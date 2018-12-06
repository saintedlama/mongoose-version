const debug = require('debug')('mongoose:version');

const cloneSchema = require('../clone-schema');
const setSchemaOptions = require('../set-schema-options');

module.exports = function(schema, options) {
  const mongoose = options.mongoose;

  const clonedSchema = cloneSchema(schema, mongoose);
  clonedSchema.add({
    refVersion: Number
  });

  const { Schema } = mongoose;
  const { ObjectId } = Schema.Types;
  const refIdType = options.refIdType || ObjectId;

  const versionedSchema = new Schema({
    refId: refIdType,
    created: Date,
    modified: Date,
    versions: [clonedSchema]
  });

  if (!options.suppressRefIdIndex) {
    versionedSchema.index({
      refId: 1
    })
  }

  if (options.documentProperty) {
    let documentPropertyField = {};
    documentPropertyField[options.documentProperty] = clonedSchema.path(options.documentProperty).options;

    versionedSchema.add(documentPropertyField);
  }

  function updateDate(next) {
    this.modified = new Date();
    next();
  }

  versionedSchema.pre('save', function(next) {
    if (!this.created) {
      this.created = new Date();
    }
    updateDate(next);
  });
  versionedSchema.pre('update', function(next) {
    updateDate(next)
  });
  versionedSchema.pre('updateOne', function(next) {
    updateDate(next)
  });
  versionedSchema.pre('findOneAndUpdate', function(next) {
    updateDate(next)
  });

  versionedSchema.statics.latest = function(limit, cb) {
    if (typeof(limit) == 'function') {
      cb = limit;
      limit = 10;
    }

    return this
      .find({})
      .limit(limit)
      .sort('-created')
      .exec(cb);
  };

  setSchemaOptions(versionedSchema, options);

  // Add reference to model to original schema
  const VersionedModel = mongoose.model(options.collection, versionedSchema);
  schema.statics.VersionedModel = VersionedModel;

  function createVersion(next) {
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

    VersionedModel.findOne({refId: this._id }, function(err, versionedModel) {
      if (!versionedModel) {
        versionedModel = new VersionedModel({
          refId: self._id,
          versions: []
        });
      }

      // Set a document identifier in case it was specified in options
      if (options.documentProperty) {
        versionedModel[options.documentProperty] = self[options.documentProperty];
      }

      let versionCopy = self.toObject();

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
  }

  schema.pre('save', createVersion);
  schema.pre('update', createVersion);
  schema.pre('updateOne', createVersion);
  schema.pre('findOneAndUpdate', createVersion);

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
