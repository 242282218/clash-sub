#!/bin/bash

PORT=${1:-31900}

echo "=== Clash 订阅转换服务部署 ==="
echo "端口: $PORT"
echo ""

if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo "错误: 未找到 docker-compose 或 docker compose"
    exit 1
fi

export PORT

cat > docker-compose.override.yml << EOF
version: '3.8'
services:
  clash-sub:
    ports:
      - "${PORT}:${PORT}"
    environment:
      - PORT=${PORT}
EOF

echo "构建镜像..."
$COMPOSE_CMD build

echo "启动服务..."
$COMPOSE_CMD up -d

echo ""
echo "=== 部署完成 ==="
echo "访问地址: http://localhost:$PORT"
echo ""
echo "常用命令:"
echo "  查看日志: $COMPOSE_CMD logs -f"
echo "  停止服务: $COMPOSE_CMD down"
echo "  重启服务: $COMPOSE_CMD restart"
