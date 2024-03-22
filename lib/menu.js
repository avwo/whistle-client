const path = require('path');
const {
  Menu, app, Tray, shell, nativeImage, BrowserWindow,
} = require('electron');
const setContextMenu = require('electron-context-menu');
const installRootCAFile = require('whistle/bin/ca');
const { version } = require('../package.json');
const {
  isEnabled, enableProxy, disableProxy, setEnabled, getTitle,
} = require('./proxy');
const { showMessageBox } = require('./dialog');
const {
  getJson, getString, requireW2, LOCALHOST,
} = require('./util');
const { getOptions, sendMsg, getWin } = require('./context');
const { showWindow, restart } = require('./window');
const { showSettings, getSettings } = require('./settings');
const storage = require('./storage');

const { getServerProxy } = requireW2('set-global-proxy');

let isSettingProxy;
const INTERVAL = 5000;
const REPO_URL = 'https://github.com/avwo/whistle-client';
let tray; // 防止被 GC https://github.com/amhoho/electron-cn-docs/blob/master/faq.md
const ICON_SIZE = { width: 15 };
const showRepo = () => {
  shell.openExternal(REPO_URL);
};
const EDIT_MENU = {
  label: 'Edit',
  submenu: [
    {
      label: 'Undo',
      accelerator: 'CmdOrCtrl+Z',
      role: 'undo',
    },
    {
      label: 'Redo',
      accelerator: 'Shift+CmdOrCtrl+Z',
      role: 'redo',
    },
    {
      type: 'separator',
    },
    {
      label: 'Cut',
      accelerator: 'CmdOrCtrl+X',
      role: 'cut',
    },
    {
      label: 'Copy',
      accelerator: 'CmdOrCtrl+C',
      role: 'copy',
    },
    {
      label: 'Paste',
      accelerator: 'CmdOrCtrl+V',
      role: 'paste',
    },
    {
      label: 'Select All',
      accelerator: 'CmdOrCtrl+A',
      role: 'selectall',
    },
    { type: 'separator' },
    {
      label: 'Help',
      click: showRepo,
    },
  ],
};

setContextMenu({
  showSelectAll: true,
  showSaveImageAs: true,
  showLookUpSelection: false,
  showSearchWithGoogle: false,
  showLearnSpelling: false,
  showCopyLink: false,
  showInspectElement: false,
});
Menu.setApplicationMenu(Menu.buildFromTemplate([
  {
    label: app.getName(),
    submenu: [
      {
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        role: 'quit',
      },
    ],
  },
  EDIT_MENU,
]));

const isAutoSetProxy = () => storage.getProperty('autoSetProxy') !== false;

const getIcon = (iconPath) => nativeImage.createFromPath(iconPath).resize(ICON_SIZE);

let curTitle;
const updateTitle = () => {
  const title = getTitle();
  if (title === curTitle) {
    return;
  }
  curTitle = title;
  const win = getWin();
  if (win) {
    win.setTitle(curTitle);
  }
  if (tray) {
    tray.setToolTip(curTitle);
  }
};

module.exports = async () => {
  const UNCHECK_ICON = getIcon(path.join(__dirname, '../public/uncheck.png'));
  const CHECKED_ICON = getIcon(path.join(__dirname, '../public/checked.png'));
  const updateProxyStatus = () => {
    const icon = isEnabled() ? CHECKED_ICON : UNCHECK_ICON;
    menus[0].submenu[4].icon = icon; // eslint-disable-line
    trayMenus[2].icon = icon; // eslint-disable-line
    Menu.setApplicationMenu(Menu.buildFromTemplate(menus)); // eslint-disable-line
    tray.setContextMenu(Menu.buildFromTemplate(trayMenus)); // eslint-disable-line
  };
  const enableSystemProxy = async () => {
    isSettingProxy = true;
    try {
      await enableProxy(getSettings());
      updateProxyStatus();
    } catch (e) {}
    isSettingProxy = false;
    updateTitle();
  };

  const disableSystemProxy = async () => {
    try {
      await disableProxy();
      updateProxyStatus();
    } catch (e) {}
    updateTitle();
  };

  const switchSystemProxy = () => {
    if (isEnabled()) {
      const msg = 'Are you sure to disable the system proxy?';
      updateProxyStatus();
      return showMessageBox(msg, {
        title: '',
        type: 'info',
        callback: disableSystemProxy,
        showSettings,
        handleCancel: true,
      });
    }
    enableSystemProxy();
  };

  const installRootCA = async () => {
    try {
      await installRootCAFile(getOptions().rootCAFile);
      sendMsg({ type: 'enableCapture' });
    } catch (e) {}
  };

  let checking;
  const checkUpdate = async () => {
    if (checking) {
      return;
    }
    checking = true;
    try {
      const pkg = await getJson('https://raw.githubusercontent.com/avwo/whistle-client/main/package.json');
      const newVersion = getString(pkg && pkg.version);
      if (!newVersion) {
        return showMessageBox('Network Error', checkUpdate);
      }
      if (version === newVersion) {
        return showMessageBox('Whistle Client is up to date', {
          title: '',
          type: 'info',
        });
      }
      return showMessageBox(`Whistle Client has new version ${newVersion}`, {
        type: 'info',
        title: '',
        buttons: ['View Update Guide', 'Cancel'],
        callback: showRepo,
      });
    } catch (e) {
      showMessageBox(e, checkUpdate);
    } finally {
      checking = false;
    }
  };
  const menus = [
    {
      label: app.getName(),
      submenu: [
        {
          label: 'Proxy Settings',
          click() {
            showSettings();
          },
        },
        {
          label: 'Install Root CA',
          click: installRootCA,
        },
        {
          label: 'Check Update',
          click: checkUpdate,
        },
        { type: 'separator' },
        {
          label: 'Set As System Proxy',
          icon: UNCHECK_ICON,
          click: switchSystemProxy,
        },
        { type: 'separator' },
        {
          label: 'Restart',
          click: restart,
        },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    EDIT_MENU,
  ];
  const trayMenus = [
    {
      label: 'Hide All Windows',
      click() {
        try {
          BrowserWindow.getAllWindows().forEach(win => win.hide());
        } catch (e) {}
      },
    },
    { type: 'separator' },
    {
      label: 'Set As System Proxy',
      icon: UNCHECK_ICON,
      click: switchSystemProxy,
    },
    { type: 'separator' },
    {
      label: 'Quit',
      role: 'quit',
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
  tray = new Tray(getIcon(path.join(__dirname, '../public/whistle.png')));
  tray.on('click', showWindow);
  tray.setContextMenu(Menu.buildFromTemplate(trayMenus));
  let autoSet = isAutoSetProxy();
  if (autoSet) {
    await enableSystemProxy();
  } else {
    setEnabled(false);
  }
  updateTitle();
  const detectProxy = () => {
    if (isSettingProxy || !isEnabled()) {
      autoSet = false;
      updateTitle();
      return setTimeout(detectProxy, INTERVAL);
    }
    getServerProxy(async (_, proxy) => {
      if (!isSettingProxy && proxy) {
        const settings = getSettings();
        const { http, https } = proxy;
        const { port } = settings;
        const host = settings.host || LOCALHOST;
        if (!http.enabled || !https.enabled || http.host !== host
          || https.host !== host || http.port !== port || https.port !== port) {
          if (autoSet) {
            await enableSystemProxy();
          } else {
            setEnabled(false);
            updateProxyStatus();
          }
        } else {
          autoSet = false;
        }
      } else if (autoSet) {
        await enableSystemProxy();
      }
      updateTitle();
      setTimeout(detectProxy, INTERVAL);
    });
  };
  setTimeout(detectProxy, autoSet ? 200 : INTERVAL);
};
