const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const CONFIGS_FILE = path.join(DATA_DIR, 'configs.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadConfigs() {
  ensureDataDir();
  try {
    if (fs.existsSync(CONFIGS_FILE)) {
      const data = fs.readFileSync(CONFIGS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('加载配置文件失败:', error.message);
  }
  return {};
}

function saveConfigs(configs) {
  ensureDataDir();
  try {
    fs.writeFileSync(CONFIGS_FILE, JSON.stringify(configs, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('保存配置文件失败:', error.message);
    return false;
  }
}

function saveConfig(configId, configData) {
  const configs = loadConfigs();
  configs[configId] = {
    ...configData,
    createdAt: configData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  return saveConfigs(configs);
}

function getConfig(configId) {
  const configs = loadConfigs();
  return configs[configId] || null;
}

function deleteConfig(configId) {
  const configs = loadConfigs();
  if (configs[configId]) {
    delete configs[configId];
    return saveConfigs(configs);
  }
  return false;
}

function listConfigs() {
  const configs = loadConfigs();
  const list = [];
  for (const [id, data] of Object.entries(configs)) {
    list.push({
      id,
      name: data.name || `订阅 ${id.substring(0, 8)}`,
      proxyCount: data.proxyCount || 0,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    });
  }
  return list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function existsConfig(configId) {
  const configs = loadConfigs();
  return configId in configs;
}

module.exports = {
  saveConfig,
  getConfig,
  deleteConfig,
  listConfigs,
  existsConfig
};
