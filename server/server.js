'use strict';

// load native modules
let http = require('http');
let path = require('path');


// load local modules
let koa = require('koa');
let server = require('koa-static');
let router = require('koa-router')();
let render = require('koa-ejs');


let app = koa();
let pkg = require('../package.json');
let env = process.env.NODE_ENV;
let debug = !env || env === 'development';
let staticDir = path.join(__dirname, '../dist');


// basic config
app.name = pkg.name;
app.keys = [pkg.name, pkg.description];
app.proxy = true;


// static file
app.use(server(staticDir));


// x-response-time
app.use(function *(next) {
  const start = new Date;
  yield next;
  const ms = new Date - start;
  this.set('X-Response-Time', `${ms}ms`);
});

// logger
if (debug) {
  app.use(function *(next) {
    const start = new Date;
    yield next;
    const ms = new Date - start;
    console.log(`${this.req.method} ${this.req.url} - ${ms}`);
  });
}

// router
require('./routes')(router, app);
app
  .use(router.routes())
  .use(router.allowedMethods());


if (debug) {
  // error handling
  app.on('error', (err, ctx) => {
    console.log('server error', err, ctx);
  });

  // // 资源的实时更新 HMR(hot module replace)
  let webpack = require('webpack');
  let webpackDevMiddleware = require('koa-webpack-dev-middleware');
  let webpackDevConf = require('../webpack-dev.config');

  app.use(webpackDevMiddleware(webpack(webpackDevConf), {
    contentBase: webpackDevConf.output.path,
    publicPath: webpackDevConf.output.publicPath,
    hot: true,
    stats: webpackDevConf.devServer.stats,
  }));
}


// 404 handling
app.use(function *(next) {
  if (404 != this.status) {
    return;
  }
  this.status = 404;
  yield next;
  // this.body = 'Page Not Found !';
  this.redirect('/404.html');
});


module.exports = app;
