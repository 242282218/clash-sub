function parseHysteria2(url) {
  try {
    let urlStr = url.replace('hysteria2://', '').replace('hy2://', '');

    const hashIndex = urlStr.indexOf('#');
    let name = 'hysteria2-node';
    if (hashIndex !== -1) {
      name = decodeURIComponent(urlStr.substring(hashIndex + 1));
      urlStr = urlStr.substring(0, hashIndex);
    }

    const atIndex = urlStr.indexOf('@');
    if (atIndex === -1) {
      console.error('Hysteria2 格式错误: 缺少 @ 符号');
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

    const portIndex = serverInfo.indexOf(':');
    const server = serverInfo.substring(0, portIndex);
    const portStr = serverInfo.substring(portIndex + 1);

    let port = 443;
    let ports = null;

    if (portStr.includes('-')) {
      ports = portStr;
    } else {
      port = parseInt(portStr);
    }

    const proxy = {
      name: name,
      type: 'hysteria2',
      server: server,
      port: port,
      password: password
    };

    if (ports) {
      proxy.ports = ports;
    }

    if (paramsStr) {
      const params = new URLSearchParams(paramsStr);

      const sni = params.get('sni');
      if (sni) proxy.sni = sni;

      const obfs = params.get('obfs');
      if (obfs) proxy.obfs = obfs;

      const obfsPassword = params.get('obfs-password');
      if (obfsPassword) proxy['obfs-password'] = obfsPassword;

      const skipCertVerify = params.get('insecure');
      if (skipCertVerify === '1' || skipCertVerify === 'true') {
        proxy['skip-cert-verify'] = true;
      }

      const alpn = params.get('alpn');
      if (alpn) proxy.alpn = alpn.split(',');
    }

    return proxy;
  } catch (error) {
    console.error('Hysteria2 解析错误:', error.message);
    return null;
  }
}

module.exports = { parseHysteria2 };
