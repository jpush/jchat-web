const path = require('path');
const webpack = require('webpack');

module.exports = function () {
    return {
        entry: {
            polyfills: [path.resolve(__dirname, '../src/config/polyfills.ts')],
            vendor: [path.resolve(__dirname, '../src/config/vendor.ts'), ]
        },
        output: {
            path: path.join(__dirname, '../src/dll/'),
            filename: '[name].dll.js',
            library: '[name]_library'
        },
        resolve: {
            extensions: ['.ts', '.js', '.json']
        },
        module: {
            rules: [{
                    test: /\.ts$/,
                    use: [{
                            loader: 'awesome-typescript-loader',
                            options: {
                                configFileName: 'tsconfig.json',
                            }
                        },
                        {
                            loader: 'angular2-template-loader'
                        }
                    ],
                    exclude: [path.resolve(__dirname, '../node_modules'),path.resolve(__dirname, '../src')]
                }
            ]
        }
    }
}