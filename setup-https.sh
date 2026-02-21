#!/bin/bash

# Clash 订阅转换服务 - HTTPS 自动配置脚本
# 适用于 Ubuntu/Debian 系统

set -e

echo "================================================"
echo "  Clash 订阅转换服务 - HTTPS 自动配置"
echo "================================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}错误: 请使用 root 权限运行此脚本${NC}"
    echo "使用方法: sudo bash setup-https.sh"
    exit 1
fi

# 获取用户输入
echo -e "${YELLOW}请输入配置信息:${NC}"
echo ""

read -p "域名 (例如: sub.example.com): " DOMAIN
read -p "邮箱 (用于 SSL 证书通知): " EMAIL
read -p "后端服务端口 (默认: 8080): " BACKEND_PORT
BACKEND_PORT=${BACKEND_PORT:-8080}

echo ""
echo -e "${GREEN}配置信息:${NC}"
echo "  域名: $DOMAIN"
echo "  邮箱: $EMAIL"
echo "  后端端口: $BACKEND_PORT"
echo ""

read -p "确认配置正确? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "已取消"
    exit 0
fi

echo ""
echo -e "${GREEN}开始配置...${NC}"
echo ""

# 1. 更新系统
echo -e "${YELLOW}[1/8] 更新系统软件包...${NC}"
apt update -qq

# 2. 安装 Nginx
echo -e "${YELLOW}[2/8] 安装 Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install nginx -y
    systemctl start nginx
    systemctl enable nginx
    echo -e "${GREEN}✓ Nginx 安装完成${NC}"
else
    echo -e "${GREEN}✓ Nginx 已安装${NC}"
fi

# 3. 安装 Certbot
echo -e "${YELLOW}[3/8] 安装 Certbot...${NC}"
if ! command -v certbot &> /dev/null; then
    apt install certbot python3-certbot-nginx -y
    echo -e "${GREEN}✓ Certbot 安装完成${NC}"
else
    echo -e "${GREEN}✓ Certbot 已安装${NC}"
fi

# 4. 创建 Nginx 配置
echo -e "${YELLOW}[4/8] 创建 Nginx 配置...${NC}"

cat > /etc/nginx/sites-available/clash-sub << EOF
server {
    listen 80;
    server_name $DOMAIN;

    access_log /var/log/nginx/clash-sub-access.log;
    error_log /var/log/nginx/clash-sub-error.log;

    location / {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /health {
        proxy_pass http://localhost:$BACKEND_PORT/health;
        access_log off;
    }
}
EOF

# 启用配置
ln -sf /etc/nginx/sites-available/clash-sub /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试配置
nginx -t
systemctl reload nginx

echo -e "${GREEN}✓ Nginx 配置完成${NC}"

# 5. 配置防火墙
echo -e "${YELLOW}[5/8] 配置防火墙...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 'Nginx Full' || true
    echo -e "${GREEN}✓ 防火墙配置完成${NC}"
else
    echo -e "${YELLOW}⚠ UFW 未安装，请手动配置防火墙${NC}"
fi

# 6. 获取 SSL 证书
echo -e "${YELLOW}[6/8] 获取 SSL 证书...${NC}"
echo ""
echo -e "${YELLOW}注意: 请确保域名 $DOMAIN 已解析到本服务器 IP${NC}"
echo ""
read -p "按 Enter 继续..."

certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect

echo -e "${GREEN}✓ SSL 证书获取完成${NC}"

# 7. 优化 HTTPS 配置
echo -e "${YELLOW}[7/8] 优化 HTTPS 配置...${NC}"

cat > /etc/nginx/sites-available/clash-sub << EOF
# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # 安全头部
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    access_log /var/log/nginx/clash-sub-access.log;
    error_log /var/log/nginx/clash-sub-error.log;

    location / {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_buffering off;
    }

    location /health {
        proxy_pass http://localhost:$BACKEND_PORT/health;
        access_log off;
    }

    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        proxy_pass http://localhost:$BACKEND_PORT;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

nginx -t
systemctl reload nginx

echo -e "${GREEN}✓ HTTPS 配置优化完成${NC}"

# 8. 配置自动续期
echo -e "${YELLOW}[8/8] 配置证书自动续期...${NC}"

# 创建续期钩子
mkdir -p /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh << 'EOF'
#!/bin/bash
systemctl reload nginx
EOF

chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

# 测试自动续期
certbot renew --dry-run

echo -e "${GREEN}✓ 自动续期配置完成${NC}"

# 完成
echo ""
echo "================================================"
echo -e "${GREEN}✓ HTTPS 配置完成!${NC}"
echo "================================================"
echo ""
echo -e "${GREEN}访问地址:${NC} https://$DOMAIN"
echo ""
echo -e "${YELLOW}后续步骤:${NC}"
echo "1. 确保后端服务运行在端口 $BACKEND_PORT"
echo "2. 访问 https://$DOMAIN 测试服务"
echo "3. 使用 SSL Labs 测试: https://www.ssllabs.com/ssltest/"
echo ""
echo -e "${YELLOW}证书信息:${NC}"
certbot certificates
echo ""
echo -e "${YELLOW}有用的命令:${NC}"
echo "  查看 Nginx 日志: sudo tail -f /var/log/nginx/clash-sub-access.log"
echo "  重新加载 Nginx: sudo systemctl reload nginx"
echo "  查看证书: sudo certbot certificates"
echo "  手动续期: sudo certbot renew"
echo ""
