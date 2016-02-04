// From the grunt plugin: https://github.com/jjt/grunt-lodash-autobuild/blob/master/test/fixtures/test.js

'use strict';

_.groupBy([4.2, 6.1, 6.4], function(num) {
  return Math.floor(num);
});

var stooges = [
  { 'name': 'moe', 'age': 40 },
  { 'name': 'larry', 'age': 50 }
];

var shallow = _.clone(stooges);

_.isFinite(-101);

_.random(0, 5);

_.unescape('Moe, Larry &amp; Curly');

_.head([1, 2, 3], 2);

_.isFinite(-101);

var array = [3, 4, 6, 9, 10, 1, 3, 4, 5];

array = _.chain(array)
  .chunk(2) // Group values
  .map(_.max) // Find max of each group
  .value();

_.invalidMethod(array);
