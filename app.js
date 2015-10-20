'use strict';

// load native modules
var http = require('http');
var path = require('path');

// load local modules
var pkg = require('./package.json');
var env = process.env.NODE_ENV;
var debug = !env || env === 'development';
var viewDir = debug ? 'src' : 'asset'; // 开发环境和生产环境对应不同的目录

// koa
var koa = require('koa');
var serve = require('koa-static');
var router = require('koa-router')();
var routes = require('./routes'); // load routes
var app = koa();

// basic settings
app.name = pkg.name; // 应用名称
app.keys = [pkg.name, pkg.description]; // 设置 Cookie 签名密钥
app.proxy = true; // 决定了哪些 proxy header 参数会被加到信任列表中

// global events listen
app.on('error', function(err, ctx) {
  // err; // Error
  // ctx; // Context(上下文)
  err.url = err.url || ctx.request.url;
  console.error('server error', err, ctx);
});

// handle favicon.ico
app.use(function *(next) {
  if (this.url.match(/favicon\.ico$/)) {
    this.body = '';
  }
  yield next;
});

// logger
app.use(function *(next) {
  console.log(this.method, this.url);
  yield next;
});

// use routes
routes(router, app);
app.use(router.routes());
// app.use(router.allowedMethods());

// app.use(function *() {
//   // this; // is the Context
//   // this.request; // is a koa Request
//   // this.response; // is a koa Response
//   this.body = 'Hello World';
// });

if (debug) {
  // 资源的实时更新 HMR(hot module replace)
  var webpack = require('webpack');
  var webpackDevMiddleware = require('koa-webpack-dev-middleware');
  var webpackDevConf = require('./webpack-dev.config');

  app.use(webpackDevMiddleware(webpack(webpackDevConf), {
    contentBase: webpackDevConf.output.path,
    publicPath: webpackDevConf.output.publicPath,
    hot: true,
    stats: webpackDevConf.devServer.stats
  }));
}

// handle static files(处理静态资源和入口文件)
app.use(serve(path.resolve(__dirname, viewDir)));

app.listen(3000, '0.0.0.0', function() {
  console.log('app listen success.');
});
