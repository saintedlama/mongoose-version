var assert = require('assert'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    version = require('../lib/version');

describe('version', function() {
    before(function(done) {
        mongoose.connect('mongodb://127.0.0.1/mongooseversiontest', function(err) {
            done(err);
        });
    });

    after(function(done) {
        mongoose.disconnect(function(err) {
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

    it('should save a version model when saving origin model twice', function(done) {
        var testSchema = new Schema({ name : String });
        testSchema.plugin(version, { collection : 'should_save_version_of_origin_model_versions_twice' });

        var Test = mongoose.model('should_save_version_of_origin_model_twice', testSchema);

        var test = new Test({ name: 'franz' });
        test.save(function(err) {
            assert.ifError(err);

            test.name = 'hugo';

            test.save(function(err) {
                assert.ifError(err);

                Test.VersionedModel.findOne({ refId : test._id, refVersion : test.__v }, function(err, versionedModel) {
                    assert.ifError(err);
                    assert.ok(versionedModel);

                    done();
                });
            });
        });
    });
    
    it('should accept options as string', function() {
        var testSchema = new Schema({ name : String });
        testSchema.plugin(version, 'should_accept_string');

        var Test = mongoose.model('should_accept_string_origin_model', testSchema);

        assert.equal(Test.VersionedModel.collection.name, 'should_accept_string');
    });

    it('should throw for unknown strategies', function() {
        var testSchema = new Schema({ name : String });
        assert.throws(function() {
            testSchema.plugin(version, { strategy: 'hugo' });
        });
    });
    
    it('should save a version model in an array when using "array" strategy', function(done) {
        var testSchema = new Schema({ name : String });
        testSchema.plugin(version, { strategy : 'array', collection : 'should_save_version_in_array' });

        var Test = mongoose.model('should_save_version_in_array_origin_model', testSchema);

        var test = new Test({ name: 'franz' });
        test.save(function(err) {
            assert.ifError(err);

            Test.VersionedModel.findOne({ refId : test._id}, function(err, versionedModel) {
                assert.ifError(err);
                assert.ok(versionedModel);

                assert.equal(versionedModel.versions.length, 1);

                done();
            });
        });
    });

    it('should keep maxVersions of version model in an array when using "array" strategy', function(done) {
        var testSchema = new Schema({ name : String });
        testSchema.plugin(version, { strategy : 'array', maxVersions : 1, collection : 'should_keep_only_max_versions' });

        var Test = mongoose.model('should_keep_only_max_versions_origin_model', testSchema);

        var test = new Test({ name: 'franz' });
        
        // Save one generates a version
        test.save(function(err) {
            assert.ifError(err);

            test.name = 'hugo';

            // Save two generates a version
            test.save(function(err) {
                assert.ifError(err);

                Test.VersionedModel.findOne({ refId : test._id}, function(err, versionedModel) {
                    assert.ifError(err);
                    assert.ok(versionedModel);

                    // expected versions in array: 1
                    assert.equal(versionedModel.versions.length, 1);

                    done();
                });
            });
        });
    });

    it('should save documentProperty as well as update and create dates', function(done) {
        var testSchema = new Schema({ name : String });
        testSchema.plugin(version, { strategy : 'array', documentProperty : 'name', collection : 'should_save_document_identifier_and_dates' });

        var Test = mongoose.model('should_save_document_identifier_and_dates_model', testSchema);

        var test = new Test({ name: 'franz' });
        test.save(function(err) {
            assert.ifError(err);

            Test.VersionedModel.findOne({ refId : test._id}, function(err, versionedModel) {
                assert.ok(versionedModel.created);
                assert.ok(versionedModel.modified);
                assert.equal(versionedModel.name, 'franz');

                done();
            });
        });
    });
});
