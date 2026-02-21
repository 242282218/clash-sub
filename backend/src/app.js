const express = require('express');
const cors = require('cors');
const path = require('path');
const subRouter = require('./routes/sub');
const templateRouter = require('./routes/template');

const app = express();
const PORT = process.env.PORT || 31900;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const frontendPath = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, '../frontend')
  : path.join(__dirname, '../../frontend');

app.use(express.static(frontendPath));

app.use('/api/sub', subRouter);
app.use('/api/template', templateRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Clash 订阅转换服务已启动`);
  console.log(`📡 服务地址: http://0.0.0.0:${PORT}`);
  console.log(`📝 API 文档: http://0.0.0.0:${PORT}/api/sub`);
  console.log(`📄 默认模板: https://raw.githubusercontent.com/242282218/clash-/add_full/proxy.ini`);
  console.log(`\n按 Ctrl+C 停止服务\n`);
});

process.on('SIGTERM', () => {
  console.log('\n正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  process.exit(0);
});
