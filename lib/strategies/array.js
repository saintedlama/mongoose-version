var cloneSchema = require('../clone-schema');

module.exports = function(schema, options) {
    var clonedSchema = cloneSchema(schema);
    clonedSchema.add({ refVersion : Number });

    var mongoose = options.mongoose;
    var Schema = mongoose.Schema;
    var ObjectId = Schema.Types.ObjectId;

    var versionedSchema = new Schema({ refId : ObjectId, created : Date, modified : Date, versions : [clonedSchema] });

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

        if (!options.suppressVersionIncrement) {
            this.increment(); // Increment origins version    
        }

        VersionedModel.findOne({ refId : this._id }, function(err, versionedModel) {
            if (!versionedModel) {
                versionedModel = new VersionedModel({ refId : self._id, versions : [] });
            }

            // Set a document identifier in case it was specified in options
            if (options.documentProperty) {
                versionedModel[options.documentProperty] = self[options.documentProperty];
            }

            // copy but don't deep clone
            var versionCopy = {};
            for (var key in self._doc) {
                if (self._doc.hasOwnProperty(key)) {
                    versionCopy[key] = self._doc[key];
                }
            }

            versionCopy.refVersion = self._doc.__v || 0;
            versionCopy._id = undefined;

            versionedModel.versions.push(versionCopy);

            if (versionedModel.versions.length > options.maxVersions) {
                versionedModel.versions.shift();
            }

            versionedModel.save(function(err) {
                if (options.logError && err) {
                    console.log(err);
                }

                next();
            });
        });
    });
}