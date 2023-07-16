const { ipcRenderer } = require('electron');

const SPEC_TAGS = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
};
const SPEC_TAG_RE = /[&<>"'`]/g;
const doc = document;

function transformTag(tag) {
  return SPEC_TAGS[tag] || tag;
}

function escapeHtml(str) {
  return str.replace(SPEC_TAG_RE, transformTag);
}

function $(selector, context) {
  if (typeof selector !== 'string') {
    return selector;
  }
  return (context || doc).querySelector(selector);
}

function $$(selector, context) {
  if (typeof selector !== 'string') {
    return selector;
  }
  return (context || doc).querySelectorAll(selector);
}

function show(elem) {
  elem = $(elem);
  elem.style.display = 'block';
  return elem;
}

function hide(elem) {
  elem = $(elem);
  elem.style.display = 'none';
  return elem;
}

function hideDialog() {
  const list = $$('.mask');
  list && list.forEach(hide);
}

function showDialog(selector) {
  return show(selector);
}

let toastTimer;

function showToast(msg, delay) {
  const toast = show('#toast');
  toast.innerHTML = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    hide(toast);
  }, delay > 0 ? delay : 3000);
}

function callFn(fnName, data, cb) {
  if (typeof data === 'function') {
    cb = data;
    data = undefined;
  }
  ipcRenderer.on(fnName, (_, result) => {
    if (typeof cb === 'function') {
      cb(result);
    }
  });
  ipcRenderer.send(fnName, data);
}

doc.addEventListener('click', (e) => {
  const style = e.target.className || '';
  if (style.indexOf('hide-dialog') !== -1) {
    hideDialog();
  }
});
