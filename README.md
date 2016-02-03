# gulp-lodash-autobuild
> Create a custom build of Lodash >= v4.0

## Usage

Install `gulp-lodash-autobuild` as a development dependency:

```shell
$ npm install --save-dev git://github.com/laurent-le-graverend/gulp-lodash-autobuild.git
```

### Gulp Example
```javascript
var gulp = require('gulp');
var lodashAutobuild = require('gulp-lodash-autobuild');

var options = {
  target: '/.tmp/lodash.custom.js',
  settings: {}
};

gulp.task('lodash', function(callback) {
  return gulp.src('./src/**/*.js', { buffer: false })
    .pipe(lodashAutobuild(options))
    .on('error', function(err) {
      console.log('err: ', err);
    })
});
```

> Original code from https://github.com/OneLittleRobot/gulp-lodash-autobuild
> !!! Work in progress, working, but not properly tested
