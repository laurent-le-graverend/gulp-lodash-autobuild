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
  var props = [];
  var search = /_\.(\w*)/g;

  if (options.include) {
    props = options.include;
  }

  function log(message) {
    gutil.log(magenta(PLUGIN_NAME), message);
  }

  function warn(message) {
    log(red('WARNING') + ' ' + message);
  }

  function raiseError(message) {
    return new PluginError(PLUGIN_NAME, message);
  }

  function findProps(body) {
    var content = body;

    // TODO: Need to be able to handle chaining, below is just the beginning
    // Remove line breaks
    content = content.replace(/(\r\n|\n|\r)/gm, '');
    // Remove comments
    content = content.replace(/(\/\*[\w\'\s\r\n\*]*\*\/)|(\/\/[\w\s\']*)|(\<![\-\-\s\w\>\/]*\>)/gm, '');
    // Remove bank spaces
    content = content.replace(/\s/g, '');

    // Match regex
    var tmp = content.match(search);
    if (tmp) {
      props = props.concat(tmp);
    }
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
        findProps(body);
        _this.push(file);
        callback();
      });
    } else {
      _this.push(file);
      callback();
    }
  }

  function flush(callback) {
    props = _.uniq(props).map(function(item) {
      return item.split('.')[1];
    }).sort();

    // Remove invalid property names
    var propsInvalid = _.difference(props, _.keys(_));
    var propsValid = _.intersection(props, _.keys(_));

    log('Build includes: ' + propsValid.join(', '));

    if (propsInvalid.length) {
      warn('Invalid properties ignored: ' + propsInvalid.join(', '));
    }

    childProcess.execFile(autobuild,
      [
        '-d',
        '-c',
        'include=' + propsValid.join(',' + ''),
        'settings=' + JSON.stringify(options.settings)
      ],
      {
        maxBuffer: 1024 * 600
      },
      function(error, stdout, stderr) {
        if (error !== null) {
          throw raiseError(error);
        }
        mkdirp(path.dirname(options.target), function() {
          fs.writeFile(options.target, stdout, function(error) {
            if (error !== null) {
              throw raiseError(error);
            }
            callback();
          });
        });
      });
  }

  return through.obj(transform, flush);
}

module.exports = gulpLodashAutobuild;
