#!/bin/bash
# AWS Infrastructure Deployment Script
# This script provisions a custom VPC, RDS, EC2 VM, and ALB for the Hospital Management System.
# Requires AWS CLI to be installed and configured (`aws configure`).

set -e

REGION="us-east-1"
PROJECT_NAME="hms-capstone"

echo "Starting AWS Deployment for $PROJECT_NAME in $REGION..."

# 1. Create VPC
echo "Creating VPC..."
VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query 'Vpc.VpcId' --output text --region $REGION)
aws ec2 create-tags --resources $VPC_ID --tags Key=Name,Value=$PROJECT_NAME-vpc --region $REGION
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames "{\"Value\":true}" --region $REGION

# 2. Create Internet Gateway
echo "Creating Internet Gateway..."
IGW_ID=$(aws ec2 create-internet-gateway --query 'InternetGateway.InternetGatewayId' --output text --region $REGION)
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID --region $REGION

# 3. Create Subnets (2 Public Subnets in different AZs for ALB requirement)
echo "Creating Subnets..."
SUBNET1_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone ${REGION}a --query 'Subnet.SubnetId' --output text --region $REGION)
SUBNET2_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 --availability-zone ${REGION}b --query 'Subnet.SubnetId' --output text --region $REGION)
aws ec2 modify-subnet-attribute --subnet-id $SUBNET1_ID --map-public-ip-on-launch --region $REGION
aws ec2 modify-subnet-attribute --subnet-id $SUBNET2_ID --map-public-ip-on-launch --region $REGION

# 4. Route Table
echo "Configuring Route Table..."
RT_ID=$(aws ec2 create-route-table --vpc-id $VPC_ID --query 'RouteTable.RouteTableId' --output text --region $REGION)
aws ec2 create-route --route-table-id $RT_ID --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID --region $REGION > /dev/null
aws ec2 associate-route-table --subnet-id $SUBNET1_ID --route-table-id $RT_ID --region $REGION > /dev/null
aws ec2 associate-route-table --subnet-id $SUBNET2_ID --route-table-id $RT_ID --region $REGION > /dev/null

# 5. Security Groups
echo "Creating Security Groups..."
ALB_SG=$(aws ec2 create-security-group --group-name alb-sg --description "ALB Security Group" --vpc-id $VPC_ID --query 'GroupId' --output text --region $REGION)
aws ec2 authorize-security-group-ingress --group-id $ALB_SG --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $REGION > /dev/null

VM_SG=$(aws ec2 create-security-group --group-name vm-sg --description "EC2 VM Security Group" --vpc-id $VPC_ID --query 'GroupId' --output text --region $REGION)
aws ec2 authorize-security-group-ingress --group-id $VM_SG --protocol tcp --port 80 --source-group $ALB_SG --region $REGION > /dev/null
aws ec2 authorize-security-group-ingress --group-id $VM_SG --protocol tcp --port 22 --cidr 0.0.0.0/0 --region $REGION > /dev/null # For SSH

DB_SG=$(aws ec2 create-security-group --group-name db-sg --description "RDS Security Group" --vpc-id $VPC_ID --query 'GroupId' --output text --region $REGION)
aws ec2 authorize-security-group-ingress --group-id $DB_SG --protocol tcp --port 3306 --source-group $VM_SG --region $REGION > /dev/null

# 6. S3 Bucket (For Object Storage Requirement)
echo "Creating S3 Bucket..."
BUCKET_NAME="$PROJECT_NAME-bucket-$(date +%s)"
aws s3api create-bucket --bucket $BUCKET_NAME --region $REGION > /dev/null

# 7. RDS Database
echo "Creating RDS Database (this takes a few minutes)..."
DB_SUBNET_GROUP="db-subnet-group-$(date +%s)"
aws rds create-db-subnet-group --db-subnet-group-name $DB_SUBNET_GROUP --db-subnet-group-description "RDS Subnet Group" --subnet-ids $SUBNET1_ID $SUBNET2_ID --region $REGION > /dev/null

DB_EXISTS=$(aws rds describe-db-instances --db-instance-identifier hms-db --region $REGION --query 'DBInstances[0].DBInstanceIdentifier' --output text 2>/dev/null || echo "not_found")

if [ "$DB_EXISTS" == "hms-db" ]; then
    echo "Database hms-db already exists. Reusing it to save Free Tier limits..."
else
    aws rds create-db-instance \
        --db-instance-identifier hms-db \
        --db-instance-class db.t3.micro \
        --engine mysql \
        --master-username admin \
        --master-user-password "hms_password_123!" \
        --allocated-storage 20 \
        --vpc-security-group-ids $DB_SG \
        --db-subnet-group-name $DB_SUBNET_GROUP \
        --region $REGION > /dev/null
fi

# Wait for DB to be available
echo "Waiting for RDS DB to be available (this can take 5-10 minutes)..."
aws rds wait db-instance-available --db-instance-identifier hms-db --region $REGION
DB_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier hms-db --query 'DBInstances[0].Endpoint.Address' --output text --region $REGION)

# 8. IAM Role for EC2 (Matches Report Section 6.1)
echo "Creating IAM Role for EC2 S3 Access..."
ROLE_NAME="hms-ec2-s3-role-$(date +%s)"
aws iam create-role --role-name $ROLE_NAME --assume-role-policy-document '{
  "Version": "2012-10-17",
  "Statement": [ { "Effect": "Allow", "Principal": { "Service": "ec2.amazonaws.com" }, "Action": "sts:AssumeRole" } ]
}' --region $REGION > /dev/null

aws iam put-role-policy --role-name $ROLE_NAME --policy-name S3AccessPolicy --policy-document '{
  "Version": "2012-10-17",
  "Statement": [ { "Effect": "Allow", "Action": ["s3:PutObject", "s3:GetObject"], "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*" } ]
}' --region $REGION > /dev/null

aws iam create-instance-profile --instance-profile-name $ROLE_NAME-profile --region $REGION > /dev/null
aws iam add-role-to-instance-profile --instance-profile-name $ROLE_NAME-profile --role-name $ROLE_NAME --region $REGION > /dev/null
sleep 10 # Wait for IAM propagation

# 9. Application Load Balancer
echo "Creating Application Load Balancer..."
ALB_NAME="hms-alb-$(date +%s)"
TG_NAME="hms-tg-$(date +%s)"

ALB_ARN=$(aws elbv2 create-load-balancer --name $ALB_NAME --subnets $SUBNET1_ID $SUBNET2_ID --security-groups $ALB_SG --query 'LoadBalancers[0].LoadBalancerArn' --output text --region $REGION)
TG_ARN=$(aws elbv2 create-target-group --name $TG_NAME --protocol HTTP --port 80 --vpc-id $VPC_ID --target-type instance --query 'TargetGroups[0].TargetGroupArn' --output text --region $REGION)
aws elbv2 create-listener --load-balancer-arn $ALB_ARN --protocol HTTP --port 80 --default-actions Type=forward,TargetGroupArn=$TG_ARN --region $REGION > /dev/null
ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN --query 'LoadBalancers[0].DNSName' --output text --region $REGION)

# 10. Auto Scaling Group & Launch Template (Matches Report Section 2.5)
echo "Creating Launch Template & Auto Scaling Group..."
AMI_ID=$(aws ec2 describe-images --owners 099720109477 --filters "Name=name,Values=ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*" --query 'sort_by(Images, &CreationDate)[-1].ImageId' --output text --region $REGION)

cat scripts/setup_vm.sh | sed "s/cp .env.example .env/cp .env.example .env\nsed -i 's\/DB_HOST=127.0.0.1\/DB_HOST=$DB_ENDPOINT\/' .env/" > user_data.sh
USER_DATA_B64=$(base64 -i user_data.sh)

LT_NAME="hms-lt-$(date +%s)"
LT_ID=$(aws ec2 create-launch-template \
    --launch-template-name $LT_NAME \
    --launch-template-data "{\"ImageId\":\"$AMI_ID\",\"InstanceType\":\"t2.micro\",\"SecurityGroupIds\":[\"$VM_SG\"],\"IamInstanceProfile\":{\"Name\":\"$ROLE_NAME-profile\"},\"UserData\":\"$USER_DATA_B64\",\"BlockDeviceMappings\":[{\"DeviceName\":\"/dev/sda1\",\"Ebs\":{\"VolumeSize\":20,\"VolumeType\":\"gp3\"}}]}" \
    --query 'LaunchTemplate.LaunchTemplateId' --output text --region $REGION)

ASG_NAME="hms-asg-$(date +%s)"
aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name $ASG_NAME \
    --launch-template LaunchTemplateId=$LT_ID,Version=1 \
    --min-size 1 \
    --max-size 2 \
    --desired-capacity 1 \
    --vpc-zone-identifier "$SUBNET1_ID,$SUBNET2_ID" \
    --target-group-arns $TG_ARN \
    --region $REGION

echo "================================================="
echo "Deployment Complete!"
echo "S3 Bucket: $BUCKET_NAME"
echo "RDS Endpoint: $DB_ENDPOINT"
echo "Application URL: http://$ALB_DNS"
echo "Note: It will take a few minutes for the ASG to launch the VM and run the setup script. Please wait ~5 minutes before visiting the URL."
echo "================================================="
rm user_data.sh
