const path = require('path');
const cp = require('child_process');
const {
  app, BrowserWindow, Menu, shell, systemPreferences,
} = require('electron');
const { writeLogSync } = require('whistle/lib/util/common');
const {
  noop, ICON, showWin, getErrorStack, getErrorMsg, isMac,
} = require('./util');
const ctx = require('./context');
const { showMessageBox } = require('./dialog');
const { createWindow, restart, showWindow } = require('./window');
const forkWhistle = require('./fork');

process.env.PFORK_EXEC_PATH = process.execPath;

const quitApp = () => app.quit();

const handleSquirrel = (uninstall) => {
  const updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
  const target = path.basename(process.execPath);
  const name = uninstall ? '--removeShortcut' : '--createShortcut';
  const child = cp.spawn(updateDotExe, [name, target], { detached: true });
  child.on('error', noop);
  child.on('close', quitApp);
};

const handleStartupEvent = () => {
  if (process.platform !== 'win32') {
    return false;
  }
  /* eslint-disable default-case */
  switch (process.argv[1]) {
    case '--squirrel-install':
    case '--squirrel-updated':
      handleSquirrel();
      return true;
    case '--squirrel-uninstall':
      handleSquirrel(true);
      return true;
    case '--squirrel-obsolete':
      quitApp();
      return true;
  }
};

let allWinList = [];
let allWinTitle = [];
const setAllWinList = (list) => {
  allWinList = list;
  allWinTitle = list.map(w => w.title);
  return false;
};
const compareWinList = (list) => {
  const len = list.length;
  if (list.length !== allWinList.length) {
    return setAllWinList(list);
  }
  for (let i = 0; i < len; i++) {
    const win = list[i];
    if (allWinList[i] !== win || allWinTitle[i] !== win.title) {
      return setAllWinList(list);
    }
  }
  return true;
};

const updateDock = () => {
  const list = BrowserWindow.getAllWindows().filter(win => !win.isSettingsWin || win.isVisible());
  if (compareWinList(list)) {
    return;
  }
  let focusedWin = BrowserWindow.getFocusedWindow();
  const menus = Menu.buildFromTemplate(allWinList.map((win) => ({
    label: win.title,
    type: 'checkbox',
    checked: focusedWin === win,
    click() {
      showWin(win);
      setImmediate(() => {
        focusedWin = BrowserWindow.getFocusedWindow();
        allWinList.forEach((w, i) => {
          menus.items[i].checked = w === focusedWin;
        });
      });
    },
  })));
  app.dock.setMenu(menus);
};

(() => {
  if (isMac) {
    app.dock.setIcon(ICON);
    systemPreferences.setUserDefault('NSDisabledDictationMenuItem', 'boolean', true);
    systemPreferences.setUserDefault('NSDisabledCharacterPaletteMenuItem', 'boolean', true);
  }
  if (!app.requestSingleInstanceLock()) {
    return quitApp();
  }

  app.on('second-instance', () => showWin(ctx.getWin()));

  if (handleStartupEvent()) {
    return;
  }
  if (isMac) {
    app.on('open-url', showWindow);
    app.on('web-contents-created', (_, win) => {
      win.on('page-title-updated', updateDock);
      win.once('close', updateDock);
      win.on('ready-to-show', updateDock);
    });
    setInterval(updateDock, 160);
  }
  app.whenReady().then(() => {
    createWindow();
    forkWhistle();
    app.on('whistleSettingsChanged', forkWhistle);
  });
})();

const handleGlobalException = async (err) => {
  const stack = getErrorStack(err);
  console.error(stack); // eslint-disable-line
  writeLogSync(`\r\n${stack}\r\n`);
  let msg = getErrorMsg(err || 'An error occurred');
  if (/^ERR_NETWORK/.test(err && err.code) || /^net::/.test(msg)) {
    return;
  }
  const handleCancel = () => {
    if (!ctx.getOptions()) {
      app.exit();
    }
  };
  app.waitForExiting = showMessageBox(msg, {
    buttons: ['Feedback', 'Restart', 'Cancel'],
    callback() {
      msg = encodeURIComponent(`[Bug]: ${msg}`);
      shell.openExternal(`https://github.com/avwo/whistle-client/issues/new?title=${msg}`);
      handleCancel();
    },
    handleAction: restart,
    handleCancel,
  }).then(res => {
    app.waitForExiting = null;
    return res === 1;
  });
};

process.on('unhandledRejection', handleGlobalException);
process.on('uncaughtException', handleGlobalException);
