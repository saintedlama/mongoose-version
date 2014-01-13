var cloneSchema = require('../clone-schema');

module.exports = function(schema, options) {
    var versionedSchema = cloneSchema(schema), mongoose = options.mongoose, ObjectId = mongoose.Schema.Types.ObjectId;

    for(var key in options) {
        if (options.hasOwnProperty(key)) {
            versionedSchema.set(key, options[key]);
        }
    }

    versionedSchema.add({
        refId : ObjectId,
        refVersion : Number
    });

    //remove uniqueness from the versionedSchema, fix for issue #3
    versionedSchema.eachPath(function (property, propertyConfig) {
        propertyConfig.options.unique = false;
        if (propertyConfig._index && propertyConfig._index.unique) {
            propertyConfig._index.unique = false;
        }
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
}