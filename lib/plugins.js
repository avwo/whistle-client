const npminstall = require('npminstall');
const fs = require('fs');
const npa = require('npminstall/lib/npa');
const Context = require('npminstall/lib/context');
const { getPeerPlugins, WHISTLE_PLUGIN_RE } = require('whistle/lib/util/common');
const { showMessageBox } = require('./dialog');
const { CLIENT_PLUGINS_PATH, noop } = require('./util');
const { sendMsg } = require('./context');

const refreshPlugins = () => {
  sendMsg({ type: 'refreshPlugins' });
};

const addRegistry = (registry) => {
  if (registry) {
    sendMsg({ type: 'addRegistry', registry });
  }
};

const install = async (data) => {
  let context;
  const tgzFiles = [];
  data.pkgs.forEach((pkg) => {
    const { name } = pkg;
    if (name && !WHISTLE_PLUGIN_RE.test(name)) {
      try {
        context = context || new Context();
        const p = npa(name, { where: data.root, nested: context.nested });
        pkg.name = p.name;
        pkg.version = p.fetchSpec || p.rawSpec;
        pkg.type = p.type;
        pkg.arg = p;
        if (!name.indexOf('file:')) {
          tgzFiles.push(name.substring(5));
        }
      } catch (e) {}
    }
  });
  try {
    await npminstall(data);
    refreshPlugins();
    tgzFiles.forEach((file) => {
      fs.unlink(file, noop);
    });
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
  getPeerPlugins(data.pkgs, CLIENT_PLUGINS_PATH, (pkgs) => {
    data.pkgs = pkgs;
    if (data.pkgs.length) {
      install(data);
    }
    addRegistry(data.registry);
  });
};

exports.install = installPlugins;
