var debug = require('debug')('mongoose:version');

var cloneSchema = require('../clone-schema');
var setSchemaOptions = require('../set-schema-options');

module.exports = function(schema, options) {
  var mongoose = options.mongoose;

  var clonedSchema = cloneSchema(schema, mongoose);
  clonedSchema.add({ refVersion: Number });

  var Schema = mongoose.Schema;
  var ObjectId = Schema.Types.ObjectId;
  var refIdType = options.refIdType || ObjectId;

  var versionedSchema = new Schema({ refId: refIdType, created: Date, modified: Date, versions: [clonedSchema] });

  if (!options.suppressRefIdIndex) {
    versionedSchema.index({ refId: 1 })
  }

  if (options.documentProperty) {
    var documentPropertyField = {};
    documentPropertyField[options.documentProperty] = clonedSchema.path(options.documentProperty).options;

    versionedSchema.add(documentPropertyField);
  }

  versionedSchema.pre('save', function(next) {
    if (!this.created) {
      this.created = new Date();
    }

    this.modified = new Date();

    next();
  });

  versionedSchema.statics.latest = function(count, cb) {
    if (typeof(count) == 'function') {
      cb = count;
      count = 10;
    }

    return this
      .find({})
      .limit(count)
      .sort('-created')
      .exec(cb);
  };

  setSchemaOptions(versionedSchema, options);

  // Add reference to model to original schema
  var VersionedModel = mongoose.model(options.collection, versionedSchema);
  schema.statics.VersionedModel = VersionedModel;

  schema.pre('save', function(next) {
    var self = this;

    if (!options.suppressVersionIncrement) {
      this.increment(); // Increment origins version
    }

    var modifiedPaths = this.modifiedPaths();

    if (modifiedPaths.length) {
      var onlyIgnoredPathModified = modifiedPaths.every(function(path) {
        return options.ignorePaths.indexOf(path) >= 0;
      });

      if (onlyIgnoredPathModified) {
        return next();
      }
    }

    VersionedModel.findOne({ refId: this._id }, function(err, versionedModel) {
      if (!versionedModel) {
        versionedModel = new VersionedModel({ refId: self._id, versions: [] });
      }

      // Set a document identifier in case it was specified in options
      if (options.documentProperty) {
        versionedModel[options.documentProperty] = self[options.documentProperty];
      }

      var versionCopy = self.toObject();

      versionCopy.refVersion = self._doc.__v + 1 || 0;
      versionCopy._id = undefined;

      versionedModel.versions.push(versionCopy);

      if (versionedModel.versions.length > options.maxVersions) {
        versionedModel.versions.shift();
      }

      versionedModel.save(function(err) {
        if (err) {
          debug(err);
        } else {
          debug('Removed versioned model from mongodb');
        }

        next();
      });
    });
  });


  schema.pre('remove', function(next) {
    if (!options.removeVersions) {
      return next();
    }

    VersionedModel.remove({ refId: this._id }, function(err) {
      if (err) {
        debug(err);
      } else {
        debug('Removed versioned model from mongodb');
      }

      next();
    });
  });
};
