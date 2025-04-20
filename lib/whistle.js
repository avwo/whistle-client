process.env.ELECTRON_RUN_AS_NODE = '1';

const path = require('path');
const fs = require('fs');
const net = require('net');
const startWhistle = require('whistle');
const {
  PROC_PATH, BASE_DIR, LOCALHOST, CUSTOM_PLUGINS_PATH, CLIENT_PLUGINS_PATH, requireW2,
} = require('./util');

const { getBypass } = requireW2('set-global-proxy');
const PROJECT_PLUGINS_PATH = path.join(__dirname, '../node_modules');
const pluginsPath = [path.join(CLIENT_PLUGINS_PATH, 'node_modules')];
const WEB_PAGE = path.join(__dirname, '../public/open.html');
const SPECIAL_AUTH = `${Math.random()}`;
const CIDR_RE = /^([(a-z\d:.]+)\/\d{1,2}$/i;

const isCIDR = (host) => {
  host = CIDR_RE.exec(host);
  if (!host) {
    return false;
  }
  return net.isIP(host[1]);
};

const sendMsg = (data) => {
  process.parentPort.postMessage(data);
};

process.handleUncauthtWhistleErrorMessage = (stack, err) => {
  sendMsg({
    type: 'error',
    message: (err && err.message) || stack,
  });
};

const getBypassRules = (bypass) => {
  if (!bypass || typeof bypass !== 'string') {
    return '';
  }
  bypass = getBypass(bypass.trim().toLowerCase());
  if (!bypass) {
    return;
  }
  const result = [];
  bypass.forEach((host) => {
    if (isCIDR(host)) {
      return;
    }
    if (host === '<local>') {
      host = LOCALHOST;
    } else if (/^\*\./.test(host)) {
      host = `*${host}`;
    }
    if (!result.includes(host)) {
      result.push(host);
    }
  });
  return result.length ? `disable://capture ${result.join(' ')}` : '';
};

const getShadowRules = (settings) => {
  const { username, password, bypass } = settings || {};
  const auth = username || password ? `* whistle.proxyauth://${username}:${password}` : '';
  return `${auth}\n${getBypassRules(bypass)}`.trim();
};

const parseJSON = (str) => {
  if (str) {
    try {
      str = decodeURIComponent(str);
      return JSON.parse(str);
    } catch (e) {}
  }
  return {};
};

const parseOptions = () => {
  const options = parseJSON(process.argv[2]);
  const uiAuth = options.uiAuth || {};
  process.env.PFORK_MAX_HTTP_HEADER_SIZE = options.maxHttpHeaderSize * 1024;
  return {
    port: options.port,
    host: options.host,
    socksPort: options.socksPort,
    username: uiAuth.username,
    password: uiAuth.password,
    bypass: options.bypass,
    shadowRules: getShadowRules(options),
    useDefaultStorage: options.useDefaultStorage,
  };
};
const newOptions = parseOptions();
const baseDir = newOptions.useDefaultStorage ? '' : BASE_DIR;
if (!baseDir) {
  newOptions.customPluginsPath = CUSTOM_PLUGINS_PATH;
}
const baseOptions = {
  baseDir,
  pluginsPath,
  projectPluginsPath: PROJECT_PLUGINS_PATH,
  specialAuth: SPECIAL_AUTH,
  mode: 'client|disableUpdateTips|disableAuthUI',
  ...newOptions,
  disableInstaller: true,
};

const proxy = startWhistle({
  ...baseOptions,
  installPlugins(plugins) {
    sendMsg({
      type: 'install',
      plugins,
    });
  },
  handleWebReq(_, res) {
    res.sendFile(WEB_PAGE);
  },
}, () => {
  sendMsg({
    type: 'options',
    options: {
      ...baseOptions,
      registryPath: proxy.pluginMgr.REGISTRY_LIST,
      rootCAFile: proxy.httpsUtil.getRootCAFile(),
    },
  });
  const host = baseOptions.host || LOCALHOST;
  const { port } = baseOptions;
  try {
    fs.writeFileSync(PROC_PATH, `${process.pid},${host},${port},${SPECIAL_AUTH}`);
  } catch (e) {}
});
process.parentPort.on('message', (data) => {
  data = data && data.data;
  const { type } = data;
  if (type === 'refreshPlugins') {
    return proxy.pluginMgr.refreshPlugins();
  }
  if (type === 'addRegistry') {
    return proxy.pluginMgr.addRegistry(data.registry);
  }
  if (type === 'enableCapture') {
    return proxy.rulesUtil.properties.setEnableCapture(true);
  }
  if (type === 'enableCapture') {
    return proxy.rulesUtil.properties.setEnableCapture(true);
  }
  if (type === 'setShadowRules') {
    return proxy.setShadowRules(getShadowRules(data.settings));
  }
  if (type === 'getRegistryList') {
    return sendMsg({
      type: 'getRegistryList',
      list: proxy.pluginMgr.getRegistryList(),
    });
  }
  if (type === 'exitWhistle') {
    return process.exit();
  }
});
