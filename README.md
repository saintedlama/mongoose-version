# Passport-Local Mongoose
Mongoose plugin to save document data versions. Documents are saved to a "versioned" document collection before saving
original documents and kept for later use.

## Installation

    $ npm install mongoose-version

## Usage
To use mongoose-version for an existing mongoose schema you'll have to require and plugin mongoose-version into the 
existing schema.

The following schema definition defines a "Page" schema, and uses mongoose-version plugin with default options

    var mongoose = require('mongoose'),
        Schema = mongoose.Schema,
        version = require('mongoose-version');
    
    var Page = new Schema({
        title : { type : String, required : true},
        content : { type : String, required : true },
        path : { type : String, required : true},
        tags : [String],
    
        lastModified : Date,
        created : Date
    });
    
    Page.plugin(version);

Mongoose-version will define a schema that has a refId field pointing to the original model and a version array containing
cloned copies of the versioned model.

Mongoose-version will add a static field to Page, that is "VersionedModel" that can be used to access the versioned
model of page, for example for querying old versions of a document.

## Option keys and defaults
* collection: name of the collection to persist versions to. The default is 'versions'. You should supply this option if you're using mongoose-version on more than one schema.
* logError: specifies if a console.log message should be written when the versioned model could not be persisted. Default `false`
* suppressVersionIncrement: mongoose-version will not increment the version of the saved model before saving the model by default. To turn on auto version increment set this option to false. Default: `true`
* strategy: mongoose-version allows versioned document to be saved as multiple documents in a collection or in a single document in a version array. In case you want to save documents in an array specify `array` strategy, for storing versioned documents in multiple documents specify `collection` strategy. Default `array`.
* maxVersions: Only valid for `array` strategy. Specifies how many historic versions of a document should be kept. Defaults to `Number.MAX_VALUE`.
* Options are passed to the newly created mongoose as settings, so you may use any [option supported by mongoose](http://mongoosejs.com/docs/guide.html#options) 

In case you only want to specify the collection name, you can pass a string instance to options that is taken as collection name.

# Changelog
* 0.2.0 Make `array` the default strategy and set `suppressVersionIncrement` default to true