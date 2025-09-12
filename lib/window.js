const { app, BrowserWindow } = require('electron');
const { ICON, closeWhistle, showWin } = require('./util');
const ctx = require('./context');
const { disableProxy, isEnabled, getTitle } = require('./proxy');

let willQuit;
let beforeQuit;

const cleanup = async () => {
  if (isEnabled()) {
    try {
      await disableProxy();
    } catch (err) {}
  }
  closeWhistle();
  app.removeListener('will-quit', handleWillQuit); // eslint-disable-line
};

const handleWillQuit = async (e) => {
  if (willQuit) {
    return app.exit();
  }
  e.preventDefault();
  willQuit = true;
  await cleanup();
  app.exit();
};

const TABS = ['Network', 'Rules', 'Values', 'Plugins'];

const showWindow = (name) => {
  if (!willQuit) {
    showWin(ctx.getWin());
  }
  if (name && TABS.includes(name)) {
    ctx.execJsSafe(`window.showWhistleWebUI("${name}")`);
  }
};

const createWindow = () => {
  const win = new BrowserWindow({
    title: getTitle(),
    fullscreen: false,
    fullscreenable: true,
    icon: ICON,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      spellcheck: false,
      webviewTag: true,
    },
  });
  win.onBeforeFindInPage = function (keyword, opts) {
    const prev = !!opts && !opts.forward;
    keyword = String(keyword).replace(/"/g, '\\"');
    return ctx.execJsSafe(`window.__findWhistleCodeMirrorEditor_("${keyword}", ${prev});`);
  };
  ctx.setWin(win);
  win.setMenu(null);
  win.maximize();
  win.on('ready-to-show', () => showWin(win));
  win.on('close', (e) => {
    if (beforeQuit) {
      return;
    }
    beforeQuit = false;
    e.preventDefault();
    win.hide();
  });
  win.webContents.once('page-title-updated', () => {
    win.setTitle(getTitle());
  });
};

app.on('before-quit', () => {
  beforeQuit = true;
});
app.on('activate', showWindow);
app.on('will-quit', handleWillQuit);

exports.willQuit = () => willQuit;

exports.showWindow = showWindow;

exports.createWindow = createWindow;

exports.restart = async () => {
  willQuit = true;
  await cleanup();
  app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) });
  app.exit();
};
