const { dialog, nativeImage, app } = require('electron');
const { getWin } = require('./context');
const { getErrorMsg, ICON } = require('./util');

const isFunction = (fn) => typeof fn === 'function';

exports.showMessageBox = async (message, callback, showSettings, handleCancel) => {
  if (await app.waitForExiting) {
    return;
  }
  let title;
  let type;
  let buttons;
  if (callback && typeof callback === 'object') {
    title = callback.title;
    type = callback.type;
    buttons = callback.buttons;
    showSettings = callback.handleAction || callback.showSettings;
    handleCancel = callback.handleCancel;
    callback = callback.callback;
  }
  if (message && typeof message !== 'string') {
    message = getErrorMsg(message);
  }

  if (!buttons) {
    if (showSettings) {
      buttons = [handleCancel ? 'Confirm' : 'Retry', 'Settings', handleCancel ? 'Cancel' : 'Quit'];
    } else {
      buttons = callback ? ['Retry', 'Cancel'] : ['OK'];
    }
  }
  const { response } = await dialog.showMessageBox(getWin(), {
    message,
    title: title == null ? 'Error' : (title || ' '),
    type: type || 'error',
    noLink: true,
    textWidth: 320,
    defaultId: 0,
    icon: nativeImage.createFromPath(ICON),
    buttons,
  });
  if (!response) {
    if (isFunction(callback)) {
      callback(true);
    }
    return response;
  }
  if (!showSettings) {
    return response;
  }
  if (response === 1) {
    if (isFunction(showSettings)) {
      showSettings();
    }
    return response;
  }
  if (handleCancel) {
    if (isFunction(handleCancel)) {
      handleCancel();
    }
    return response;
  }
  app.quit();
  return response;
};
