module.exports = function(schema, mongoose) {
  'use strict';

  mongoose = mongoose || require('mongoose');

  let clonedSchema = new mongoose.Schema();

  schema.eachPath(function(key, path) {
    if (key === "_id") {
      return;
    }

    let clonedPath = {};

    clonedPath[key] = path.options;
    delete clonedPath[key].unique;

    clonedSchema.add(clonedPath);
  });

  return clonedSchema;
};
