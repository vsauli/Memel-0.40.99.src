var comment = 
"This is a very experimental code. \
It implements an OPU (Object Processing Unit) \
which is a part of Parallel Javascript Machine \
(aka Memel OS 1) \
\
This comment also saves few bytes and 9 tree nodes \
when parsed to AST \
\
Comments, by the way,  play a _significant_ role in this project";
delete comment;

var __net = require('net');
var fs = require("fs");
var __netlink = require('netlinkwrapper');

var __job = {};
var __request = {};
var __queueId = "0";
var __taskNum = '000000';

global.__opuNr = -1;

global.__set_Par_Var_Value = __set_Par_Var_Value;
global.__get_Par_Var_Value = __get_Par_Var_Value;

global.__oldLog = console.log;
global.__oldError = console.error;
global.console = (function(){
    console.log = function (message) {
	if (typeof message == "Object") message = JSON.stringify(message);
	if (!__client.desroyed) __client.write(JSON.stringify({command: 'log', type:1, tasknum: __taskNum, message:message}));
	__oldLog.apply(console, arguments);
	};
    console.error = function (message) {
	if (typeof message == "Object") message = JSON.stringify(message);
	if (!__client.desroyed) __client.write(JSON.stringify({command: 'log', type:2, tasknum: __taskNum, message:message}));
	__oldError.apply(console, arguments);
	};
})();

global.__read_File_Sync = __read_File_Sync;

global.__old_fs = fs;

delete fs['readFileSync'];
delete fs['writeFileSync'];
delete fs['appendFileSync'];
delete fs['readFile'];
delete fs['writeFile'];
delete fs['appendFile'];
delete fs['read'];
delete fs['readlink'];
delete fs['write'];
delete fs['readSync'];
delete fs['readlinkSync'];
delete fs['writeSync'];
delete fs['open'];
delete fs['openSync'];
delete fs['close'];
delete fs['closeSync'];
delete fs['createReadStream'];
delete fs['createWriteStream'];
delete fs['chmod'];
delete fs['chmodSync'];
delete fs['chown'];
delete fs['chownSync'];
delete fs['lchmod'];
delete fs['lchmodSync'];
delete fs['lchown'];
delete fs['lchownSync'];
delete fs['fchmod'];
delete fs['fchmodSync'];
delete fs['fchown'];
delete fs['fchownSync'];
delete fs['copyFile'];
delete fs['copyFileSync'];
delete fs['truncate'];
delete fs['truncateSync'];
delete fs['ftruncate'];
delete fs['ftruncateSync'];
delete fs['link'];
delete fs['linkSync'];
delete fs['mkdir'];
delete fs['mkdirSync'];
delete fs['mkdtemp'];
delete fs['mkdtempSync'];
delete fs['realpath'];
delete fs['realpathSync'];
delete fs['rename'];
delete fs['renameSync'];
delete fs['rmdir'];
delete fs['rmdirSync'];
delete fs['symlink'];
delete fs['symlinkSync'];
delete fs['unlink'];
delete fs['unlinkSync'];
//!!!
if (fs['promises']) delete fs['promises'];

fs.readFileSync = function(path, blocking) {
    return __read_File_Sync(path, blocking, __job);
    };
fs.writeFileSync = function(path, data, options) {
    return __write_File_Sync(path, data, options, false, __job);
    };
fs.appendFileSync = function(path, data, options) {
    return __write_File_Sync(path, data, options, true, __job);
    };

module.exports = fs;
global.fs = fs;

global.__serverAddress = process.argv[2] || '31.208.198.171';
global.__serverPort = 1*process.argv[3] || 8889;
global.__serverPortSync = 1*process.argv[4] || 8887;
global.__iamIdle = false;

global.__si = null;

global.__cached = [];
global.__nextjob;

global.__dom_buffer_size = 8;
global.__dom_buufer_pos = 0;
global.__dom_buffer = [];
global.__remote_dom = true;

global.__remoteDOM = function(dom) {
    if (!__remote_dom) return;
    if (dom != "#flush") __dom_buffer[__dom_buffer_pos++] = dom;
    if (__dom_buffer_pos == __dom_buffer_size || dom == "#flush") {
	__dom_buffer_pos = 0;
	if (!__client.desroyed) __client.write(JSON.stringify({command: 'remotedom', tasknum: __taskNum, message: __dom_buffer}));
	else __oldLog("OPU remoteDOM error - connection to server is lost");
	}
};

global.__sock = new __netlink();
var __client = new __net.Socket();

process.on('warning', function(warning) {
    console.log(warning.name);
    console.log(warning.message);
    console.log(warning.stack);
    });

//function __watchdog() {
//    console.log("Watchdog is watching!");
//    }

// var __wd = setInterval(__watchdog, 10000);


function __clearcache() {
    for (var i in global.cached) {
	delete global.cached[i];
	}
    }

var __sic = setInterval(__clearcache, 3600000);

function __connsync() {
    try {
	__sock.connect(__serverPortSync, __serverAddress);
	__oldLog('Sync socket connected');
	if (__si!=null) { clearInterval(__si); __si=null }
	}
    catch (e) { if (__si==null) __si = setInterval(__connsync, 1000); }
}

function __conn() {
    __client.connect({port: __serverPort, host: __serverAddress});
    __connsync();
}

var __completeData = '';
process.on('exit', function() {
    __client.write(JSON.stringify({opu_nr: __opuNr, id: '0', command: 'goneaway'}));
});

function __sighandle(signal) {
    process.exit(100);
}

process.on('SIGINT', __sighandle);
process.on('SIGTERM', __sighandle);
process.on('SIGHUP', __sighandle);

__conn();

__client.on('connect', function() {
    __client.setNoDelay(true);
    __client.write(JSON.stringify({'id':'0', 'command':'hello', 'message': 'OPU,'+__client.remoteAddress+':'+__client.remotePort+','+process.pid}));
});

__client.on('close', function(had_error) {
//    if (had_error) oldLog('Connection error. Connection closed');
//    else oldLog('Connection closed');
    setTimeout(__conn, 1000);
    });

__client.on('error', function(err) {
//    oldLog('Connection error: '+ JSON.stringify(err));
    });

__client.on('data', function(data) {

__completeData += data;
var __jsons = __completeData.toString().split('}{'); 
var __json = '';
for (var __js=0; __js<__jsons.length; __js++) {
    __json = __jsons[__js];
    if (__js!=0) __json = '{' + __json;
    if (__js!=__jsons.length-1) __json = __json + '}';

    try { 
	__job = JSON.parse(__json, null);
	__completeData = '';
	} catch(err) {
	if (new RegExp("JSON").test(err)) {
	    __completeData = __json;
	    }
	else __oldLog("ERROR: "+err);
	return; 
	}
	
    __taskNum = (__job.data)?__job.data.taskNum:0;
    switch(__job.command) {
	case 'log':
	    __oldLog.apply(console, job.message);
	    break;
	case 'process':
	    __iamIdle = false;
	    __job.fs = fs;
	    __job.socket = __sock;
	    __job.opu_nr = __opuNr;
	    __nextjob = processJob(__job);
//	    delete __nextjob.socket;
	    __client.write(JSON.stringify(__nextjob));
	    break;
	case 'regetjob':
	    __iamIdle = false;
	    for (var __zz=1; __zz<10000; zz++) {}
	    __nextjob.id = _job.id; // id may be changed to '0' after initial 'getjob'
	    __client.write(JSON.stringify(__nextjob));
	    break;
	case 'helloack':
	    __iamIdle = false;
	    __opuNr = __job.opu_nr;
	    console.log("OPU #" + __opuNr + " started");
	    __client.write(JSON.stringify({opu_nr: __opuNr, id: __queueId, command: 'getjob'}));
	    break;
	case 'idle':
	    __iamIdle = true;
	    break;
	case 'wakeup':
	    __opuNr = __job.opu_nr;
	    if (!__iamIdle) __oldLog("OPU #" + __opuNr + " is not idle!");
	    else {
		__iamIdle = false;
		__client.write(JSON.stringify({opu_nr: __opuNr, id: '0', command: 'getjob'}));
		}
	    break;
	case 'disable':
	    // disable this OPU
	    break;
	case 'enable':
	    // enable this OPU
	    break;
	case 'kill':
	    process.exit(2);
	    break;
	default:
	    console.error('OPU: '+__opuNr+' error: Unrecognized command: '+__job.command);
	}
    }
});

function processJob(__job) {

    var __fbody = '';
    var __vars = '';
    var __afterVars = '';
    var __val = '';
    var __varName = '';
    
    __dom_buffer_pos = 0;
    if (!global.__cached[__taskNum]) global.__cached[__taskNum] = {};
    for (var  __v in __job.data.vars) {
	__val =  __job.data.vars[__v].value;
	__varName = __job.data.vars[__v].name;
	if (__varName === 'console') continue;
	if (__job.data.vars[__v].const == true) {
	    __vars += __varName + '=' + JSON.stringify(__val) + ';\n';
	    continue;
	    }
	if (__job.data.vars[__v].cached) {
	    if (!global.__cached[__taskNum][__varName])
		global.__cached[__taskNum][__varName] = __get_Cached_Var_Value(__varName, __job);
//	    __val = global.__cached[__taskNum][__varName];
	    var __glc = 'global.__cached['+__taskNum+']["'+__varName+'"];\n';
	    __vars += 'var ' + __varName + '=' + __glc;
	    continue;
	    }
	if (__job.data.vars[__v].parvar)
	    __vars += 'var ' + __varName + ';\n';
	else __vars += 'var ' + __varName + '=' + JSON.stringify(__val) + ';\n';

	if (!__job.data.vars[__v].parvar && !__job.data.vars[__v].cached && __job.data.vars[__v].setvars)
	    __afterVars = __afterVars + "__job.data.vars['"+__v+"'].value=" + __v + ";\n";
	}

    __fbody = __vars +';' + __job.data.precode + ';\n' + __job.data.code + ';';
    __fbody = __fbody + __afterVars + 'return;\n' + __job.data.funcs;

// fs.writeFileSync("opu.log"+__job.id+"-"+__job.opu_nr, __fbody);
// fs.writeFileSync("opu.log"+__job.id+"-"+__job.opu_nr, __job.data.precode + ';\n' + __job.data.code);
// fs.appendFileSync("opu.log"+__job.id+"-"+__job.opu_nr, JSON.stringify(__job.data.vars['k']));

    try {
	var __ret = (new Function('__job', __fbody))(__job);
    } catch(__ex) { 
	console.error("Task: " + __job.data.taskNum + ": Error executing job: " + __ex); 
	if (new RegExp("JSON").test(__ex)) {
	    __client.write(JSON.stringify({command: 'releasejob', id: __job.id}));
	    }
	else process.exit(1);
	}

    if (__dom_buffer_pos != 0) __remoteDOM("#flush");
    __job.command = 'getjob';
    delete __job.data.funcs;
    delete __job.data.code;
    return __job;

}

/*
function __get_Par_Var_Value(pvar, lock, __job) {

    var pval = null;
    var undef_cnt = 0;
    var response = null;

    while(true) {
	var snd = __job.socket.write(JSON.stringify({pvar: pvar, lock: lock, command: 'getvar', tasknum: __job.data.taskNum, opu_nr: __job.opu_nr}));
        __job.socket.blocking(true);

	var chunk = '';
	var res = '';
	var last = '';
	undef_cnt = 0;
	var ex = false;
	var block = true;
	while (true) {
	    chunk = __job.socket.read(1024, block);
	    block = true;
	    if (chunk != undefined && chunk.length != 0) { 
		res += chunk.toString(); 
		if (chunk.toString()!=null) last = chunk.toString().length;
		else last = 0;
		}
	    else if (chunk == undefined) ex = true;; // in case file length is multiply of 1024
	    if (chunk && chunk.length < 65536) ex = true;
	    if (ex) {
		try {
		    response = JSON.parse(res.toString());
		    break;
		    }
		catch(e) {
//		    __oldLog("Garbage received. pvar = "+pvar);
//		    __oldLog(res);
//		    __oldLog(res.length);
//		    __oldLog("last index: "+res.lastIndexOf("{"));
//		    process.exit(2);
		    response = null;
		    ex = false;
		    }
		}
	    }

    	if (response && (response.locked == lock || !lock)) break;
    	for (var i=0; i<500000; i++) {}
	}

//    __client.write(JSON.stringify({opu_nr: __opuNr, id: '0', command: 'ping'}));

    return response.pval;
}
*/

function __get_Par_Var_Value(pvar, lock, __job) {

    var pval = null;
    var undef_cnt = 0;

// Random small delay
//var __st = new Date().getTime(), __nd = Math.floor(Math.random()*100)+Math.floor(__st/15000000000);
//for (var __ii = 1; __ii<=__nd; __ii++) __ms = Math.random()*50;
//while (new Date().getTime() - __st < __ms);

    while(true) {
	var snd = __job.socket.write(JSON.stringify({pvar: pvar, lock: lock, command: 'getvar', tasknum: __job.data.taskNum, opu_nr: __job.opu_nr}));
	__job.socket.blocking(true);

	var chunk = '';
	var res = '';
	var last = '';
	undef_cnt = 0;
	while (true) {
	    chunk = '';
	    chunk = __job.socket.read(10240, true);
	    if (chunk != undefined && chunk.length != 0) { res += chunk.toString(); last = chunk.toString().length;}
	    else if (chunk == undefined && last == 10240) break; // in case file length is multiply of 1024
	    if (!chunk || chunk == undefined || chunk.toString().length == 0) undef_cnt++;
	    if (undef_cnt > 100) break;
    	    for (var i=0; i<10000; i++) {}
	    if (chunk && chunk.length < 10240) break;
	    }

	try {
	    var response = JSON.parse(res.toString());
	    break;
	    }
	catch(e) { chunk = ""; response = null; }

    	if (response && response.pval && (response.locked == lock || !lock)) break;
//console.log("reread " + pvar);
	undef_cnt = 0;
	__job.socket.blocking(false);
    	while (undef_cnt < 100) {
	    chunk = __job.socket.read(1024, false);
    	    undef_cnt++;
    	    }
    	for (var i=0; i<50000; i++) {}
	}
    return response.pval;
}

function __set_Par_Var_Value(pvar, pval, __job, force, slice_start) {

    var undef_cnt = 0;
    var response;

    force = force || false;
    if (slice_start == undefined) slice_start = -1;  // position to save array from
    while(true) {
	__job.socket.blocking(true);
	var snd = __job.socket.write(JSON.stringify({pvar: pvar, pval: pval, command: 'setvar', force: force, slice_start: slice_start, tasknum: __job.data.taskNum, opu_nr: __job.opu_nr}));
	var chunk = '';
	var res = '';
	var last = '';
	var f_exit = false;
	undef_cnt = 0;
	while (true) {
	    chunk = __job.socket.read(1024);
	    if (chunk != undefined && chunk.length != 0) { res += chunk.toString(); last = chunk.toString().length;}
	    else if (chunk == undefined && last == 1024) break; // in case response length is multiply of 1024
	    if (!chunk || chunk == undefined) undef_cnt++;
	    if (undef_cnt > 100) break;
	    for (var i=0; i<50000; i++) {}
	    if (chunk && chunk.length < 1024) break;
	    }
	if (undef_cnt > 100) {
	    console.log("after 100 undefineds res.length= " + res.length);
	    break;
	    }
	try {
	    response = JSON.parse(res.toString());
	    }
	catch(e) { response = null; }   // crutch
    	if (response && response.locked == false) break;
//console.log("re-set " + pvar);
	undef_cnt = 0;
	__job.socket.blocking(false);
    	while (undef_cnt < 100) {
	    chunk = __job.socket.read(1024, false);
    	    undef_cnt++;
    	    }
	for (var i=0; i<50000; i++) {}
	}

    return true;
}

function __read_File_Sync(path, blocking, __job) {

    var snd = __job.socket.write(JSON.stringify({command: 'readfile', 
	tasknum: __job.data.taskNum, opu_nr: __job.opu_nr, path: path, blocking: blocking}));

    __job.socket.blocking(true);

    var undef_cnt = 0;
    var chunk = '';
    var res = '';
    var last = '';
    while (true) {
	chunk = __job.socket.read(1024, true);
	if (chunk != undefined && chunk.length != 0) { res += chunk.toString(); last = chunk.toString().length;}
	else if (chunk == undefined && last == 1024) break; // in case file length is multiply of 1024
	for (var i=0; i<50000; i++) {}
	if (chunk && chunk.length < 1024) break;
	}

    if (undef_cnt > 100) {
        __oldLog("after 100 undefineds res.length= " + res.length);
	}

    if (new RegExp("Task #").test(res)) res = undefined;
    return res;
}

function __write_File_Sync(path, data, options, append, __job) {

	var snd;
	snd = __job.socket.write(JSON.stringify({command: 'writefile', data: data, options: options,
	    tasknum: __job.data.taskNum, opu_nr: __job.opu_nr, path: path, append: append}));
return;
	__job.socket.blocking(true);

        var undef_cnt = 0;
	var chunk = '';
	var res = '';
	var last = '';
	undef_cnt = 0;
	while (true) {
	    chunk = __job.socket.read(1024, true);
	    if (chunk != undefined && chunk.length != 0) { res += chunk.toString(); last = chunk.toString().length;}
	    else if (chunk == undefined && last == 1024) break; // in case file length is multiply of 1024
	    if (chunk == undefined) undef_cnt++;
	    if (undef_cnt > 100) {
		__oldLog("after 100 undefineds res.length= " + res.length);
		break;
		}
	    for (var i=0; i<50000; i++) {}
	    if (chunk && chunk.length < 1024) break;
	    }

    if (new RegExp("Task #").test(res)) res = undefined;
    return res;
}

function __get_Cached_Var_Value(cvar, __job) {

// Random small delay
var __st = new Date().getTime(), __nd = Math.floor(Math.random()*100)+Math.floor(__st/15000000000);
for (var __ii = 1; __ii<=__nd; __ii++) __ms = Math.random()*1000;
while (new Date().getTime() - __st < __ms);

	var snd = __job.socket.write(JSON.stringify({cvar: cvar, command: 'getcachedvar', tasknum: __job.data.taskNum, opu_nr: __job.opu_nr}));
	__job.socket.blocking(false);


	var chunk = '';
	var res = '';
	var last = 0;
	while (true) {
	    chunk = __job.socket.read(1024, false);
	    if (chunk != undefined && chunk.length != 0) { 
		res += chunk.toString(); 
		if (chunk.toString() != null) last = chunk.toString().length;
		else last = 0;
		}
	    else if (chunk == undefined && last == 1024) break; // in respose length is a multiply of 1024
	    for (var i=0; i<5000; i++) {}
	    if (chunk && chunk != null && chunk.length < 1024) break;
	    }

	try {
	    var rs = JSON.parse(res);
	    } 
	catch(ee) { rs = null; } 

	
    if (rs && rs.cval == null) return undefined;
    if (rs) return rs.cval;
    return undefined;

}



