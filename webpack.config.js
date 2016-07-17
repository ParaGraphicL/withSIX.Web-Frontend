"use strict";
require('regenerator-runtime/runtime');

/**
 * To learn more about how to use Easy Webpack
 * Take a look at the README here: https://github.com/easy-webpack/core
 **/
const easyWebpack = require('@easy-webpack/core');
const generateConfig = easyWebpack.default;
const get = easyWebpack.get;
const path = require('path');
const ELECTRON = process.env.ELECTRON && process.env.ELECTRON.toLowerCase() || false;
const ENV = process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() || 'development';
let config;

// basic configuration:
const title = 'withSIX';
const baseUrl = '/';
const rootDir = path.resolve();
const srcDir = path.resolve('src');
const outDir = path.resolve('dist');

const coreBundles = {
  bootstrap: [
    'aurelia-polyfills',
    'aurelia-pal',
    'aurelia-pal-browser',
    'regenerator-runtime',
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
    'aurelia-mediator',
    'aurelia-fetch-client',
    'aurelia-validation',
    'aurelia-ui-virtualization',
    'withsix-sync-api'
  ]
}

const baseConfig = {
  entry: {
    'app': ['./src/main'],
    'aurelia-bootstrap': ['./index'].concat(coreBundles.bootstrap).concat(coreBundles.aurelia)
      //'aurelia': coreBundles.aurelia.filter(pkg => coreBundles.bootstrap.indexOf(pkg) === -1)
  },
  output: {
    path: outDir,
  }
}

// advanced configuration:

switch (ENV) {
  case 'production':
    config = generateConfig(
      baseConfig,

      require('@easy-webpack/config-env-production')
      ({
        compress: true
      }),

      require('@easy-webpack/config-aurelia')
      ({
        root: rootDir,
        src: srcDir,
        title: title,
        baseUrl: baseUrl
      }),

      require('@easy-webpack/config-typescript')(),
      require('@easy-webpack/config-html')(),

      require('@easy-webpack/config-css')
      ({
        filename: '[name]-[contenthash].css',
        allChunks: !!ELECTRON,
        sourceMap: false
      }),
      require('@easy-webpack/config-sass')({
        filename: '[name]-[contenthash].css',
        allChunks: !!ELECTRON,
        sourceMap: false
      }),
      require('@easy-webpack/config-json')(),

      require('@easy-webpack/config-fonts-and-images')(),
      require('@easy-webpack/config-global-bluebird')(),
      //require('@easy-webpack/config-global-jquery')(),
      require('@easy-webpack/config-global-regenerator')(),
      require('@easy-webpack/config-generate-index-html')
      ({
        minify: true,
      }),

      require('@easy-webpack/config-uglify')
      ({
        debug: false
      })
    );
    break;

  case 'test':
    config = generateConfig(
      baseConfig,

      require('@easy-webpack/config-env-development')
      ({
        devtool: 'inline-source-map'
      }),

      require('@easy-webpack/config-aurelia')
      ({
        root: rootDir,
        src: srcDir,
        title: title,
        baseUrl: baseUrl
      }),

      require('@easy-webpack/config-typescript')(),
      require('@easy-webpack/config-html')(),

      require('@easy-webpack/config-css')
      ({
        filename: '[name]-[contenthash].css',
        allChunks: !!ELECTRON,
        sourceMap: false
      }),
      require('@easy-webpack/config-sass')({
        filename: '[name]-[contenthash].css',
        allChunks: !!ELECTRON,
        sourceMap: false
      }),
      require('@easy-webpack/config-json')(),

      require('@easy-webpack/config-fonts-and-images')(),
      require('@easy-webpack/config-global-bluebird')(),
      //require('@easy-webpack/config-global-jquery')(),
      require('@easy-webpack/config-global-regenerator')(),
      require('@easy-webpack/config-generate-index-html')()
    );
    break;

  default:
  case 'development':
    process.env.NODE_ENV = 'development';
    config = generateConfig(
      baseConfig,

      require('@easy-webpack/config-env-development')(),

      require('@easy-webpack/config-aurelia')
      ({
        root: rootDir,
        src: srcDir,
        title: title,
        baseUrl: baseUrl
      }),

      require('@easy-webpack/config-typescript')(),
      require('@easy-webpack/config-html')(),

      require('@easy-webpack/config-css')
      ({
        filename: '[name].css',
        allChunks: !!ELECTRON,
        sourceMap: true
      }),
      require('@easy-webpack/config-sass')({
        filename: '[name].css',
        allChunks: !!ELECTRON,
        sourceMap: true
      }),
      require('@easy-webpack/config-json')(),

      require('@easy-webpack/config-fonts-and-images')(),
      require('@easy-webpack/config-global-bluebird')(),
      //require('@easy-webpack/config-global-jquery')(),
      require('@easy-webpack/config-global-regenerator')(),
      require('@easy-webpack/config-generate-index-html')
      ({
        minify: false
      })
    );
    break;
}

if (ELECTRON) {
  config = generateConfig(
    config, {
      entry: ['./index', './src/main']
    },
    require('@easy-webpack/config-electron')(),
    ELECTRON == 'main' ?
    require('@easy-webpack/config-electron-main')() : require('@easy-webpack/config-electron-renderer')()
  );
}

if (ENV !== 'test' && !ELECTRON) {
  config = generateConfig(
    config,
    require('@easy-webpack/config-common-chunks-simple')
    ({
      appChunkName: 'app',
      firstChunk: 'aurelia-bootstrap'
    })
  );
}

if (ENV === 'test') {
  config = generateConfig(
    config,
    require('@easy-webpack/config-test-coverage-istanbul')()
  );
}

config.externals = {
  jquery: "jQuery"
}
config.module.loaders.push(...[
  /*{
    test: /\.json$/,
    loader: 'json-loader'
  }, */
  {
    test: /\.ts$/,
    loader: 'awesome-typescript-loader',
    include: /node_modules[\\\/](rxui|linq4es2015)/
  }, {
    test: /\.map$/,
    loader: 'ignore-loader'
  }
])

config.sassLoader = {
  includePaths: ['scss/inc',
    'bower_components/compass-mixins/lib',
    'bower_components/bootstrap-sass-xl/assets/stylesheets'
  ]
}



config.resolve.alias = Object.assign({}, config.resolve.alias || {}, {
  "breeze": "breeze-client"
})

config.devServer = Object.assign({}, config.devServer, {
  host: 'local.withsix.net',
  port: 9000
});

module.exports = config;
