FROM node:18-alpine

WORKDIR /app

# 复制 package.json
COPY backend/package*.json ./

# 安装依赖
RUN npm install --production

# 复制应用代码
COPY backend/src ./src
COPY frontend ./frontend
COPY clash.ini ./frontend/

# 暴露端口
EXPOSE 8080

# 启动应用
CMD ["node", "src/app.js"]
