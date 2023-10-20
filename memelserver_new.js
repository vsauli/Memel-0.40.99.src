var express = require('express');
var bodyParser = require('body-parser');
var net = require('net');
var ws = require('nodejs-websocket');
var fs = require("fs");
var md = require('markdown-it')({
//    html: true,
//    linkify: true,
//    typographer: true,
    xhtmlOut: true
//    breaks: true
});

global.reply = {};
global.webClients = [];
global.opuClients = [];
global.idleList = [];
global.inWakeError = false;
global.fslock = false;

global.oldLog = console.log;
global.oldError = console.error;
global.console = (function(){
    console.log = function (message, eobj) {
	if (typeof message == "Object") message = JSON.stringify(message);
	for (var z=0; z<webClients.length; z++) {
	    if (!webClients[z].ready) continue;
	    if (eobj && eobj.tasknum != 0 && eobj.owner != webClients[z].owner) continue;
	    var soc = webClients[z].socket;
	    if (soc.readyState < 2) 
		try {
		    soc.sendText(JSON.stringify({'command':'msg', 'message': message}), null);
		} catch(err) {soc.sendText(JSON.stringify({'command':'msg', 'message': "System error: " + err})) };
	    }
	var l = arguments.length-1;
	if (arguments[l] && arguments[l].web_nr != undefined) {arguments[l] = '';}
	oldLog.apply(console, arguments);
	};
    console.error = function (message, eobj) {
	if (typeof message == "Object") message = JSON.stringify(message);
	for (var z=0; z<webClients.length; z++) {
	    if (!webClients[z].ready) continue;
	    if (eobj && eobj.tasknum != 0 && eobj.owner != webClients[z].owner) continue;
	    var soc = webClients[z].socket;
	    if (soc.readyState < 2) 
		try {
		    soc.sendText(JSON.stringify({'command':'msg', 'message': message}), null);
		} catch(err) {soc.sendText(JSON.stringify({'command':'msg', 'message': "System error: " + err})) };
	    }
	var l = arguments.length-1;
	if (arguments[l] && arguments[l].web_nr != undefined) arguments[l] = '';
	oldError.apply(console, arguments);
	};
})();

var Fileops = require('./ssjs/fileops');
var DBops = require('./ssjs/dbops');
var queue = require('./ssjs/queue')
var Task = require('./ssjs/task');
var Kernel = require('./ssjs/kernel.js');

var Q = new queue();
var initTask = new Task({taskName: 'init'});
initTask.get_glob().initTask = initTask;
initTask.get_glob().Queue = Q;

var app = express();

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var MemelBase = "/srv/www/cgi-bin/Memel/4.0/memelapp/";
var rootBase = "";

var fops = new Fileops({cmd:'', MemelBase: MemelBase, rootBase: rootBase});
var dops = new DBops({mod:'', MemelBase: MemelBase, rootBase: rootBase});

app.use('/cljs', express.static('cljs'));
app.use('/root', express.static('root'));
app.use('/workspaces', express.static('workspaces'));
app.use('/css', express.static('cljs/css'));
app.use('/resources', express.static('cljs/resources'));
app.use('/lists', express.static('cljs/tinymce/examples/lists'));
app.use('/templates', express.static('cljs/tinymce/examples/templates'));

app.get('/', function (req, res) {

    fs.readFile('memel.js', "binary", function(err, file) {
	if(err) {
    	    res.set({"Content-Type": "text/plain"});
    	    res.sendStatus(404);
    	    res.send(err + "\n");
    	    res.end();
    	    return;
    	    }
	eval(file);
	fs.readFile('memel.md', "binary", function(nerr, mdfile) {
	    if (nerr) {
		res.send(_code);
		res.end();
		return;
		}
	    var mdhtml = md.render(mdfile);
	    _code =_code.replace(/%%md%%/, mdhtml);
	    res.send(_code);
	    res.end();
	    });
	});
  });

app.get('/favicon.ico', function (req, res) {
    res.setHeader('Content-Type', 'text/plain');
    res.end();
});
  
app.post('/ssjs/fileops.js', urlencodedParser, function(req, res) {
    res.setHeader('Content-Type', 'text/plain');
    fops.process(req.body, res, dops);
});

app.get('/ssjs/dbops.js', function(req, res) {
    res.setHeader('Content-Type', 'text/plain');
    dops.process(req.query, res);
});

app.post('/ssjs/dbops.js', urlencodedParser, function(req, res) {
    res.setHeader('Content-Type', 'text/plain');
    dops.process(req.body, res);
});


var completeData = {};

var TCPserver = net.createServer(function(socket) {

    socket.setNoDelay(true);
    socket.setKeepAlive(true, 100000);
    socket.conn_id = require('crypto').createHash('sha1').update( 'vsaulis' + Date.now() + Math.random() ).digest('hex') ;
    if (!completeData[socket.conn_id]) completeData[socket.conn_id] = {};
    if (!completeData[socket.conn_id].data) completeData[socket.conn_id].data = '';

    socket.on('data', function(data) {
// sometimes several jsons come up with data...
	socket.pause();
	completeData[socket.conn_id].data += data;
	var jsons = completeData[socket.conn_id].data.toString().split('}{'); 
	var json = '';
	for (var js=0; js<jsons.length; js++) {
	    json = jsons[js];
	    if (js!=0) json = '{' + json;
	    if (js!=jsons.length-1) json = json + '}';
	    try { 
		reply = JSON.parse(json, null);
		completeData[socket.conn_id].data = '';
	    } catch(err) { 
		completeData[socket.conn_id].data = json;
		if (new RegExp(Kernel.escapeRegExp("{")).test(err)) console.log("Error while parsing OPU request: " + err);
		socket.resume();
		return;
		}
	    socket.resume();
	    switch (reply.command) {
		case 'hello':
		    var databody = reply.message.split(',');
		    var j=-1;
		    for (var i=0; i<opuClients.length; i++) {
			if (opuClients[i]!=undefined && !opuClients[i].active) {j=i;break;}
			if (opuClients[i]==undefined) {j=i;break;}
			}
		    var resp = {opu_nr: -1, 'id':'0', 'command': 'helloack'};
		    var ent = {opu_nr: -1, socket: socket, active: true, ehandler: false, address: databody[1], pid: databody[2]};
		    if (j != -1) {resp.opu_nr = j; ent.opu_nr = j; opuClients[j] = ent;}
		    else {resp.opu_nr = opuClients.length; ent.opu_nr = resp.opu_nr; opuClients[resp.opu_nr] = ent; }
		    socket.write(JSON.stringify(resp));
		    break;
		case 'goneaway':
		    if (opuClients[reply.opu_nr] != undefined) {
			opuClients[reply.opu_nr].active = false;
			delete completeData[socket.conn_id];
			console.log("OPU #"+reply.opu_nr+" has disconnected");
			}
		    break;
		case 'getjob':
		    var id = '0';
		    var glob = initTask.get_glob();
		    if (!opuClients[reply.opu_nr].active) break;
		    id = Kernel.extractor(Q, reply, glob, socket, Task.zeroedTaskNum);
		    if (id === '0' && opuClients[reply.opu_nr] && opuClients[reply.opu_nr].active) {
			// If no jobs, put current OPU to idle list
			inWakeError = true;
			socket.write(JSON.stringify({opu_nr: reply.opu_nr, id:'0', command:'idle'}));
			idleList.push(reply.opu_nr);
			}
		    if (id !== '0' && idleList.length > 0){ 
			inWakeError = true;
			Kernel.wakeupOne(); // to account new coming OPUs
			inWakeError = false;
			}
		    break;
		case 'releasejob':
		    var n = Q.seek(reply.id);
		    if (n) {
			n.data.in_process = false;
			var t = initTask.get_glob().Tasks[Task.zeroedTaskNum(1*n.data.taskNum)];
			t.chunks++;
			}
		    break;
		case 'log':
		    var eobj = {tasknum: 0, owner: undefined, web_nr: 0};
		    if (reply.message == undefined) reply.message = "undefined";
		    var mshead = reply.message.toString().split(' ')[0];
		    if (mshead != 'OPU' && mshead != 'Task') {
			mshead = 'Task #' + reply.tasknum + ': ';;
			}
		    else {
			mshead = '';
			reply.tasknum = 0;
			}
			
		    var task = initTask.get_glob().Tasks[Task.zeroedTaskNum(reply.tasknum)];
		    var owner, web_nr;
		    if (task != undefined) {
			owner = task.owner;
			web_nr = task.web_nr;
			eobj = {tasknum: reply.tasknum, owner: owner, web_nr: web_nr};
			
			if (reply.message.toString() == '#starttime') {
			    task.starttime = new Date().getTime();
			    break;
			    }
			if (reply.message.toString() == '#endtime') {
		    	    if (task.starttime == 0) {console.log("Task #" + task.taskNum + ": endtime without starttime.", eobj); }
			    else {
				var diff = (new Date().getTime()) - task.starttime;
				var secs = Math.floor(diff / 1000);
				var mins = Math.floor(secs / 60);
				secs = secs - mins * 60;
				var millisecs = diff - secs * 1000;
				console.log('Task #' + task.taskNum + ': Elapsed time: ' + mins + ' min ' + secs + '.' + millisecs + ' sec.', eobj);
				}
			    break;
			    }
			}
		    if (reply.type = '1') console.log(mshead+reply.message, eobj);
		    else console.error(mshead+reply.message, eobj);
		    break;
		case 'remotedom':
		    var task = initTask.get_glob().Tasks[Task.zeroedTaskNum(reply.tasknum)];
		    if (!task) break;
		    var soc;
		    for (var z=0; z<webClients.length; z++) {
			if (!webClients[z].ready || webClients[z].web_nr != task.web_nr) continue;
			soc = webClients[z].socket;
			if (soc.readyState < 2) 
			    try {
				soc.sendText(JSON.stringify({'command':'remotedom', 'message': reply.message, tasknum: reply.tasknum, taskname: task.taskName}), null);
				} catch(err) {soc.sendText(JSON.stringify({'command':'msg', 'message': "System error: task #" + reply.tasknum + ": remotedom: " + err})) };
			}
		    break;
		default:
		    console.log("Server: Unrecognized command: " + reply.command + " received.");
		    socket.write(JSON.stringify({id:'0', command:'idle'}));
		}
	    }
	});
	
    socket.on('error', function(err) {
	if (inWakeError) {
//	    console.log("in standard error handler");
	    inWakeError = false;
	    }
	else {
	    delete completeData[socket.conn_id];
	    socket.destroy();
	    console.error("System error: OPU: " + err);
	    }
	});
	
    socket.on('end', function() {
	delete completeData[socket.conn_id];
	socket.destroy();
	})

    socket.on('close', function(had_error) {
	delete completeData[socket.conn_id];
	socket.destroy();
	if (had_error) setTimeout(function(){console.error('System: Transmission error');}, 1000);
	});

    });

TCPserver.on('error', function(err) {
    throw err;
    });

TCPserver.listen(8889, '0.0.0.0');

var completeDataSync = {};

var TCPserverSync = net.createServer(function(socketSync) {
    socketSync.setNoDelay(true);
    socketSync.setKeepAlive(true, 100000);
    socketSync.conn_id = require('crypto').createHash('sha1').update( 'vsaulis' + Date.now() + Math.random() ).digest('hex') ;
    if (!completeDataSync[socketSync.conn_id]) completeDataSync[socketSync.conn_id] = {};
    if (!completeDataSync[socketSync.conn_id].data) completeDataSync[socketSync.conn_id].data = '';

    socketSync.on('data', function(data) {
	socketSync.pause();
	completeDataSync[socketSync.conn_id].data += data;
	var jsons = completeDataSync[socketSync.conn_id].data.toString().split('}{'); 
	var json = '';
	for (var js=0; js<jsons.length; js++) {
	    json = jsons[js];
	    if (js!=0) json = '{' + json;
	    if (js!=jsons.length-1) json = json + '}';
	    try { 
		reply = JSON.parse(json, null);
		completeDataSync[socketSync.conn_id].data = '';
	    } catch(err) { 
		completeDataSync[socketSync.conn_id].data = json;
		if (new RegExp(Kernel.escapeRegExp("{")).test(err)) console.log("Error while parsing OPU request: " + err);
		socketSync.resume();
		return;
		}
	    socketSync.resume();
	    switch (reply.command) {
		case 'getvar':
		    var task = initTask.get_glob().Tasks[Task.zeroedTaskNum(reply.tasknum)];
		    var opunr = reply.opu_nr;
		    var vvar = reply.pvar.split('[');
		    var pvar = task.vars[vvar[0]];
		    var pval;
		    var locked = false;
		    if (reply.lock == true) {
			if (pvar.locked == true) {
			    if (pvar.lockedby != opunr) {
				if ((new Date().getTime()) - pvar.lockedat > 50000) {
				    pvar.lockedby = opunr; // overtake this lock
				    pvar.lockedat = new Date().getTime();
				    pval = pvar.value;
				    locked = true;
				    }
				else {
				    locked = false;
				    socketSync.write(JSON.stringify({command:'getvar', pval: null, locked: locked}));
				    break;
				    }
				}
			    else {
				pvar.lockedby = opunr;
				pvar.lockedat = new Date().getTime(); // rebrand own lock
				pvar.locked = true;
				pval = pvar.value;
				locked = true;
				}
			    }
			else {
			    pvar.locked = true;
			    pvar.lockedby = opunr;
			    pvar.lockedat = new Date().getTime();
			    pval = pvar.value;
			    locked = true;
			    }
			}
		    else {
			pvar.locked = false;
			locked = false;
			}
		    if (vvar.length == 1) {
			pvar.locked = true;
			locked = true;
			pval = pvar.value; 
			}
		    else {
			var vind = vvar[1].match(/(\d.*)\]/)[1]*1;
			try {
			    pval = pvar.value[vind];
			    }
			catch(e) {console.log("Server error: Wrong index of Array in 'getvar' "+vind);}
			}
		    socketSync.write(JSON.stringify({pval:pval, command:'getvar', locked: locked}));
		    break;
		case 'setvar':
		    var task = initTask.get_glob().Tasks[Task.zeroedTaskNum(reply.tasknum)];
		    var opunr = reply.opu_nr;
		    var vvar = reply.pvar.split('[');
		    var pvar = task.vars[vvar[0]];
		    var locked = false;
		    if (pvar.locked == true && reply.force != true) {
			if (pvar.lockedby != opunr) {
			    if ((new Date().getTime()) - pvar.lockedat > 20000) {
				pvar.locked = false; // reset stalled lock
				locked = false;
				}
			    else {
				locked = true;
				}
			    }
			else {
			    pvar.locked = false;
			    locked = false;
			    }
			}
		    else { 
			locked = false;
			}
		    if (reply.force == true) locked = false;
		    if (vvar.length == 1) {
			if (!locked) {
			    pvar.locked = false;
			    pvar.value = reply.pval; 
			    }
			}
		    else {
			var vind = vvar[1].match(/(\d.*)\]/)[1]*1;
			try {
			    if (!locked) pvar.value[vind] = reply.pval;
			    }
			catch(e) {console.log("Server error: Wrong index of Array in 'setvar' "+reply.pvar);}
			}

		    socketSync.write(JSON.stringify({command:'setvar', locked: locked}));
		    break;
		case 'getcachedvar':
		    var task = initTask.get_glob().Tasks[Task.zeroedTaskNum(reply.tasknum)];
		    var opunr = reply.opu_nr;
		    var cvar = reply.cvar;
		    var cval;
		    if (task.cachedVars[cvar] && task.cachedVars[cvar].value) cval = task.cachedVars[cvar].value;
		    else cval = task.vars[cvar].value;
		    socketSync.write(JSON.stringify({cval:cval}));
		    break;
		case 'readfile':
		    var task = initTask.get_glob().Tasks[Task.zeroedTaskNum(reply.tasknum)];
		    var opunr = reply.opu_nr;
		    var lpath = reply.path;
		    lpath = lpath.replace(/\.\.\//, ""); // prevent from jail-break
		    if (lpath.substring(0,1) == "/") path = task.userDir + lpath;
		    else path = task.cwd + lpath;
		    var fdata;
		    try { 
			fdata = fs.readFileSync(path);
			socketSync.write(fdata);
			}
		    catch(ex) {
			var errmsg = "Task #" + reply.tasknum + ": Error reading file :" + lpath + " - " + ex;
			console.log(errmsg);
			socketSync.write(errmsg);
			}
		    break;
		case 'writefile':
		    var task = initTask.get_glob().Tasks[Task.zeroedTaskNum(reply.tasknum)];
		    var opunr = reply.opu_nr;
		    var lpath = reply.path;
		    lpath = lpath.replace(/\.\.\//, ""); // prevent from jail-break
		    if (lpath.substring(0,1) == "/") path = task.userDir + lpath;
		    else path = task.cwd + lpath;
		    var fsmeth = ((reply.append)?"append":"write")+"FileSync";
		    var r;
		    try { 
			r = fs[fsmeth](path, reply.data, reply.options);
			}
		    catch(ex) {
			var errmsg = "Task #" + reply.tasknum + ": Error writing file :" + lpath + " - " + ex;
			console.log(errmsg);
			}
		    break;
		default:
		    console.log("Server: Sync: Unrecognized command: " + reply.command + " received.");
		    socketSync.write(JSON.stringify({id:'0', command:'idle'}));
		}
	    }
	});
	
    socketSync.on('error', function(err) {
	    socketSync.destroy();
	    console.error("System error: OPU: " + err);
	});
	
    socketSync.on('end', function() {
	socketSync.destroy();
	})

    socketSync.on('close', function(had_error) {
	socketSync.destroy();
	if (had_error) setTimeout(function(){console.error('System: Transmission error');}, 1000);
	});

    });

TCPserverSync.listen(8887, '0.0.0.0');
	
var WSserver = ws.createServer(function(wsock) {

    wsock.on("text", function(data) {
	if (wsock.readyState >= 2) return;
	try { var reply = JSON.parse(data.toString(), null);
	} catch(err) { console.log("System error while parsing Web client request: " + err); }
	switch (reply.command) {
	    case 'hello':
		var databody = reply.message.split(',');
		var j=0;
		for (var i=0; i<webClients.length; i++) {
		    if (webClients[i] == undefined) {j=i;break;}
		    }
		initTask.get_glob().user = databody[3];
		var resp = {web_nr: -1, 'id':'0', 'owner': databody[3], 'command': 'helloack', message: 'Connection accepted'};
		var ent = {web_nr: -1, ready: false, owner: databody[3], socket: wsock, address: databody[1], pid: databody[2]};
		if (j != 0) {resp.web_nr = j; ent.web_nr = j; webClients[j] = ent;}
		else {resp.web_nr = webClients.length; ent.web_nr = resp.web_nr; webClients.push(ent); }
		wsock.sendText(JSON.stringify(resp));
		break;
	    case 'ready':
		webClients[reply.web_nr].ready = true;
		webClients[reply.web_nr].active = true;
		console.log("System: Console #" + reply.web_nr + " is activated");
		break;
	    case 'chown':
		initTask.get_glob().user = reply.newOwner;
		webClients[reply.web_nr].owner = reply.newOwner;
		var T = initTask.get_glob().Tasks;
//		for (var tz in T) {
//		    if (T[tz].owner == reply.oldOwner) T[tz].owner = reply.newOwner;
//		    }
		wsock.sendText(JSON.stringify({command: 'chuser', user: reply.newOwner}));
		console.log("System: User changed to '" + reply.newOwner + "'.");
		break;
	    case 'shell':
		var tokens = reply.msg.split(' ');
		if (tokens[0] == '?') {
		    wsock.sendText(JSON.stringify({command: 'shellcmd', 
		    msg: "      <b>status</b> - queue length, tasks, OPU status.\n" +
		         "      <b>queue [n]</b> - list queue entries. [n] - list first n entries.\n" +
		         "      <b>schedule [n]</b> - set/get scheduler mode.\n" +
		         "      &nbsp; &nbsp; 1 - in queue order\n" +
		         "      &nbsp; &nbsp; 2 - tasks round-robin\n" +
		         "      &nbsp; &nbsp; no parameter - show current mode.\n" + 
		         "      <b>log <var> [<var> ...]</b> - log variables like console.log.\n" +
		         "      <b>clear</b> - clear console.\n" +
		         "      <b>tasks</b> | <b>ts [all]</b> - list active tasks.\n" +
		         "      &nbsp; &nbsp; all - list all tasks.\n" +
		         "      <b>task</b> | <b>t [n]</b> - view last task.\n" +
		         "      &nbsp; &nbsp; n - optional task number.\n" +
		         "      <b>kill</b> n</b> - kill task.\n" +
		         "      &nbsp; &nbsp; n - task number.\n" +
		         "      <b>disable</b> n</b> - disable OPU.\n" +
		         "      &nbsp; &nbsp; n - OPU number.\n" +
		         "      <b>enable</b> n</b> - enable OPU.\n" +
		         "      &nbsp; &nbsp; n - OPU number.\n" +
		         "      <b>mload</b> | <b>ml</b> - Machine load (1.0 - optimal).\n" }));
		    }
		else if (tokens[0] == 'status') {
		    // Count active tasks in the Queue
		    var T = initTask.get_glob().Tasks;
		    for (var tz in T) {
			T[tz].active = false;
			}
		    var n = Q.first;
		    while (n) {
			T[Task.zeroedTaskNum(n.data.taskNum)].active = true;
			n = n.next;
			}
		    var tc = 0;
		    for (var tz in T) {
			if (T[tz].active == true) tc++;
			}
		    // Count active OPUs
		    var opus = 0;
		    for (var opu in opuClients) {
			if (opuClients[opu] != undefined && 
			    !opuClients[opu].socket.destroyed &&
			    opuClients[opu].active == true) opus++;
			}
		    wsock.sendText(JSON.stringify({command: 'shellcmd', 
		    msg: "Queue length: " + Q.size + "\n" +
			 "Active tasks: " + tc + "\n" +
			 "Active OPUs: " + opus}));
		    }
		else if (tokens[0] == 'disable') {
		    var o;
		    if (tokens[1] == undefined) {
			wsock.sendText(JSON.stringify({command: 'shellcmd',
			    msg: "Please specify OPU number."})); 
			break;
			}
		    else {
			o = parseInt(tokens[1], 10);
			if (isNaN(o) || o < 0) {
			    wsock.sendText(JSON.stringify({command: 'shellcmd',
				msg: "Invalid OPU number."})); 
			    break;
			    }
			 }
		    if (!opuClients[o]) {
			wsock.sendText(JSON.stringify({command: 'shellcmd',
			    msg: "OPU #"+o+" is not found."})); 
			break;
			}
		    else if (opuClients[o].active) {
			opuClients[o].active = false;
			inWakeError = true;
			opuClients[o].socket.write(JSON.stringify({opu_nr: o, id:'0', command:'idle'}));
			idleList.push(o);
			wsock.sendText(JSON.stringify({command: 'shellcmd',
			    msg: "OPU #"+o+" disabled"})); 
			}
		    }
		else if (tokens[0] == 'enable') {
		    var o;
		    if (tokens[1] == undefined) {
			wsock.sendText(JSON.stringify({command: 'shellcmd',
			msg: "Please specify OPU number."})); 
			break;
			}
		    else {
			o = parseInt(tokens[1], 10);
			if (isNaN(o) || o < 0) {
			    wsock.sendText(JSON.stringify({command: 'shellcmd',
			    msg: "Invalid OPU number."})); 
			    break;
			    }
			 }
		    if (!opuClients[o]) {
			wsock.sendText(JSON.stringify({command: 'shellcmd',
			    msg: "OPU #"+o+" is not found."})); 
			break;
			}
		    else if (!opuClients[o].active) {
			opuClients[o].active = true;
			inWakeError = true;
			Kernel.wakeupOne(); // to account new coming OPUs
			inWakeError = false;
			wsock.sendText(JSON.stringify({command: 'shellcmd',
			    msg: "OPU #"+o+" enabled"})); 
			}
		    }
		else if (tokens[0] == 'kill') {
		    var T = initTask.get_glob().Tasks;
		    var t = 0;
		    var force = false;
		    if (tokens[1] == undefined) { 
			wsock.sendText(JSON.stringify({command: 'shellcmd',
			msg: "Please specify task number."})); 
			break;
			}
		    else {
			t = parseInt(tokens[1], 10);
			if (isNaN(t) || t < 2) { 
			    wsock.sendText(JSON.stringify({command: 'shellcmd',
			    msg: "Invalid task number."}));
			    break;
			    }
			}
		    if (T[Task.zeroedTaskNum(t)].owner != webClients[reply.web_nr].owner) {
		    	wsock.sendText(JSON.stringify({command: 'shellcmd',
			msg: "This is not your task!"}));
			break;
			}

		    force = (tokens[2] == "force") ? true : false;

		    var lck = Q.lock();
		    var n = Q.first, dn = null, nn = null;
		    var found = false;
		    while (n) {
			if (n.data.taskNum == t) {
			    found = true;
			    dn = n;
			    // Brutally kill corresponding OPU,
			    // causing it to restart
//			    if (n.data.in_process 
//				&& opuClients[n.data.opu] 
//				&& opuClients[n.data.opu].socket)
//				    opuClients[n.data.opu].socket.write(JSON.stringify({command: "kill"}));
			    }
			nn = n.next;
			if (dn) Q.dequeue(dn);
			n = nn;
			}
		    Q.unlock(lck);
		    wsock.sendText(JSON.stringify({command: 'shellcmd',
		        msg: (found == true) ? "Task #"+t+ " killed." : "Task #"+t+ " is not found." }));
		    }
		else if (tokens[0] == 'mload' || tokens[0] == 'ml') {
		    // Count active tasks in the Queue
		    var T = initTask.get_glob().Tasks;
		    var processing = 0, waiting = 0;
		    var opus = 0;
		    var ml = 0;
		    var n = Q.first;
		    while (n) {
			if (T[Task.zeroedTaskNum(n.data.taskNum)].stopped != true) {
			    if (n.data.in_process) processing++;
			    else waiting++;
			    }
			n = n.next;
			}
		    // Count active OPUs
		    for (var opu in opuClients) {
			if (opuClients[opu] != undefined && 
			    !opuClients[opu].socket.destroyed &&
			    opuClients[opu].active == true) opus++;
			}
		    ml = (opus == 0) ? 0 : ((processing + waiting / 2) / opus);
		    wsock.sendText(JSON.stringify({command: 'shellcmd', 
		    msg: "Machine load:  " + ml + "\n"}));
		    }
		else if (tokens[0] == 'queue') {
		    var n = Q.first;
		    if (!n) { wsock.sendText(JSON.stringify({command: 'shellcmd',
			      msg: "Queue is empty"})); }
		    else {
			var ind = 1;
			while (n) {
			    var inp = (n.data.in_process == true)?'*':'';
			    wsock.sendText(JSON.stringify({command: 'shellcmd',
			    msg: n.id + inp + ": " + n.data.precode + " " + n.data.code.substring(0, 40)}));
			    n = n.next;
			    if (tokens[1] && ind++ >= 1*tokens[1]) break;
			    }
			}
		    }
		else if (tokens[0] == 'tasks' || tokens[0] == 'ts') {
		    var n = Q.first;
		    var t_all = (tokens[1] == "all" || tokens[1] == "a")?true:false;
		    if (!n && !t_all) { wsock.sendText(JSON.stringify({command: 'shellcmd',
			      msg: "No running tasks"})); }
		    else {
			var T = initTask.get_glob().Tasks;
			var tasks = [];
			var t, tn, ts;
			var path = "";
			var sts = "";
			var tmsg = ((t_all) ? "      All tasks:\n" : "      Active tasks:\n") +
				    "      -------------\n" +
				    "  Task #" + "   " + "Chunks processing" + "   " + "Chunks waiting" + "   " + "Status" + "     " + "Owner" + "        " + "Name" + "\n";
			while (n) {
			    tn = n.data.taskNum;
			    if (!tasks[tn]) tasks[tn] = {task: tn, in_process: 0, waiting: 0, status: "Running    "};
			    if (n.data.in_process == true) tasks[tn].in_process++;
			    else tasks[tn].waiting++;
			    tasks[tn].owner = T[Task.zeroedTaskNum(tn)].owner;
			    tasks[tn].name = T[Task.zeroedTaskNum(tn)].taskName;
			    n = n.next;
			    }
			for (ts in T) {
			    t = T[ts];
			    if (t != undefined && ts*1 != 1 && (t.stopped == true || t_all)) {
				sts = (t.stopped) ? "Stopped    " : "Finished   ";
				if (ts*1 in tasks) { if (t.stopped) tasks[ts*1].status = sts;}
				else tasks[ts*1] = {task: ts*1, in_process: 0, waiting: 0, status: sts};
				tasks[ts*1].owner = t.owner;
				tasks[ts*1].name = t.taskName;
				}
			    }
			for (tn = 2; tn <= tasks.length; tn++) {
			    if (tasks[tn] != undefined) {
				path = tasks[tn].name.replace(/^workspaces\///g)
				tmsg += alignRight(7, tasks[tn].task) + "   " +
					alignRight(16, tasks[tn].in_process) + "   " +
					alignRight(13, tasks[tn].waiting) +
					"   " + tasks[tn].status + 
					(tasks[tn].owner + "            ").substring(0, 13) + 
					tasks[tn].name.replace(/^workspaces\//g, "") + "\n";
				}
			    }
			wsock.sendText(JSON.stringify({command: 'shellcmd', msg: tmsg}));
			}
		    }
		else if (tokens[0] == 'task' || tokens[0] == 't') {
		    var n = Q.first;
		    var T = initTask.get_glob().Tasks;
		    var t;
		    var tasks = [];
		    var path = "";
		    var sts = "";
		    var tmsg = "  Task #" + "   " + "Chunks processing" + "   " + "Chunks waiting" + "   " + "Status" + "     " + "Owner" + "        " + "Name" + "\n";
		    if (!tokens[1]) t = initTask.get_glob().taskNextNum - 1;
		    else {
			t = parseInt(tokens[1], 10);
			if (isNaN(t)) t = initTask.get_glob().taskNextNum - 1;
			}
		    while (n) {
			if (n.data.taskNum == t ) {
			    if (!tasks[t]) tasks[t] = {task: t, in_process: 0, waiting: 0, status: "Running    "};
			    if (n.data.in_process == true) tasks[t].in_process++;
			    else tasks[t].waiting++;
			    tasks[t].owner = T[Task.zeroedTaskNum(t)].owner;
			    tasks[t].name = T[Task.zeroedTaskNum(t)].taskName;
			    }
			n = n.next;
			}
		    ts = T[Task.zeroedTaskNum(t)];
		    if (ts != undefined) {
			sts = (ts.stopped) ? "Stopped    " : "Finished   ";
			if (t in tasks) { if (ts.stopped) tasks[t].status = sts;}
			else tasks[t] = {task: t, in_process: 0, waiting: 0, status: sts};
			tasks[t].owner = ts.owner;
			tasks[t].name = ts.taskName;
			}
		    if (t > 1 &&tasks[t] != undefined) {
			path = tasks[t].name.replace(/^workspaces\///g)
			tmsg += alignRight(7, tasks[t].task) + "   " +
				alignRight(16, tasks[t].in_process) + "   " +
				alignRight(13, tasks[t].waiting) +
				"   " + tasks[t].status + 
				(tasks[t].owner + "            ").substring(0, 13) + 
				tasks[t].name.replace(/^workspaces\//g, "") + "\n";
			}
		    else { tmsg += "      Task is not available"; }
		    wsock.sendText(JSON.stringify({command: 'shellcmd', msg: tmsg}));
		    }
		else if (tokens[0] == 'schedule') {
		    var g = initTask.get_glob();
		    switch (tokens[1]) {
			case '1':
			    g.scheduleMode = 1;
			    wsock.sendText(JSON.stringify({command: 'shellcmd',
			    msg: "Schedule mode set to: 1\n"}));
			    break;
			case '2':
			    g.scheduleMode = 2;
			    wsock.sendText(JSON.stringify({command: 'shellcmd',
			    msg: "Schedule mode set to: 2\n"}));
			    break;
			default:
			    wsock.sendText(JSON.stringify({command: 'shellcmd',
			    msg: "Trying to set wrong schedule mode: " + tokens[1] + "\n"}));
			case undefined:
			    wsock.sendText(JSON.stringify({command: 'shellcmd',
			    msg: "Current schedule mode is: " + g.scheduleMode + "\n"}));
			    break;
			}
		    }
		else if (tokens[0] == 'log') {
		    var par = '';
		    for (zz=1; zz<tokens.length; zz++) par += tokens[zz];
		    try{console.log(eval(par));}catch(err){console.log(err.message);}
		    }
		else if (tokens[0] == 'clear') {
		    wsock.sendText(JSON.stringify({command: 'shellcmd',
		    subcmd: "clear", msg: "clr" + "\n"}));
		    }
		else {
		    wsock.sendText(JSON.stringify({command: 'shellcmd', 
		    msg: "Unrecognized command: " + tokens[0]}));
		    }
		break;
	    default:
		if (wsock.readyState < 2)
		    console.log("System error: Unrecognized command: " + reply.command + " received.");
	    }

	});

    wsock.on("close", function(code, reason, evt) {
//	oldLog("System: WebSocket closed with code: " + code + ", reason: " + reason);
	});
	
    wsock.on("error", function(err) {
	oldLog("System error: WebSocket error: " + err);
	});
    }).listen(8890, '0.0.0.0');


var server = app.listen(8888, function () {
  
    var host = server.address().address;
    var port = server.address().port;
    console.log('System: Memel server started');

});

function alignRight(len, num) {

    var blanks = '                    ';
    return blanks.substring(0, len - num.toString().length + 1) + num;
}
