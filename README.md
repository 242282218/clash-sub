# 自用 Clash 订阅转换

> 完全本地运行的 Clash 订阅转换服务

## 快速开始

### Docker 部署（推荐）

```bash
# Linux/Mac
./deploy.sh           # 默认端口 31900
./deploy.sh 8080      # 自定义端口

# Windows
deploy.bat            # 默认端口 31900
deploy.bat 8080       # 自定义端口
```

访问 http://localhost:31900

### 直接运行

```bash
cd backend && npm install && npm start
```

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

## 参考项目

- [tindy2013/subconverter](https://github.com/tindy2013/subconverter)
- [CareyWang/sub-web](https://github.com/CareyWang/sub-web)
- [siiway/urlclash-converter](https://github.com/siiway/urlclash-converter)

## 仓库

https://github.com/242282218/clash-sub
