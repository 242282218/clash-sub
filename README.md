# 自用 Clash 订阅转换

> 完全本地运行的 Clash 订阅转换服务

## 快速开始

```bash
# Docker 部署
docker-compose up -d

# 或直接运行
cd backend && npm install && npm start
```

访问 http://localhost:8080

## 功能

- 支持 VMess/VLESS/SS/Trojan/SSR/Hysteria2
- 远程模板加载
- 订阅持久化存储
- Web 管理界面

## 使用

1. 输入节点链接
2. 选择模板
3. 生成订阅
4. 复制到 Clash

## 仓库

https://github.com/242282218/clash-sub
