const { globalShortcut } = require('electron');

const callbacks = {};

const { register, unregister } = globalShortcut;

globalShortcut.register = function (name, callback) {
  if (typeof callback !== 'function') {
    return;
  }
  if (name !== 'ESC') {
    return register.call(this, name, callback);
  }
  const list = callbacks[name] || (callbacks[name] = []);
  const index = list.indexOf(callback);
  if (index === -1) {
    list.push(callback);
    register.call(this, name, function (...args) {
      const cb = list.pop();
      if (cb) {
        cb.apply(this, args);
      }
    });
  } else {
    list.splice(index, 1);
    list.push(callback);
  }
};

globalShortcut.unregister = function (name, callback) {
  if (name !== 'ESC') {
    return unregister.call(this, name);
  }
  const list = callbacks[name];
  if (list) {
    const index = list.indexOf(callback);
    if (index !== -1) {
      list.splice(index, 1);
    }
  }
  if (!list || !list.length) {
    unregister.call(this, name);
    delete callbacks[name];
  }
};
