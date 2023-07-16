let win;
let child;
let options;

exports.setChild = (c) => {
  child = c;
};

exports.getChild = () => child;

exports.setWin = (w) => {
  win = w;
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
