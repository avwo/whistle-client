const path = require('path');
const {
  Menu, app, Tray, shell, nativeImage, BrowserWindow, nativeTheme,
} = require('electron');
const setContextMenu = require('electron-context-menu');
const installRootCAFile = require('whistle/bin/ca');
const { version } = require('../package.json');
const {
  isEnabled, enableProxy, disableProxy, setEnabled, getTitle,
} = require('./proxy');
const { showMessageBox } = require('./dialog');
const {
  getJson, getString, requireW2, LOCALHOST, TRAY_ICON,
  sudoPrompt,
  getArtifactName,
} = require('./util');
const { getOptions, sendMsg, getWin } = require('./context');
const { restart, showWindow } = require('./window');
const { showSettings, getSettings } = require('./settings');
const storage = require('./storage');

const { getServerProxy } = requireW2('set-global-proxy');

let updateTrayMenus;
let rulesConfig;
let isSettingProxy;
const INTERVAL = 5000;
const REPO_URL = 'https://github.com/avwo/whistle-client';
let tray; // 防止被 GC https://github.com/amhoho/electron-cn-docs/blob/master/faq.md
const ICON_SIZE = { width: 15 };
const SEPARATOR_MENU = { type: 'separator' };
const showRepo = () => {
  shell.openExternal(REPO_URL);
};
const PATH_SEP_RE = /[\\/]/;
const getTheme = () => (nativeTheme.shouldUseDarkColors ? 'dark/' : '');
let theme = getTheme();
const iconCache = {};
const getIcon = (name) => {
  if (!PATH_SEP_RE.test(name)) {
    name = path.join(__dirname, `../public/${theme}${name}`);
  }
  let icon = iconCache[name];
  if (!icon) {
    icon = nativeImage.createFromPath(name).resize(ICON_SIZE);
    iconCache[name] = icon;
  }
  return icon;
};
const createIcons = () => ({
  settings: getIcon('settings.png'),
  uncheck: getIcon('uncheck.png'),
  checked: getIcon('checked.png'),
  cert: getIcon('cert.png'),
  update: getIcon('update.png'),
  network: getIcon('network.png'),
  rules: getIcon('rules.png'),
  values: getIcon('values.png'),
  plugins: getIcon('plugins.png'),
});
let icons = createIcons();

const RESTART_MENU = {
  label: 'Restart',
  accelerator: 'CommandOrControl+Shift+R',
  click: restart,
};
const QUIT_MENU = {
  label: 'Quit',
  accelerator: 'CmdOrCtrl+Q',
  role: 'quit',
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
    SEPARATOR_MENU,
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
    SEPARATOR_MENU,
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
    submenu: [RESTART_MENU, QUIT_MENU],
  },
  EDIT_MENU,
]));

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

const setStartAtLogin = (startAtLogin) => {
  if (!app.isPackaged) {
    return;
  }
  startAtLogin = !!startAtLogin;
  try {
    app.setLoginItemSettings({ openAtLogin: startAtLogin });
  } catch (e) {}
};

exports.create = async () => {
  let trayRulesMenu = [];

  updateTrayMenus = () => {
    if (rulesConfig) {
      trayRulesMenu = [];
      const { disabled, pluginsDisabled } = rulesConfig;
      trayRulesMenu.push(
        SEPARATOR_MENU,
        {
          label: 'All Plugins',
          icon: pluginsDisabled ? icons.uncheck : icons.checked,
          click: () => {
            sendMsg({ type: pluginsDisabled ? 'enableAllPlugins' : 'disableAllPlugins' });
          },
        },
        SEPARATOR_MENU,
        {
          label: 'All Rules',
          icon: disabled ? icons.uncheck : icons.checked,
          click: () => {
            sendMsg({ type: disabled ? 'enableAllRules' : 'disableAllRules' });
          },
        },
      );
      if (!disabled) {
        rulesConfig.list.forEach((rule) => {
          trayRulesMenu.push({
            label: rule.name,
            icon: rule.selected ? icons.checked : icons.uncheck,
            click: () => {
              sendMsg({
                type: rule.selected ? 'unselectRules' : 'selectRules',
                name: rule.name,
              });
            },
          });
        });
        if (trayRulesMenu.length) {
          trayRulesMenu.splice(4, 0, SEPARATOR_MENU);
        }
      }
    }
    tray.setContextMenu(Menu.buildFromTemplate(trayMenus.concat(trayRulesMenu))); // eslint-disable-line
  };
  const updateCheckbox = (menu, checked) => {
    const icon = checked ? icons.checked : icons.uncheck;
    menu.icon = icon;
    Menu.setApplicationMenu(Menu.buildFromTemplate(menus)); // eslint-disable-line
    updateTrayMenus();
  };
  const updateProxyStatus = () => {
    updateCheckbox(proxyMenu, isEnabled()); // eslint-disable-line
    storage.setProperty('autoSetProxy', isEnabled());
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
      disableSystemProxy();
    } else {
      enableSystemProxy();
    }
  };

  const updateStartAtLogin = (startAtLogin) => {
    if (startAtLogin === undefined) {
      startAtLogin = storage.getProperty('startAtLogin');
    }
    startAtLogin = !!startAtLogin;
    setStartAtLogin(startAtLogin);
    updateCheckbox(startMenu, startAtLogin); // eslint-disable-line
    storage.setProperty('startAtLogin', startAtLogin);
  };

  const switchStartAtLogin = () => {
    updateStartAtLogin(!storage.getProperty('startAtLogin'));
  };

  const installRootCA = async () => {
    try {
      const useExceFunc = await installRootCAFile(getOptions().rootCAFile, (cmd) => {
        sudoPrompt(cmd, (err) => {
          if (!err) {
            sendMsg({ type: 'enableCapture' });
          }
        });
      });
      if (!useExceFunc) {
        sendMsg({ type: 'enableCapture' });
      }
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
        buttons: ['Download', 'View CHANGELOG', 'Cancel'],
        callback() {
          shell.openExternal(`https://github.com/avwo/whistle-client/releases/download/v${newVersion}/${getArtifactName(newVersion)}`);
        },
        showSettings() {
          shell.openExternal('https://github.com/avwo/whistle-client/blob/main/CHANGELOG.md');
        },
        handleCancel() {},
      });
    } catch (e) {
      showMessageBox(e, checkUpdate);
    } finally {
      checking = false;
    }
  };

  app.on('checkUpdateClient', checkUpdate);

  const proxyMenu = {
    label: 'Set As System Proxy',
    icon: icons.uncheck,
    accelerator: 'CmdOrCtrl+R',
    click: switchSystemProxy,
  };
  const startMenu = {
    label: 'Start At Login',
    icon: icons.uncheck,
    click: switchStartAtLogin,
  };
  const createAppMenus = () => ([
    {
      label: app.getName(),
      submenu: [
        {
          label: 'Proxy Settings',
          icon: icons.settings,
          accelerator: 'CommandOrControl+,',
          click: showSettings,
        },
        {
          label: 'Install Root CA',
          icon: icons.cert,
          click: installRootCA,
        },
        {
          label: 'Check Update',
          icon: icons.update,
          click: checkUpdate,
        },
        SEPARATOR_MENU,
        proxyMenu,
        SEPARATOR_MENU,
        startMenu,
        SEPARATOR_MENU,
        RESTART_MENU,
        QUIT_MENU,
      ],
    },
    EDIT_MENU,
  ]);
  const createTrayMenus = () => ([
    {
      label: 'Show All Windows',
      click() {
        try {
          BrowserWindow.getAllWindows().forEach(win => win.show());
        } catch (e) {}
      },
    },
    {
      label: 'Hide All Windows',
      click() {
        try {
          BrowserWindow.getAllWindows().forEach(win => win.hide());
        } catch (e) {}
      },
    },
    SEPARATOR_MENU,
    {
      label: 'Proxy Settings',
      icon: icons.settings,
      accelerator: 'CommandOrControl+,',
      click: showSettings,
    },
    SEPARATOR_MENU,
    proxyMenu,
    SEPARATOR_MENU,
    startMenu,
    SEPARATOR_MENU,
    {
      label: 'Network',
      icon: icons.network,
      click() {
        showWindow('Network');
      },
    },
    {
      label: 'Rules',
      icon: icons.rules,
      click() {
        showWindow('Rules');
      },
    },
    {
      label: 'Values',
      icon: icons.values,
      click() {
        showWindow('Values');
      },
    },
    {
      label: 'Plugins',
      icon: icons.plugins,
      click() {
        showWindow('Plugins');
      },
    },
    SEPARATOR_MENU,
    RESTART_MENU,
    QUIT_MENU,
  ]);
  let menus = createAppMenus();
  let trayMenus = createTrayMenus();
  const trayIcon = getIcon(TRAY_ICON);
  trayIcon.setTemplateImage(true);
  tray = new Tray(trayIcon);
  if (process.platform === 'win32') {
    tray.on('click', showWindow);
  }
  updateStartAtLogin();

  let autoSet = storage.getProperty('autoSetProxy');
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
  nativeTheme.on('updated', () => {
    const curTheme = getTheme();
    if (theme === curTheme) {
      return;
    }
    theme = curTheme;
    icons = createIcons();
    menus = createAppMenus();
    trayMenus = createTrayMenus();
    updateStartAtLogin();
    updateProxyStatus();
    updateTrayMenus();
  });
};
exports.updateRules = (rulesConf) => {
  if (rulesConfig && rulesConf && JSON.stringify(rulesConfig) === JSON.stringify(rulesConf)) {
    return;
  }
  rulesConfig = rulesConf;
  if (updateTrayMenus) {
    updateTrayMenus();
  }
};
