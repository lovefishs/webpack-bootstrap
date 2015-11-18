'use strict';

let gulp = require('gulp');
let webpack = require('webpack');
let gutil = require('gulp-util');
let jshint = require('gulp-jshint');
let jshintJSX = require('jshint-jsx');
let stylish = require('jshint-stylish');
let rimraf = require('gulp-rimraf');
let replace = require('gulp-replace');
let sftp = require('gulp-sftp');
let watch = require('gulp-watch');
let WebpackDevServer = require('webpack-dev-server');

let webpackConf = require('./webpack.config');
let webpackDevConf = require('./webpack-dev.config');

let appDir = `${process.cwd()}/app`;
let distDir = `${process.cwd()}/dist`;

let hintArr = [
  `${appDir}/{js/**/*.js,helper/**/*.js}`,
  `!${appDir}/lib/**/*.js`,
];
let copyArr = [
  `${appDir}/**/*`,
  `!${appDir}/{*.html,js,js/**,css,css/**,helper,helper/**,alias.json}`,
];

// js hint
gulp.task('hint', () => {
  return gulp
    .src(hintArr)
    .pipe(jshint({
      linter: jshintJSX.JSXHINT,
    }))
    .pipe(jshint.reporter(stylish));
});

// clean
gulp.task('clean', () => {
  return gulp
    .src(distDir, { read: false }) // much faster
    .pipe(rimraf());
});

// copy
gulp.task('copy', ['clean'], () => {
  return gulp
    .src(copyArr)
    .pipe(gulp.dest(distDir));
});

// watch copy
gulp.task('watch', () => {  
  return gulp
    .src(copyArr, { base: appDir })
    .pipe(watch(appDir, { base: appDir }))
    .pipe(gulp.dest(distDir));
});

// run webpack pack
gulp.task('pack', ['copy'], (done) => {
  webpack(webpackConf, (err, stats) => {
    if (err) {
      throw new gutil.PluginError('webpack', err);
    }

    gutil.log('[webpack]', stats.toString({
      colors: true,
    }));

    done();
  });
});

// run HMR on `cli` mode
// @see http://webpack.github.io/docs/webpack-dev-server.html
gulp.task('hmr', ['copy'], (done) => {
  let compiler = webpack(webpackDevConf);
  let devSvr = new WebpackDevServer(compiler, {
    contentBase: webpackConf.output.path,
    publicPath: webpackDevConf.output.publicPath,
    hot: true,
    stats: webpackDevConf.devServer.stats,
  });

  devSvr.listen(8088, '0.0.0.0', (err) => {
    if (err) {
      throw new gutil.PluginError('webpack-dev-server', err);
    }

    gutil.log('[webpack-dev-server]', 'http://localhost:8088/webpack-dev-server/index.html');

    // keep the devSvr alive
    // done();
  });
});

// deploy dist to remote server
gulp.task('deploy', () => {
  return gulp
    .src(`${distDir}/**`)
    .pipe(sftp({
      host: '192.168.1.111',
      remotePath: '/www/app/',
      user: 'admin',
      pass: 'password',
    }));
});

let replaceHtml = () => {
  return gulp
    .src(`${distDir}/*.html`)
    // remove <link data-debug> & <script data-debug ...></script>
    .pipe(replace(/<link[^<]+data-debug.*?>|<script[^<]+data-debug([^>]+)?><\/script>/gi, ''))
    .pipe(gulp.dest(distDir));
}

gulp.task('default', ['hint', 'pack']);
gulp.task('build', ['hint', 'pack']);
gulp.task('dev', ['hmr']);
