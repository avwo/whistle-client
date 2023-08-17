const path = require('path');
const npminstall = require('npminstall');
const { WHISTLE_PLUGIN_RE } = require('whistle/lib/util/common');
const { showMessageBox } = require('./dialog');
const {
  noop, requireW2, readJson, CLIENT_PLUGINS_PATH,
} = require('./util');
const { sendMsg, getOptions } = require('./context');

const fse = requireW2('fs-extra2');

const refreshPlugins = () => {
  sendMsg({ type: 'refreshPlugins' });
};

const addRegistry = (registry) => {
  if (registry) {
    sendMsg({ type: 'addRegistry', registry });
  }
};

const getPeerPlugins = async (pkgs, root) => {
  const peerPlugins = [];
  const curPlugins = {};
  pkgs.forEach(({ name }) => {
    curPlugins[name] = 1;
  });
  await Promise.all(pkgs.map(async ({ name }) => {
    const pkgFile = path.join(root, 'node_modules', name, 'package.json');
    const pkg = (await readJson(pkgFile)).whistleConfig || {};
    const list = pkg.peerPluginList || pkg.peerPlugins;
    if (Array.isArray(list) && list.length < 16) {
      list.forEach((pkgName) => {
        pkgName = typeof pkgName === 'string' ? pkgName.trim() : null;
        if (WHISTLE_PLUGIN_RE.test(pkgName)) {
          pkgName = RegExp.$1;
          const version = RegExp.$2;
          if (!curPlugins[pkgName]) {
            curPlugins[pkgName] = 1;
            peerPlugins.push({
              name: pkgName,
              version,
            });
          }
        }
      });
    }
  }));
  return peerPlugins;
};

const install = async (data) => {
  try {
    await npminstall(data);
    refreshPlugins();
    return true;
  } catch (e) {
    showMessageBox(e, () => install(data));
  }
};

const installPlugins = async (data) => {
  data.root = CLIENT_PLUGINS_PATH;
  if (!(await install(data))) {
    return;
  }
  data.pkgs = await getPeerPlugins(data.pkgs, CLIENT_PLUGINS_PATH);
  if (data.pkgs.length) {
    install(data);
  }
  addRegistry(data.registry);
};

exports.install = installPlugins;

const removePlugins = (data) => {
  const { customPluginsPath } = getOptions();
  data.pkgs.forEach(({ name }) => {
    const dir = path.join(CLIENT_PLUGINS_PATH, 'node_modules', name);
    fse.emptyDir(dir, noop);
    if (customPluginsPath) {
      fse.emptyDir(path.join(customPluginsPath, name), noop);
    }
  });
  refreshPlugins();
};

exports.uninstall = removePlugins;
