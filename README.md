# JChat-web
![Release](https://img.shields.io/badge/release-1.0.0-blue.svg?style=flat)
![Support](https://img.shields.io/badge/support-IE11+-blue.svg?style=flat)
![Language](http://img.shields.io/badge/language-Angular2-brightgreen.svg?style=flat)

		
### 简介

JChat 是基于 JMessage SDK 带有完整 UI 界面的即时通讯应用。 演示了完整的即时通讯功能，包括：

* 单聊、群聊、会话列表、通讯录；
* 支持发送文本、图片、文件、表情；
* 提供用户管理、群组管理、黑名单、群屏蔽、消息漫游等功能；

JChat 无需成为好友也可以聊天

* 通过搜索对方的用户名可直接发起会话

目前已覆盖 [Android](https://github.com/jpush/jchat-android) 、 [iOS](https://github.com/jpush/jchat-swift) 和 web 平台，开发者可参照 JChat 快速打造自己的产品，提高开发效率。

![jiguang](./screenshot/webjchat.gif)

### 应用截图

![jiguang](./screenshot/webjchat2.png)

### 在线体验地址

<a href="https://jchat.im.jiguang.cn/#/login" target="_blank">JChat-web在线体验</a>

### 环境配置

前提：安装 node (node 6.0以上版本 and npm 3.0以上版本)

web jchat本地安装和用法：

```
npm install
```
```
npm run dll
```
```
npm run dev
```
打开浏览器：
localhost:3000

说明：
* 如果npm install安装后仍缺少依赖，如node-sass，则是该模块被墙掉了，推荐使用淘宝镜像cnpm install重新安装依赖，[淘宝镜像安装方法](http://npm.taobao.org/)
* 如果使用的不是本地localhost服务器，则要在task/webpack.dev.js中的publicPath改成自己的ip和端口去访问项目
* 项目打包并发布到测试环境(前提：已全局安装gulp)：

1. 如果静态资源需要提交到七牛上，需在src/task/config.json中配置ak和sk以及url，使用gulp dev即可将项目打包到dist目录下，只需将index.html部署在测试环境服务器即可，其他静态资源已经自动提交到七牛

2. 如果静态资源无需提交到七牛，存放在自己服务器上，在task/webpack.prod.js中的publicPath改成自己的域名，使用gulp noqiniu-dev可将项目打包到dist目录下，将dist目录下的所有文件部署到服务器上

* 项目打包并发布到正式环境(前提：已全局安装gulp)：

1. 如果静态资源需要提交到七牛上，需在src/task/config.json中配置ak和sk以及url，使用gulp prod即可将项目打包到dist目录下，只需将index.html部署在正式环境服务器即可，其他静态资源已经自动提交到七牛

2. 如果静态资源无需提交到七牛，存放在自己服务器上，在task/webpack.prod.js中的publicPath改成自己的域名，使用gulp noqiniu-prod可将项目打包到dist目录下，将dist目录下的所有文件部署到服务器上

### 备注说明

* 整个应用使用Angular2 + webpack + gulp的技术栈，使用了Angular2中的ngrx去管理应用状态
* 当前是jchat-web v1.0.0版本，暂无好友、免打扰等功能，相关功能将在v1.1.0实现
* 业务事件消息，如群聊成员入群消息等，目前实现方法较为复杂，在js sdk更新版本后，v1.1.0将重写相关功能
* 浏览器兼容性: IE11+ ， Chrome ， Firefox ， Safari，后续考虑兼容IE10

### JMessage 文档

* [JMessage web 开发指南](https://docs.jiguang.cn/jmessage/client/im_sdk_js_v2/)