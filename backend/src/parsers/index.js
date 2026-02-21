const { parseVmess } = require('./vmess');
const { parseVless } = require('./vless');
const { parseSs } = require('./ss');
const { parseTrojan } = require('./trojan');
const { parseSsr } = require('./ssr');
const { parseHysteria2 } = require('./hysteria2');

function parseProxy(url) {
  const trimmedUrl = url.trim();

  if (trimmedUrl.startsWith('vmess://')) {
    return parseVmess(trimmedUrl);
  } else if (trimmedUrl.startsWith('vless://')) {
    return parseVless(trimmedUrl);
  } else if (trimmedUrl.startsWith('ss://')) {
    return parseSs(trimmedUrl);
  } else if (trimmedUrl.startsWith('trojan://')) {
    return parseTrojan(trimmedUrl);
  } else if (trimmedUrl.startsWith('ssr://')) {
    return parseSsr(trimmedUrl);
  } else if (trimmedUrl.startsWith('hysteria2://') || trimmedUrl.startsWith('hy2://')) {
    return parseHysteria2(trimmedUrl);
  } else {
    console.warn('不支持的协议:', trimmedUrl.substring(0, 30));
    return null;
  }
}

function parseProxies(urls) {
  const lines = urls.split('\n').filter(line => line.trim());
  const proxies = [];

  for (const line of lines) {
    const proxy = parseProxy(line);
    if (proxy) {
      proxies.push(proxy);
    }
  }

  return proxies;
}

module.exports = { parseProxy, parseProxies };
