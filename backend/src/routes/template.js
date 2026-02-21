const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');

const templateCache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

const DEFAULT_TEMPLATE_URL = 'https://raw.githubusercontent.com/242282218/clash-/add_full/proxy.ini';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const cached = templateCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      resolve(cached.data);
      return;
    }

    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'clash-sub-converter/1.0'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl(res.headers.location).then(resolve).catch(reject);
        return;
      }

      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        templateCache.set(url, { data, timestamp: Date.now() });
        resolve(data);
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

router.get('/default', async (req, res) => {
  try {
    const templateUrl = req.query.url || DEFAULT_TEMPLATE_URL;
    const content = await fetchUrl(templateUrl);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(content);
  } catch (error) {
    console.error('获取远程模板失败:', error.message);
    res.status(500).json({ error: '获取远程模板失败: ' + error.message });
  }
});

router.post('/fetch', express.json(), async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: '缺少模板 URL' });
    }

    const content = await fetchUrl(url);
    res.json({ success: true, content });
  } catch (error) {
    console.error('获取远程模板失败:', error.message);
    res.status(500).json({ error: '获取远程模板失败: ' + error.message });
  }
});

router.get('/list', (req, res) => {
  res.json({
    templates: [
      {
        name: '默认模板 (GitHub)',
        url: DEFAULT_TEMPLATE_URL,
        description: '来自 242282218/clash- 项目的代理配置模板'
      },
      {
        name: '本地默认模板',
        url: '/clash.ini',
        description: '本地 clash.ini 文件'
      }
    ],
    defaultUrl: DEFAULT_TEMPLATE_URL
  });
});

module.exports = router;
