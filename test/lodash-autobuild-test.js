'use strict';

const gulp = require('gulp');
const lodashAutobuild = require('../index');

const options = {
  target: '.tmp/lodash.custom.js',
  settings: {},
  include: ['_.chunk', '_.tap', '_.wrongMethod'] // Force include these functions
};

gulp.task('lodash:autobuild', () => {
  return gulp.src('./fixtures/**/*.js', { buffer: false })
    .pipe(lodashAutobuild(options))
    .on('error', function(err) {
      console.log('err: ', err);
    });
});
