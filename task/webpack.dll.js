const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const path = require('path');
const DllBundlesPlugin = require('webpack-dll-bundles-plugin').DllBundlesPlugin;
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');
const CheckerPlugin = require('awesome-typescript-loader').CheckerPlugin;
const CopyWebpackPlugin = require('copy-webpack-plugin');
const OptimizeJsPlugin = require('optimize-js-plugin');
const ngcWebpack = require('ngc-webpack');
const WebpackMd5Hash = require('webpack-md5-hash');

module.exports = function () {
    return {
        entry: {
            app: [path.resolve(__dirname, '../src/config/polyfills'), path.resolve(__dirname, '../src/main.aot')]
        },
        output: {
            path: path.resolve(__dirname, '../dist'),
            publicPath: './',
            filename: 'index.[chunkhash:8].js'
        },
        resolve: {
            extensions: ['.ts', '.js']
        },
        module: {
            rules: [{
                test: /\.ts$/,
                loaders: [{
                    loader: '@angularclass/hmr-loader',
                    options: {
                        pretty: false,
                        prod: true
                    }
                }, {
                    loader: 'ng-router-loader',
                    options: {
                        loader: 'async-import',
                        genDir: path.resolve(__dirname, '../src/compiled'),
                        aot: true
                    }
                }, {
                    loader: 'awesome-typescript-loader',
                    options: {
                        configFileName: 'tsconfig.aot.json'
                    }
                }, {
                    loader: 'angular2-template-loader'
                }],
                exclude: [path.resolve(__dirname, '../src/index.html')]
            }, {
                test: /\.html$/,
                loader: 'html-loader',
                exclude: [path.resolve(__dirname, '../src/index.html')]
            }, {
                test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
                loader: 'file-loader?name=assets/images/[name].[hash:8].[ext]'
            }, {
                test: /\.css$/,
                exclude: [path.resolve(__dirname, '../src/app')],
                loader: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: 'css-loader'
                })
            }, {
                test: /\.css$/,
                include: [path.resolve(__dirname, '../src/app')],
                loader: 'raw-loader'
            },{
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: 'css-loader!sass-loader'
                }),
                exclude: [path.resolve(__dirname, '../src/app')]
            }, {
                test: /\.scss$/,
                use: ['to-string-loader', 'css-loader', 'sass-loader'],
                include: [path.resolve(__dirname, '../src/app')]
            }]
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify('prod'),
                'process.env.API_URL': JSON.stringify('xxx--生产API地址--xxx')
            }),
            new webpack.ContextReplacementPlugin(
                /angular(\\|\/)core(\\|\/)(esm(\\|\/)src|src)(\\|\/)linker/,
                path.resolve(__dirname, '../src'), // location of your src
                {} // a map of your routes 
            ),
            new WebpackMd5Hash(),
            new CopyWebpackPlugin([{
                from: path.resolve(__dirname, '../src/assets/static/'),
                to: './assets/static/',
            }]),
            new webpack.DllReferencePlugin({
                context: '.',
                manifest: require('../src/dll/polyfills-manifest.json')
            }),
            new webpack.DllReferencePlugin({
                context: '.',
                manifest: require('../src/dll/vendor-manifest.json')
            }),
            new ngcWebpack.NgcWebpackPlugin({
                disabled: false,
                tsConfig: path.resolve(__dirname, '../tsconfig.aot.json'),
                resourceOverride: path.resolve(__dirname, '../src/config/resource-override.js'),
            }),
            new CheckerPlugin(),
            new OptimizeJsPlugin({
                sourceMap: false
            }),
            new ExtractTextPlugin('vender.[contenthash:8].css'),
            new webpack.optimize.UglifyJsPlugin({
                beautify: false,
                output: {
                    comments: false
                },
                compress: {
                    warnings: false
                }
            }),
            new HtmlWebpackPlugin({
                filename: 'index.html',
                template: path.resolve(__dirname, '../src/index.html')
            }),
            new AddAssetHtmlPlugin([{
                    filepath: 'src/dll/polyfills.dll.js',
                    includeSourcemap: false
                },
                {
                    filepath: 'src/dll/vendor.dll.js',
                    includeSourcemap: false
                }
            ])
        ]
    };
}