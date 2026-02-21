@echo off
chcp 65001 >nul
echo 🚀 Clash 订阅转换服务 - 快速启动脚本
echo ======================================
echo.

REM 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未检测到 Node.js，请先安装 Node.js 18+
    echo    下载地址: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js 版本: %NODE_VERSION%
echo.

REM 进入后端目录
cd backend

REM 检查是否已安装依赖
if not exist "node_modules" (
    echo 📦 正在安装依赖...
    call npm install
    echo.
)

REM 启动服务
echo 🚀 正在启动服务...
echo.
call npm start

pause
