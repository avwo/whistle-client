const { utilityProcess, app } = require('electron');
const { install, uninstall } = require('./plugins');
const {
  getSettings, showSettings, authorization, reloadPage,
} = require('./settings');
const {
  SCRIPT, closeWhistle, LOCALHOST, VERSION,
} = require('./util');
const { willQuit } = require('./window');
const {
  setChild, setOptions, getWin,
} = require('./context');
const { showMessageBox } = require('./dialog');
const createMenu = require('./menu');

const forkOptions = {
  execArgv: ['--max-semi-space-size=64', '--max-http-header-size=256000', '--tls-min-v1.0'],
};
let initing = true;
let hasError;

const handleWhistleError = async (err) => {
  if (willQuit() || hasError) {
    return;
  }
  const win = getWin();
  if (!win || win.isDestroyed()) {
    return;
  }
  hasError = true;
  err = (err !== 1 && err) || 'Failed to start, please try again';
  await showMessageBox(err, forkWhistle, showSettings); // eslint-disable-line
  hasError = false;
};

const forkWhistle = (restart) => {
  if (restart) {
    closeWhistle();
  }
  let options;
  const settings = JSON.stringify(getSettings());
  encodeURIComponent(settings);
  const args = [settings];
  const child = utilityProcess.fork(SCRIPT, args, forkOptions);
  setChild(child);
  child.on('error', handleWhistleError);
  child.once('exit', handleWhistleError);
  child.on('message', async (data) => {
    const type = data && data.type;
    if (type === 'error') {
      return handleWhistleError(data.message);
    }
    if (type === 'install') {
      return install(data.plugins);
    }
    if (type === 'uninstall') {
      return uninstall(data.plugins);
    }
    if (type === 'getRegistryList') {
      return app.emit('getRegistryList', data.list);
    }
    if (type !== 'options') {
      return;
    }
    options = data.options;
    setOptions(options);
    const win = getWin();
    const proxyRules = `http://${options.host || LOCALHOST}:${options.port}`;
    await win.webContents.session.setProxy({ proxyRules });
    if (initing) {
      initing = false;
      const { screen } = require('electron'); // eslint-disable-line
      const { width, height } = screen.getPrimaryDisplay().workAreaSize;
      let dockToBottom = '';
      if (width / (height || 1) < 0.8) {
        dockToBottom = '&dockToBottom=true';
      }
      win.loadURL(`http://local.whistlejs.com/?authorization=${authorization}${dockToBottom}&mode=client&v=${VERSION}`);
      createMenu();
    } else {
      reloadPage();
    }
  });
};

module.exports = forkWhistle;
