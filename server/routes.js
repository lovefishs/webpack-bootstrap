'use strict';

// @see https://github.com/alexmingoia/koa-router
module.exports = (router, app) => {
  router.get('/blog/list', function *(next) {
    this.body = 'blog list';
  });
}
