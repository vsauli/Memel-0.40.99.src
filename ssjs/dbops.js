var fs = require('fs');
var execFile = require('child_process').execFile;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/control';

module.exports = DBops;

function DBops(conf) {
    this.mod = (conf) ? conf.mod : '';
    this.MemelBase = (conf) ? conf.MemelBase : '';
    this.rootBase = (conf) ? conf.rootBase : '';
//    this.result = {success: false, message: "Failed", results: 0, rows:[]};
}

DBops.prototype.process = function process(params, res) {
    if (this[params.mod]) this[params.mod](params, res);
    else res.end(this.enclose(params, '{success: false, message: "Failed", results: 0, rows:[]}'));
}

DBops.prototype.enclose = function enclose(params, str) {
    if (params.callback) return params.callback + "(" + str + ");";
    return str;
}

DBops.prototype.res_end = function res_end(params, r, res) {
    res.end(this.enclose(params,JSON.stringify(r, null)));
}

DBops.prototype.get_table = function get_table(params, res) {
    
    var r = {success: false, message: '', results: 0, rows: []};
    var that = this;
    MongoClient.connect(url, function(err, db) {
	if (err) {r.message = "Connect failed"; that.res_end(params, r, res);return;}
	db.collection(params.table).count(function(err, count) {
	    if (err) {db.close(); r.message = "Count failed"; that.res_end(params, r, res);return;}
	    r.results = count;
	    var opts = {};
	    if (params.start) { opts.skip = params.start; }
	    if (params.limit) { opts.limit = params.limit; }
	    if (params.sort) {
		opts['hint'] = {};
		opts['hint'][params.sort] = (params.dir && params.dir == "DESC") ? -1 : 1;
	    }
	    var cursor = db.collection(params.table).find({}, opts);
	    if (!cursor) {db.close(); r.message = "Find failed"; that.res_end(params, r, res);return;}
	    cursor.each(function(err, doc) {
		if (err) {db.close(); r.message = "Each cursor failed"; that.res_end(params, r, res);return;}
    		if (doc != null) {
        	    r.rows.push(doc);
    		} else {
        	    db.close();
    		    r.success = true;
		    r.message = "";
		    that.res_end(params, r, res);
		}
    	    });
	});
    });
}

DBops.prototype.login = function login(params, res) {

    var r = {success: false, message: '', modules:[], results: 0};
    var that = this;
    var controlDb = null;
    MongoClient.connect(url, function(err, db) {
	if (err) {db.close(); r.message = "Connect failed"; that.res_end(params, r, res);return;}
	controlDb = db;
	db.collection('users').findOne({user: params.user}, {}, function(err, doc) {
	    if (err || !doc) {db.close(); r.message = "User does not exist."; that.res_end(params, r, res);return;}
	    if (doc.passwd != params.passwd) {db.close(); r.message = "The password is invalid"; that.res_end(params, r, res);return;}
	    if (doc.dis) {db.close(); r.message = "User has been disabled. Call system administrator."; that.res_end(params, r, res);return;}
	    db.collection('databases').findOne({dbname: doc.dbname}, {}, function(dberr, dbdoc) {
		if (dberr || !dbdoc) {db.close(); r.message = "Workspace is not registered."; that.res_end(params, r, res);return;}
		if (dbdoc.dis) {db.close(); r.message = "Your workspace is disabled. Call system administrator."; that.res_end(params, r, res);return;}
		var opts = {};
		opts['hint'] = {};
		opts['hint']['_id'] = 1;
		db.collection('modules').find({}, opts).toArray(function(err, mods) {
		    if (err) {db.close(); r.message = "Find modules failed"; that.res_end(params, r, res);return;}
//		    if (!mods || mods.length == 0) {db.close(); r.success = true; r.message = ""; that.res_end(params, r, res);return;}
		
		    r.cluster = dbdoc.cluster;
		    r.agent = dbdoc.dbname;
		    r.trial = dbdoc.trial;
		    r.logins = 1*dbdoc.logins+1;
    		    var expired = dbdoc.expire;
//    		    var exp = new Date();
//		    exp = new Date(exp.getTime() + 21*86400000).toISOString().split('T')[0];
//		    if (expired != "0") {
//			expired = (dbdoc.logins == 0)?exp:expired;
//			}
		    db.collection('setup').findAndModify(
			{_id: "webs"},
			[],
			{$inc: {seq: 1}},
			{w:1,
			new: true,
			upsert: true},
			function(err, doc) {
			if (err) {db.close(); r.message = "Control setup: " + err.message; that.res_end(params, r, res);return;}
			var websid = doc.value.seq;
			var seed = Math.round(Math.random() * 10000000000);
			var d = new Date();
			var tstamp = "" + d.getFullYear()
			    	+ (((d.getMonth()+1) < 10) ? "0": "") + (d.getMonth()+1) 
			    	+ ((d.getDate() < 10) ? "0": "") + d.getDate() 
			    	+ ((d.getHours() < 10) ? "0": "") + d.getHours() 
			    	+ ((d.getMinutes() < 10) ? "0": "") + d.getMinutes() 
			    	+ ((d.getSeconds() < 10) ? "0": "") + d.getSeconds();
			r.session = '' + websid + '.' + seed;
			db.collection('webs').insert({
			    _id: websid,
			    cby: params.user,
			    seed: seed,
			    ts: tstamp,
			    cts: tstamp}, {w:1}, function(err, doc) {
			    if (err) {db.close(); r.message = "webs: " + err.message; that.res_end(params, r, res);return;}
			    var t = new Date();
			    var ts = "" + t.getFullYear() + '-'
				    + (((t.getMonth()+1) < 10) ? "0": "") + (t.getMonth()+1) + '-'
				    + ((t.getDate() < 10) ? "0": "") + t.getDate();
			    db.collection('users').findOneAndUpdate(
				{user: params.user},
				{$inc: {logins: 1},$set:{last_login:ts}},
				{w:1},
				function(err, doc) {
				if (err) {db.close(); r.message = "users.logins: " + err.message; that.res_end(params, r, res);return;}
				db.collection('databases').findOneAndUpdate(
				    {dbname: r.agent},
				    {$inc: {logins: 1},$set:{last_login:ts, last_user:params.user, expire: expired}},
				    {w:1},
				    function(err, doc) {
				    if (err) {db.close(); r.message = "databases.logins: " + err.message; that.res_end(params, r, res);return;}
				    r.success = true;
				    r.user = params.user;
				    that.res_end(params, r, res);
				    db.close();
				    });
				});
			    });
			});
		    });
		});
	    });
	});
}

DBops.prototype.logout = function logout(params, res) {
    
    var root = params.root || 'rows';
    var r = {success: false, message: ''};
    var that = this;
    MongoClient.connect(url, function(err, db) {
	if (err) {db.close(); r.message = "Connect failed"; that.res_end(params, r, res);return;}
        var n_session;
	if (params.session) {
	    var t_session = params.session.split(".");
	    n_session = t_session[0]*1;
	    }
	else n_session = 100;
	db.collection('webs').remove({"_id":n_session}, {w:1}, function(err, doc) {
	    if (err) {db.close(); r.message = "Session remove failed"; that.res_end(params, r, res);return;}
	    db.close(); r.success = true; r.message = ""; that.res_end(params, r, res);return;
	    });
	});
},

DBops.prototype.dbname_check = function dbname_check(params, res) {

    var r = {success: false, dbname_ok: false, message: ''};
    var that = this;
    var pt = new RegExp("^system$");
    if (pt.test(params.dbname.toLowerCase())) {r.success = true; r.message = 'Forbidden name'; that.res_end(params, r, res); return;}
    pt = new RegExp("^sysadm$");
    if (pt.test(params.dbname.toLowerCase())) {r.success = true; r.message = 'Forbidden name'; that.res_end(params, r, res); return;}
    pt = new RegExp("^admin$");
    if (pt.test(params.dbname.toLowerCase())) {r.success = true; r.message = 'Forbidden name'; that.res_end(params, r, res); return;}
    pt = new RegExp("^owner$");
    if (pt.test(params.dbname.toLowerCase())) {r.success = true; r.message = 'Forbidden name'; that.res_end(params, r, res); return;}
    pt = new RegExp("^default$");
    if (pt.test(params.dbname.toLowerCase())) {r.success = true; r.message = 'Forbidden name'; that.res_end(params, r, res); return;}
    MongoClient.connect(url, function(err, db) {
	if (err) {db.close(); r.message = "Connect failed"; that.res_end(params, r, res);return;}
	db.collection('databases').findOne({dbname: params.dbname.toLowerCase()}, {hint: {"dbname":1}}, function(err, doc) {
	    if (err) {db.close(); r.message = err.message; that.res_end(params, r, res);return;}
	    if (!doc) r.dbname_ok = true;
	    r.success = true;
	    that.res_end(params, r, res);
	    db.close();
	    });
	});
}

DBops.prototype.user_check = function user_check(params, res) {

    var r = {success: false, user_ok: false, message: ''};
    var that = this;
    var pt = new RegExp("^system$");
    if (pt.test(params.user)) {r.success = true; r.message = 'Forbidden name'; that.res_end(params, r, res); return;}
    pt = new RegExp("^sysadm");
    if (pt.test(params.user)) {r.success = true; r.message = 'Forbidden name'; that.res_end(params, r, res); return;}
    pt = new RegExp("^admin$");
    if (pt.test(params.user)) {r.success = true; r.message = 'Forbidden name'; that.res_end(params, r, res); return;}
    pt = new RegExp("^owner$");
    if (pt.test(params.user)) {r.success = true; r.message = 'Forbidden name'; that.res_end(params, r, res); return;}
    pt = new RegExp("^vladas$");
    if (pt.test(params.user)) {r.success = true; r.message = 'Forbidden name'; that.res_end(params, r, res); return;}
    MongoClient.connect(url, function(err, db) {
	if (err) {db.close(); r.message = "Connect failed"; that.res_end(params, r, res);return;}
	db.collection('users').findOne({user: params.user}, {hint: {"user":1}}, function(err, doc) {
	    if (err) {db.close(); r.message = err.message; that.res_end(params, r, res);return;}
	    if (!doc) r.user_ok = true;
	    r.success = true;
	    that.res_end(params, r, res);
	    db.close();
	    });
	});
}

DBops.prototype.create_database = function create_database(params, res) {

    var r = {success: false, message: ''};
    var that = this;
    var controlDb = null;
    var cluster = 0;
    MongoClient.connect(url, function(err, db) {
	if (err) {db.close(); r.message = "Connection failed"; that.res_end(params, r, res);return;}
	controlDb = db;
	db.collection('users').findOne({user: params.user_name}, {}, function(err, doc) {
	    if (err) {db.close(); r.message = "User read error: " + err.message; that.res_end(params, r, res);return;}
	    if (doc) {db.close(); r.message = "User already in use"; that.res_end(params, r, res);return;}
	    db.collection('databases').findOne({dbname: params.dbname.toLowerCase()}, {}, function(dberr, dbdoc) {
		if (dberr) {db.close(); r.message = "Workspace read error: " + err.message; that.res_end(params, r, res);return;}
		if (dbdoc) {db.close(); r.message = "Workspace name already exists. Call system administrator."; that.res_end(params, r, res);return;}
		db.collection('users').insert(
		    {user:params.user_name,passwd:params.password,
		    dbname:params.dbname.toLowerCase(),dis:false,full_name:params.full_name,
		    superuser:true,can_disable:true,can_hide:true,can_create:true,
		    can_edit:true,can_delete:true,can_set_perm:true},
		    {w:1},
		    function(ierr, result) {
		    if (ierr) {db.close();db.close(); r.message = "User create error: " + err.message; that.res_end(params, r, res);return;}
		    var exp = new Date();
		    exp = new Date(exp.getTime() + 21*86400000).toISOString().split('T')[0];
		    var today = new Date().toISOString().split('T')[0];
		    var android = (params.android && params.android == '1')?1*params.android:0;
		    var ios = (params.ios && params.ios == '1')?1*params.ios:0;
		    db.collection('databases').insert(
			{dbname:params.dbname.toLowerCase(),e_mail:params.e_mail,
			dis:false,comp_name:params.comp_name,android:android,ios:ios,
			expire:exp,trial:true,logins:0,last_login:today,last_user:params.user_name},
			{w:1},
			function(ierr, result) {
			if (ierr) {db.close(); r.message = "User create error: " + err.message; that.res_end(params, r, res);return;}
			db.close();
			execFile('./clonedir', [params.dbname.toLowerCase()], function(err, out, code) {
			    if (err) {r.message = "Workspace clone error: " + err.message; that.res_end(params, r, res);return;}
			    var d = new Date().toISOString();
			    var wstr = d + ': new user: ' + params.user_name + ', workspace: ' + params.dbname + '\n' + '-------------------------------------\n\n';
			    fs.appendFile('memel.log', wstr, function(err) { return; });
			    r.success = true;
			    that.res_end(params, r, res);
			    });
			});
		    });
		});
	    });
	});
}

DBops.prototype.check_forged = function check_forged(params, cb) {

    var r = {message: '', success: false};
    var that = this;
    MongoClient.connect(url, function(err, db) {
	if (err) {db.close(); r.message = "Connect failed"; cb(r, false); return;}
	if (params.user == 'anonymous' && params.dbname == 'public') {db.close(); r.message = ""; r.success = true; cb(r, true); return;}
        var n_session;
	if (params.session) {
	    var t_session = params.session.split(".");
	    if (t_session.length < 2) {r.message = "Wrong session number: " + params.session; cb(r, false); return;}
	    n_session = t_session[0]*1;
	    }
	else n_session = 100;
	db.collection('webs').findOne({"_id":n_session}, {}, function(err, doc) {
	    if (err) {db.close(); r.message = "Session check failed"; cb(r, false); return;}
	    if (params.session) {
		if (!doc) {r.message = "Session not found"; cb(r, false); return;}
		if (doc.seed != t_session[1]) {r.message = "Incorrect session seed"; cb(r, false); return;}
		if (doc.cby != params.user) {r.message = "Incorrect session owner"; cb(r, false) ;return;}
		}
	    db.collection('users').findOne({user: params.user}, {}, function(err, doc) {
		if (err || !doc) {db.close(); r.message = "Attempt to forge username registered to the log."; cb(r, false);return;}
		if (doc.dbname != params.dbname.toLowerCase()) {db.close(); r.message = "Attempt to forge db name registered to the log."; cb(r, false); return;}
		r.success = true;
		cb(r, true);
		});
	    });
	});
}
