let win;
let child;
let options;
let dataUrl;
let timer;
let isRunning = false;

const execJsSafe = async (code) => {
  try {
    return await win.webContents.executeJavaScript(code);
  } catch (e) {}
};

exports.execJsSafe = execJsSafe;

const importDataUrl = async (delay) => {
  if (delay !== true && win && isRunning && dataUrl && win.webContents) {
    const result = await execJsSafe(`window.setWhistleDataUrl("${dataUrl}")`);
    if (result != null) {
      dataUrl = null;
    }
  }
  timer = dataUrl && setTimeout(importDataUrl, isRunning ? 100 : 300);
};

const setDataUrl = function () {
  clearTimeout(timer);
  importDataUrl(true);
};

exports.setChild = (c) => {
  child = c;
};

exports.getChild = () => child;

exports.setWin = (w) => {
  win = w;
  setDataUrl();
};

exports.getWin = () => win;

exports.setOptions = (o) => {
  options = o;
};

exports.getOptions = () => options;

const sendMsg = (data) => {
  if (child) {
    child.postMessage(data);
  }
};

exports.sendMsg = sendMsg;

exports.setDataUrl = (url) => {
  dataUrl = url.replace(/[^\w.~!*'’();:@&=+$,/?#[\]<>{}|%-]/g, (s) => {
    try {
      return encodeURIComponent(s);
    } catch (e) {}
    return '';
  });
  setDataUrl();
};

exports.isRunning = () => isRunning;
exports.setRunning = (running) => {
  isRunning = running;
};
