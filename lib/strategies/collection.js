var cloneSchema = require('../clone-schema');
var setSchemaOptions = require('../set-schema-options');

module.exports = function(schema, options) {
    var versionedSchema = cloneSchema(schema);
    var mongoose = options.mongoose;
    var ObjectId = mongoose.Schema.Types.ObjectId;

    setSchemaOptions(versionedSchema, options);

    versionedSchema.add({
        refId : ObjectId,
        refVersion : Number
    });

    // Add reference to model to original schema
    schema.statics.VersionedModel = mongoose.model(options.collection, versionedSchema);

    schema.pre('save', function (next) {
        if (!options.suppressVersionIncrement) {
            this.increment(); // Increment origins version    
        }

        var versionedModel = new schema.statics.VersionedModel(this);
        versionedModel.refVersion = this._doc.__v;   // Saves current document version
        versionedModel.refId = this._id;        // Sets origins document id as a reference
        delete versionedModel._id;

        versionedModel.save(function(err) {
            if (options.logError && err) {
                console.log(err);
            }

            next();
        });
    });

    schema.pre('remove', function(next) {
        if (!options.removeVersions) {
            return next();
        }

        schema.statics.VersionedModel.remove({ refId : this._id }, function(err) {
            if (options.logError && err) {
                console.log(err);
            }

            next();
        });
    });
};