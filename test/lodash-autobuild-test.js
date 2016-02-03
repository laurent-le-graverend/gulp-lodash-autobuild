'use strict';

var gulp = require('gulp');
var lodashAutobuild = require('../index');

var options = {
  target: '.tmp/lodash.custom.js',
  settings: {}
};

gulp.task('lodash:autobuild', function(callback) {
  return gulp.src('./fixtures/**/*.js', { buffer: false })
    .pipe(lodashAutobuild(options))
    .on('error', function(err) {
      console.log('err: ', err);
    });
});
