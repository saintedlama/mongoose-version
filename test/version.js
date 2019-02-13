var expect = require('chai').expect;
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongotest = require('./mongotest');
var version = require('../lib/version');
var util = require('util');

describe('version', function() {
  beforeEach(mongotest.dropCollections('mongodb://localhost/mongoose_version_tests'));
  afterEach(mongotest.disconnect());

  describe('#VersionModel', function() {
    it('should expose a version model in the original schema', function() {
      var testSchema = new Schema();
      testSchema.plugin(version, { collection: 'should_expose_version_model_versions' });

      var Test = mongoose.model('should_expose_version_model', testSchema);

      expect(Test.VersionedModel).to.be.ok;
    });
  });

  it('should save a version model when saving origin model', function(done) {
    var testSchema = new Schema({ name: String });
    testSchema.plugin(version, { collection: 'should_save_version_of_origin_model_versions' });

    var Test = mongoose.model('should_save_version_of_origin_model', testSchema);

    var test = new Test({ name: 'franz' });
    test.save(function(err) {
      expect(err).to.not.exist;

      Test.VersionedModel.find({ refId: test._id, refVersion: test.__v }, function(err, versionedModel) {
        expect(err).to.not.exist;
        expect(versionedModel).to.be.ok;

        done();
      });
    });
  });

  it('should save a version model when saving origin model twice', function(done) {
    var testSchema = new Schema({ name: String });
    testSchema.plugin(version, { collection: 'should_save_version_of_origin_model_versions_twice' });

    var Test = mongoose.model('should_save_version_of_origin_model_twice', testSchema);

    var test = new Test({ name: 'franz' });
    test.save(function(err) {
      expect(err).to.not.exist;

      test.name = 'hugo';

      test.save(function(err) {
        expect(err).to.not.exist;

        Test.VersionedModel.findOne({
          refId: test._id,
          versions: { $elemMatch: { refVersion: test.__v } }
        }, function(err, versionedModel) {
          expect(err).to.not.exist;
          expect(versionedModel).to.be.ok;

          done();
        });
      });
    });
  });

  it('should accept options as string', function() {
    var testSchema = new Schema({ name: String });
    testSchema.plugin(version, 'should_accept_string');

    var Test = mongoose.model('should_accept_string_origin_model', testSchema);

    expect(Test.VersionedModel.collection.name).to.equal('should_accept_string');
  });

  it('should throw for unknown strategies', function() {
    var testSchema = new Schema({ name: String });

    expect(function() {
      testSchema.plugin(version, { strategy: 'hugo' });
    }).to.throw(Error);
  });

  it('should save a version model in an array when using "array" strategy', function(done) {
    var testSchema = new Schema({ name: String });
    testSchema.plugin(version, { strategy: 'array', collection: 'should_save_version_in_array' });

    var Test = mongoose.model('should_save_version_in_array_origin_model', testSchema);

    var test = new Test({ name: 'franz' });
    test.save(function(err) {
      expect(err).to.not.exist;

      Test.VersionedModel.findOne({ refId: test._id }, function(err, versionedModel) {
        expect(err).to.not.exist;
        expect(versionedModel).to.be.ok;

        expect(versionedModel.versions.length).to.equal(1);

        done();
      });
    });
  });

  it('should save a version model in a collection when using "collection" strategy', function(done) {
    var testSchema = new Schema({ name: String, desc: String });
    testSchema.plugin(version, { strategy: 'collection', collection: 'should_save_version_in_collection' });

    var Test = mongoose.model('should_save_version_in_collection_origin_model', testSchema);

    var test = new Test({ name: 'franz' });
    test.save(function(err) {
      expect(err).to.not.exist;

      Test.VersionedModel.find({ refId: test._id }, function(err, versionedModels) {
        expect(err).to.not.exist;
        expect(versionedModels).to.be.ok;

        expect(versionedModels.length).to.equal(1);

        test.desc = 'A lunar crater';
        test.save(function(err) {
          expect(err).to.not.exist;

          Test.VersionedModel.find({ refId: test._id }, function(err, versionedModels) {
            expect(err).to.not.exist;
            expect(versionedModels).to.be.ok;

            expect(versionedModels.length).to.equal(2);

            // One of them should have the new property
            expect(versionedModels.filter(function(m) {
              return m.desc == 'A lunar crater'
            }).length).to.equal(1);

            done();
          });
        });
      });
    });
  });

  it('should keep maxVersions of version model in an array when using "array" strategy', function(done) {
    var testSchema = new Schema({ name: String });
    testSchema.plugin(version, { strategy: 'array', maxVersions: 1, collection: 'should_keep_only_max_versions' });

    var Test = mongoose.model('should_keep_only_max_versions_origin_model', testSchema);

    var test = new Test({ name: 'franz' });

    // Save one generates a version
    test.save(function(err) {
      expect(err).to.not.exist;

      test.name = 'hugo';

      // Save two generates a version
      test.save(function(err) {
        expect(err).to.not.exist;

        Test.VersionedModel.findOne({ refId: test._id }, function(err, versionedModel) {
          expect(err).to.not.exist;
          expect(versionedModel).to.be.ok;

          // expected versions in array: 1
          expect(versionedModel.versions.length).to.equal(1);

          done();
        });
      });
    });
  });

  it('should save documentProperty as well as update and create dates', function(done) {
    var testSchema = new Schema({ name: String });
    testSchema.plugin(version, {
      strategy: 'array',
      documentProperty: 'name',
      collection: 'should_save_document_identifier_and_dates'
    });

    var Test = mongoose.model('should_save_document_identifier_and_dates_model', testSchema);

    var test = new Test({ name: 'franz' });
    test.save(function(err) {
      expect(err).to.not.exist;

      Test.VersionedModel.findOne({ refId: test._id }, function(err, versionedModel) {
        expect(versionedModel.created).to.be.ok;
        expect(versionedModel.modified).to.be.ok;
        expect(versionedModel.name).to.equal('franz');

        done();
      });
    });
  });

  it('should save versions of different schemas in the same collection when dbCollection property is passed', function(done) {
    function AbstractPersonSchema() {
      Schema.apply(this, arguments);

      this.add({
        name: String
      })
    }

    util.inherits(AbstractPersonSchema, Schema);

    var personSchema = new AbstractPersonSchema();

    var Person = mongoose.model('Person', personSchema);

    var employeeSchema = new AbstractPersonSchema({employeeId: String});
    employeeSchema.plugin(version, { strategy: 'collection', model: 'Employee', dbCollection: 'people__versions' });

    var Employee = Person.discriminator('employee', employeeSchema, 'personType');

    var employee = new Employee({ name: 'John Smith', employeeId: 1 });

    var studentSchema = new AbstractPersonSchema({studentId: String});
    studentSchema.plugin(version, { strategy: 'collection', model: 'Student', dbCollection: 'people__versions' });

    var Student = Person.discriminator('student', studentSchema, 'personType');

    var student = new Student({ name: 'Amy Adams', studentId: 2 });

    employee.save(function(err) {
      expect(err).to.not.exist;

      Employee.VersionedModel.find({ }, function(err, versionedModels) {
        expect(err).to.not.exist;
        expect(versionedModels).to.be.ok;
        expect(versionedModels.length).to.equal(1);

        student.save(function(err) {
          expect(err).to.not.exist;
    
          Student.VersionedModel.find({ }, function(err, versionedModels) {
            expect(err).to.not.exist;
            expect(versionedModels).to.be.ok;
            expect(versionedModels.length).to.equal(2);
    
            done();
          });
        });
      });
    });
  });
});
