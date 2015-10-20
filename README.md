# webpack-bootstrap

基于 webpack + gulp 搭建纯静态页面型前端工程解决方案模板

*注:* 该模板由 [chemdemo/webpack-bootstrap](https://github.com/chemdemo/webpack-bootstrap) 修改而成,感谢原作者,详细信息请点击[基于webpack搭建前端工程解决方案探索](https://github.com/chemdemo/chemdemo.github.io/issues/10)查看

### 安装软件
  
```bash
# NodeJS
$ nvm ls
$ nvm ls-remote
# 这里使用 4.1.1 做示范,建议使用最新版
$ nvm install v4.1.1
$ nvm use 4.1.1
$ nvm alias default 4.1.1
```

### 拷贝项目模板

```bash
$ clone https://github.com/lovefishs/webpack-bootstrap.git
```

### 安装依赖模块

```bash
$ npm install -g node-dev # 推荐这个工具.代码改动会自动重启 node 进程
$ cd webpack-bootstrap && npm install
```

### 本地开发环境

```bash
$ npm run start
```

浏览器打开 `http://localhost:3000/a.html` 即可访问

### 业务开发

##### 目录结构

```javascript
- webapp/                       # 根目录
  - src/                        # 开发目录
    + css/                      # css
    + img/                      # img
    + lib/                      # 非模块化第三方依赖库
    - js/                       # js
      - component/              # 组件目录
        - foo/                  # 组件: foo
          foo.css               # 组件样式
          util.js               # 组件工具函数
          foo.tpl               # 组件模板
          foo.js                # 组件js
        + bar/                  # 组件: bar
      ...                       # 根据项目需要任意添加的代码目录
    + tmpl/                     # 模板目录
    + helper/                   # handlebars helper 目录
    a.html                      # 入口文件a
    b.html                      # 入口文件b
  - asset/                      # 编译输出目录
    + css/                      # 编译输出的css目录
    + font/                     # 编译输出的font目录
    + img/                      # 编译输出的图片目录
    + js/                       # 编译输出的js目录
    a.html                      # 入口文件a
    b.html                      # 入口文件b
  + mock/                       # 假数据目录
  + node_modules/               # CommonJS模块(通过 npm 安装,使用 import 方式引用)
  app.js                        # 本地server入口
  routes.js                     # 本地路由配置
  webpack-common.config.js      # webpack公共配置文件
  webpack-dev.config.js         # webpack开发配置文件
  webpack.config.js             # webpack生产配置文件
  gulpfile.js                   # gulp任务配置
  package.json                  # 项目配置
  README.md                     # 项目说明
```

##### 单/多页面支持

约定 `/src/*.html` 为应用的入口文件,在 `/src/js/` 一级目录下有一个同名的 js 文件作为该入口文件的逻辑入口(entry).

在编译时会扫描入口 html 文件并且根据 webpack 配置项解决 entry 的路径依赖,同时还会对 html 文件进行压缩、字符替换等处理.

这样可以做到同时支持 SPA 和多页面型的项目.

### 编译

```bash
$ npm run build
```

### 模拟生产环境

```bash
$ npm run asset
```

### 部署&发布

纯静态页面型的应用,最简单的做法是直接把 `asset` 文件夹部署到指定机器即可(先配置好机器ip、密码、上传路径等信息):

```bash
$ npm run deploy # or run `gulp deploy`
```

如果需要将生成的js、css、图片等发布到 cdn,修改下 `publicPath` 项为目标 cdn 地址即可:

```javascript
...
output: {
  ...
  publicPath: debug ? '/__build/' : 'http://cdn.site.com/'
}
...
```

### License

MIT
