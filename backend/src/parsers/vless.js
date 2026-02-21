// VLESS 协议解析器
function parseVless(url) {
  try {
    // 移除 vless:// 前缀
    const urlStr = url.replace('vless://', '');

    // 分离 UUID 和其他部分
    const [uuidAndServer, paramsStr] = urlStr.split('?');
    const [uuid, serverAndPort] = uuidAndServer.split('@');
    const [server, port] = serverAndPort.split(':');

    // 解析 URL 参数
    const params = new URLSearchParams(paramsStr);
    const hash = urlStr.split('#')[1] || 'vless-node';

    // 构建 Clash 配置
    const proxy = {
      name: decodeURIComponent(hash),
      type: 'vless',
      server: server,
      port: parseInt(port),
      uuid: uuid,
      udp: true
    };

    // 处理加密方式
    const encryption = params.get('encryption');
    if (encryption && encryption !== 'none') {
      proxy.cipher = encryption;
    }

    // 处理流控
    const flow = params.get('flow');
    if (flow) {
      proxy.flow = flow;
    }

    // 处理网络类型
    const network = params.get('type');
    if (network) {
      proxy.network = network;

      // WebSocket 配置
      if (network === 'ws') {
        const path = params.get('path');
        const host = params.get('host');
        if (path || host) {
          proxy['ws-opts'] = {};
          if (path) proxy['ws-opts'].path = path;
          if (host) proxy['ws-opts'].headers = { Host: host };
        }
      }

      // gRPC 配置
      if (network === 'grpc') {
        const serviceName = params.get('serviceName') || params.get('path');
        if (serviceName) {
          proxy['grpc-opts'] = { 'grpc-service-name': serviceName };
        }
      }
    }

    // 处理 TLS/Reality
    const security = params.get('security');
    if (security === 'tls') {
      proxy.tls = true;
      const sni = params.get('sni');
      if (sni) proxy.servername = sni;

      const alpn = params.get('alpn');
      if (alpn) proxy.alpn = alpn.split(',');

      const fp = params.get('fp');
      if (fp) proxy['client-fingerprint'] = fp;
    } else if (security === 'reality') {
      proxy.tls = true;
      proxy.servername = params.get('sni') || 'apple.com';

      const fp = params.get('fp');
      if (fp) proxy['client-fingerprint'] = fp;

      // Reality 特有参数
      proxy['reality-opts'] = {};
      const pbk = params.get('pbk');
      if (pbk) proxy['reality-opts']['public-key'] = pbk;

      const sid = params.get('sid');
      if (sid) proxy['reality-opts']['short-id'] = sid;
    }

    return proxy;
  } catch (error) {
    console.error('VLESS 解析错误:', error.message);
    return null;
  }
}

module.exports = { parseVless };
