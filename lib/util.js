const fs = require('fs');
const path = require('path');
const { homedir } = require('os');
const http = require('http');
const { parse } = require('url');
const requireW2 = require('whistle/require');
const WHISTLE_PATH = require('whistle').getWhistlePath();
const { getChild, sendMsg, getOptions } = require('./context');
const config = require('../package.json');

const fse = requireW2('fs-extra');
const noop = () => {};
const USERNAME = config.name;
const PROC_PATH = path.join(homedir(), '.whistle_client.pid');
const SCRIPT = path.join(__dirname, 'whistle.js');
const ICON = path.join(__dirname, '../public/whistle.png');
const HTTPS_RE = /^https:\/\//;
const LOCALHOST = '127.0.0.1';
const isMac = process.platform === 'darwin';

exports.isMac = isMac;
exports.LOCALHOST = LOCALHOST;
exports.VERSION = config.version;
exports.BASE_DIR = path.join(WHISTLE_PATH, '.whistle_client');
exports.CLIENT_PLUGINS_PATH = path.join(WHISTLE_PATH, '.whistle_client_plugins');
exports.CUSTOM_PLUGINS_PATH = path.join(WHISTLE_PATH, 'custom_plugins');
exports.noop = noop;
exports.USERNAME = USERNAME;
exports.requireW2 = requireW2;
exports.PROC_PATH = PROC_PATH;
exports.SCRIPT = SCRIPT;
exports.ICON = ICON;

const existsFile = (file) => new Promise((resolve) => {
  fs.stat(file, (err, stat) => {
    if (err) {
      return fs.stat(file, (_, s) => resolve(s && s.isFile()));
    }
    resolve(stat.isFile());
  });
});

const readFile = (file) => new Promise((resolve) => {
  fs.readFile(file, (err, buf) => {
    if (err) {
      return fs.readFile(file, (_, buf2) => resolve(buf2));
    }
    resolve(buf);
  });
});

exports.compareFile = async (file1, file2) => {
  const exists = await existsFile(file1);
  if (!exists) {
    return false;
  }
  const [ctn1, ctn2] = await Promise.all([readFile(file1), readFile(file2)]);
  return ctn1 && ctn2 ? ctn1.equals(ctn2) : false;
};

exports.readJson = (file) => new Promise((resolve) => {
  fse.readJson(file, (err, data) => {
    if (err) {
      return fse.readJson(file, (_, data2) => {
        resolve(data2 || {});
      });
    }
    resolve(data || {});
  });
});

const killProcess = (pid) => {
  if (pid) {
    try {
      process.kill(pid);
    } catch (e) {}
  }
};

const ENCODING = { encoding: 'utf-8' };

const readFileSync = (file) => {
  try {
    return fs.readFileSync(file, ENCODING);
  } catch (e) {}
  return fs.readFileSync(file, ENCODING);
};

exports.readFileSync = readFileSync;

exports.closeWhistle = () => {
  const child = getChild();
  const curPid = child && child.pid;
  if (child) {
    child.removeAllListeners();
    child.on('error', noop);
  }
  if (curPid) {
    sendMsg({ type: 'exitWhistle' });
    killProcess(curPid);
  }
  try {
    const pid = +readFileSync(PROC_PATH).split(',', 1)[0];
    if (pid !== curPid) {
      killProcess(pid);
    }
  } catch (e) {} finally {
    try {
      fs.unlinkSync(PROC_PATH);
    } catch (e) {}
  }
};

exports.showWin = (win) => {
  if (!win) {
    return;
  }
  if (win.isMinimized()) {
    win.restore();
  }
  win.show();
  win.focus();
};

exports.getErrorMsg = (err) => {
  try {
    return err.message || err.stack || `${err}`;
  } catch (e) {}
  return 'Unknown Error';
};

exports.getErrorStack = (err) => {
  if (!err) {
    return '';
  }

  let stack;
  try {
    stack = err.stack;
  } catch (e) {}
  stack = stack || err.message || err;
  const result = [
    `From: ${USERNAME}@${config.version}`,
    `Node: ${process.version}`,
    `Date: ${new Date().toLocaleString()}`,
    stack,
  ];
  return result.join('\r\n');
};

const parseJson = (str) => {
  try {
    return str && JSON.parse(str);
  } catch (e) {}
};

const getString = (str, len) => {
  if (typeof str !== 'string') {
    return '';
  }
  str = str.trim();
  return len ? str.substring(0, len) : str;
};

exports.getString = getString;

exports.getJson = (url) => {
  const options = getOptions();
  if (!options) {
    return;
  }
  const isHttps = HTTPS_RE.test(url);
  url = parse(url.replace(HTTPS_RE, 'http://'));
  const headers = { host: url.host };
  if (isHttps) {
    headers['x-whistle-https-request'] = '1';
  }
  url.headers = headers;
  delete url.hostname;
  url.host = options.host || LOCALHOST;
  url.port = options.port;
  return new Promise((resolve, reject) => {
    const handleError = (err) => {
      clearTimeout(timer);  // eslint-disable-line
      reject(err || new Error('Timeout'));
      client.destroy(); // eslint-disable-line
    };
    const timer = setTimeout(handleError, 16000);
    const client = http.get(url, (res) => {
      res.on('error', handleError);
      if (res.statusCode !== 200) {
        return handleError(new Error(`Response code ${res.statusCode}`));
      }
      let body;
      res.on('data', (chunk) => {
        body = body ? Buffer.concat([body, chunk]) : chunk;
      });
      res.once('end', () => {
        clearTimeout(timer);
        resolve(parseJson(body && body.toString()));
      });
    });
    client.on('error', handleError);
  });
};

exports.execJsSafe = async (win, code) => {
  try {
    return await win.executeJavaScript(code);
  } catch (e) {}
};

const findNext = (win, forward) => {
  try {
    return win.findInPage(win._findBarText, {
      forward,
      findNext: true,
      matchCase: false,
    });
  } catch (e) {}
};

exports.findNext = (win) => {
  let forward = win._findForward;
  if (forward) {
    const next = forward > 0;
    win._findBarReqId = findNext(win, next);
    win._findForward = forward - (next ? 1 : -1);
  } else {
    win._findForward = undefined;
  }
};
