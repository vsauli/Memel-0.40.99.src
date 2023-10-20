#!/usr/local/bin/node
// Uncomment previous line to run Node interpreter automagically
///////////////////////////////////////////////////////////////////////////////
//
// This is a solution to exam task provided by X-Team.
//
// Author: Vladas Saulis
// Date: 03/16/2017
//
// Notes to the program:
//
// - It's a common practice to put all functions to the external file/module,
//   but it was decided to keep everything in one file, beacause the program
//   is relatively small and it is some faster to load and execute.
//
// - The program doesn't use OOP and is just a set of inter-operating functions 
//   written in old-school style.
//
// - The program requires 'fs' and 'path' modules, which usually are internal 
//   in the latest NodeJS releases.
//
// - The printing of results (printTags) takes into account the maximum length 
//   of tag names. This was not clearly explained in the exam task requirements.
//
// - Tags may also be given as a separate argument for each tag. This extends 
//   a proposed task functionality.
//

var path = require('path');
var fs = require('fs');

var tags = {};
var tagsArr = [];
var tagsStr = '';
var cache = {};

var i = 2;
if (process.argv[2]) {
    i = 0;
    tagsArr = process.argv[2].split(',');
    if (tagsArr.length > 1) {
	for (var j in tagsArr) {tags[tagsArr[j]] = 0;}
    }
    // If the first argument doesn't contain commas, assume that each tag 
    // goes as a separate argument.
    else {
	i = 2;
	while (process.argv[i]) {
	    tags[process.argv[i++]] = 0;
	}
    }
}

if (i === 2) { // If no arguments are given
    fs.readFile(path.join(process.cwd(), 'tags.txt'), function(err, file) {
	if (err) {
	    console.error(err+'\n');
	    console.log('Failed to read "tags.txt" file. No tags specified. Nothing to do.\n');
	    process.exit(1);
	}
	var tagsArr = file.toString().replace(/\n$/,'').replace(/\r/g,'').split('\n');
	if (tagsArr.length === 0) {
	    console.log('No tags specified. Nothing to do.\n');
	    process.exit(1);
	}
	for (var j in tagsArr) {tags[tagsArr[j]] = 0;}
	lookupCache();
    });
}
else {
    lookupCache();
}

function lookupCache() {

    var tagsArr = [];
    cache = {};
    for (var tag in tags) { tagsArr.push(tag); }
    tagsArr.sort();
    tagsStr = tagsArr.join(':'); // cache key

    fs.readFile(path.join(process.cwd(), 'tags.cache'), function(err, file) {
	if (err) { countTags(); }
	else {
	    try { cache = JSON.parse(file); }
	    catch(e) { countTags(); }
	    if (cache[tagsStr] !== undefined) {
		tags = cache[tagsStr];
		printTags();
	    }
	    else { countTags(); }
	}
    });
}

function countTags() {

    var tagDB = [];
    var k = 0; // Number of pending callbacks
    
    fs.readdir(path.join(process.cwd(), 'data'), function(err, files) {
	if (err) { console.error("Error accessing data directory" + err); process.exit(1); }
	for (var i=0, j=0; i<files.length; i++) {
	    var currentFile = files[i];
	    if (path.extname(files[i]) !== '.json') continue;
	    if (files[i].substring(0,1) === '.') continue; // Do not process hidden files
	    j++;
	    k++;
	    fs.readFile(path.join(process.cwd(), 'data', files[i]), function(err, file) {
		k--; // Decrease a number of pending callbacks
		var parsedfile;
		if (err) { console.error("Error reading " + currentFile + " file: "+err+"\n"); }
		else {
		    try { 
			parsedfile = JSON.parse(file);
			tagDB.push(parsedfile);
		    } catch(e) { console.error("Invalid json file: " + currentFile + " : " + e + "\n");}
		}
		// When all files are processed
		if (k === 0) { traverseDB(tagDB); writeCache(); printTags(); }
	    });
	}
	if (j === 0) { console.error("No json files were found in the data directory.\n"); process.exit(1); }
    });
}

function traverseDB(DB) {

    if (toString.apply(DB) === '[object Array]') {
	for (var elem in DB) {
	    parseObject(DB[elem]);
	}
    } else parseObject(DB); // Single object may not be enclosed into array
}

function parseObject(obj) {

    for (var prop in obj) {
	var o = obj[prop];
	if (prop == 'tags') {
	    if (typeof o === 'object') {
	        for (var tag in o) {
		    if (tags[o[tag]] !== undefined) tags[o[tag]]++;
		}
	    }
	    else if (o) { // tags may also be set as a single literal
		if (tags[o] !== undefined) tags[o]++;
	    }
	}
	else if (typeof o === 'object') {
	    traverseDB(o); // recurse
	}
    }
}

function writeCache() {

    cache[tagsStr] = tags;
    fs.writeFile(path.join(process.cwd(), 'tags.cache'), JSON.stringify(cache), 'utf8', function(err) {
	if (err) { console.error('Cannot save tags.cache file: ' + err); }
    });
}

function printTags() {

    var maxlen = 0;
    var spaces = "                                      ";
    var spacecnt;

    tagsArr = [];
    for (var tag in tags) {
	tagsArr.push({"name": tag, "count": tags[tag]});
	if (tag.length > maxlen) maxlen = tag.length;
    }
    if (maxlen < 8) maxlen = 8;

    tagsArr.sort(function(a,b){ return b.count - a.count});

    console.log('```');
    for (var i=0; i<tagsArr.length; i++) {
	spacecnt = maxlen - tagsArr[i].name.length + 1;
	console.log(tagsArr[i].name + spaces.substring(0, spacecnt), tagsArr[i].count);
    }
    console.log('```');

}
