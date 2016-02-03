'use strict';

var _ = require('lodash');
var fs = require('fs');
var gutil = require('gulp-util');
var path = require('path');
var mkdirp = require('mkdirp');
var through = require('through2');
var childProcess = require('child_process');
var PluginError = gutil.PluginError;
var red = gutil.colors.red;
var magenta = gutil.colors.magenta;

var pkg = require('lodash-cli/package.json'),
  bin = pkg.bin.lodash,
  autobuild = require.resolve('lodash-cli/' + bin);

/**
 * Constants
 */
var PLUGIN_NAME = 'gulp-lodash-autobuild';

/**
 * Search for lodash functions in the stream and creates a custom Lodash build
 *
 * @param {=Object} options - Configuration for running Lodash cli
 * @returns {stream} gulp file stream
 */
function gulpLodashAutobuild(options) {
  var options = options ? options : { target: './lodash.custom.js', settings: {} };
  var dependencies = [];
  var search = /_\.(\w*)/g;

  function log(message) {
    gutil.log(magenta(PLUGIN_NAME), message);
  }

  function warn(message) {
    log(red('WARNING') + ' ' + message);
  }

  function error(message) {
    return new PluginError(PLUGIN_NAME, message);
  }

  function transform(file, enc, callback) {
    var _this = this;
    if (file.isBuffer()) {
      warn('Buffers not supported...');
      return callback();
    } else if (file.isStream()) {
      var body = '';
      file.contents.on('data', function(chunk) {
        body += chunk;
      }).on('end', function() {
        var tmp = body.match(search);
        if (tmp) {
          dependencies = dependencies.concat(tmp);
        }
        _this.push(file);
        callback();
      });
    } else {
      _this.push(file);
      callback();
    }
  }

  function flush(callback) {
    dependencies = _.uniq(dependencies).map(function(item) {
      return item.split('.')[1];
    });
    dependencies = dependencies.sort();
    log('Lodash build includes: ' + dependencies.join(', '));

    childProcess.execFile(autobuild,
      [
        '-d',
        '-c',
        'include=' + dependencies.join(',' + ''),
        'settings=' + JSON.stringify(options.settings)
      ],
      {
        maxBuffer: 1024 * 600
      },
      function(error, stdout, stderr) {
        if (error !== null) {
          error(error);
        }
        mkdirp(path.dirname(options.target), function() {
          fs.writeFile(options.target, stdout, function(error) {
            if (error !== null) {
              error(error);
            }
            callback();
          });
        });
      });
  }

  return through.obj(transform, flush);
}

module.exports = gulpLodashAutobuild;
