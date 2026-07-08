#!/bin/bash
# DawnVision 服务器初始化脚本
# 在服务器上以 root 或 sudo 运行：bash server-setup.sh

set -e

echo "=== DawnVision 服务器初始化 ==="

# Update packages
echo "[1/6] 更新系统包..."
sudo apt update -y

# Install Nginx
echo "[2/6] 安装 Nginx..."
sudo apt install -y nginx

# Install certbot for SSL
echo "[3/6] 安装 certbot (用于HTTPS证书)..."
sudo apt install -y certbot python3-certbot-nginx

# Create web root directory
echo "[4/6] 创建网站目录..."
sudo mkdir -p /var/www/dawnvision
sudo chown -R www-data:www-data /var/www/dawnvision
sudo chmod -R 755 /var/www/dawnvision

# Configure Nginx
echo "[5/6] 配置 Nginx..."
# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Write dawnvision config
sudo tee /etc/nginx/sites-available/dawnvision > /dev/null << 'NGINXCONF'
server {
    listen 80;
    server_name dawnvision.cn www.dawnvision.cn;

    root /var/www/dawnvision;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
    gzip_min_length 1000;

    # Static assets cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|avif)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Astro directory-based routing
    location / {
        try_files $uri $uri/ $uri/index.html /404.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
NGINXCONF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/dawnvision /etc/nginx/sites-enabled/dawnvision

# Test nginx config
echo "测试 Nginx 配置..."
sudo nginx -t

# Start/restart nginx
echo "启动 Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# Configure firewall (if ufw is active)
echo "[6/6] 配置防火墙..."
sudo ufw allow 'Nginx Full' 2>/dev/null || true
sudo ufw allow OpenSSH 2>/dev/null || true
echo "防火墙已配置（允许HTTP/HTTPS/SSH）"

echo ""
echo "=== 基础配置完成！==="
echo ""
echo "下一步操作："
echo "1. 确保域名 dawnvision.cn 的 A 记录指向服务器 IP: 110.42.236.22"
echo "2. 在本地运行 deploy.ps1 上传网站文件"
echo "3. 文件上传后，运行以下命令获取HTTPS证书："
echo "   sudo certbot --nginx -d dawnvision.cn -d www.dawnvision.cn"
echo ""
echo "   certbot会自动修改Nginx配置启用HTTPS和HTTP→HTTPS跳转"
echo ""
echo "网站目录: /var/www/dawnvision"
echo "Nginx配置: /etc/nginx/sites-available/dawnvision"
