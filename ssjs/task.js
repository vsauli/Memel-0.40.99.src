var fs = require('fs');
var uglify = require('uglify-js');
var queue = require('./queue');
var _glob = require('./_glob');
var Kernel = require('./kernel.js');
_glob = {
    user: 'anonymous',
    taskNextNum : 1,
    initTask: {},
    Tasks : {},
    recentRunningTask: 1,
    scheduleMode: 1,
    Queue: {}
    };

module.exports = Task;
module.exports._glob = _glob;

function extract_left(total_chars) {
    return this.substring(0, total_chars);
}

function extract_right(total_chars) {
    return this.substring(this.length - total_chars);
}

String.prototype.left = extract_left;
String.prototype.right = extract_right;

function trim_spaces(from_where) {

    var temp_string = this;
    
    if (arguments.length == 0) {
        from_where = "BOTH";
	}
	
    if (from_where.toUpperCase() == "LEFT" ||
        from_where.toUpperCase() == "BOTH") {
	while(temp_string.left(1) == " ") {
	    temp_string = temp_string.substring(1);
	    }
	}

    if (from_where.toUpperCase() == "RIGHT" ||
        from_where.toUpperCase() == "BOTH") {
	while(temp_string.right(1) == " ") {
	    temp_string = temp_string.substring(0, temp_string.length - 1);
	    }
	}
    return temp_string;
}

String.prototype.trim = trim_spaces;

function Task(conf) {
    this.src = (conf && conf.src) ? conf.src : '';
    this.userDir = conf.userDir;
    this.cwd = conf.cwd;
    this.ast = {};
    this.vars = {};
    this.chunkVars = {};
    this.next_stop = [0];
    this.mode = 'par';
    this.keepsetvars = false;
    this.stack = [];
//    this.scope = this;
    this.waitList = {};
    this.next_wait_id = 1;
    this.current_waits = 0;
    this.owner = _glob.user;
    this.starttime = 0;
    this.started = new Date().getTime();
    this.web_nr = (conf && conf.web_nr) ? conf.web_nr : '';
    this.taskNum = (conf && conf.taskNum) ? conf.taskNum: _glob.taskNextNum++;
    this.taskName = (conf && conf.taskName) ? conf.taskName: 'undef';
    this.chunks = 0;
}

Task.prototype.addToTasksList = function addToTasksList(task) {

    _glob.Tasks[Task.zeroedTaskNum(task.taskNum)] = task;
}

Task.prototype.launchTask = function launchTask() {

    // launch Task here
    try { this.ast = uglify.parse(this.src);
    } catch(err) { console.log("Task #" + this.taskNum + " error while parsing task code: " + err); }

    if (!this.ast || !this.ast.body) return;

    var funcs = '';
    var OUTPUT_OPTIONS = { beautify: true, preamble: null, quote_style: 0, comments: true };
    var output;
    for (var i = 0; i < this.ast.body.length; i++) {
	if (this.ast.body[i].start.value == 'function') {
	    output = uglify.OutputStream(OUTPUT_OPTIONS);
	    this.ast.body[i].print(output);
	    funcs += output.get();
	    }
	}
    this.funcs = funcs;

    var d = new Date().toISOString();
    var wstr = d + ': user: ' + this.owner + '\n' + this.src + '\n' + '-------------------------------------\n\n';
    fs.appendFile('memel.log', wstr, function(err) { return; });

//console.log(JSON.stringify(this.ast, null));

//    this.ast.walk(new uglify.TreeWalker(function(node) {
//	console.log(node);
//	for (var g in node) {
//	    console.log(g);
//        console.log(node.TYPE);
//        console.log(node.start.value);
//	console.log(node.TYPE + ' == ' + node.value + ' == ' + node.name + ' == ' + node.init + ' == ' + node.condition + ' == ' + node.step + ' == ' + node.expression);
//	if (node.TYPE == 'VarDef') {console.log(node.value); console.log(node.name);}
//	return false;
//	}));

//return;
//    var OUTPUT_OPTIONS = { beautify: true, preamble: null, quote_style: 0, comments: true };

//    for (var i=0; i<this.ast.body.length; i++) {
//	var output = uglify.OutputStream(OUTPUT_OPTIONS);
//	this.ast.body[i].print(output);
//	output = output.get();
//	console.log(output);
//	}

    task = _glob.Tasks[Task.zeroedTaskNum(this.taskNum)];
    Kernel.parallelizator(task, this.ast, task.next_stop, 0);

//    var q = _glob.Queue;

//    n = q.first;
//    while (n && n.next) {
//	console.log(n);
//	n = n.next;
//	}


}

Task.prototype.get_glob = function get_glob() {

    return _glob;
}


module.exports.zeroedTaskNum = function zeroedTaskNum(num) {

    var tnum = '000000' + num;
    return tnum.substring(num.toString().length - 1, 7);
}

