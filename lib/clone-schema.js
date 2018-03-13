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

  clonedSchema.add({ lastmodif_version: { type: Date, detault: new Date() }})
  return clonedSchema;
};