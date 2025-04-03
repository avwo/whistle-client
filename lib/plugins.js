const npminstall = require('npminstall');
const { getPeerPlugins } = require('whistle/lib/util/common');
const { showMessageBox } = require('./dialog');
const { CLIENT_PLUGINS_PATH } = require('./util');
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
  getPeerPlugins(data.pkgs, CLIENT_PLUGINS_PATH, (pkgs) => {
    data.pkgs = pkgs;
    if (data.pkgs.length) {
      install(data);
    }
    addRegistry(data.registry);
  });
};

exports.install = installPlugins;
