const { requireW2, LOCALHOST, sudoPrompt } = require('./util');

const { enableProxy, disableProxy, sudoMacProxyHelper } = requireW2('set-global-proxy');

const TITLE = 'Whistle Web Debugging Proxy (System Proxy Enabled)';
const DISABLED_TITLE = TITLE.replace('Enabled', 'Not Enabled');
let isEnabled;

exports.enableProxy = async (options) => {
  await sudoMacProxyHelper(sudoPrompt);
  enableProxy({
    port: options.port,
    host: options.host || LOCALHOST,
    bypass: options.bypass,
  });
  isEnabled = true;
};

exports.disableProxy = async () => {
  await sudoMacProxyHelper(sudoPrompt);
  disableProxy();
  isEnabled = false;
};

exports.isEnabled = () => isEnabled;

exports.setEnabled = (flag) => {
  isEnabled = flag;
};

exports.getTitle = () => (isEnabled !== false ? TITLE : DISABLED_TITLE);
