'use strict';

// @see http://christianalfoni.github.io/javascript/2014/12/13/did-you-know-webpack-and-react-is-awesome.html
// @see https://github.com/webpack/react-starter/blob/master/make-webpack-config.js

// load native modules
var path = require('path');
var fs = require('fs');

var webpack = require('webpack');
var _ = require('lodash');

var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;

var srcDir = path.resolve(process.cwd(), 'src');
var asset = 'asset/';
var aliasMap = require('./src/aliasmap.json');

var excludeFromStats = [
  /node_modules[\\\/]/
];

// 获取入口文件信息
// 通过这个函数获取 src/*.html 同名的 src/js/*.js 文件作为入口文件
function genEntries() {
  var jsDir = path.resolve(srcDir, 'js');
  var names = fs.readdirSync(jsDir);
  var map = {};

  names.forEach(function(name) {
    var m = name.match(/(.+)\.(js)$/);
    var entry = m ? m[1] : '';
    var entryPath = entry ? path.resolve(jsDir, name) : '';

    if (entry) {
      map[entry] = entryPath;
    }
  });

  return map;
}

// webpack 的三个概念: 模块(module), 入口文件(entry), 分块(chunk)
// module 指各种资源文件,如 js,css,img,svg,scss,less等等,一切资源皆被当做模块
// webpack 编译输出的文件包括以下 2 种:
// entry: 入口可以是一个或者多个资源合并而成,由 html 通过 script 标签引入
// chunk: 被 entry 所依赖的额外的代码块,同样可以包含一个或者多个文件
function commonConf(options) {
  options = options || {};

  var debug = options.debug !== undefined ? options.debug : true;
  var entries = genEntries();
  var chunks = Object.keys(entries);
  var config = {
    cache: true,

    // entry 项是入口文件路径映射表
    entry: entries,

    // output 项是对输出文件路径和名称的配置,占位符如[id]、[chunkhash]、[name]等分别代表编译后的模块 id、chunk 的 hashnum 值、chunk 名等,可以任意组合决定最终输出的资源格式
    // hashnum 的做法,基本上弱化了版本号的概念,版本迭代的时候 chunk 是否更新只取决于 chnuk 的内容是否发生变化
    output: {
      // 在 debug 模式下,__build 目录是虚拟的,webpack 的 dev server 存储在内存里
      path: path.resolve(debug ? '__build' : asset),
      filename: debug ? '[name].js' : 'js/[name].[chunkhash:8].min.js',
      chunkFilename: debug ? 'chunk.[chunkhash:8].js' : 'js/chunk.[chunkhash:8].min.js',
      hotUpdateChunkFilename: debug ? '[id].[chunkhash:8].js' : 'js/[id].[chunkhash:8].min.js',
      publicPath: debug ? '/__build/' : ''
    },

    resolve: {
      root: [srcDir, './node_modules'],
      alias: aliasMap,
      extensions: ['', '.js', '.css', '.scss', '.tpl', '.png', '.jpg']
    },

    resolveLoader: {
      root: path.join(__dirname, 'node_modules')
    },

    module: {
      noParse: [],
      loaders: [
        {
          // test 项表示匹配的资源类型
          test: /\.(jpe?g|png|gif|svg)$/i,
          // loader 或 loaders 项表示用来加载这种类型的资源的 loader
          // loader 的使用可以参考 http://webpack.github.io/docs/using-loaders.html
          // 更多的 loader 可以参考 http://webpack.github.io/docs/list-of-loaders.html
          loaders: [
            'image?{bypassOnDebug: true, progressive:true, \
                              optimizationLevel: 3, pngquant:{quality: "65-80", speed: 4}}',
            // url-loader 更好用,小于 10KB 的图片会自动转成 dataUrl,
            // 否则则调用 file-loader,参数直接传入
            'url?limit=10000&name=img/[name].[hash:8].[ext]',
          ]
        },
        {
          test: /\.(woff|eot|ttf)$/i,
          loader: 'url?limit=10000&name=font/[name].[hash:8].[ext]'
        },
        {
          test: /\.(ejs)$/,
          loader: 'ejs'
        },
        {
          test: /\.(hbs|handlebars)$/,
          // loader: 'handlebars?helperDirs[]='+ srcDir +'/helper'
          loader: 'handlebars',
          query: {
            helperDirs: [
              srcDir +'/helper'
            ]
          }
        },
        {
          test: /\.(js)$/,
          exclude: /(node_modules|lib)/,
          loader: 'babel'
        }
      ]
    },

    plugins: [
      // 用 CommonsChunkPlugin 插件对指定的 chunks 进行公共模块的提取
      new CommonsChunkPlugin({
        name: 'bundle', // 将公共模块提取,生成名为 bundle 的 chunk
        chunks: chunks,
        // Modules must be shared between all entries
        minChunks: chunks.length // 提取所有 chunks 共同依赖的模块
      })
    ],

    devServer: {
      stats: {
        cached: false,
        exclude: excludeFromStats,
        colors: true
      }
    }
  };

  if (debug) {
    // 开发阶段,css 直接内嵌
    var cssLoader = {
      test: /\.(css)$/,
      loader: 'style!css'
    };
    var sassLoader = {
      test: /\.(scss)$/,
      loader: 'style!css!autoprefixer?browsers=last 2 version!sass'
    };
    var lessLoader = {
      test: /\.(less)$/,
      loader: 'style!autoprefixer?browsers=last 2 version!less'
    };

    config.module.loaders.push(cssLoader);
    config.module.loaders.push(sassLoader);
    config.module.loaders.push(lessLoader);
  } else {
    // 生成 source map file
    // config.devtool = 'source-map'; // or 'inline-source-map'

    // 编译阶段,css 分离出来单独引入
    var cssLoader = {
      test: /\.(css)$/,
      loader: ExtractTextPlugin.extract('style', 'css?minimize')
      // loader: ExtractTextPlugin.extract('style', 'css?minimize&sourceMap') // enable minimize and sourceMap
    };
    var sassLoader = {
      test: /\.(scss)$/,
      loader: ExtractTextPlugin.extract('style', 'css?minimize!autoprefixer?browsers=last 2 version!sass')
      // loader: ExtractTextPlugin.extract('style', 'css?minimize&sourceMap!autoprefixer?browsers=last 2 version!sass?sourceMap')
    };
    var lessLoader = {
      test: /\.(less)$/,
      loader: ExtractTextPlugin.extract('style', 'css?minimize!autoprefixer?browsers=last 2 version!less')
    };

    config.module.loaders.push(cssLoader);
    config.module.loaders.push(sassLoader);
    config.module.loaders.push(lessLoader);
    config.plugins.push(
      new ExtractTextPlugin('css/[name].[contenthash:8].min.css', {
        // 当 allChunks 指定为 false 时,css loader 必须指定怎么处理
        // additional chunk 所依赖的 css,即指定 `ExtractTextPlugin.extract()`
        // 第一个参数 `notExtractLoader`,一般是使用 style-loader
        // @see https://github.com/webpack/extract-text-webpack-plugin
        allChunks: false
      })
    );

    // 自动生成入口文件,入口 js 名必须和入口文件名相同
    // 例如: a 页的入口文件是 a.html,那么在 js 目录下必须有一个 a.js 作为入口文件
    var pages = fs.readdirSync(srcDir);

    pages.forEach(function(filename) {
      var m = filename.match(/(.+)\.(html)$/);

      if (m) {
        var conf = {
          template: path.resolve(srcDir, filename),
          // @see https://github.com/kangax/html-minifier
          minify: {
            collapseWhitespace: true,
            removeComments: true
          },
          filename: filename
        };

        if (m[1] in config.entry) {
          conf.inject = 'body';
          conf.chunks = ['bundle', m[1]];
        }

        // HtmlWebpackPlugin 插件解决资源路径切换问题
        // 开发环境: <script src="/__build/bundle.js"></script>
        // 生产环境: <script src="http://cdn.site.com/js/bundle.460de4b8.min.js"></script>
        // 这里资源根路径的配置在 output 项的 publicPath
        config.plugins.push(new HtmlWebpackPlugin(conf));
      }
    });

    config.plugins.push(new UglifyJsPlugin({
      compress: {
        warnings: false
      },
      mangle: {
        except: ['$super', 'module', 'require', 'exports', 'console', '$']
      }
    }));
  }

  return config;
}

module.exports = commonConf;
