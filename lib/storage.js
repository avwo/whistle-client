const path = require('path');
const Storage = require('whistle/lib/rules/storage');
const { BASE_DIR } = require('./util');

module.exports = new Storage(path.join(BASE_DIR, 'proxy_settings'));
