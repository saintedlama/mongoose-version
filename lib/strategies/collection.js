var debug = require('debug')('mongoose:version');
var xtend = require('xtend');

var cloneSchema = require('../clone-schema');
var setSchemaOptions = require('../set-schema-options');

module.exports = function(schema, options) {
    var versionedSchema = cloneSchema(schema, options.mongoose);
    var mongoose = options.mongoose;
    var ObjectId = mongoose.Schema.Types.ObjectId;

    setSchemaOptions(versionedSchema, options);

    versionedSchema.add({
        refId : ObjectId,
        refVersion : Number
    });

    // Add reference to model to original schema
    schema.statics.VersionedModel = {};

    schema.on('init', function (Model) {
        // Add reference to model to original schema
        var VersionedModel = Model.db.model(options.collection, versionedSchema);

        schema.statics.VersionedModel = VersionedModel;
        Model.VersionedModel = VersionedModel;
    });

    schema.pre('save', function (next) {
        if (!options.suppressVersionIncrement) {
            this.increment(); // Increment origins version    
        }

        var clone = xtend(this._doc);

        delete clone._id
        clone.refVersion = this._doc.__v;   // Saves current document version
        clone.refId = this._id;        // Sets origins document id as a reference

        new schema.statics.VersionedModel(clone).save(function (err) {
            if (err) {
                debug(err);
            } else {
                debug('Created versioned model in mongodb');
            }

            next();
        });
    });

    schema.pre('remove', function(next) {
        if (!options.removeVersions) {
            return next();
        }

        schema.statics.VersionedModel.remove({ refId : this._id }, function(err) {
            if (err) {
                debug(err);
            } else {
                debug('Removed versioned model from mongodb');
            }

            next();
        });
    });
};