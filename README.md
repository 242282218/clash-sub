# 自用 Clash 订阅转换

一个完全自托管的 Clash 订阅转换服务，可以将节点链接（vmess、vless 等）结合配置模板生成 Clash 订阅链接。

## 特性

- 完全本地运行，数据不上传外部服务器
- 支持 VMess、VLESS、Shadowsocks、Trojan、SSR、Hysteria2 协议
- 远程模板支持，可从 GitHub 加载配置模板
- 订阅持久化存储，支持管理、删除、更新
- 简洁的 Web 界面
- Docker 一键部署

## 快速开始

### Docker 部署

```bash
docker-compose up -d
```

访问 `http://localhost:8080`

### 直接运行

```bash
cd backend
npm install
npm start
```

### PM2 守护进程

```bash
npm install -g pm2
cd backend && npm install
pm2 start src/app.js --name clash-sub
pm2 startup
pm2 save
```

## 使用方法

1. 访问 Web 界面 `http://localhost:8080`
2. 输入节点链接（每行一个）
3. 选择配置模板（远程/本地/自定义）
4. 输入订阅名称（可选）
5. 点击「生成订阅链接」
6. 复制链接到 Clash 客户端

## 订阅管理

- **创建订阅**：在「创建订阅」标签页生成新订阅
- **管理订阅**：在「管理订阅」标签页查看所有已保存订阅
- **删除订阅**：点击删除按钮，确认后删除
- **更新配置**：点击更新按钮重新生成配置

## 支持的协议

| 协议 | 前缀 |
|------|------|
| VMess | `vmess://` |
| VLESS | `vless://` |
| Shadowsocks | `ss://` |
| Trojan | `trojan://` |
| ShadowsocksR | `ssr://` |
| Hysteria2 | `hysteria2://` / `hy2://` |

## API 文档

### 生成订阅

```http
POST /api/sub/generate
Content-Type: application/json

{
  "nodes": "vmess://...\nvless://...",
  "template": "配置模板内容",
  "name": "订阅名称"
}
```

### 获取订阅列表

```http
GET /api/sub/list
```

### 获取订阅配置

```http
GET /api/sub/{configId}
```

### 删除订阅

```http
DELETE /api/sub/{configId}
```

### 更新订阅配置

```http
POST /api/sub/{configId}/regenerate
```

## 默认模板

默认使用 GitHub 上的配置模板：
```
https://raw.githubusercontent.com/242282218/clash-/add_full/proxy.ini
```

也可以使用本地 `clash.ini` 文件或自定义模板。

## 技术栈

- 后端：Node.js + Express
- 前端：原生 HTML/CSS/JavaScript
- 存储：JSON 文件持久化

## 项目结构

```
clash_ini/
├── backend/
│   ├── src/
│   │   ├── parsers/      # 协议解析器
│   │   ├── config/       # 配置处理和存储
│   │   ├── routes/       # API 路由
│   │   └── app.js
│   └── data/             # 订阅数据存储
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── clash.ini
├── Dockerfile
└── docker-compose.yml
```

## 许可证

MIT
