const { app, BrowserWindow } = require('electron');
const {
  TITLE, ICON, closeWhistle, showWin,
} = require('./util');
const ctx = require('./context');
const { disableProxy, isEnabled } = require('./proxy');

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

const showWindow = () => {
  if (!willQuit) {
    showWin(ctx.getWin());
  }
};

const createWindow = () => {
  const win = new BrowserWindow({
    title: TITLE,
    fullscreen: false,
    fullscreenable: true,
    icon: ICON,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      spellcheck: false,
    },
  });
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
