'use strict';

module.exports = function (schema, mongoose, ignorePaths = []) {

  mongoose = mongoose || require('mongoose');

  var clonedSchema = new mongoose.Schema();

  schema.eachPath(function (key, path) {

    if (ignorePaths.indexOf(key) >= 0) {
      return;
    }

    var clonedPath = {};

    clonedPath[key] = path.options;
    clonedPath[key].unique = false;

    clonedSchema.add(clonedPath);
  });

  return clonedSchema;
};
