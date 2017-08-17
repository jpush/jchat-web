const path = require('path');
const webpack = require('webpack');
const DllConfig = require('./dll.config')();

DllConfig.devtool = 'cheap-module-source-map';
DllConfig.plugins = [
    new webpack.ContextReplacementPlugin(
        /angular(\\|\/)core(\\|\/)(esm(\\|\/)src|src)(\\|\/)linker/,
        path.resolve(__dirname, '../src'), // location of your src
        {} // a map of your routes 
    ),
    new webpack.DllPlugin({
        path: path.join(__dirname, '../src/dll/[name]-manifest.json'),
        name: '[name]_library'
    })
]
module.exports = DllConfig;