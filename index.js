'use strict';

const _ = require('lodash');
const fs = require('fs');
const gutil = require('gulp-util');
const path = require('path');
const mkdirp = require('mkdirp');
const through = require('through2');
const childProcess = require('child_process');
const PluginError = gutil.PluginError;
const red = gutil.colors.red;
const magenta = gutil.colors.magenta;

const pkg = require('lodash-cli/package.json'),
  bin = pkg.bin.lodash,
  autobuild = require.resolve('lodash-cli/' + bin);

/**
 * Constants
 */
const PLUGIN_NAME = 'gulp-lodash-autobuild';

/**
 * Search for lodash functions in the stream and creates a custom Lodash build
 *
 * @param {=Object} options - Configuration for running Lodash cli
 * @returns {stream} gulp file stream
 */
function gulpLodashAutobuild(options) {
  const search = /_\.(\w*)/g;
  let props = [];

  options = options ? options : { target: './lodash.custom.js', settings: {} };

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
    let content = body;

    // TODO: Need to be able to handle chaining, below is just the beginning
    // Remove line breaks
    content = content.replace(/(\r\n|\n|\r)/gm, '');
    // Remove comments
    content = content.replace(/(\/\*[\w\'\s\r\n\*]*\*\/)|(\/\/[\w\s\']*)|(\<![\-\-\s\w\>\/]*\>)/gm, '');
    // Remove bank spaces
    content = content.replace(/\s/g, '');

    // Match regex
    const tmp = content.match(search);
    if (tmp) {
      props = props.concat(tmp);
    }
  }

  function transform(file, enc, callback) {
    const _this = this;
    if (file.isBuffer()) {
      warn('Buffers not supported...');
      return callback();
    } else if (file.isStream()) {
      let body = '';
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
    const propsInvalid = _.difference(props, _.keys(_));
    const propsValid = _.intersection(props, _.keys(_));

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
