'use strict';

// @see http://christianalfoni.github.io/javascript/2014/12/13/did-you-know-webpack-and-react-is-awesome.html
// @see https://github.com/webpack/react-starter/blob/master/make-webpack-config.js

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
var sourceMap = require('./src/sourcemap.json');

var excludeFromStats = [
  /node_modules[\\\/]/
];

// webpack的三个概念：模块（module）、入口文件（entry）、分块（chunk）
// 其中，module指各种资源文件，如js、css、图片、svg、scss、less等等，一切资源皆被当做模块
// webpack编译输出的文件包括以下2种：
// entry：入口，可以是一个或者多个资源合并而成，由html通过script标签引入
// chunk：被entry所依赖的额外的代码块，同样可以包含一个或者多个文件
function makeConf(options) {
  options = options || {};

  var debug = options.debug !== undefined ? options.debug : true;
  var entries = genEntries();
  var chunks = Object.keys(entries);
  var config = {
    // entry项是入口文件路径映射表
    entry: entries,

    // output项是对输出文件路径和名称的配置，占位符如[id]、[chunkhash]、[name]等分别代表编译后的模块id、chunk的hashnum值、chunk名等，可以任意组合决定最终输出的资源格式
    // hashnum的做法，基本上弱化了版本号的概念，版本迭代的时候chunk是否更新只取决于chnuk的内容是否发生变化
    output: {
      // 在debug模式下，__build目录是虚拟的，webpack的dev server存储在内存里
      path: path.resolve(debug ? '__build' : asset),
      filename: debug ? '[name].js' : 'js/[chunkhash:8].[name].min.js',
      chunkFilename: debug ? '[chunkhash:8].chunk.js' : 'js/[chunkhash:8].chunk.min.js',
      hotUpdateChunkFilename: debug ? '[id].[chunkhash:8].js' : 'js/[id].[chunkhash:8].min.js',
      publicPath: debug ? '/__build/' : ''
    },

    resolve: {
      root: [srcDir, './node_modules'],
      alias: sourceMap,
      extensions: ['', '.js', '.css', '.scss', '.tpl', '.png', '.jpg']
    },

    resolveLoader: {
      root: path.join(__dirname, 'node_modules')
    },

    module: {
      noParse: ['zepto'],
      loaders: [
        {
          // test项表示匹配的资源类型
          test: /\.(jpe?g|png|gif|svg)$/i,
          // loader或loaders项表示用来加载这种类型的资源的loader
          // loader的使用可以参考 http://webpack.github.io/docs/using-loaders.html
          // 更多的loader可以参考 http://webpack.github.io/docs/list-of-loaders.html
          loaders: [
            'image?{bypassOnDebug: true, progressive:true, \
                              optimizationLevel: 3, pngquant:{quality: "65-80", speed: 4}}',
            // url-loader更好用，小于10KB的图片会自动转成dataUrl，
            // 否则则调用file-loader，参数直接传入
            'url?limit=10000&name=img/[hash:8].[name].[ext]',
          ]
        },
        {
          test: /\.(woff|eot|ttf)$/i,
          loader: 'url?limit=10000&name=font/[hash:8].[name].[ext]'
        },
        {
          test: /\.(ejs)$/,
          loader: 'ejs'
        },
        {
          test: /\.(js)$/,
          exclude: /node_modules/,
          loader: 'jsx'
        }
      ]
    },

    plugins: [
      // 用CommonsChunkPlugin插件对指定的chunks进行公共模块的提取
      new CommonsChunkPlugin({
        name: 'vendor', // 将公共模块提取，生成名为vendor的chunk
        chunks: chunks,
        // Modules must be shared between all entries
        minChunks: chunks.length // 提取所有chunks共同依赖的模块
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
    // 开发阶段，css直接内嵌
    var cssLoader = {
      test: /\.css$/,
      loader: 'style!css'
    };
    var sassLoader = {
      test: /\.scss$/,
      loader: 'style!css!sass'
    };

    config.module.loaders.push(cssLoader);
    config.module.loaders.push(sassLoader);
  } else {
    // 编译阶段，css分离出来单独引入
    var cssLoader = {
      test: /\.css$/,
      loader: ExtractTextPlugin.extract('style', 'css?minimize') // enable minimize
    };
    var sassLoader = {
      test: /\.scss$/,
      loader: ExtractTextPlugin.extract('style', 'css?minimize', 'sass')
    };

    config.module.loaders.push(cssLoader);
    config.module.loaders.push(sassLoader);
    config.plugins.push(
      new ExtractTextPlugin('css/[contenthash:8].[name].min.css', {
        // 当allChunks指定为false时，css loader必须指定怎么处理
        // additional chunk所依赖的css，即指定`ExtractTextPlugin.extract()`
        // 第一个参数`notExtractLoader`，一般是使用style-loader
        // @see https://github.com/webpack/extract-text-webpack-plugin
        allChunks: false
      })
    );

    // 自动生成入口文件，入口js名必须和入口文件名相同
    // 例如，a页的入口文件是a.html，那么在js目录下必须有一个a.js作为入口文件
    var pages = fs.readdirSync(srcDir);

    pages.forEach(function(filename) {
      var m = filename.match(/(.+)\.html$/);

      if (m) {
        // @see https://github.com/kangax/html-minifier
        var conf = {
          template: path.resolve(srcDir, filename),
          // @see https://github.com/kangax/html-minifier
          // minify: {
          //     collapseWhitespace: true,
          //     removeComments: true
          // },
          filename: filename
        };

        if (m[1] in config.entry) {
          conf.inject = 'body';
          conf.chunks = ['vendor', m[1]];
        }

        // HtmlWebpackPlugin插件解决资源路径切换问题
        // 开发环境: <script src="/__build/vendors.js"></script>
        // 生产环境: <script src="http://cdn.site.com/js/460de4b8.vendors.min.js"></script>
        // 这里资源根路径的配置在output项的publicPath
        config.plugins.push(new HtmlWebpackPlugin(conf));
      }
    });

    config.plugins.push(new UglifyJsPlugin());
  }

  return config;
}

function genEntries() {
  var jsDir = path.resolve(srcDir, 'js');
  var names = fs.readdirSync(jsDir);
  var map = {};

  names.forEach(function(name) {
    var m = name.match(/(.+)\.js$/);
    var entry = m ? m[1] : '';
    var entryPath = entry ? path.resolve(jsDir, name) : '';

    if (entry) map[entry] = entryPath;
  });

  return map;
}

module.exports = makeConf;
