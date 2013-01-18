var assert = require('assert'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    version = require('../lib/version');

describe('version', function() {
    before(function(done) {
        mongoose.connect('mongodb://localhost/mongooseversiontest', function(err) {
            done(err);
        });
    });

    describe('#VersionModel', function() {
        it('should expose a version model in the original schema', function() {
            var testSchema = new Schema();
            testSchema.plugin(version, { collection : 'should_expose_version_model_versions' });
            
            var Test = mongoose.model('should_expose_version_model', testSchema);
            
            assert.ok(Test.VersionedModel);
        });
    });
    
    it('should save a version model when saving origin model', function(done) {
        var testSchema = new Schema({ name : String });
        testSchema.plugin(version, { collection : 'should_save_version_of_origin_model_versions' });

        var Test = mongoose.model('should_save_version_of_origin_model', testSchema);

        var test = new Test({ name: 'franz' });
        test.save(function(err) {
            assert.ifError(err);
            
            Test.VersionedModel.find({ refId : test._id, refVersion : test.__v }, function(err, versionedModel) {
                assert.ifError(err);
                assert.ok(versionedModel);
                
                done();
            });
        });
    });
    
    
})
