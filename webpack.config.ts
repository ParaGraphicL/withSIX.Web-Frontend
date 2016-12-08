/// <reference path="./node_modules/@types/node/index.d.ts" />
/**
 * To learn more about how to use Easy Webpack
 * Take a look at the README here: https://github.com/easy-webpack/core
 **/

require('regenerator-runtime/runtime');

import {
  generateConfig,
  get,
  stripMetadata,
  EasyWebpackConfig
} from '@easy-webpack/core';
import * as path from 'path';

import * as webpack from 'webpack';

import * as envProd from '@easy-webpack/config-env-production';
import * as envDev from '@easy-webpack/config-env-development';
import * as aurelia from '@easy-webpack/config-aurelia';
import * as typescript from '@easy-webpack/config-typescript';
import * as html from '@easy-webpack/config-html';
import * as css from '@easy-webpack/config-css';
import * as fontAndImages from '@easy-webpack/config-fonts-and-images';
import * as globalBluebird from '@easy-webpack/config-global-bluebird';
import * as globalJquery from '@easy-webpack/config-global-jquery';
import * as generateIndexHtml from '@easy-webpack/config-generate-index-html';
import * as commonChunksOptimize from '@easy-webpack/config-common-chunks-simple';
import * as copyFiles from '@easy-webpack/config-copy-files';
import * as uglify from '@easy-webpack/config-uglify';
import * as generateCoverage from '@easy-webpack/config-test-coverage-istanbul';

import * as sass from '@easy-webpack/config-sass';
import * as json from '@easy-webpack/config-json';
import * as globalRegenerator from '@easy-webpack/config-global-regenerator';

const ENV: 'development' | 'production' | 'test' = process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() ||
  (process.env.NODE_ENV = 'development');

// basic configuration:
const title = 'withSIX';
const baseUrl = '/';
const rootDir = path.resolve();
const srcDir = path.resolve('src');
const outDir = path.resolve('dist');

const coreBundles = {
  bootstrap: [
    'aurelia-bootstrapper-webpack',
    'aurelia-polyfills',
    'aurelia-pal',
    'aurelia-pal-browser',
    'bluebird'
  ],
  // these will be included in the 'aurelia' bundle (except for the above bootstrap packages)
  aurelia: [
    'aurelia-bootstrapper-webpack',
    'aurelia-binding',
    'aurelia-dependency-injection',
    'aurelia-event-aggregator',
    'aurelia-framework',
    'aurelia-history',
    'aurelia-history-browser',
    'aurelia-loader',
    'aurelia-loader-webpack',
    'aurelia-logging',
    'aurelia-logging-console',
    'aurelia-metadata',
    'aurelia-pal',
    'aurelia-pal-browser',
    'aurelia-path',
    'aurelia-polyfills',
    'aurelia-route-recognizer',
    'aurelia-router',
    'aurelia-task-queue',
    'aurelia-templating',
    'aurelia-templating-binding',
    'aurelia-templating-router',
    'aurelia-templating-resources',

    // custom
    'aurelia-dialog',
    'mediatr',
    'aurelia-fetch-client',
    'aurelia-validation',
    //'aurelia-ui-virtualization',
    'withsix-sync-api'
  ]
}

/**
 * Main Webpack Configuration
 */
let config = generateConfig({
  entry: {
    'app': ['./src/main' /* this is filled by the aurelia-webpack-plugin */],
    'aurelia-bootstrap': coreBundles.bootstrap,
    'aurelia': coreBundles.aurelia.filter(pkg => coreBundles.bootstrap.indexOf(pkg) === -1)
  },
  output: {
    path: outDir,
  },
},

  /**
   * Don't be afraid, you can put bits of standard Webpack configuration here
   * (or at the end, after the last parameter, so it won't get overwritten by the presets)
   * Because that's all easy-webpack configs are - snippets of premade, maintained configuration parts!
   * 
   * For Webpack docs, see: https://webpack.js.org/configuration/
   */

  ENV === 'test' || ENV === 'development' ?
    envDev(ENV !== 'test' ? {} : {
      devtool: 'inline-source-map'
    }) :
    envProd({ /* devtool: '...' */ }),

  aurelia({
    root: rootDir,
    src: srcDir,
    title: title,
    baseUrl: baseUrl
  }),
  typescript(ENV !== 'test' ? {} : {
    options: {
      doTypeCheck: false,
      sourceMap: false,
      inlineSourceMap: true,
      inlineSources: true
    }
  }),
  html(),
  css({
    filename: '[name]-[contenthash].css',
    allChunks: true,
    sourceMap: false
  }),
  sass({
    filename: '[name]-[contenthash].css',
  }),
  json({
    exclude: ['node_modules']
  }),
  globalRegenerator(),
  fontAndImages(),
  globalBluebird(),
  globalJquery(),
  generateIndexHtml({
    minify: ENV === 'production'
  }),

  ...(ENV === 'production' || ENV === 'development' ? [
    commonChunksOptimize({
      appChunkName: 'app',
      firstChunk: 'aurelia-bootstrap'
    }),
    copyFiles({
      patterns: [{
        from: 'favicon.ico',
        to: 'favicon.ico'
      }]
    })
  ] : [
      /* ENV === 'test' */
      generateCoverage({
        options: {
          esModules: true
        }
      })
    ]),

  ENV === 'production' ?
    uglify({
      debug: false,
      mangle: {
        except: ['cb', '__webpack_require__']
      }
    }) : {}
);


config.externals = {
  jquery: "jQuery",
  'aurelia-webpack-plugin': "awp",
  'awesome-typescript-loader': "atl",
  'copy-webpack-plugin': "cwp",
}
//console.log("$$$$ CONFIG", config.metadata);
config.module.rules.push(...[{
  test: /\.ts$/,
  loader: 'awesome-typescript-loader',
  include: /node_modules[\\\/](rxui|linq4es2015)/
}, {
  test: /\.map$/,
  loader: 'ignore-loader'
}])

config.plugins.push(
  new webpack.LoaderOptionsPlugin({
    options: {
      sassLoader: {
        includePaths: ['scss/inc',
          'bower_components/compass-mixins/lib',
          'bower_components/bootstrap-sass-xl/assets/stylesheets'
        ]
      }
    }
  })
);


config.resolve.alias = Object.assign({}, config.resolve.alias || {}, {
  "breeze": "breeze-client",
})

config.devServer = Object.assign({}, config.devServer, {
  host: 'local.withsix.net',
  port: 9000
});

module.exports = stripMetadata(config);