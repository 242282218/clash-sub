FROM node:18-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm install --production

COPY backend/src ./src
COPY frontend ./frontend
COPY clash.ini ./frontend/

RUN mkdir -p /app/data

ENV PORT=31900
ENV NODE_ENV=production

EXPOSE 31900

CMD ["node", "src/app.js"]
