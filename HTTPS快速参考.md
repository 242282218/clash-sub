# HTTPS 配置 - 快速参考

## 🚀 一键自动配置（推荐）

```bash
# 下载并运行自动配置脚本
sudo bash setup-https.sh
```

脚本会自动完成：
- ✅ 安装 Nginx
- ✅ 安装 Certbot
- ✅ 配置反向代理
- ✅ 获取 SSL 证书
- ✅ 配置 HTTPS
- ✅ 设置自动续期

---

## 📋 手动配置步骤

### 1. 安装依赖
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

### 2. 配置 Nginx
```bash
sudo nano /etc/nginx/sites-available/clash-sub
```

粘贴配置（见 HTTPS配置指南.md）

### 3. 获取证书
```bash
sudo certbot --nginx -d sub.example.com
```

### 4. 测试
```bash
# 测试配置
sudo nginx -t

# 重新加载
sudo systemctl reload nginx

# 访问测试
curl -I https://sub.example.com
```

---

## 🔧 常用命令

### 证书管理
```bash
# 查看证书
sudo certbot certificates

# 手动续期
sudo certbot renew

# 测试续期
sudo certbot renew --dry-run
```

### Nginx 管理
```bash
# 测试配置
sudo nginx -t

# 重新加载
sudo systemctl reload nginx

# 重启
sudo systemctl restart nginx

# 查看状态
sudo systemctl status nginx
```

### 日志查看
```bash
# 访问日志
sudo tail -f /var/log/nginx/clash-sub-access.log

# 错误日志
sudo tail -f /var/log/nginx/clash-sub-error.log

# Certbot 日志
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

---

## 🔍 故障排查

### 问题 1: 证书获取失败
```bash
# 检查域名解析
nslookup sub.example.com

# 检查 80 端口
sudo netstat -tlnp | grep :80

# 查看详细错误
sudo certbot --nginx -d sub.example.com --debug
```

### 问题 2: 502 Bad Gateway
```bash
# 检查后端服务
sudo netstat -tlnp | grep :8080

# 检查 Nginx 错误日志
sudo tail -f /var/log/nginx/clash-sub-error.log

# 测试后端连接
curl http://localhost:8080/health
```

### 问题 3: 证书续期失败
```bash
# 手动续期并查看详细信息
sudo certbot renew --force-renewal --debug

# 检查续期配置
sudo cat /etc/letsencrypt/renewal/sub.example.com.conf
```

---

## 📊 SSL 评级测试

访问 SSL Labs 测试你的配置：
```
https://www.ssllabs.com/ssltest/analyze.html?d=sub.example.com
```

目标评级：**A+**

---

## 🔐 安全检查清单

部署后请确认：

- [ ] HTTPS 可正常访问
- [ ] HTTP 自动重定向到 HTTPS
- [ ] 证书有效且未过期
- [ ] SSL Labs 评级 A 或 A+
- [ ] 安全头部已配置
- [ ] 自动续期已测试
- [ ] 防火墙已配置
- [ ] 日志轮转已设置

---

## 📞 获取帮助

详细配置说明请查看：
- `HTTPS配置指南.md` - 完整配置文档
- `README.md` - 项目使用说明

常见问题：
- Let's Encrypt 文档: https://letsencrypt.org/docs/
- Nginx 文档: https://nginx.org/en/docs/
- Certbot 文档: https://certbot.eff.org/docs/
