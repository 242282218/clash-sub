function parseSs(url) {
  try {
    let urlStr = url.replace('ss://', '');

    const hashIndex = urlStr.indexOf('#');
    let name = 'ss-node';
    if (hashIndex !== -1) {
      name = decodeURIComponent(urlStr.substring(hashIndex + 1));
      urlStr = urlStr.substring(0, hashIndex);
    }

    const atIndex = urlStr.indexOf('@');
    let method, password, server, port;

    if (atIndex !== -1) {
      const userInfo = urlStr.substring(0, atIndex);
      const serverInfo = urlStr.substring(atIndex + 1);

      try {
        const decoded = Buffer.from(userInfo, 'base64').toString('utf-8');
        const colonIndex = decoded.indexOf(':');
        method = decoded.substring(0, colonIndex);
        password = decoded.substring(colonIndex + 1);
      } catch (e) {
        const colonIndex = userInfo.indexOf(':');
        method = userInfo.substring(0, colonIndex);
        password = userInfo.substring(colonIndex + 1);
      }

      const questionIndex = serverInfo.indexOf('?');
      let serverPart = serverInfo;
      let pluginOpts = '';

      if (questionIndex !== -1) {
        serverPart = serverInfo.substring(0, questionIndex);
        pluginOpts = serverInfo.substring(questionIndex + 1);
      }

      const lastColonIndex = serverPart.lastIndexOf(':');
      server = serverPart.substring(0, lastColonIndex);
      port = parseInt(serverPart.substring(lastColonIndex + 1));

      const proxy = {
        name: name,
        type: 'ss',
        server: server,
        port: port,
        cipher: method,
        password: password,
        udp: true
      };

      if (pluginOpts) {
        const params = new URLSearchParams(pluginOpts);
        const plugin = params.get('plugin');
        if (plugin) {
          proxy.plugin = plugin;
          const pluginOptsStr = params.get('plugin-opts') || params.get('obfs');
          if (pluginOptsStr) {
            try {
              proxy['plugin-opts'] = JSON.parse(decodeURIComponent(pluginOptsStr));
            } catch (e) {
              const opts = {};
              const parts = pluginOptsStr.split(';');
              for (const part of parts) {
                const [key, value] = part.split('=');
                if (key && value) {
                  opts[key.trim()] = value.trim();
                }
              }
              proxy['plugin-opts'] = opts;
            }
          }
        }
      }

      return proxy;
    } else {
      try {
        const decoded = Buffer.from(urlStr, 'base64').toString('utf-8');
        const methodColon = decoded.indexOf(':');
        method = decoded.substring(0, methodColon);
        const rest = decoded.substring(methodColon + 1);
        const atColon = rest.lastIndexOf(':');
        password = rest.substring(0, rest.indexOf('@'));
        const serverPart = rest.substring(rest.indexOf('@') + 1);
        const lastColon = serverPart.lastIndexOf(':');
        server = serverPart.substring(0, lastColon);
        port = parseInt(serverPart.substring(lastColon + 1));

        return {
          name: name,
          type: 'ss',
          server: server,
          port: port,
          cipher: method,
          password: password,
          udp: true
        };
      } catch (e) {
        console.error('SS 解析错误:', e.message);
        return null;
      }
    }
  } catch (error) {
    console.error('SS 解析错误:', error.message);
    return null;
  }
}

module.exports = { parseSs };
