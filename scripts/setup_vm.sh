#!/bin/bash
# AWS EC2 User Data Script (Ubuntu 24.04)
# This script provisions the Virtual Machine for the Hospital Management System

set -e

# Add 2GB Swap Space to prevent Out of Memory (OOM) errors during npm build on t2.micro
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# Update and upgrade system packages
apt-get update -y
apt-get upgrade -y

# Install Nginx, PHP, and other dependencies
apt-get install -y nginx curl git unzip
apt-get install -y software-properties-common
add-apt-repository -y ppa:ondrej/php
apt-get update -y
apt-get install -y php8.3 php8.3-cli php8.3-fpm php8.3-mysql php8.3-xml php8.3-mbstring php8.3-curl php8.3-zip

# Install Node.js & npm (for frontend build)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install Composer (PHP package manager)
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Create web directory and clone repository
cd /var/www/html
rm -rf *
git clone https://github.com/chinthaka-lakshan/Hospital_Management_System.git
cd Hospital_Management_System

# Setup Backend (Laravel)
cd backend
composer install --no-dev --optimize-autoloader
cp .env.example .env

# We need to wait for RDS DB host to be provided or pass it manually. 
# For now, generate the app key
php artisan key:generate

# Set permissions for Laravel
chown -R www-data:www-data /var/www/html/Hospital_Management_System
chmod -R 775 storage bootstrap/cache

# Setup Frontend (React)
cd ../frontend
npm install
npm run build

# Configure Nginx directly
cat << 'EOF' > /etc/nginx/sites-available/default
server {
    listen 80;
    server_name _;
    root /var/www/html/Hospital_Management_System;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php index.html index.htm;
    charset utf-8;

    # Frontend (React build)
    location / {
        root /var/www/html/Hospital_Management_System/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API (Laravel)
    location /api {
        alias /var/www/html/Hospital_Management_System/backend/public;
        try_files $uri $uri/ @api;
    }

    location @api {
        rewrite /api/(.*)$ /api/index.php?/$1 last;
    }

    location ~ \.php$ {
        root /var/www/html/Hospital_Management_System/backend/public;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $request_filename;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
EOF

systemctl restart nginx
systemctl enable nginx
systemctl enable php8.3-fpm

echo "VM Provisioning Complete!"
