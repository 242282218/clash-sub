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

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:31900/health || exit 1

CMD ["node", "src/app.js"]
