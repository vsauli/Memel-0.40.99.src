var fs = require('fs');
var path = require('path');
//var md2html = require('simple-md2html');
//var markdown = require('markdown').markdown;
var md = require('markdown-it')({
//    html: true,
//    linkify: true,
//    typographer: true,
    xhtmlOut: true
//    breaks: true
    });

var Task = require('./task');

var f_response = null;
var r_success = false;
var r_message = "";

module.exports = Fileops;

function Fileops(conf) {
    this.cmd = (conf) ? conf.cmd : '';
    this.MemelBase = (conf) ? conf.MemelBase : '';
    this.rootBase = (conf) ? conf.rootBase : '';
    this.dops = null;
}

Fileops.prototype.process = function process(params, res, dops) {

    this.dops = dops;
    if (this[params.cmd]) this[params.cmd](params, res);
    else res.end(this.enclose(params, '{success: false, error: "Cmd is not implemented", message: "Failed", results: 0, rows:[]}'));
//    return {success: false, error: 'Cmd is not implemented'};
}

Fileops.prototype.enclose = function enclose(params, str) {
    if (params.callback) return params.callback + "(" + str + ");";
    return str;
}

Fileops.prototype.res_end = function res_end(params, r, res) {
    res.end(this.enclose(params,JSON.stringify(r, null)));
}

Fileops.prototype.get = function get(params, res) {
    var p_path = params['path'];
    var that = this;
    if (p_path) p_path = p_path.replace(/root/, this.MemelBase + this.rootBase);
    var files = [];
    if (fs.existsSync(p_path)) {
	files = fs.readdirSync(p_path);
	}
//console.log(p_path);
    var result = [];
    var file = {};
    var stats;
    for (var i=0; i<files.length; i++) {
	stats = fs.statSync(p_path + '/' + files[i]);
	file = {};
	file.text = files[i];
	file.iconCls = "file-txt";
	var ext = files[i].split('.');
	var fext = (ext[1]) ? ext[ext.length-1] : ext[0];
	if (fext != '') file.iconCls = 'file-'+fext;
	if (stats.isDirectory()) file.iconCls = "folder";
	file.disabled = false;
	if (!stats.isDirectory()) file.leaf = true;
	file.qtip = "Size: " + stats.size;
	result.push(file);
    }
    that.res_end(params, result, res);
}

Fileops.prototype.readfile = function readfile(params, res) {
    var p_path = params['dir'];
    var that = this;
    if (p_path) p_path = p_path.replace(/root/, this.MemelBase + this.rootBase);
    var result = {};
    result.success = true;
    try {
	result.text = fs.readFileSync(p_path, {encoding: 'utf8'});
	}
    catch(ex) { result.text = ex.message; }
    result.ext = path.extname(p_path);
    that.res_end(params, result, res);

//    return JSON.stringify(result, null);
}

Fileops.prototype.savefile = function savefile(params, res) {
    var p_path = params['dir'];
    var that = this;
    if (p_path) p_path = p_path.replace(/root/, this.MemelBase + this.rootBase);
    var result = {};
    if (params.user == 'anonymous' || params.dbname == 'public') { 
	result.success = false; 
	result.message = "You are not allowed to modify content of this directory. \nPlease login or register to get to your personal workspace."; 
	result.error = result.message;
	that.res_end(params, result, res);
	return;
//	return JSON.stringify(result, null); 
	}
    result.success = true;
    this.dops.check_forged(params, function(r, allow) {
	if (!allow || ! r.success) {result.success = false; result.error = r.message; result.message = result.error; that.res_end(params, result, res); return;}
	var text = decodeURIComponent(params['text']);
	result.success = true;
	fs.writeFile(p_path, text, 'utf8', function(err) {
	    if (err) {result.message = err.message; result.error = err.message; result.success = false;}
	    that.res_end(params, result, res);
	    return;
	    });
	});
//    return JSON.stringify(result, null);
}

Fileops.prototype.runfile = function runfile(params, res) {
    var p_path = params['dir'];
    var agent = params['agent'];
    var cwda = p_path.split('/');
    cwda[cwda.length - 1] = '';
    var cwd = cwda.join('/');
    var that = this;
    if (p_path) p_path = p_path.replace(/root/, this.MemelBase + this.rootBase);
    var result = {};
    var text = decodeURIComponent(params['text']);
    result.success = true;
    t = new Task({taskName: params['dir'], cwd: cwd, userDir: 'workspaces/'+agent, src: text, web_nr: params['web_nr']});
    t.addToTasksList(t);
    t.launchTask();
    that.res_end(params, result, res);

//    return JSON.stringify(result, null);

}

Fileops.prototype.create = function create(params, res) {
    var p_path = params['dir'];
    var that = this;
    if (p_path) p_path = p_path.replace(/root/, this.MemelBase + this.rootBase);
    var stats = fs.existsSync(p_path);
    var result = {};
    result.success = true;
    if (params.user == 'anonymous' || params.dbname == 'public') { 
	result.success = false; 
	result.error = "You are not allowed to modify content of this directory. \nPlease login or register to get to your personal workspace."; 
	result.message = result.error;
	that.res_end(params, result, res);
	return;
//	return JSON.stringify(result, null); 
	}
    if (stats) { result.error = "File already exists!"; result.success = false; }
    else {
	this.dops.check_forged(params, function(r, allow) {
	    if (!allow || ! r.success) {result.success = false; result.error = r.message; result.message = result.error; that.res_end(params, result, res); return;}
	    var text = '';
	    result.success = true;
	    fs.writeFile(p_path, text, 'utf8', function(err) {
		if (err) {result.message = err.message; result.error = err.message; result.success = false;}
		that.res_end(params, result, res);
		});
	    });
	}
//    return JSON.stringify(result, null);

}

Fileops.prototype.newdir = function newdir(params, res) {

    var p_path = params['dir'];
    var that = this;
    if (p_path) p_path = p_path.replace(/root/, this.MemelBase + this.rootBase);
    var stats = fs.existsSync(p_path);
    var result = {};
    result.success = true;
    if (params.user == 'anonymous' || params.dbname == 'public') { 
	result.success = false; 
	result.error = "You are not allowed to modify content of this directory. \nPlease login or register to get to your personal workspace."; 
	result.message = result.error;
	that.res_end(params, result, res);
	return;
//	return JSON.stringify(result, null); 
	}
    if (stats) { result.error = "Directory already exists!"; result.message = result.error; result.success = false; that.res_end(params, result, res); return; }
    else {
	this.dops.check_forged(params, function(r, allow) {
	    if (!allow || ! r.success) {result.success = false; result.message = r.message; return;}
	    result.success = true;
	    fs.mkdir(p_path, 0o755, function(err) {
		if (err) {result.message = err.message; result.error = err.message; result.success = false; that.res_end(params, result, res); return; }
		that.res_end(params, result, res);
		});
	    });
	}
//    return JSON.stringify(result, null);

}

Fileops.prototype.rename = function rename(params, res) {

    var p_path_old = params['oldname'];
    var that = this;
    if (p_path_old) p_path_old = p_path_old.replace(/root/, this.MemelBase + this.rootBase);
    var p_path_new = params['newname'];
    if (p_path_new) p_path_new = p_path_new.replace(/root/, this.MemelBase + this.rootBase);
    var stats = fs.existsSync(p_path_new);
    var result = {};
    result.success = true;
    if (params.user == 'anonymous' || params.dbname == 'public') { 
	result.success = false; 
	result.message = "You are not allowed to modify content of this directory. \nPlease login or register to get to your personal workspace."; 
	result.error = result.message;
	that.res_end(params, result, res);

//	return JSON.stringify(result, null); 
	}
    if (stats) { result.error = "File/Directory already exists!"; result.message = result.error; result.success = false; that.res_end(params, result, res); return; }
    else {
	this.dops.check_forged(params, function(r, allow) {
	    if (!allow || ! r.success) {result.success = false; result.message = r.message; result.error = result.message; that.res_end(params, result, res); return;}
	    result.success = true;
	    fs.rename(p_path_old, p_path_new, function(err) {
		if (err) {result.message = err.message; result.error = err.message; result.success = false; that.res_end(params, result, res); return;}
		that.res_end(params, result, res);
		});
	    });
	}
//    return JSON.stringify(result, null);

}

Fileops.prototype.getinfo = function getinfo(params, res) {
    var p_path = this.MemelBase + 'memel.md';
    var that = this;
    var result = {};
    result.success = true;
    fs.readFile(p_path, {encoding: 'utf8'}, function(err, text) {
	if (err) {result.message = err.message; result.error = err.message; result.success = false; that.res_end(params, result, res); return;}
	result.text = md.render(text);
	that.res_end(params, result, res);
//	md2html(p_path, 'monokai', function(err, html) {
//	    if (err) {result.message = err.message; result.error = err.message; result.success = false; that.res_end(params, result, res); return;}
//	    result.text = html;
//	    that.res_end(params, result, res);
//	    });
	});

}
