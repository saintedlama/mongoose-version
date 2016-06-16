module.exports = function(schema, options) {
  for (var key in options) {
    if (options.hasOwnProperty(key)) {
      schema.set(key, options[key]);
    }
  }
};