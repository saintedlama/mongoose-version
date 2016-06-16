var assert = require('assert');
var mongoose = require('mongoose');
var async = require('async');
var debug = require('debug')('mongoose:version');

module.exports = {
  dropCollections: function(connectionString) {
    return function(cb) {
      mongoose.connect(connectionString, function(err) {
        assert.ifError(err);

        mongoose.connection.db.collections(function(err, collections) {
          assert.ifError(err);

          var collectionsToDrop = collections
            .filter(function(col) { return col.collectionName.indexOf('system.') != 0; })
            .map(function(col) { return col.collectionName; });

          async.forEach(collectionsToDrop, dropCollection, cb);
        });
      });
    };
  },

  disconnect: function() {
    return function(cb) {
      mongoose.disconnect(cb);
    }
  }
}

function dropCollection(collection, cb) {
  mongoose.connection.db.dropCollection(collection, function(err) {
    if (err) {
      debug('Could not drop collection. Retrying...');

      // Simple manual retry
      return mongoose.connection.db.dropCollection(collection, cb);
    }

    cb();
  });
}