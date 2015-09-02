'use strict';

console.info('require module b.');

require('commonCss');
require('../css/b');

require('zepto');
require('fetch');

// 直接使用npm模块
var _ = require('lodash');
