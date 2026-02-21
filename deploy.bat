@echo off
setlocal enabledelayedexpansion

set PORT=31900
if not "%1"=="" set PORT=%1

echo === Clash 订阅转换服务部署 ===
echo 端口: %PORT%
echo.

docker --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到 Docker
    exit /b 1
)

docker compose version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到 docker compose
    exit /b 1
)

set COMPOSE_CMD=docker compose

echo 构建镜像...
%COMPOSE_CMD% build --build-arg PORT=%PORT%

echo 启动服务...
%COMPOSE_CMD% up -d

echo.
echo === 部署完成 ===
echo 访问地址: http://localhost:%PORT%
echo.
echo 常用命令:
echo   查看日志: %COMPOSE_CMD% logs -f
echo   停止服务: %COMPOSE_CMD% down
echo   重启服务: %COMPOSE_CMD% restart

pause
