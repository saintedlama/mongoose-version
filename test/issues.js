var expect = require('chai').expect;
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongotest = require('./mongotest');
var version = require('../lib/version');
var Page = require('./fixtures/page');

describe('issues', function () {
    beforeEach(mongotest.prepareDb('mongodb://localhost/mongoose_version_issues_tests'));
    afterEach(mongotest.disconnect());

    it('should play nice with text search plugin', function (done) {
        var page = new Page({ title : 'Title', content : 'content', path : '/path' });

        page.save(function(err) {
            expect(err).to.not.exist;

            Page.VersionedModel.findOne({ refId : page._id }, function(err, versionedModel) {
                expect(err).to.not.exist;
                expect(versionedModel).to.be.ok;

                done();
            });
        });
    });

    it('should allow to create an empty versioned model', function(done) {
        var UserSchema = new Schema({});

        UserSchema.plugin(version, {
            logError: true,
            collection: 'userVersions'
        });

        var User = mongoose.model('User', UserSchema);

        var user = new User({});

        user.save(function(err) {
            expect(err).to.not.exist;

            User.VersionedModel.find({}, function(err, models) {
                expect(err).to.not.exist;
                expect(models).to.be.not.empty;

                done();
            });
        });
    });

    it('should delete versioned model when deleting the model', function(done) {
        var UserSchema = new Schema({});

        UserSchema.plugin(version, {
            logError: true,
            removeVersions: true,
            collection: 'User_should_be_deleted_when_model_is_deleted_versions'
        });

        var User = mongoose.model('User_should_be_deleted_when_model_is_deleted', UserSchema);

        var user = new User({});

        user.save(function(err) {
            expect(err).to.not.exist;

            user.remove(function(err) {
                expect(err).to.not.exist;

                User.VersionedModel.find({}, function(err, models) {
                    expect(err).to.not.exist;
                    expect(models).to.be.empty;

                    done();
                });
            });
        });
    });

    it('should delete versioned model when deleting the model in collection mode', function(done) {
        var UserSchema = new Schema({});

        UserSchema.plugin(version, {
            logError: true,
            removeVersions: true,
            collection: 'User_should_be_deleted_when_model_is_deleted_in_collection_mode_versions',
            strategy: 'collection'
        });

        var User = mongoose.model('User_should_be_deleted_when_model_is_in_collection_mode_deleted', UserSchema);

        var user = new User({});

        user.save(function(err) {
            expect(err).to.not.exist;

            user.remove(function(err) {
                expect(err).to.not.exist;

                User.VersionedModel.find({}, function(err, models) {
                    expect(err).to.not.exist;
                    expect(models).to.be.empty;

                    done();
                });
            });
        });
    });
});
