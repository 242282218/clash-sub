const yaml = require('js-yaml');
const https = require('https');
const http = require('http');

const rulesCache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const cached = rulesCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      resolve(cached.data);
      return;
    }

    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'clash-sub-converter/1.0'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        rulesCache.set(url, { data, timestamp: Date.now() });
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

function matchProxyByFilter(proxyName, filter) {
  if (!filter) return false;

  try {
    let pattern = filter;
    if (pattern.startsWith('^')) pattern = pattern.substring(1);
    if (pattern.endsWith('$')) pattern = pattern.substring(0, pattern.length - 1);

    const regex = new RegExp(pattern);
    return regex.test(proxyName);
  } catch (error) {
    console.error('正则表达式错误:', filter, error.message);
    return false;
  }
}

function generateProxyGroups(templateConfig, proxies) {
  const proxyGroups = [];
  const proxyNames = proxies.map(p => p.name);

  for (const group of templateConfig.proxyGroups) {
    const clashGroup = {
      name: group.name,
      type: group.type,
      proxies: []
    };

    if (group.url && ['url-test', 'fallback', 'load-balance'].includes(group.type)) {
      clashGroup.url = group.url;
      if (group.interval) clashGroup.interval = group.interval;
      if (group.strategy) {
        clashGroup.strategy = group.strategy;
      }
    }

    for (const proxyRef of group.proxies) {
      if (proxyRef.startsWith('[]')) {
        const refName = proxyRef.substring(2);
        clashGroup.proxies.push(refName);
      }
      else if (proxyNames.includes(proxyRef)) {
        clashGroup.proxies.push(proxyRef);
      }
    }

    if (group.filter) {
      const matchedProxies = proxyNames.filter(name => matchProxyByFilter(name, group.filter));
      for (const proxyName of matchedProxies) {
        if (!clashGroup.proxies.includes(proxyName)) {
          clashGroup.proxies.push(proxyName);
        }
      }
    }

    if (clashGroup.proxies.length === 0 && group.filter === '.*') {
      clashGroup.proxies.push(...proxyNames);
    }

    if (clashGroup.proxies.length === 0) {
      clashGroup.proxies.push('DIRECT');
    }

    proxyGroups.push(clashGroup);
  }

  return proxyGroups;
}

async function fetchRules(ruleUrl) {
  try {
    if (ruleUrl.startsWith('[]')) {
      return [ruleUrl.substring(2)];
    }

    const content = await fetchUrl(ruleUrl);
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#') && !line.startsWith(';'));

    return lines;
  } catch (error) {
    console.error('获取规则失败:', ruleUrl, error.message);
    return [];
  }
}

async function generateRules(templateConfig) {
  const rules = [];

  for (const ruleset of templateConfig.rulesets) {
    if (ruleset.ruleUrl.startsWith('[]')) {
      const rule = ruleset.ruleUrl.substring(2);
      rules.push(`${rule},${ruleset.groupName}`);
    }
    else {
      try {
        const ruleLines = await fetchRules(ruleset.ruleUrl);
        for (const rule of ruleLines) {
          if (rule.includes(',')) {
            rules.push(`${rule},${ruleset.groupName}`);
          } else {
            rules.push(`${rule},${ruleset.groupName}`);
          }
        }
      } catch (error) {
        console.error('规则获取失败:', ruleset.ruleUrl);
      }
    }
  }

  return rules;
}

async function generateClashConfig(proxies, templateConfig) {
  const proxyGroups = generateProxyGroups(templateConfig, proxies);

  const rules = await generateRules(templateConfig);

  const config = {
    'mixed-port': 7890,
    'allow-lan': false,
    'bind-address': '*',
    mode: 'rule',
    'log-level': 'info',
    'ipv6': false,
    'external-controller': '127.0.0.1:9090',
    proxies: proxies,
    'proxy-groups': proxyGroups,
    rules: rules
  };

  return yaml.dump(config, {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false
  });
}

module.exports = { generateClashConfig, fetchRules, generateRules };
