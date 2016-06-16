var strategies = require('./strategies');

module.exports = function(schema, options) {
  if (typeof(options) == 'string') {
    options = {
      collection: options
    }
  }

  options = options || {};
  options.collection = options.collection || 'versions';
  options.logError = options.logError || false;
  options.strategy = options.strategy || 'array';
  options.maxVersions = options.maxVersions || Number.MAX_VALUE;
  options.suppressVersionIncrement = options.suppressVersionIncrement !== false;
  options.suppressRefIdIndex = options.suppressRefIdIndex !== false;
  options.mongoose = options.mongoose || require('mongoose');
  options.removeVersions = !!options.removeVersions;
  options.ignorePaths = options.ignorePaths || [];

  if (!strategies[options.strategy]) {
    throw new Error('Strategy ' + options.strategy + ' is unknown');
  }

  strategies[options.strategy](schema, options);
};
