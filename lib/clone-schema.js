var owl = require('owl-deepcopy');

module.exports = function (schema) {
    'use strict';

    // Deep clone the existing schema so we can add without changing it
    var newSchema = owl.deepCopy(schema);

    // Fix for callQueue arguments
    newSchema.callQueue.forEach(function (k) {
        var args = [], i;
        for (i in k[1]) {
            args.push(k[1][i]);
        }
        k[1] = args;
    });

    return newSchema;
};