'use strict';

console.info('require module a.');

require('commonCss');
require('../css/a');

require('zepto');
require('fetch');

// 直接使用npm模块
var _ = require('lodash');

var component = getQuery('component');

function getQuery(name) {
  var u = location.search.slice(1);
  var re = new RegExp(name + '=([^&\\s+]+)');
  var m = u.match(re);
  var v = m ? m[1] : '';

  return (v === '' || isNaN(v)) ? v : v - 0;
}

if ('dialog' === component) {
  require.ensure([], function(require) {
    var dialog = require('./component/dialog');
    // todo ...

    $('#dialog').removeClass('none');
  });
}

if ('toast' === component) {
  require.ensure([], function(require) {
    var toast = require('./component/toast');
    // todo ...

    $('#toast').removeClass('none');
  });
}

require.ensure([], function() {
  var t = _.now();
  var data = new FormData();
  data.append('offset', 0);
  data.append('limit', 5);

  // fetch('/api/list', {
  //   method: 'post',
  //   headers: {
  //     'Accept': 'application/json',
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     offset: 0,
  //     limit: 5
  //   })
  // }).then(function(response) {
  //   console.log(response);
  // });

  fetch('/api/list?offset=0&limit=5', {
    method: 'get'
  }).then(function(response) {
    return response.json();
  }).then(function(json) {
    var template = require('../tmpl/list.ejs');
    // console.log(template);
    // console.log(typeof json, json);
    
    var html = template({
      list: json.data || []
    });

    console.info('ajax took %d ms.', _.now() - t);

    $('#list').html(html);
  });
});

var logoImg = require('webpackLogo');
var $logo = $('<img />').attr('src', logoImg);

$('#logo').html($logo);
