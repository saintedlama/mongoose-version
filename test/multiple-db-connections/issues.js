var expect = require('chai').expect;
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongotest = require('./mongotest');
var version = require('../../lib/version');
var pageModel = require('../fixtures/page');

describe('issues', function () {
    beforeEach(mongotest.prepareDb('mongodb://localhost/mongoose_version_issues_tests'));
    afterEach(mongotest.disconnect());

    it('should play nice with text search plugin', function (done) {
        var Page = pageModel(mongotest.connection);
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

        var User = mongotest.connection.model('User', UserSchema);

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

        var User = mongotest.connection.model('User_should_be_deleted_when_model_is_deleted', UserSchema);

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

        var User = mongotest.connection.model('User_should_be_deleted_when_model_is_in_collection_mode_deleted', UserSchema);

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

    it('should not save a versioned model when field is excluded', function(done) {
        var UserSchema = new Schema({ excludeThisField : String, notExcludeThisField : String });

        UserSchema.plugin(version, {
            logError: true,
            ignorePaths: 'excludeThisField',
            collection: 'User_should_not_save_a_versioned_model_when_field_is_excluded_versions'
        });

        var User = mongotest.connection.model('User_should_not_save_a_versioned_model_when_field_is_excluded', UserSchema);

        var user = new User({ });

        user.save(function(err) {
            expect(err).to.not.exist;

            user.excludeThisField = 'ThisShouldBeIgnoredFromVersioning';

            user.save(function(err) {
                expect(err).to.not.exist;

                user.notExcludeThisField = 'ThisShouldNotBeIgnoredFromVersioning';

                user.save(function(err) {
                    expect(err).to.not.exist;

                    User.VersionedModel.findOne({ refId : user._id }, function(err, model) {
                        expect(err).to.not.exist;
                        expect(model).to.be.not.empty;

                        expect(model.versions.length).to.equal(2); // One update should be ignored

                        done();
                    });
                });
            });
        });
    });

    it('should ignore unique indexes in cloned model', function(done){
        var UserSchema = new Schema({
            module: {
                type: Schema.Types.ObjectId,
                required: true
            },
            slug: {
                type: String,
                required: true
            }
        });

        UserSchema.index({
            module: 1,
            slug: 1
        }, {
            unique: true
        });

        UserSchema.plugin(version, {
            logError: true,
            collection: 'User_should_ignore_indexes_in_cloned_model_versions'
        });

        var User = mongotest.connection.model('User_should_ignore_indexes_in_cloned_model', UserSchema);

        var user = new User({
            module: '538c5caa4f019dd4225fe4f7',
            slug: 'test-module'
        });

        user.save(function (err) {
            expect(err).to.not.exist;
            console.log('saved');

            user.remove(function (err) {
                expect(err).to.not.exist;
                var user = new User({
                    module: '538c5caa4f019dd4225fe4f7',
                    slug: 'test-module'
                });
                user.save(function (err, user) {
                    expect(err).to.not.exist;

                    User.VersionedModel.findOne({ refId : user._id }, function(err, model) {
                        expect(err).to.not.exist;
                        expect(model).to.be.not.empty;

                        done();
                    });
                });
            });
        });
    });

    it('should not break when using the plugin with collection strategy #10', function() {
        var schema = new mongoose.Schema({
          title: { type: String, required: true, trim: true },
          content: { type: String, trim: true }
        });

        schema.plugin(version, { strategy: 'collection', collection: 'PageVersionsCollectionIssue10' });

        var model = mongotest.connection.model('PageIssue10CollectionStrategy', schema);

        expect(model).to.exist;
    });

    it('should not break when using the plugin with array strategy #10', function() {
        var schema = new mongoose.Schema({
            title: { type: String, required: true, trim: true },
            content: { type: String, trim: true }
        });

        schema.plugin(version, { strategy: 'array', collection: 'PageVersionsArrayIssue10' });

        var model = mongotest.connection.model('PageIssue10ArrayStrategy', schema);

        expect(model).to.exist;
    });
});
