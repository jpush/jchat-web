const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const DllBundlesPlugin = require('webpack-dll-bundles-plugin').DllBundlesPlugin;
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = function (config) {
    if (!config) {
        console.log("请在task/config.json中配置相关信息！");
        return null;
    }
    return {
        entry: {
            app: [path.resolve(__dirname, '../src/config/polyfills'), path.resolve(__dirname, '../src/main.jit')]
        },
        output: {
            path: path.resolve(__dirname, '../dist'),
            publicPath: 'http://localhost:3000/',
            filename: 'index.js'
        },
        resolve: {
            extensions: ['.ts', '.js']
        },
        module: {
            rules: [{
                    test: /\.ts$/,
                    loaders: [{
                            loader: 'ng-router-loader',
                            options: {
                                loader: 'async-import',
                                aot: false
                            }
                        }, {
                            loader: 'awesome-typescript-loader',
                            options: {
                                configFileName: 'tsconfig.json',
                            }
                        }, '@angularclass/hmr-loader',
                        'angular2-template-loader'
                    ]
                },
                {
                    test: /\.html$/,
                    loader: 'html-loader',
                    exclude: [path.resolve(__dirname, '../src/index.html')]
                },
                {
                    test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
                    loader: 'file-loader?name=assets/images/[name].[ext]'
                },
                {
                    test: /\.css$/,
                    exclude: [path.resolve(__dirname, '../src/app')],
                    loader: 'style-loader!css-loader'
                },
                {
                    test: /\.css$/,
                    include: [path.resolve(__dirname, '../src/app')],
                    loader: 'raw-loader'
                },
                {
                    test: /\.scss$/,
                    include: [path.resolve(__dirname, '../src/app')],
                    loaders: ['raw-loader', 'sass-loader']
                },
                {
                    test: /\.scss$/,
                    exclude: [path.resolve(__dirname, '../src/app')],
                    use: [{
                        loader: "style-loader" // creates style nodes from JS strings 
                    }, {
                        loader: "css-loader" // translates CSS into CommonJS 
                    }, {
                        loader: "sass-loader" // compiles Sass to CSS 
                    }]
                }
            ]
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(config.env),
                'process.env.API_URL': JSON.stringify(config.api)
            }),
            new webpack.ContextReplacementPlugin(
                /angular(\\|\/)core(\\|\/)(esm(\\|\/)src|src)(\\|\/)linker/,
                path.resolve(__dirname, '../src'), // location of your src
                {} // a map of your routes 
            ),
            new CopyWebpackPlugin([{
                from: path.resolve(__dirname, '../src/assets/static/'),
                to: './assets/static/',
            },{
                from: path.resolve(__dirname, '../src/assets/images/'),
                to: './assets/images/',
            }]),
            new webpack.DllReferencePlugin({
                context: '.',
                manifest: require('../src/dll/polyfills-manifest.json')
            }),
            new webpack.DllReferencePlugin({
                context: '.',
                manifest: require('../src/dll/vendor-manifest.json')
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
        ],
        devServer: {
            historyApiFallback: true,
            inline: true,
            port: 3000,
            host: '0.0.0.0'
        }
    };
}