const express = require('express');
const router = express.Router();
const { parseProxies } = require('../parsers');
const { parseTemplate } = require('../config/template');
const { generateClashConfig } = require('../config/generator');
const storage = require('../config/storage');

router.post('/generate', express.json(), async (req, res) => {
  try {
    const { nodes, template, name } = req.body;

    if (!nodes || !template) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const proxies = parseProxies(nodes);
    if (proxies.length === 0) {
      return res.status(400).json({ error: '没有有效的节点' });
    }

    const templateConfig = parseTemplate(template);
    const clashConfig = await generateClashConfig(proxies, templateConfig);

    const configId = Date.now().toString(36) + Math.random().toString(36).substring(2);

    storage.saveConfig(configId, {
      config: clashConfig,
      proxyCount: proxies.length,
      name: name || `订阅 ${configId.substring(0, 8)}`,
      nodes: nodes,
      template: template
    });

    const subscriptionUrl = `${req.protocol}://${req.get('host')}/api/sub/${configId}`;

    res.json({
      success: true,
      subscriptionUrl,
      configId,
      proxyCount: proxies.length,
      config: clashConfig
    });
  } catch (error) {
    console.error('生成配置错误:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/preview', express.json(), async (req, res) => {
  try {
    const { nodes, template } = req.body;

    if (!nodes || !template) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const proxies = parseProxies(nodes);
    if (proxies.length === 0) {
      return res.status(400).json({ error: '没有有效的节点' });
    }

    const templateConfig = parseTemplate(template);
    const clashConfig = await generateClashConfig(proxies, templateConfig);

    res.json({
      success: true,
      config: clashConfig,
      proxyCount: proxies.length,
      proxies: proxies.map(p => p.name)
    });
  } catch (error) {
    console.error('预览配置错误:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/list', (req, res) => {
  try {
    const configs = storage.listConfigs();
    res.json({
      success: true,
      configs
    });
  } catch (error) {
    console.error('获取配置列表错误:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:configId', (req, res) => {
  try {
    const { configId } = req.params;

    const configData = storage.getConfig(configId);
    if (!configData) {
      return res.status(404).send('配置不存在');
    }

    res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=clash-${configId}.yaml`);
    res.setHeader('Subscription-Userinfo', `upload=0; download=0; total=10737418240; expire=0`);
    res.setHeader('profile-update-interval', '24');
    res.setHeader('profile-web-page-url', `${req.protocol}://${req.get('host')}`);

    res.send(configData.config);
  } catch (error) {
    console.error('获取配置错误:', error);
    res.status(500).send('服务器错误');
  }
});

router.get('/:configId/info', (req, res) => {
  try {
    const { configId } = req.params;

    const configData = storage.getConfig(configId);
    if (!configData) {
      return res.status(404).json({ error: '配置不存在' });
    }

    res.json({
      success: true,
      config: {
        id: configId,
        name: configData.name,
        proxyCount: configData.proxyCount,
        createdAt: configData.createdAt,
        updatedAt: configData.updatedAt
      }
    });
  } catch (error) {
    console.error('获取配置信息错误:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:configId', (req, res) => {
  try {
    const { configId } = req.params;

    if (!storage.existsConfig(configId)) {
      return res.status(404).json({ error: '配置不存在' });
    }

    storage.deleteConfig(configId);
    res.json({ success: true, message: '配置已删除' });
  } catch (error) {
    console.error('删除配置错误:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:configId', express.json(), (req, res) => {
  try {
    const { configId } = req.params;
    const { name } = req.body;

    const configData = storage.getConfig(configId);
    if (!configData) {
      return res.status(404).json({ error: '配置不存在' });
    }

    if (name) {
      configData.name = name;
      storage.saveConfig(configId, configData);
    }

    res.json({ success: true, message: '配置已更新' });
  } catch (error) {
    console.error('更新配置错误:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:configId/regenerate', express.json(), async (req, res) => {
  try {
    const { configId } = req.params;

    const configData = storage.getConfig(configId);
    if (!configData) {
      return res.status(404).json({ error: '配置不存在' });
    }

    if (!configData.nodes || !configData.template) {
      return res.status(400).json({ error: '缺少原始数据，无法重新生成' });
    }

    const proxies = parseProxies(configData.nodes);
    const templateConfig = parseTemplate(configData.template);
    const clashConfig = await generateClashConfig(proxies, templateConfig);

    configData.config = clashConfig;
    configData.proxyCount = proxies.length;
    storage.saveConfig(configId, configData);

    res.json({
      success: true,
      message: '配置已重新生成',
      proxyCount: proxies.length
    });
  } catch (error) {
    console.error('重新生成配置错误:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
