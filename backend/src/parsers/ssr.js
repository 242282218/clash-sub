function parseSsr(url) {
  try {
    let urlStr = url.replace('ssr://', '');

    const decoded = Buffer.from(urlStr, 'base64').toString('utf-8');

    const parts = decoded.split(':');
    if (parts.length < 6) {
      console.error('SSR 格式错误: 参数不足');
      return null;
    }

    const server = parts[0];
    const port = parseInt(parts[1]);
    const protocol = parts[2];
    const method = parts[3];
    const obfs = parts[4];
    const passwordBase64 = parts[5].split('/?')[0];

    let password = '';
    try {
      password = Buffer.from(passwordBase64, 'base64').toString('utf-8');
    } catch (e) {
      password = passwordBase64;
    }

    const proxy = {
      name: 'ssr-node',
      type: 'ssr',
      server: server,
      port: port,
      cipher: method,
      password: password,
      protocol: protocol,
      'protocol-param': '',
      obfs: obfs,
      'obfs-param': ''
    };

    const paramIndex = decoded.indexOf('/?');
    if (paramIndex !== -1) {
      const paramsStr = decoded.substring(paramIndex + 2);
      const params = new URLSearchParams(paramsStr.replace(/&/g, '&'));

      const obfsParam = params.get('obfsparam');
      if (obfsParam) {
        try {
          proxy['obfs-param'] = Buffer.from(obfsParam, 'base64').toString('utf-8');
        } catch (e) {
          proxy['obfs-param'] = obfsParam;
        }
      }

      const protocolParam = params.get('protoparam');
      if (protocolParam) {
        try {
          proxy['protocol-param'] = Buffer.from(protocolParam, 'base64').toString('utf-8');
        } catch (e) {
          proxy['protocol-param'] = protocolParam;
        }
      }

      const remarks = params.get('remarks');
      if (remarks) {
        try {
          proxy.name = Buffer.from(remarks, 'base64').toString('utf-8');
        } catch (e) {
          proxy.name = remarks;
        }
      }
    }

    return proxy;
  } catch (error) {
    console.error('SSR 解析错误:', error.message);
    return null;
  }
}

module.exports = { parseSsr };
