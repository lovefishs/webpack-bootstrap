'use strict';

// load native modules
let path = require('path');
let fs = require('fs');

// load local modules
let webpack = require('webpack');
let ExtractTextPlugin = require('extract-text-webpack-plugin');
let HtmlWebpackPlugin = require('html-webpack-plugin');

let alias = require('./app/alias.json');

let UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
let CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;

let appDir = path.resolve(process.cwd(), 'app');
let distDir = path.resolve(process.cwd(), 'dist');
let nodeModuleDir = path.resolve(process.cwd(), 'node_modules');

// 获取入口文件信息
// 通过这个函数获取 app/*.html 同名的 app/js/*.js 文件作为入口文件
function genEntries() {
  let jsDir = path.resolve(appDir, 'js');
  let names = fs.readdirSync(jsDir);
  let map = {};

  for (let name of names) {
    // "index.js".match(/(.+)\.(js)$/) => ["index.js", "index", "js"]
    // "xxx".match(/(.+)\.(js)$/) => null
    let m = name.match(/(.+)\.(js)$/);
    let entry = m ? m[1] : '';
    let entryPath = entry ? path.resolve(jsDir, name) : '';

    if (entry) {
      map[entry] = entryPath;
    }
  }

  return map;
}

function commonConf(options) {
  options = options || {};

  let debug = options.debug !== undefined ? options.debug : true;
  let entries = genEntries();
  let chunks = Object.keys(entries);

  let config = {
    cache: true,

    // entry 项是入口文件路径映射表
    // eg: { 'index': '/.../app/js/index.js' }
    entry: entries,

    // output 项是对输出文件路径和名称的配置,占位符如[id]、[chunkhash]、[name]等分别代表编译后的模块 id、chunk 的 hashnum 值、chunk 名等,可以任意组合决定最终输出的资源格式
    // hashnum 的做法,基本上弱化了版本号的概念,版本迭代的时候 chunk 是否更新只取决于 chnuk 的内容是否发生变化
    output: {
      path: debug ? distDir : distDir,
      filename: debug ? 'js/[name].js' : 'js/[name].[chunkhash:8].js',
      chunkFilename: debug ? 'js/chunk.js' : 'js/chunk.[chunkhash:8].js',
      hotUpdateChunkFilename: debug ? 'js/[id].js' : 'js/[id].[chunkhash:8].js',
      publicPath: debug ? '' : '',
      // 开发环境: <script src="js/bundle.js"></script>
      // 生产环境: <script src="http://cdn.site.com/js/bundle.460de4b8.min.js"></script>
      // 这里资源根路径的配置在 output 项的 publicPath(eg: 'http://cdn.site.com/')
    },

    // resolve 用来配置应用层的模块（要被打包的模块）解析
    resolve: {
      root: [appDir, nodeModuleDir],
      alias: alias,
      extensions: ['', '.js', '.css', '.scss', '.tpl', '.png', '.jpg'],
    },

    // resolveLoader 用来配置 loader 模块的解析
    resolveLoader: {
      root: [nodeModuleDir],
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
          ],
        },
        {
          test: /\.(woff|eot|ttf)$/i,
          loader: 'url?limit=10000&name=font/[name].[hash:8].[ext]',
        },
        {
          test: /\.(ejs)$/,
          loader: 'ejs',
        },
        {
          test: /\.(hbs|handlebars)$/,
          // loader: 'handlebars?helperDirs[]='+ appDir +'/helper'
          loader: 'handlebars',
          query: {
            helperDirs: [
              `${appDir}/helper`,
            ]
          },
        },
        {
          test: /\.(css)$/,
          loader: ExtractTextPlugin.extract('style', 'css?minimize'),
        },
        {
          test: /\.(scss)$/,
          loader: ExtractTextPlugin.extract('style', 'css?minimize!autoprefixer?browsers=last 2 version!sass'),
          // loader: ExtractTextPlugin.extract('style', 'css?minimize&sourceMap!autoprefixer?browsers=last 2 version!sass?sourceMap'),
        },
        {
          test: /\.(less)$/,
          loader: ExtractTextPlugin.extract('style', 'css?minimize!autoprefixer?browsers=last 2 version!less'),
        },
        {
          test: /\.(js)$/,
          exclude: /(node_modules|lib)/,
          loader: 'babel',
          query: {
            presets: ['react', 'es2015'],
          },
          // npm install --save-dev babel-preset-react babel-preset-es2015
          // loader: 'babel?presets[]=react,presets[]=es2015',
        },
      ],
    },

    plugins: [
      // 用 CommonsChunkPlugin 插件对指定的 chunks 进行公共模块的提取
      new CommonsChunkPlugin({
        name: 'bundle', // 将公共模块提取,生成名为 bundle 的 chunk
        chunks: chunks,
        // Modules must be shared between all entries
        minChunks: chunks.length, // 提取所有 chunks 共同依赖的模块
      }),
      // css chunk
      new ExtractTextPlugin((debug ? 'css/[name].css' : 'css/[name].[contenthash:8].css'), {
        // 当 allChunks 指定为 false 时,css loader 必须指定怎么处理
        // additional chunk 所依赖的 css,即指定 `ExtractTextPlugin.extract()`
        // 第一个参数 `notExtractLoader`,一般是使用 style-loader
        // @see https://github.com/webpack/extract-text-webpack-plugin
        allChunks: false,
      }),
    ],

    devServer: {
      stats: {
        cached: false,
        exclude: [
          /node_modules[\\\/]/
        ],
        colors: true,
      },
    },
  };

  // 自动生成入口文件,入口 js 名必须和入口文件名相同
  // 例如: a 页的入口文件是 a.html,那么在 js 目录下必须有一个 a.js 作为入口文件
  let pages = fs.readdirSync(appDir);

  for (let pageName of pages) {
    let m = pageName.match(/(.+)\.(html)$/);

    if (m) {
      let conf = {
        template: path.resolve(appDir, pageName),
        filename: pageName,
      };
      if (!debug) {
        // @see https://github.com/kangax/html-minifier
        conf.minify = {
          collapseWhitespace: true,
          removeComments: true,
        };
      }

      if (config.entry[m[1]]) {
        conf.inject = 'body';
        conf.chunks = ['bundle', m[1]];
      }

      // HtmlWebpackPlugin 插件解决资源路径切换问题
      config.plugins.push(new HtmlWebpackPlugin(conf));
    }
  }

  if (!debug) {
    // 生成 source map file
    // config.devtool = 'source-map'; // or 'inline-source-map'

    // UglifyJs
    config.plugins.push(new UglifyJsPlugin({
      compress: {
        warnings: false,
      },
      mangle: {
        except: ['$super', 'define', 'module', 'require', 'exports', 'console', '$', '_'],
      },
    }));
  }

  return config;
}

module.exports = commonConf;
