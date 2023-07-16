const { BrowserWindow, ipcMain, app } = require('electron');
const path = require('path');
const { isIP } = require('net');
const { lookup } = require('dns');
const {
  showWin, getString, LOCALHOST, USERNAME, ICON, isMac,
} = require('./util');
const {
  getWin, getOptions, getChild, sendMsg,
} = require('./context');
const { enableProxy, isEnabled } = require('./proxy');
const storage = require('./storage');

const username = USERNAME;
const password = `pass_${Math.random()}`;
const authorization = Buffer.from(`${username}:${password}`).toString('base64');
const DEFAULT_PORT = '8888';
let child;
let storageChanged;

exports.authorization = authorization;

const isPort = p => p > 0 && p < 65536;

const getPort = (p, defaultPort) => (isPort(p) ? String(p) : (defaultPort || ''));

const hideSettings = () => {
  if (child) {
    child.hide();
  }
};

const getValue = (data, key) => data && (data.getProperty ? data.getProperty(key) : data[key]);

const parseSettings = (data) => ({
  port: getPort(getValue(data, 'port'), DEFAULT_PORT),
  socksPort: getPort(getValue(data, 'socksPort')),
  username: getString(getValue(data, 'username'), 16),
  password: getString(getValue(data, 'password'), 16),
  uiAuth: { username, password },
  autoSetProxy: getValue(data, 'autoSetProxy') !== false,
  host: getString(getValue(data, 'host'), 255),
  bypass: getString(getValue(data, 'bypass'), 2000),
  useDefaultStorage: !!getValue(data, 'useDefaultStorage'),
});

const getSettings = () => parseSettings(storage);

const updateShadowRules = (settings) => {
  sendMsg({
    type: 'setShadowRules',
    settings,
  });
};
const hasChanged = (data) => {
  if (!getChild()) {
    return true;
  }
  const curSettings = getSettings();
  const keys = Object.keys(curSettings);
  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i];
    if (key !== 'uiAuth' && curSettings[key] !== data[key]) {
      return true;
    }
  }
  return false;
};

const showToast = msg => {
  msg = (msg && msg.message) || msg;
  return child.webContents.send('showToast', msg);
};

const dnsLookup = (host) => {
  if (!host || isIP(host)) {
    return host;
  }
  return new Promise((resolve, reject) => {
    lookup(host, (err, ip) => {
      if (err) {
        return reject(err);
      }
      resolve(ip || LOCALHOST);
    });
  });
};

ipcMain.on('hideSettings', () => {
  if (!getOptions()) {
    return app.quit();
  }
  hideSettings();
});
ipcMain.on('autoSetProxy', async (_, autoSetProxy) => {
  autoSetProxy = autoSetProxy !== false;
  storage.setProperty('autoSetProxy', autoSetProxy);
  showToast(`Set as system proxy on startup is ${autoSetProxy ? 'enabled' : 'disabled'}`);
});
ipcMain.on('applySettings', async (_, data) => {
  data = data && parseSettings(data);
  if (!data) {
    return;
  }
  try {
    await dnsLookup(data.host);
  } catch (e) {
    return showToast(e);
  }
  if (!hasChanged(data)) {
    return hideSettings();
  }
  const curSettings = getSettings();
  const portChanged = curSettings.port !== data.port;
  const hostChanged = curSettings.host !== data.host;
  const bypassChanged = curSettings.bypass !== data.bypass;
  if (isEnabled() && (portChanged || hostChanged || bypassChanged)) {
    try {
      await enableProxy(data);
    } catch (e) {}
  }
  updateShadowRules(data);
  delete data.uiAuth;
  storage.setProperties(data);
  hideSettings();
  storageChanged = curSettings.useDefaultStorage !== data.useDefaultStorage;
  const socksChanged = curSettings.socksPort !== data.socksPort;
  if (portChanged || hostChanged || socksChanged || storageChanged) {
    app.emit('whistleSettingsChanged', true);
  }
});

const showSettings = () => {
  showWin(child);
  child.webContents.send('showSettings', getSettings());
};

exports.reloadPage = () => {
  if (storageChanged) {
    storageChanged = false;
    const win = getWin();
    if (win) {
      win.webContents.reload();
    }
  }
};

exports.showSettings = () => {
  if (child) {
    return showSettings();
  }
  child = new BrowserWindow({
    parent: getWin(),
    title: 'Proxy Settings',
    autoHideMenuBar: true,
    show: false,
    frame: false,
    modal: true,
    icon: ICON,
    width: 470,
    height: isMac ? 420 : 395,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      spellcheck: false,
    },
  });
  child.loadFile(path.join(__dirname, '../public/settings.html'));
  child.isSettingsWin = true;
  child.on('ready-to-show', () => {
    showSettings();
  });
};

exports.getSettings = getSettings;
