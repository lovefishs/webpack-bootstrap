'use strict';

var proxy = require('koa-proxy');

var list = require('./mock/list');

module.exports = function(router, app) {
  // mock api
  // 可以根据需要任意定制接口的返回
  // router.post('/api/list', function *() {
  //   var query = this.query || {};
  //   var offset = query.offset || 0;
  //   var limit = query.limit || 10;
  //   var diff = limit - list.length;
  //   // console.log(query);

  //   if (diff <= 0) {
  //     this.body = {
  //       code: 0,
  //       data: list.slice(0, limit)
  //     };
  //   } else {
  //     var arr = list.slice(0, list.length);
  //     var i = 0;

  //     while (diff--) arr.push(arr[i++]);

  //     this.body = {
  //       code: 0,
  //       data: arr
  //     };
  //   }
  // });
  // method is GET
  router.get('/api/list', function *() {
    var query = this.query || {};
    var offset = query.offset || 0;
    var limit = query.limit || 10;
    var diff = limit - list.length;
    console.log(query); // { offset: '0', limit: '5' }

    if (diff <= 0) {
      this.body = {
        code: 0,
        data: list.slice(0, limit)
      };
    } else {
      var arr = list.slice(0, list.length);
      var i = 0;

      while (diff--) arr.push(arr[i++]);

      this.body = {
        code: 0,
        data: arr
      };
    }
  });

  // proxy api
  router.get('/api/foo/bar', proxy({
    url: 'http://foo.bar.com'
  }));
};
