#! /usr/local/bin/node

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert')
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/control';

var findRestaurants = function(db, callback) {
    var cursor = db.collection('news').find( { } );
    cursor.each(function(err, doc) {
        assert.equal(err, null);
        if (doc != null) {
          console.dir(doc);
        } else {
          callback();
        }
    });
};

MongoClient.connect(url, function(err, db) {
    if (err) {console.log('Connection error'); return;}
    db.collection('news').count(function(err, count) {
	if (err) {db.close(); return;}
	var cursor = db.collection('news').find( { } );
	if (!cursor) {db.close(); return;}
	cursor.each(function(err, doc) {
	    if (err) {db.close(); return;}
    	    if (doc != null) {
        	console.dir(doc);
    	    } else {
        	db.close();
	    }
        });
    });
});


791
130
156
7
580
965
