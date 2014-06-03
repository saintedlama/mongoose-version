var setSchemaOptions = require('../lib/set-schema-options');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var expect = require('chai').expect;

describe('set-schema-options', function() {
  it('should set options for passed schema', function() {
    var testSchema = new Schema({ name: String, date: Date });

    setSchemaOptions(testSchema, { option : true});

    expect(testSchema.get('option')).to.equal(true);
  });

  it('should set do nothing if no option object was passed as argument', function() {
    var testSchema = new Schema({ name: String, date: Date });

    setSchemaOptions(testSchema);
  });
});