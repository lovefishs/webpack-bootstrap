'use strict';

require('reset');
require('../css/common');
require('../css/index');

require('whatwg-fetch');

let fetch = window.fetch;
let _ = require('lodash');

let hello = document.getElementById('hello');
hello.innerHTML = 'Hello world!';

// get list
let list = document.getElementById('list');
fetch(list.getAttribute('data-url'), {
  method: 'get'
}).then(function(response) {
  return response.json();
}).then(function(json) {
  let template = require('../../tmpl/list.ejs');
  // console.log(template);
  // console.log(typeof json, json);
  
  let data = _.sortByAll(json.data, 'title');
  let html = template({
    list: data
  });

  list.innerHTML = html;
});
