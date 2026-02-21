// VMess 协议解析器
function parseVmess(url) {
  try {
    // 移除 vmess:// 前缀
    const base64Data = url.replace('vmess://', '');

    // Base64 解码
    const jsonStr = Buffer.from(base64Data, 'base64').toString('utf-8');
    const config = JSON.parse(jsonStr);

    // 转换为 Clash 格式
    const proxy = {
      name: config.ps || 'vmess-node',
      type: 'vmess',
      server: config.add,
      port: parseInt(config.port),
      uuid: config.id,
      alterId: parseInt(config.aid || 0),
      cipher: config.scy || 'auto',
      udp: true
    };

    // 处理网络类型
    if (config.net) {
      proxy.network = config.net;

      // WebSocket 配置
      if (config.net === 'ws') {
        if (config.path) proxy['ws-opts'] = { path: config.path };
        if (config.host) {
          proxy['ws-opts'] = proxy['ws-opts'] || {};
          proxy['ws-opts'].headers = { Host: config.host };
        }
      }

      // gRPC 配置
      if (config.net === 'grpc' && config.path) {
        proxy['grpc-opts'] = { 'grpc-service-name': config.path };
      }
    }

    // TLS 配置
    if (config.tls === 'tls') {
      proxy.tls = true;
      if (config.sni) proxy.servername = config.sni;
      if (config.alpn) proxy.alpn = config.alpn.split(',');
    }

    return proxy;
  } catch (error) {
    console.error('VMess 解析错误:', error.message);
    return null;
  }
}

module.exports = { parseVmess };
