const path = require('path');
const sudoPrompt = require('sudo-prompt');
const {
  requireW2, compareFile, BASE_DIR, LOCALHOST,
} = require('./util');

const {
  enableProxy, disableProxy, getMacProxyHelper, getUid,
} = requireW2('set-global-proxy');

const TITLE = 'Whistle Web Debugging Proxy';
const DISABLED_TITLE = `${TITLE} (Not Set As System Proxy)`;
const SUDO_OPTIONS = { name: 'Whistle' };
const PROXY_HELPER = path.join(BASE_DIR, 'whistle');
let isEnabled;

const installProxyHelper = async () => {
  const originHelper = getMacProxyHelper();
  if (!originHelper) {
    return;
  }
  if (getUid(PROXY_HELPER) === 0 && (await compareFile(PROXY_HELPER, originHelper))) {
    return;
  }
  const command = `cp "${originHelper}" "${PROXY_HELPER}" && chown root:admin "${PROXY_HELPER}" && chmod a+rx+s "${PROXY_HELPER}"`;
  return new Promise((resolve, reject) => {
    sudoPrompt.exec(command, SUDO_OPTIONS, (err, stdout, stderr) => {
      err = err || stderr;
      if (err) {
        return reject(err);
      }
      resolve(stdout);
    });
  });
};

exports.enableProxy = async (options) => {
  await installProxyHelper();
  enableProxy({
    port: options.port,
    host: options.host || LOCALHOST,
    bypass: options.bypass,
    proxyHelper: PROXY_HELPER,
  });
  isEnabled = true;
};

exports.disableProxy = async () => {
  await installProxyHelper();
  disableProxy(PROXY_HELPER);
  isEnabled = false;
};

exports.isEnabled = () => isEnabled;

exports.setEnabled = (flag) => {
  isEnabled = flag;
};

exports.getTitle = () => (isEnabled !== false ? TITLE : DISABLED_TITLE);
