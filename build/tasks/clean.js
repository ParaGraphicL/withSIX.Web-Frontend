var gulp = require('gulp');
var paths = require('../paths');
var del = require('del');
var vinylPaths = require('vinyl-paths');
var runSequence = require('run-sequence');

gulp.task('clean-scripts', function() {
  return gulp.src([paths.source, paths.otherSource, paths.otherMiscSource, map(paths.source), map(paths.otherSource), map(paths.otherMiscSource)])
    .pipe(vinylPaths(del))
})

gulp.task('clean', function(callback) {
  return runSequence(
    // 'unbundle',
    ['clean-scripts'],
    callback
  );
});
