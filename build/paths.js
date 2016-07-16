var path = require('path');

var publicRoot = './';
var appRoot = publicRoot + 'src/';
var appOutRoot = publicRoot + 'dist/';

var legacyRoot = publicRoot + 'src_legacy/';
var legacyOutRoot = publicRoot + 'legacy/';
var otherMiscRoot = legacyRoot + 'misc/';
var otherAppRoot = legacyRoot + 'app/';

module.exports = {
  realRoot: '',
  root: appRoot,
  publicRoot: publicRoot,
  source: appRoot + '**/*.js',
  tsSource: appRoot + '**/*.ts',
  otherSource: otherAppRoot + '**/*.js',
  otherMiscSource: otherMiscRoot + '**/*.js',
  html: appRoot + '**/*.html',
  style: publicRoot + 'styles/**/*.css',
  css: appRoot + '**/*.css',
  scss: appRoot + '**/*.scss',
  scssOther: otherAppRoot + '**/*.scss',
  scssGlobal: legacyRoot + 'scss/*.scss',
  scssGlobalWatch: legacyRoot + 'scss/**/*.scss',
  additionalPaths: [
    otherAppRoot + '**/*.html', otherAppRoot + '**/*.js', publicRoot + 'styles/**/*.css',
    legacyOutRoot + 'vendor/**/*.js', publicRoot + 'data/**/*.json'
  ],
  output: appOutRoot,
  stylesOut: publicRoot + 'styles/',
  otherOutput: legacyOutRoot + 'app/',
  otherMiscOutput: legacyOutRoot + 'misc/',
  doc: './doc',
  e2eSpecsSrc: 'test/e2e/src/*.js',
  e2eSpecsDist: 'test/e2e/dist/'
};
