module.exports = function (schema, mongoose) {
  'use strict';

  mongoose = mongoose || require('mongoose');

  var clonedSchema = new mongoose.Schema();

  schema.eachPath(function (key, path) {
    var clonedPath = {};

    clonedPath[key] = path.options;
    clonedPath[key].unique = false;

    clonedSchema.add(clonedPath);
  });

  return clonedSchema;
};