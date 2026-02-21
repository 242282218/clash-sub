function parseTemplate(templateContent) {
  const lines = templateContent.split('\n');
  const config = {
    rulesets: [],
    proxyGroups: []
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) {
      continue;
    }

    if (trimmed.startsWith('ruleset=')) {
      const rulesetStr = trimmed.substring(8);
      const firstComma = rulesetStr.indexOf(',');
      if (firstComma !== -1) {
        const groupName = rulesetStr.substring(0, firstComma).trim();
        const ruleUrl = rulesetStr.substring(firstComma + 1).trim();
        config.rulesets.push({ groupName, ruleUrl });
      }
    }

    if (trimmed.startsWith('custom_proxy_group=')) {
      const groupStr = trimmed.substring(19);
      const parts = groupStr.split('`');

      if (parts.length >= 2) {
        const proxyGroup = {
          name: parts[0],
          type: parts[1],
          proxies: [],
          filter: null,
          url: null,
          interval: null,
          strategy: null
        };

        for (let i = 2; i < parts.length; i++) {
          const part = parts[i];

          if (part.startsWith('(') || (part.startsWith('^') && !part.startsWith('http'))) {
            proxyGroup.filter = part;
          }
          else if (part.startsWith('http://') || part.startsWith('https://')) {
            proxyGroup.url = part;
          }
          else if (part === 'consistent-hashing' || part === 'round-robin') {
            proxyGroup.strategy = part;
          }
          else if (/^\d+$/.test(part)) {
            if (!proxyGroup.interval) {
              proxyGroup.interval = parseInt(part);
            }
          }
          else {
            proxyGroup.proxies.push(part);
          }
        }

        config.proxyGroups.push(proxyGroup);
      }
    }
  }

  return config;
}

module.exports = { parseTemplate };
