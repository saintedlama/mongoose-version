var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = function (schema) {
    'use strict';
    var clonedSchema = new Schema();

    schema.eachPath(function(key, path) {
      // name : { type : String, required : true }

      var clonedPath = {};

      clonedPath[key] = path.options;
      clonedSchema.add(clonedPath);
    });

    return clonedSchema;
};