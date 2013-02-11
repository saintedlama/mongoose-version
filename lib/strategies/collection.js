var mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.Types.ObjectId,
    cloneSchema = require('../clone-schema');

module.exports = function(schema, options) {
    var versionedSchema = cloneSchema(schema);

    for(var key in options) {
        if (options.hasOwnProperty(key)) {
            versionedSchema.set(key, options[key]);
        }
    }

    versionedSchema.add({
        refId : ObjectId,
        refVersion : Number
    });

    // Add reference to model to original schema
    schema.statics.VersionedModel = mongoose.model(options.collection, versionedSchema);

    schema.pre('save', function(next) {
        if (!options.suppressVersionIncrement) {
            this.increment(); // Increment origins version    
        }

        var versionedModel = new schema.statics.VersionedModel(this);
        versionedModel.refVersion = this._doc.__v;   // Saves current document version
        versionedModel.refId = this._id;        // Sets origins document id as a reference
        versionedModel._id = undefined;

        versionedModel.save(function(err) {
            if (options.logError) {
                console.log(err);
            }

            next();
        });
    });    
}

