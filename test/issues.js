var assert = require('assert'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Page = require('./fixtures/page');

describe('issues', function () {
    before(function(done) {
        mongoose.connect('mongodb://127.0.0.1/mongooseversion_issuestest', function(err) {
            done(err);
        });
    });

    after(function(done) {
        mongoose.disconnect(function(err) {
            done(err);
        });
    });

    it('should play nice with text search plugin', function (done) {
        var page = new Page({ title : 'Title', content : 'content', path : '/path' });

        page.save(function(err) {
            assert.ifError(err);

            Page.VersionedModel.findOne({ refId : page._id }, function(err, versionedModel) {
                assert.ifError(err);
                assert.ok(versionedModel);

                done();
            });
        });
    })
});
