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

  if(!clonedSchema.path("__version_modifiedDate")) clonedSchema.add({ __version_modifiedDate: { type: Date }})
  return clonedSchema;
};