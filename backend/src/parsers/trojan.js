function parseTrojan(url) {
  try {
    let urlStr = url.replace('trojan://', '');

    const hashIndex = urlStr.indexOf('#');
    let name = 'trojan-node';
    if (hashIndex !== -1) {
      name = decodeURIComponent(urlStr.substring(hashIndex + 1));
      urlStr = urlStr.substring(0, hashIndex);
    }

    const atIndex = urlStr.indexOf('@');
    if (atIndex === -1) {
      console.error('Trojan 格式错误: 缺少 @ 符号');
      return null;
    }

    const password = urlStr.substring(0, atIndex);
    const serverPart = urlStr.substring(atIndex + 1);

    const questionIndex = serverPart.indexOf('?');
    let serverInfo = serverPart;
    let paramsStr = '';

    if (questionIndex !== -1) {
      serverInfo = serverPart.substring(0, questionIndex);
      paramsStr = serverPart.substring(questionIndex + 1);
    }

    const lastColonIndex = serverInfo.lastIndexOf(':');
    const server = serverInfo.substring(0, lastColonIndex);
    const port = parseInt(serverInfo.substring(lastColonIndex + 1));

    const proxy = {
      name: name,
      type: 'trojan',
      server: server,
      port: port,
      password: password,
      udp: true,
      'skip-cert-verify': false
    };

    if (paramsStr) {
      const params = new URLSearchParams(paramsStr);

      const sni = params.get('sni') || params.get('peer');
      if (sni) proxy.sni = sni;

      const type = params.get('type');
      if (type && type !== 'tcp') {
        proxy.network = type;
      }

      if (type === 'ws') {
        proxy['ws-opts'] = {};
        const path = params.get('path');
        const host = params.get('host');
        if (path) proxy['ws-opts'].path = path;
        if (host) proxy['ws-opts'].headers = { Host: host };
      }

      if (type === 'grpc') {
        const serviceName = params.get('serviceName') || params.get('path');
        if (serviceName) {
          proxy['grpc-opts'] = { 'grpc-service-name': serviceName };
        }
      }

      const alpn = params.get('alpn');
      if (alpn) proxy.alpn = alpn.split(',');

      const skipCertVerify = params.get('allowInsecure');
      if (skipCertVerify === '1' || skipCertVerify === 'true') {
        proxy['skip-cert-verify'] = true;
      }

      const fp = params.get('fp');
      if (fp) proxy['client-fingerprint'] = fp;
    }

    return proxy;
  } catch (error) {
    console.error('Trojan 解析错误:', error.message);
    return null;
  }
}

module.exports = { parseTrojan };
