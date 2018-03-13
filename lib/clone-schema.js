module.exports = function(schema, mongoose) {
  'use strict';

  mongoose = mongoose || require('mongoose');

  var clonedSchema = new mongoose.Schema();

  schema.eachPath(function(key, path) {
    if (key === "_id") {
      return;
    }

    var clonedPath = {};

    clonedPath[key] = path.options;
    delete clonedPath[key].unique;
    delete clonedPath[key].validate;

    clonedSchema.add(clonedPath);
  });

  if(!clonedSchema.path("modo")) clonedSchema.add({ modo: { type: Date }})
  return clonedSchema;
};