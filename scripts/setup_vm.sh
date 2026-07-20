#!/bin/bash
# AWS EC2 User Data Script (Ubuntu 24.04)
# This script provisions the Virtual Machine for the Hospital Management System

exec > /var/log/user_data_debug.log 2>&1
set -x  # Print commands as they run to help debug
set -e  # Abort on any error

# Guarantee log upload even if the script crashes, retrying to allow IAM propagation
trap 'for i in {1..5}; do aws s3 cp /var/log/user_data_debug.log s3://YOUR_BUCKET_NAME/user_data_debug.log --region us-east-1 && break; sleep 10; done' EXIT


# Prevent interactive dialogs from freezing the deployment
export DEBIAN_FRONTEND=noninteractive
apt-get purge -y needrestart || true

# Update and upgrade system packages
apt-get update -y

# Install Nginx, PHP 8.3, AWS CLI, build-essential, MySQL Client
DEBIAN_FRONTEND=noninteractive apt-get install -y nginx curl git unzip awscli build-essential mysql-client \
    php-cli php-fpm php-mysql php-xml php-mbstring php-curl php-zip

# Install Composer
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Configure Nginx immediately so it is guaranteed to apply
cat << 'EOF' > /etc/nginx/sites-available/default
server {
    listen 80;
    server_name _;
    root /var/www/html/Hospital_Management_System/backend/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;
    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
EOF

systemctl restart nginx
systemctl enable nginx
systemctl enable php8.3-fpm

# Create web directory and clone repository
mkdir -p /var/www/html
cd /var/www/html || exit 1
rm -rf ./*
git clone -b Lakshan https://github.com/chinthaka-lakshan/Hospital_Management_System.git
cd Hospital_Management_System

# Setup Backend (Laravel)
cd backend
composer install --no-dev --optimize-autoloader || echo "Composer failed"

cat << 'ENVEOF' > .env
APP_NAME=Hospital_Management_System
APP_ENV=production
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=hms_db
DB_USERNAME=admin
DB_PASSWORD=hms_password_123!
ENVEOF

php artisan key:generate || echo "Key generate failed"

# Create the database if it doesn't exist
mysql -h $DB_HOST -P 3306 -u admin -p"hms_password_123!" -e "CREATE DATABASE IF NOT EXISTS hms_db;" || echo "Failed to create database"

# Run Migrations and Seeders
php artisan migrate --force || echo "Migration failed"
php artisan db:seed --force || echo "Seeder failed"

chown -R www-data:www-data /var/www/html/Hospital_Management_System
chmod -R 775 storage bootstrap/cache || echo "Chmod failed"

echo "VM Provisioning Complete!"
