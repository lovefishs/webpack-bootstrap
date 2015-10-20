'use strict';

var gulp = require('gulp');
var webpack = require('webpack');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');
var jshintJSX = require('jshint-jsx');
var stylish = require('jshint-stylish');
var rimraf = require('gulp-rimraf');
var replace = require('gulp-replace');
var sftp = require('gulp-sftp');
var WebpackDevServer = require('webpack-dev-server');

var webpackConf = require('./webpack.config');
var webpackDevConf = require('./webpack-dev.config');

var src = process.cwd() + '/src';
var asset = process.cwd() + '/asset';

// js check
gulp.task('hint', function() {
  return gulp.src([
      '!' + src + '/lib/**/*.js',
      src + '/js/**/*.js'
    ])
    .pipe(jshint({
      linter: jshintJSX.JSXHINT
    }))
    .pipe(jshint.reporter(stylish));
});

// clean asset
gulp.task('clean', function() {  
  return gulp
    .src(asset, { read: false }) // much faster
    .pipe(rimraf());
});

// run webpack pack
gulp.task('pack', ['clean'], function(done) {
  webpack(webpackConf, function(err, stats) {
    if (err) {
      throw new gutil.PluginError('webpack', err);
    }

    gutil.log('[webpack]', stats.toString({
      colors: true
    }));
    done();
  });
});

// html process
gulp.task('default', ['pack'], function() {
  return gulp
    .src(asset + '/*.html')
    // remove <script data-debug ...></script>
    .pipe(replace(/<script(.+)?data-debug([^>]+)?><\/script>/g, ''))
    .pipe(gulp.dest(asset));
});

// deploy asset to remote server
gulp.task('deploy', function() {
  return gulp.src(asset + '/**')
    .pipe(sftp({
      host: '[remote server ip]',
      remotePath: '/www/app/',
      user: 'foo',
      pass: 'bar'
    }));
});

// run HMR on `cli` mode
// @see http://webpack.github.io/docs/webpack-dev-server.html
gulp.task('hmr', function(done) {
  var compiler = webpack(webpackDevConf);
  var devSvr = new WebpackDevServer(compiler, {
    contentBase: webpackConf.output.path,
    publicPath: webpackDevConf.output.publicPath,
    hot: true,
    stats: webpackDevConf.devServer.stats,
  });

  devSvr.listen(8080, '0.0.0.0', function(err) {
    if (err) {
      throw new gutil.PluginError('webpack-dev-server', err);
    }

    gutil.log('[webpack-dev-server]', 'http://localhost:8088/webpack-dev-server/index.html');

    // keep the devSvr alive
    // done();
  });
});
