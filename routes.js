'use strict';

var proxy = require('koa-proxy');

function router(router, app) {
  // eg:
  // router
  //   .get('/', function *(next) {
  //     this.body = 'Hello World!';
  //   })
  //   .post('/users', function *(next) {
  //     // ...
  //   })
  //   .put('/users/:id', function *(next) {
  //     // ...
  //   })
  //   .del('/users/:id', function *(next) {
  //     // ...
  //   });

  // method is GET
  router.get('/api/list', function *(next) {
    // var req = this.request;
    // var res = this.response;
    var list = require('./mock/list');

    this.body = {
      success: true,
      data: list
    };
  });

  // proxy api
  router.get('/api/foo/bar', proxy({
    url: 'http://foo.bar.com'
  }));
}

module.exports = router;
