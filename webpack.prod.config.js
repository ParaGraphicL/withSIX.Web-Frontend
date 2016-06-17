/*eslint-disable no-var*/

var pkg = require('./package.json');
var outputFileTemplateSuffix = '-' + pkg.version;

var path = require('path');
var AureliaWebpackPlugin = require('aurelia-webpack-plugin');
var ProvidePlugin = require('webpack/lib/ProvidePlugin');
var combineLoaders = require('webpack-combine-loaders');
var webpack = require('webpack');

module.exports = {
  resolve: {
    extensions: ['', '.ts', '.js'],
    alias: {
      "breeze": "breeze-client"
    }
  },
  entry: {
    main: [
      'babel-polyfill',
      './src/main'
    ]
  },
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '//withsix.azureedge.net/dist/',
    filename: '[name]' + outputFileTemplateSuffix + '.js',
    chunkFilename: '[id]' + outputFileTemplateSuffix + '.js'
  },
  plugins: [
    new AureliaWebpackPlugin({
      includeSubModules: [{
        moduleId: "aurelia-validation"
      }, {
        moduleId: "aurelia-dialog"
      }, {
        moduleId: "aurelia-ui-virtualization"
      }, {
        moduleId: "aurelia-auth"
      }, {
        moduleId: "contextMenu"
      }]
    }),
    //new webpack.NormalModuleReplacementPlugin(/linq4es2015$/, 'linq4es2015/src/linq.js'),
    new ProvidePlugin({
      Promise: 'bluebird'
    })
  ],
  module: {
    loaders: [
      //{ test: /\.js$/, loader: 'babel', exclude: /bower_components|src|src_legacy|node_modules\/^(linq4es2015)/, query: { presets: ['es2015-loose', 'stage-3'], plugins: ['transform-decorators-legacy'] } },
      {
        test: /\.js$/,
        loader: 'ignore-loader',
        include: /src[\\\/]|src_legacy[\\\/]/,
        exclude: /node_modules|bower_components/
      }, {
        test: /\.js\.map$/,
        loader: 'ignore-loader',
        include: /src[\\\/]|src_legacy[\\\/]/,
        exclude: /node_modules|bower_components/
      }, {
        test: /\.js$/,
        loader: 'babel',
        include: /node_modules[\\\/](linq4es2015)/,
        query: {
          presets: ['es2015-loose', 'stage-3'],
          plugins: ['transform-decorators-legacy']
        }
      }, {
        test: /\.ts$/,
        loader: combineLoaders([{
          loader: 'babel',
          query: {
            presets: ['es2015-loose', 'stage-3'],
            plugins: ['transform-decorators-legacy']
          }
        }, {
          loader: 'ts-loader',
          query: {
            compiler: 'ntypescript'
          }
        }]),
        exclude: /bower_components|node_modules|typings/
      },
      //{ test: /\.ts$/, loader: 'ignore-loader' },
      {
        test: /\.(map)$/,
        loader: 'ignore-loader'
      },
      //{ test: /\.map$/, loader: 'raw' },
      {
        test: /\.scss$/,
        loaders: ["raw", "sass"]
      }, {
        test: /\.css$/,
        loader: 'style!css',
        include: /node_modules[\\\/](font-awesome)/
      }, {
        test: /\.css$/,
        loader: 'raw',
        exclude: /node_modules[\\\/](font-awesome)/
      }, {
        test: /\.html$/,
        loader: 'raw'
      }, {
        test: /\.(png|gif|jpg)$/,
        loader: 'url-loader?limit=8192'
      }, {
        test: /\.woff2(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader?limit=10000&minetype=application/font-woff2'
      }, {
        test: /\.woff(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader?limit=10000&minetype=application/font-woff'
      }, {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'file-loader'
      }
    ]
  },
  sassLoader: {
    includePaths: ['src_legacy/scss/inc',
      'bower_components/compass-mixins/lib',
      'bower_components/bootstrap-sass-xl/assets/stylesheets'
    ]
  }
};
