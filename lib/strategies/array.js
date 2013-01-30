var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId,
    clone = require('clone'),
    cloneSchema = require('../clone-schema');

module.exports = function(schema, options) {
    
    var clonedSchema = cloneSchema(schema);
    clonedSchema.add({ refVersion : Number });

    var versionedSchema = new Schema({ refId : ObjectId, versions : [clonedSchema] });
    
    for(var key in options) {
        if (options.hasOwnProperty(key)) {
            versionedSchema.set(key, options[key]);
        }
    }

    // Add reference to model to original schema
    var VersionedModel = mongoose.model(options.collection, versionedSchema);
    schema.statics.VersionedModel = VersionedModel;
    
    schema.pre('save', function(next) {
        var self = this;

        if (!options.surpressVersionIncrement) {
            this.increment(); // Increment origins version    
        }

        VersionedModel.findOne({ refId : this._id }, function(err, versionedModel) {
            if (!versionedModel) {
                versionedModel = new VersionedModel({ refId : self._id, versions : [] });
            }

            var clonedModel = clone(self._doc);
            clonedModel.refVersion = self._doc.__v;
            clonedModel._id = undefined;

            versionedModel.versions.push(clonedModel);

            if (versionedModel.versions.length > options.maxVersions) {
                versionedModel.versions.shift();
            }
            
            versionedModel.save(function(err, savedVersionedModel) {
                if (options.logError) {
                    console.log(err);
                }

                next();
            });
        });        
    });
}


