# HTTPS 配置指南 - 生产环境部署

本指南将帮助你为 Clash 订阅转换服务配置 HTTPS，确保数据传输安全。

---

## 方案概述

我们将使用以下技术栈：
- **Nginx** - 反向代理服务器
- **Let's Encrypt** - 免费 SSL 证书
- **Certbot** - 自动化证书管理工具

---

## 前置要求

1. ✅ 一台公网可访问的服务器（VPS）
2. ✅ 一个域名（如 `sub.example.com`）
3. ✅ 域名已解析到服务器 IP
4. ✅ 服务器开放 80 和 443 端口

---

## 步骤 1：安装 Nginx

### Ubuntu/Debian

```bash
# 更新软件包列表
sudo apt update

# 安装 Nginx
sudo apt install nginx -y

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 检查状态
sudo systemctl status nginx
```

### CentOS/RHEL

```bash
# 安装 Nginx
sudo yum install nginx -y

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 检查状态
sudo systemctl status nginx
```

---

## 步骤 2：配置 Nginx 反向代理（HTTP）

首先配置 HTTP 反向代理，稍后升级到 HTTPS。

### 创建 Nginx 配置文件

```bash
sudo nano /etc/nginx/sites-available/clash-sub
```

### 配置内容

```nginx
server {
    listen 80;
    server_name sub.example.com;  # 替换为你的域名

    # 日志文件
    access_log /var/log/nginx/clash-sub-access.log;
    error_log /var/log/nginx/clash-sub-error.log;

    # 反向代理到 Node.js 应用
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;

        # 传递真实 IP 和协议
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 支持（如果需要）
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 健康检查
    location /health {
        proxy_pass http://localhost:8080/health;
        access_log off;
    }
}
```

### 启用配置

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/clash-sub /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重新加载 Nginx
sudo systemctl reload nginx
```

### 验证 HTTP 访问

访问 `http://sub.example.com`，确认可以正常访问服务。

---

## 步骤 3：安装 Certbot

### Ubuntu/Debian

```bash
# 安装 Certbot 和 Nginx 插件
sudo apt install certbot python3-certbot-nginx -y
```

### CentOS/RHEL

```bash
# 安装 EPEL 仓库
sudo yum install epel-release -y

# 安装 Certbot
sudo yum install certbot python3-certbot-nginx -y
```

---

## 步骤 4：获取 SSL 证书

### 自动配置（推荐）

Certbot 会自动修改 Nginx 配置并获取证书：

```bash
sudo certbot --nginx -d sub.example.com
```

### 交互式配置

运行命令后，按照提示操作：

1. **输入邮箱**：用于接收证书过期提醒
2. **同意服务条款**：输入 `Y`
3. **是否分享邮箱**：输入 `N`（可选）
4. **重定向 HTTP 到 HTTPS**：选择 `2`（推荐）

### 手动配置（高级）

如果你想手动配置，使用 `certonly` 模式：

```bash
sudo certbot certonly --nginx -d sub.example.com
```

证书文件位置：
- 证书：`/etc/letsencrypt/live/sub.example.com/fullchain.pem`
- 私钥：`/etc/letsencrypt/live/sub.example.com/privkey.pem`

---

## 步骤 5：优化 HTTPS 配置

Certbot 会自动配置 HTTPS，但我们可以进一步优化安全性。

### 编辑 Nginx 配置

```bash
sudo nano /etc/nginx/sites-available/clash-sub
```

### 优化后的完整配置

```nginx
# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name sub.example.com;

    # Let's Encrypt 验证
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # 重定向所有 HTTP 请求到 HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    server_name sub.example.com;

    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/sub.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sub.example.com/privkey.pem;

    # SSL 配置（由 Certbot 生成）
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # 安全头部
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 日志文件
    access_log /var/log/nginx/clash-sub-access.log;
    error_log /var/log/nginx/clash-sub-error.log;

    # 反向代理到 Node.js 应用
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;

        # 传递真实 IP 和协议
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 支持
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # 缓冲设置
        proxy_buffering off;
    }

    # 健康检查
    location /health {
        proxy_pass http://localhost:8080/health;
        access_log off;
    }

    # 静态文件缓存（可选）
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        proxy_pass http://localhost:8080;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 重新加载 Nginx

```bash
# 测试配置
sudo nginx -t

# 重新加载
sudo systemctl reload nginx
```

---

## 步骤 6：配置自动续期

Let's Encrypt 证书有效期为 90 天，需要定期续期。

### 测试自动续期

```bash
# 模拟续期（不会真正续期）
sudo certbot renew --dry-run
```

如果测试成功，说明自动续期配置正确。

### 查看续期定时任务

Certbot 会自动创建定时任务：

```bash
# 查看 systemd timer
sudo systemctl list-timers | grep certbot

# 或查看 cron 任务
sudo cat /etc/cron.d/certbot
```

### 手动续期（如果需要）

```bash
sudo certbot renew
```

### 续期后重新加载 Nginx

编辑续期钩子：

```bash
sudo nano /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

添加内容：

```bash
#!/bin/bash
systemctl reload nginx
```

设置执行权限：

```bash
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

---

## 步骤 7：防火墙配置

### UFW（Ubuntu/Debian）

```bash
# 允许 HTTP 和 HTTPS
sudo ufw allow 'Nginx Full'

# 或单独配置
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

### Firewalld（CentOS/RHEL）

```bash
# 允许 HTTP 和 HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# 重新加载
sudo firewall-cmd --reload

# 查看状态
sudo firewall-cmd --list-all
```

---

## 步骤 8：验证 HTTPS 配置

### 1. 浏览器测试

访问 `https://sub.example.com`，检查：
- ✅ 浏览器地址栏显示锁图标
- ✅ 证书有效
- ✅ HTTP 自动重定向到 HTTPS

### 2. SSL 测试工具

使用 SSL Labs 测试：
```
https://www.ssllabs.com/ssltest/analyze.html?d=sub.example.com
```

目标评级：**A 或 A+**

### 3. 命令行测试

```bash
# 测试 SSL 连接
openssl s_client -connect sub.example.com:443 -servername sub.example.com

# 测试 HTTP 重定向
curl -I http://sub.example.com

# 测试 HTTPS
curl -I https://sub.example.com
```

---

## 步骤 9：Docker 部署配置

如果使用 Docker 部署，需要调整配置。

### 更新 docker-compose.yml

```yaml
version: '3.8'

services:
  clash-sub-converter:
    build: .
    container_name: clash-sub-converter
    ports:
      - "127.0.0.1:8080:8080"  # 只监听本地
    environment:
      - NODE_ENV=production
      - PORT=8080
    restart: unless-stopped
    networks:
      - clash-network

networks:
  clash-network:
    driver: bridge
```

注意：端口改为 `127.0.0.1:8080:8080`，只允许本地访问，通过 Nginx 代理。

---

## 步骤 10：监控和维护

### 查看 Nginx 日志

```bash
# 访问日志
sudo tail -f /var/log/nginx/clash-sub-access.log

# 错误日志
sudo tail -f /var/log/nginx/clash-sub-error.log
```

### 查看证书信息

```bash
# 证书详情
sudo certbot certificates

# 证书过期时间
sudo openssl x509 -in /etc/letsencrypt/live/sub.example.com/fullchain.pem -noout -dates
```

### 定期检查

建议每月检查一次：
- [ ] 证书是否正常续期
- [ ] Nginx 日志是否有异常
- [ ] SSL 评级是否保持 A+
- [ ] 服务是否正常运行

---

## 常见问题

### 1. 证书获取失败

**问题**：`Failed to obtain certificate`

**解决方案**：
- 检查域名是否正确解析到服务器 IP
- 确保 80 端口可访问
- 检查防火墙设置
- 查看详细错误：`sudo certbot --nginx -d sub.example.com --debug`

### 2. 证书续期失败

**问题**：续期时出错

**解决方案**：
```bash
# 手动续期并查看详细信息
sudo certbot renew --force-renewal --debug

# 检查续期日志
sudo cat /var/log/letsencrypt/letsencrypt.log
```

### 3. Nginx 配置错误

**问题**：`nginx: configuration file test failed`

**解决方案**：
```bash
# 查看详细错误
sudo nginx -t

# 检查配置文件语法
sudo nginx -T | grep -i error
```

### 4. 502 Bad Gateway

**问题**：Nginx 无法连接到后端服务

**解决方案**：
```bash
# 检查后端服务是否运行
sudo netstat -tlnp | grep 8080

# 检查 SELinux（CentOS）
sudo setsebool -P httpd_can_network_connect 1

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/clash-sub-error.log
```

---

## 安全建议

### 1. 定期更新

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 更新 Certbot
sudo apt install --only-upgrade certbot
```

### 2. 限制访问（可选）

如果只允许特定 IP 访问：

```nginx
location / {
    # 允许特定 IP
    allow 1.2.3.4;
    allow 5.6.7.8;

    # 拒绝其他所有 IP
    deny all;

    proxy_pass http://localhost:8080;
    # ... 其他配置
}
```

### 3. 速率限制

防止滥用：

```nginx
# 在 http 块中添加
http {
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

    # ... 其他配置
}

# 在 server 块中应用
server {
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://localhost:8080;
    }
}
```

### 4. 启用日志轮转

```bash
sudo nano /etc/logrotate.d/clash-sub
```

添加内容：

```
/var/log/nginx/clash-sub-*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

---

## 完整部署检查清单

部署前请确认：

- [ ] 域名已解析到服务器 IP
- [ ] 防火墙开放 80 和 443 端口
- [ ] Nginx 已安装并运行
- [ ] 后端服务在 8080 端口运行
- [ ] SSL 证书已获取
- [ ] HTTPS 配置已优化
- [ ] 自动续期已配置
- [ ] HTTP 重定向到 HTTPS
- [ ] 安全头部已添加
- [ ] 日志轮转已配置
- [ ] SSL Labs 评级 A+
- [ ] 监控和告警已设置

---

## 总结

完成以上步骤后，你的 Clash 订阅转换服务将：

✅ 使用 HTTPS 加密传输
✅ 自动续期 SSL 证书
✅ 获得 A+ SSL 评级
✅ 具备生产环境安全性

**访问地址**：`https://sub.example.com`

如有问题，请查看日志文件或参考常见问题部分。
