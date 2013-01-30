var clone = require('clone');
    
module.exports = function(schema) {
    var clonedSchema = clone(schema);

    // Fix for callQueue arguments
    clonedSchema.callQueue.forEach(function(queueEntry) {
        var args = [];

        for(var key in queueEntry[1]) {
            args.push(queueEntry[1][key]);
        }

        queueEntry[1] = args;
    });

    return clonedSchema;
};