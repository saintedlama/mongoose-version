var clone = require('clone'),
    mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.Types.ObjectId;

module.exports = function(schema, options) {
    options = options || {};
    options.collection = options.collection || 'versions';

    var versionedSchema = clone(schema);

    // Fix for callQueue arguments, todo: fix clone implementation
    versionedSchema.callQueue.forEach(function(queueEntry) {
        var args = [];
        
        for(var key in queueEntry[1]) {
            args.push(queueEntry[1][key]);
        }

        queueEntry[1] = args;
    });

    for(var key in options) {
        if (options.hasOwnProperty(key)) {
            versionedSchema.set(key, options[key]);
        }
    }

    versionedSchema.add({
        refId : ObjectId,
        refVersion : Number
    });

    versionedSchema.statics.VersionedModel = mongoose.model(options.collection, versionedSchema);

    schema.pre('save', function(next) {
        this.increment(); // Increment origins version

        var versionedModel = new versionedSchema.statics.VersionedModel(this);
        versionedModel.refVersion = this._doc.__v;   // Saves current document version
        versionedModel.refId = this._id;        // Sets origins document id as a reference
        versionedModel._id = undefined; 
        
        versionedModel.save(function(err) {
            next();
        });
    });
};
