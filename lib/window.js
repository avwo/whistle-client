const { app, BrowserWindow, screen } = require('electron');
const { ICON, closeWhistle, showWin } = require('./util');
const ctx = require('./context');
const { disableProxy, isEnabled, getTitle } = require('./proxy');
const storage = require('./storage');

const TABS = ['Network', 'Rules', 'Values', 'Plugins'];
const WINDOW_BOUNDS_KEY = 'windowBounds';
const MIN_SIZE = 160;
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
  let timer;
  const saveSizeDebounce = (max) => {
    clearTimeout(timer);
    if (max) {
      return storage.removeProperty(WINDOW_BOUNDS_KEY);
    }
    timer = setTimeout(() => {
      const {
        width, height, x, y,
      } = win.getBounds();
      storage.setProperty(WINDOW_BOUNDS_KEY, {
        width, height, x, y,
      });
    }, 200);
  };
  win.onBeforeFindInPage = function (keyword, opts) {
    const prev = !!opts && !opts.forward;
    keyword = String(keyword).replace(/"/g, '\\"');
    return ctx.execJsSafe(`window.__findWhistleCodeMirrorEditor_("${keyword}", ${prev});`);
  };
  ctx.setWin(win);
  win.setMenu(null);
  const bounds = storage.getProperty(WINDOW_BOUNDS_KEY);
  if (bounds && bounds.width > 0 && bounds.height > 0) {
    win.setSize(Math.max(bounds.width, MIN_SIZE), Math.max(bounds.height, MIN_SIZE));
    if (typeof bounds.x === 'number' && typeof bounds.y === 'number') {
      const winBounds = win.getBounds();
      const { width, height } = screen.getDisplayMatching(winBounds).bounds;
      const maxX = Math.max(width - winBounds.width, 0);
      const maxY = Math.max(height - winBounds.height, 0);
      win.setPosition(Math.min(Math.max(bounds.x, 0), maxX), Math.min(Math.max(bounds.y, 0), maxY));
    }
  } else {
    win.maximize();
  }
  win.on('resize', () => saveSizeDebounce());
  win.on('maximize', () => saveSizeDebounce(true));
  win.on('move', () => saveSizeDebounce());
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
