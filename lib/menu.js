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
const showRepo = () => {
  shell.openExternal(REPO_URL);
};
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
    submenu: [RESTART_MENU, QUIT_MENU],
  },
  EDIT_MENU,
]));

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
  const UNCHECK_ICON = getIcon(path.join(__dirname, '../public/uncheck.png'));
  const CHECKED_ICON = getIcon(path.join(__dirname, '../public/checked.png'));
  let trayRulesMenu = [];

  updateTrayMenus = () => {
    if (rulesConfig) {
      trayRulesMenu = [];
      const { disabled, pluginsDisabled } = rulesConfig;
      trayRulesMenu.push(
        { type: 'separator' },
        {
          label: 'All Plugins',
          icon: pluginsDisabled ? UNCHECK_ICON : CHECKED_ICON,
          click: () => {
            sendMsg({ type: pluginsDisabled ? 'enableAllPlugins' : 'disableAllPlugins' });
          },
        },
        { type: 'separator' },
        {
          label: 'All Rules',
          icon: disabled ? UNCHECK_ICON : CHECKED_ICON,
          click: () => {
            sendMsg({ type: disabled ? 'enableAllRules' : 'disableAllRules' });
          },
        },
      );
      if (!disabled) {
        rulesConfig.list.forEach((rule) => {
          trayRulesMenu.push({
            label: rule.name,
            icon: rule.selected ? CHECKED_ICON : UNCHECK_ICON,
            click: () => {
              sendMsg({
                type: rule.selected ? 'unselectRules' : 'selectRules',
                name: rule.name,
              });
            },
          });
        });
        if (trayRulesMenu.length) {
          trayRulesMenu.splice(4, 0, { type: 'separator' });
        }
      }
    }
    tray.setContextMenu(Menu.buildFromTemplate(trayMenus.concat(trayRulesMenu))); // eslint-disable-line
  };
  const updateCheckbox = (menu, checked) => {
    const icon = checked ? CHECKED_ICON : UNCHECK_ICON;
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
  const proxyMenu = {
    label: 'Set As System Proxy',
    icon: UNCHECK_ICON,
    accelerator: 'CmdOrCtrl+R',
    click: switchSystemProxy,
  };
  const startMenu = {
    label: 'Start At Login',
    icon: UNCHECK_ICON,
    click: switchStartAtLogin,
  };
  const menus = [
    {
      label: app.getName(),
      submenu: [
        {
          label: 'Proxy Settings',
          accelerator: 'CommandOrControl+,',
          click: showSettings,
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
        proxyMenu,
        { type: 'separator' },
        startMenu,
        { type: 'separator' },
        RESTART_MENU,
        QUIT_MENU,
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
    proxyMenu,
    { type: 'separator' },
    startMenu,
    { type: 'separator' },
    {
      label: 'Proxy Settings',
      icon: getIcon(path.join(__dirname, '../public/settings.png')),
      accelerator: 'CommandOrControl+,',
      click: showSettings,
    },
    { type: 'separator' },
    {
      label: 'Network',
      icon: getIcon(path.join(__dirname, '../public/network.png')),
      click() {
        showWindow('Network');
      },
    },
    {
      label: 'Rules',
      icon: getIcon(path.join(__dirname, '../public/rules.png')),
      click() {
        showWindow('Rules');
      },
    },
    {
      label: 'Values',
      icon: getIcon(path.join(__dirname, '../public/values.png')),
      click() {
        showWindow('Values');
      },
    },
    {
      label: 'Plugins',
      icon: getIcon(path.join(__dirname, '../public/plugins.png')),
      click() {
        showWindow('Plugins');
      },
    },
    { type: 'separator' },
    RESTART_MENU,
    QUIT_MENU,
  ];
  const trayIcon = getIcon(TRAY_ICON);
  trayIcon.setTemplateImage(true);
  tray = new Tray(trayIcon);
  if (process.platform === 'win32') {
    tray.on('click', showWindow);
  }
  updateStartAtLogin(storage.getProperty('startAtLogin'));

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
