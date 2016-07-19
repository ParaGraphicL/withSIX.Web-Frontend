var gulp = require('gulp');
var runSequence = require('run-sequence');
var changed = require('gulp-changed');
var plumber = require('gulp-plumber');
var to5 = require('gulp-babel');
var sourcemaps = require('gulp-sourcemaps');
var ts = require('gulp-typescript');
var paths = require('../paths');
var assign = Object.assign || require('object.assign');
var merge = require('merge2');
var notify = require('gulp-notify');

var gulp = require('gulp');

var tsProject = ts.createProject(paths.realRoot + 'tsconfig.json');
gulp.task('scripts', function() {
  var tsResult = tsProject.src() //tsProject.src() // instead of gulp.src(...)
    .pipe(sourcemaps.init())
    .pipe(ts(tsProject));

  return merge([ // Merge the two output streams, so this task is finished when the IO of both operations are done.
    tsResult.js
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(paths.realRoot)),
    tsResult.dts.pipe(gulp.dest(paths.realRoot)),
  ]);
  //return tsResult.js.pipe(gulp.dest(paths.root));
});

// this task calls the clean task (located
// in ./clean.js), then runs the build-system
// and build-html tasks in parallel
// https://www.npmjs.com/package/gulp-run-sequence
gulp.task('build', function(callback) {
  return runSequence(
    'clean', ['scripts'],
    callback
  );
});
