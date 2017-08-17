
/*
获取npm命令
*/
const config = require('./task/config.json');
const type = process.env.npm_package_env?process.env.npm_package_env:'dev';
module.exports = require('./task/webpack.dev')(config[type]);