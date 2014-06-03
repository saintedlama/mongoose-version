var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = function (schema) {
  'use strict';
  var clonedSchema = new Schema();

  schema.eachPath(function (key, path) {
    var clonedPath = {};

    clonedPath[key] = path.options;
    clonedPath[key].unique = false;

    clonedSchema.add(clonedPath);
  });

  return clonedSchema;
};