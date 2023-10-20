var uglify = require('uglify-js');
var queue = require('./queue');
var _glob = require('./_glob');


module.exports.setVars = setVars;

//module.exports.parallelizator = parallelizator;

module.exports.parallelizator = function parallelizator(task, ast, next_stop, level) {

    if (task.next_stop[level] == undefined) return;

    var q = task.get_glob().Queue;
    var f_wait = false;
    var f_in_block = false;
    var f_start_block = false;
    var f_end_block = false;
    var f_start_time = false;
    var f_end_time = false;
    var f_cached = false;
    var f_cachedvars = {};
    var f_parvar = false;
    var f_parvars = {};
    var f_dive = false;
    var f_noautoparvar = false;
    var parvar;
    var cvs, cv;
    var OUTPUT_OPTIONS = { beautify: true, preamble: null, quote_style: 0, comments: true };
    
    var code = '', precode = '';
    var pv;

    for (var st in task.vars) {
	if (task.vars[st].const != true) task.vars[st].setvars = undefined;
	}

    if (!ast) {
	console.log('Task #' + task.taskNum + ': Line ' + start.line + ": Undefined error when diving");
	return false;
	}
    while (toString.apply(ast.body) !== '[object Array]') ast = ast.body;

    for (var i = task.next_stop[level]; i < ast.body.length; i++) {
	var body = ast.body[i];
	var start = body.start;
	f_start_block = false;
	f_end_block = false;
	f_wait = false;
	f_cached = false;
	f_cachedvars = {};
	f_parvar = false;
	f_parvars = {};
	f_dive = false;
	var f_noautoparvar = false;

	if (task.next_stop.length > level + 1) {
	    if (!this.parallelizator(task, ast.body[i], task.next_stop, level+1)) return false;
	    }
	
	var old_mode = task.mode;
	for (var j=0; start.comments_before != undefined && j<start.comments_before.length; j++) {
	    var comm = start.comments_before[j].value.trim().split(' ');
	    if (comm[0].trim() == "#pragma" && comm[1] != undefined) {
		comm[1] = comm[1].trim().toString();
		switch (comm[1]) {
		    case 'parallel':
			 task.mode = 'par';
			 break;
		    case 'sequential':
			 task.mode = 'seq';
			 break;
		    case 'wait':
			 f_wait = true;
			 break;
		    case 'beginblock':
			 f_in_block = true;
			 f_start_block = true;
			 break;
		    case 'endblock':
			 f_end_block = true;
			 break;
		    case 'starttime':
			f_start_time = true;
			break;
		    case 'endtime':
			f_end_time = true;
			break;
		    case 'parvar':
			if (comm[2]) parvar = comm[2].trim().toString();
			else break;
			f_parvars[parvar] = parvar;
			f_parvar = true;
			break;
		    case 'noautoparvar':
			task.noautoparvar = true;
			break;
		    case 'keepsetvars':
			task.keepsetvars = true;
			break;
		    case 'resetsetvars':
			task.keepsetvars = false;
			break;
		    case 'noremotedom':
		    case 'remotedom':
			var o = (comm[1] == 'remotedom')?true:false;
			task.remotedom = o;
			var rd = '__remote_dom';
			if (!task.vars[rd]) {
			    task.vars[rd] = {};
			    task.vars[rd].name = rd;
			    }
			task.vars[rd].const = true;
			task.vars[rd].setvars = true;
			task.vars[rd].value = o;
			break;
		    case 'dombuffersize':
			var o = parseInt(comm[2], 10);
			if (isNaN(o) || o < 0) break;
			var dbs = '__dom_buffer_size';
			if (!task.vars[dbs]) {
			    task.vars[dbs] = {};
			    task.vars[dbs].name = dbs;
			    }
			task.vars[dbs].const = true;
			task.vars[dbs].setvars = true;
			task.vars[dbs].value = o;
			break;
		    case 'cache':
			if (comm[2]) cv = comm[2].trim().toString();
			else break;
			f_cachedvars[cv] = cv;
			f_cached = true;
			break;
		    case 'cachefuncs':
			f_cachedfuncs = true;
			if (!task.cachedVars) task.cachedVars = {};
			if (!task.cachedVars['#__funcs'])
			    task.cachedVars['#__funcs'] = {name: '#__funcs', value: task.funcs};
			task.funcs = "cached";
			break;
		    case 'dive':
			 f_dive = true;
			 f_wait = true; // Implicit wait before dive
			 break;
		
		    default:
			console.error('Task #' + task.taskNum + ': Line ' + start.line + ": Unrecognized #pragma directive '" + comm[1] + "'");
		    }
		}
	    }

	// force #endblock for last iteration of body
	if (i == ast.body.length-1 && f_in_block) f_end_block = true;

//	if (task.mode == 'par' && old_mode == 'seq' || task.mode == 'seq' && old_mode == 'par') {
	    // Finalize sequential statements
//	    f_wait = true;
//	    }

	if (/* task.mode == 'par' && */ f_wait && i != task.next_stop[level]) {
	    if (code != '') {
		this.enqueuer(task, q, ast.body, precode, code);
		}
	    precode = '';
	    code = '';
	    if (task.current_waits == 0) task.current_waits++;
	    task.waitList[''+task.next_wait_id] = {totalWaits: task.current_waits, completeWaits: 0};
	    task.next_wait_id++;
	    task.next_stop[level] = i;
	    return null;
	    }

	if ( /*task.mode == 'par' && */ f_wait && i == task.next_stop[level]) {
	    for (w in task.waitList) {
		if (task.waitList[w].totalWaits != task.waitList[w].completeWaits) return false;
		task.current_waits = 0;
		delete task.waitList[w];
		}
	    }

	if (f_start_time) {
	    code += "console.log('#starttime');\n"
	    f_start_time = false;
	    }

	if (f_end_time) {
	    if (task.mode == 'seq')
		code += "console.log('#endtime');\n"
	    else precode += "console.log('#endtime');\n"
	    f_end_time = false;
	    }
	    
	// Define task vars
	
	if (start.value != 'function') {

	    if ((!task.keepsetvars && task.mode == 'par') || (f_in_block && f_start_block)) {
		for (var svi in task.vars) {
		    task.vars[svi].setvars = false;
		    }
		}

	    var incall = 0;
	    body.walk(new uglify.TreeWalker(function(node) {
		if (node.TYPE == "New") return true;
		if (node.TYPE == "Function") return true;
		if (node.TYPE == 'Dot' && node.property == 'prototype') return true;
		if (node.TYPE == "Call") incall = 1;
		if (node.TYPE == 'SymbolVar' || node.TYPE == 'SymbolRef') {
		    if (incall > 0 && incall++ < 2) return false;
		    if (node.name == '__job' || node.name == 'global') return false;
		    if (task.vars[node.name] != undefined) task.vars[node.name].setvars = true;
		    else task.vars[node.name] = {name: node.name, value: undefined, setvars: true};
		    }
		return false;
		}));


	    this.detectsetvars(task, body);
	    }

	if (f_cached) {
	    for (cvs in f_cachedvars) {
		if (!task.vars[cvs]) 
		    task.vars[cvs] = {name: cvs, value: undefined, setvars: false, scope: undefined, cached: true};
		else task.vars[cvs].cached = true;
		if (!task.cachedVars) task.cachedVars = {};
		if (!task.cachedVars[cvs])
		    task.cachedVars[cvs] = {name: cvs, value: undefined, scope: undefined};
		if (task.vars[cvs].value != undefined) {
		    task.cachedVars[cvs].value = JSON.parse(JSON.stringify(task.vars[cvs].value, null));
		    task.vars[cvs].value = undefined;
		    }
		}
	    f_cachedvars = {};
	    }

	if (f_parvar) {
	    for (parvar in f_parvars) {
		if (!task.vars[parvar]) 
		    task.vars[parvar] = {name: parvar, value: undefined, setvars: false, scope: undefined, parvar: true};
		else task.vars[parvar].parvar = true;
		task.vars[parvar].setvars = false;
		}
	    f_parvars = {};
	    }

	if (task.mode == 'par' && old_mode == 'seq') {
	    if (code != '') {
		this.enqueuer(task, q, ast.body, precode, code);
		code = '';
		precode = '';
		}
	    }

	if (task.mode == 'par' && f_end_block && !f_in_block) {
	    console.error('Task #' + task.taskNum + ': Line ' + start.line + ': Unmatched #pragma endblock. Interpreted just as ordinary parallel statement.');
	    }

	var ret = this.analyzator(task, body, task.mode, f_dive);
	if (ret === null) return null;
	if (ret === false) continue;
	else {
	    output = uglify.OutputStream(OUTPUT_OPTIONS);
	    body.print(output);
	    var statement = output.get();
	    if (this.statementchecker(statement, task, start) != '') {
		if (task.mode == 'par') {
		    pv = this.parvardetector(task, body);
		    code += pv.precode + statement + pv.postcode;
		    }
		else code += statement;
		}
	    if (task.mode == 'par' || (task.mode == 'seq' && i == ast.body.length - 1)) {
		if (task.mode == 'par' && f_in_block && !f_end_block ) continue; 
		if (level == 0 && code != '') {
		    this.enqueuer(task, q, ast.body, precode, code);
		    f_in_block = false;
		    f_end_block = false;
		    task.current_waits++;
		    }
		if (level > 0 && task.mode == 'seq' && code != '') {
		    this.enqueuer(task, q, ast.body, precode, code);
		    task.current_waits = 1;
		    task.waitList[''+task.next_wait_id] = {totalWaits: task.current_waits, completeWaits: 0};
		    task.next_wait_id++;
		    }
		code = '';
		precode = '';
		if (i == ast.body.length - 1) {
		    task.next_stop.pop();
		    return null;
		    }
		}
	    }
	if (i == ast.body.length - 1) task.next_stop.pop();
	} // for i

return true;

}

module.exports.analyzator = function analyzator(task, ast, mode, f_dive) {

    var q = task.get_glob().Queue;

    var precode = '';
    var code = '';
    var output;
    var loopvars = {};
    var condvars = {};
    var cvars = '';
    var OUTPUT_OPTIONS = { beautify: true, preamble: null, quote_style: 0, comments: true };
    var pv;

    if (f_dive) {
	if (ast.start.value == 'while') { // dive into while loop
	    var b = ast;
	    if (!b) { console.log("Error: no cycle body"); return false; }

	    var condition;
	    output = uglify.OutputStream(OUTPUT_OPTIONS);
	    b.condition.print(output);
	    condition = output.get();

	    b.condition.walk(new uglify.TreeWalker(function(node) {
		if (node.TYPE == 'SymbolVar' || node.TYPE == 'SymbolRef') {
		    if (node.name in condvars) return false;
		    condvars[node.name] = task.vars[node.name];
		    }
		return false;
		}));

	    var testbody;

	    for (var name in condvars) {
		cvars += 'var ' + name + '= ' + task.vars[name].value +';';
		}
	    testbody = cvars + ' return ' + condition + ';';
	    try { if (!(new Function(testbody))()) return false;
	    } catch(err) { console.log("Task #" + task.taskNum + " error while parsing 'condition' clause of the 'while' loop: " + err); return false;}

	    task.next_stop.push(0);

	    return this.parallelizator(task, b.body, task.next_stop, task.next_stop.length-1);
	    }
	}

    if (mode == 'par' && ast.start.value == 'for') { // parallel For loop

	var b = ast.body.body;
	if (!b) return false;
	for (ind=0; ind<b.length; ind++) {
	    output = uglify.OutputStream(OUTPUT_OPTIONS);
	    b[ind].print(output);
	    var statement = output.get();
	    if (task.noautoparvar)
		pv = {precode:'', postcode: ''};
	    else
		pv = this.parvardetector(task, b[ind]);
	    if (this.statementchecker(statement, task, b[ind].start) != '') 
		code += pv.precode + statement + '' + pv.postcode;
	    }
	// get loop definitions
	b = ast;
	var step;
	output = uglify.OutputStream(OUTPUT_OPTIONS);
	b.step.print(output);
	step = output.get();
	var condition;
	output = uglify.OutputStream(OUTPUT_OPTIONS);
	b.condition.print(output);
	condition = output.get();
	var init;
	output = uglify.OutputStream(OUTPUT_OPTIONS);
	b.init.print(output);
	init = output.get();
	
	// determine loop iterator var
	b.init.walk(new uglify.TreeWalker(function(node) {
	    if (node.TYPE == 'SymbolVar' || node.TYPE == 'SymbolRef') {
		loopvars[node.name] = (node.TYPE == 'SymbolVar') ? undefined : task.vars[node.name];
		task.vars[node.name] = {name: node.name, value: loopvars[node.name], setvars: false, type: 'number', subtype: 'loop', scope: ''};
		}
	    return false;
	    }));
	b.step.walk(new uglify.TreeWalker(function(node) {
	    if (node.TYPE == 'SymbolVar' || node.TYPE == 'SymbolRef') {
		loopvars[node.name] = (node.TYPE == 'SymbolVar') ? undefined : task.vars[node.name];
		task.vars[node.name] = {name: node.name, value: loopvars[node.name], setvars: false, type: 'number', subtype: 'loop', scope: ''};
		}
	    return false;
	    }));
	b.condition.walk(new uglify.TreeWalker(function(node) {
	    if (node.TYPE == 'SymbolVar' || node.TYPE == 'SymbolRef') {
		if (node.name in loopvars) return false;
		condvars[node.name] = task.vars[node.name];
		}
	    return false;
	    }));
	// create precode preambula
	var funcbody;
	var testbody;
	for (name in loopvars) {
	    funcbody = init + '; return ' + name + ';';
	    try {loopvars[name] = (new Function(funcbody))();
	    } catch(err) { console.log("Task #" + task.taskNum + " error while parsing 'init' clause of the 'for' loop: " + err); }
	    task.vars[name].value = loopvars[name];
	    precode += 'var ' + name + ' = ' + loopvars[name] + ';';
	    }
	for (name in condvars) {
	    cvars += 'var ' + name + '= ' + task.vars[name].value +';';
	    }
	task.current_waits = 0;
	var iter = 0;
	// iterate through for loop
	while (1) {
	    testbody = precode + cvars + ' return ' + condition + ';';
	    try { if (!(new Function(testbody))()) break;
	    } catch(err) { console.log("Task #" + task.taskNum + " error while parsing 'condition' clause of the 'for' loop: " + err); }
	    task.current_waits++;
	    this.enqueuer(task, q, ast.body.body, precode, code);
	    if (++iter > 1000) {
		console.error('Task #' + task.taskNum + ': Line ' + ast.body.start.line + ': Too much iterations of the loop');
		break;
		}
	    funcbody = '';
	    for (name in loopvars) {
		funcbody += name + ' = ' + loopvars[name] + ';';
		}
	    funcbody += step + ';';
	    precode = '';
	    for (name in loopvars) {
		try { loopvars[name] = (new Function(funcbody + '; return ' + name + ';'))();
		} catch(err) { console.log("Task #" + task.taskNum + ": error while parsing 'increment' clause of the 'for' loop: " + err); }
		task.vars[name].value = loopvars[name];
		precode += name + ' = ' + loopvars[name] + ';';
		}
	    } // end while
	return false;
	}
    // other statements
    return true;
}

module.exports.extractor = function extractor(Q, reply, glob, socket, ztn) {

    var n = null;
    var w;
    var task = 0;
    var id = reply.id;
    var ndata = {};

    n = Q.seek(id);
    if (n) {
	task = glob.Tasks[ztn(n.data.taskNum)];
	setVars(reply.data.vars, task);
	var l = Q.lock();
	if (l == 0) {
	    socket.write(JSON.stringify({id: id, command:'regetjob', opu_nr: reply.opu_nr, data:n.data})+"\n");
	    return id;
	    }
	Q.dequeue(n);
	Q.unlock(l);
	w = n.data.wait_id;
	if (task && task.waitList[w] != undefined) {
	    task.waitList[w].completeWaits++;
	    if (task.waitList[w].totalWaits == task.waitList[w].completeWaits) {
		task.current_waits = 0;
		delete task.waitList[w];
		for (var sv in task.vars) {
		    if (!task.keepsetvars) task.vars[sv].setvars = false;
		    task.vars[sv].parvar = false;
		    }
		this.parallelizator(task, task.ast, task.next_stop, 0);
		}
	    }
	}



    var id = '0';
    var fallthru = 0;
    var found = false;
    var tnum = glob.recentRunningTask;
    var lc = Q.lock();

    if (lc == 0) {
	socket.write(JSON.stringify({id: id, command:'regetjob', opu_nr: reply.opu_nr, data:n.data})+"\n");
	return id;
	}

    n = null;

    if (glob.scheduleMode == 2) { // schedule mode 2 - tasks round-robin

	task = glob.Tasks[ztn(++tnum)];
	while(!found && task != undefined) {
	    n = Q.seekTask(tnum);
	    if (n && task.chunks > 0 && !n.data.in_process) {
		found = true;
		break;
		}
	    task = glob.Tasks[ztn(++tnum)];
	    }

	tnum = 2;
	task = glob.Tasks[ztn(tnum)];
	while(!found && tnum <= glob.recentRunningTask && task != undefined) {
	    n = Q.seekTask(tnum);
	    if (n && task.chunks > 0 && !n.data.in_process) {
		found = true;
		break;
		}
	    task = glob.Tasks[ztn(++tnum)];
	    }

	if (!found) fallthru = 1;
	    
	}

    if (glob.scheduleMode == 1 || fallthru == 1) { // schedule mode 1 - in queue order
	n = Q.first;
	while (n && !found) {
    	    if (!n.data.in_process) {
		task = glob.Tasks[ztn(n.data.taskNum)];
    		found = true;
		break;
		}
	    n = n.next;
	    }
	}

    if (n && found) {
	id = n.id;
	n.data.in_process = true;
	--task.chunks;
	n.data.opu = reply.opu_nr;
	glob.recentRunningTask = n.data.taskNum;
	socket.write(JSON.stringify({id: id, command:'process', opu_nr: reply.opu_nr, data:n.data})+"\n");
	Q.unlock(lc);
	}
    else Q.unlock(lc);

    return id;

}


module.exports.statementchecker = function statementchecker(statement, task, start) {

    if (!this.constrains(statement, task, start)) return '';

    if (this.functiondetector(statement, task, start)) return '';

    if (task.mode == 'par' && start.value != 'for' && 
	(new RegExp(this.escapeRegExp("continue")).test(statement) || new RegExp(this.escapeRegExp("break")).test(statement))) 
	statement = statement.replace(/continue/, "return").replace(/break/,"return");

    return statement;

}

module.exports.enqueuer = function enqueuer(task, q, ast, precode, code) {

    if (code == '') return;

    var setvars = {};
    for (var sv in task.vars) {
	if (task.vars[sv].setvars == true || task.vars[sv].const == true) {
	    setvars[sv] = {};
	    for (var svall in task.vars[sv]) {
		setvars[sv][svall] = task.vars[sv][svall];
		}
	    }
	}

    var l = q.lock();
    ++task.chunks;
    q.enqueue({
	vars: setvars,
	taskNum: task.taskNum,
	funcs: task.funcs,
	precode: precode,
	code: code,
	opu: -1,
	in_process: false,
	wait_id: task.next_wait_id,
	id: q.next_node_id,
	mode: task.mode
	});
    q.unlock(l);

    this.wakeupOne();
}

module.exports.wakeupOne = function wakeupOne() {

    if (idleList.length == 0) {
	return;
	}

    var that = this;
    var opu_nr = idleList[0];
    var opuCl = opuClients[opu_nr];
    if (opuCl.active && !opuCl.ehandler) {
	opuClients[opu_nr].ehandler = true;
        opuCl.socket.prependOnceListener('error', function(err) {
	    // OPU gone
	    console.log("OPU #"+opu_nr+" had gone");
	    opuClients[opu_nr].active = false;
	    if (that.wakeupOne) that.wakeupOne();
	    inWakeError = true;
	    opuClients[opu_nr].ehandler = false;
	    });
	}
    idleList.shift();
    if (opuCl.active) opuCl.socket.write(JSON.stringify({opu_nr: opu_nr, id:'0', command:'wakeup'}));
    else {
	inWakeError = true;
	if (that.wakeupOne) that.wakeupOne();
	inWakeError = false;
	}
}

module.exports.detectsetvars = function detectsetvars(task, ast) {

	var v = '';

	ast.walk(new uglify.TreeWalker(function(node) {
	    if (node.TYPE == "New") return true;
	    if (node.TYPE == "Function") return true;
	    if (node.TYPE == 'Dot' && node.property == 'prototype') return true;
	    if (node.TYPE == "Assign") {
		node.left.walk(new uglify.TreeWalker(function(nodeleft) {
		    if (nodeleft.TYPE == 'Dot' && nodeleft.property == 'prototype') return true;
		    if (nodeleft.TYPE == 'SymbolVar' || nodeleft.TYPE == 'SymbolRef') {
			v = nodeleft.start.value;
			if (v == 'global') return false;
			if (task.vars[v] == undefined) task.vars[v] = {name: v, value: undefined, setvars: true};
			else if (!task.vars[v].parvar /* || task.mode !== 'par' */)
			    task.vars[v].setvars = true;
	    		return false;
	    		}
	    	    return false;
	    	    }));
		}
	    else if (node.TYPE == "Var") {
		node.walk(new uglify.TreeWalker(function(nodebody) {
		    if (nodebody.TYPE == 'Dot' && nodebody.property == 'prototype') return true;
		    if (nodebody.TYPE == 'VarDef')  {
			v = nodebody.start.value;
			if (v == 'global') return false;
			if (task.vars[v] == undefined) task.vars[v] = {name: v, value: undefined, setvars: true};
			else if (!task.vars[v].parvar /* || task.mode != 'par' */)
			    task.vars[v].setvars = true;
	    		return false;
	    		}
	    	    return false;
	    	    }));
		}
	    return false;
	    }));
}

module.exports.parvardetector = function parvardetector(task, ast) {

    if (task.noautoparvar) return {precode: precode, postcode: postcode};

    var precode = '', postcode = '';
    var setisset = false;
    var v = null;

    ast.walk(new uglify.TreeWalker(function(node) {
	setisset = false;
	if (node.TYPE == "Assign") {
	    node.left.walk(new uglify.TreeWalker(function(nodeleft) {
		if (nodeleft.TYPE == 'SymbolVar' || nodeleft.TYPE == 'SymbolRef') {
		    v = nodeleft.start.value;
		    if (task.vars[v] && task.vars[v].parvar == true) {
	    		postcode += "\n__set_Par_Var_Value('"+v+"', "+v+", __job, false);\n";
			setisset = true;
	    		return false;
	    		}
	    	    }
	    	return false;
	    	}));
	    node.right.walk(new uglify.TreeWalker(function(noderight) {
		if (noderight.TYPE == 'SymbolVar' || noderight.TYPE == 'SymbolRef') {
		    v = noderight.start.value;
		    if (task.vars[v] && task.vars[v].parvar == true) {
	    		precode += "\n"+v+"=__get_Par_Var_Value('"+v+"', "+((setisset)?'true':'false')+", __job);\n";
	    		return false;
	    		}
	    	    }
	    	return false;
	    	}));
	    }
	if (node.TYPE == "Var") {
	    node.walk(new uglify.TreeWalker(function(nodebody) {
		if (nodebody.TYPE == 'VarDef')  {
		    v = nodebody.start.value;
		    if (task.vars[v] && task.vars[v].parvar == true) {
	    		postcode += "\n__set_Par_Var_Value('"+v+"', "+v+", __job, false);\n";
			setisset = true;
	    		return false;
	    		}
	    	    }
	    	if (nodebody.TYPE == 'SymbolRef') {
		    v = nodebody.start.value;
		    if (task.vars[v] && task.vars[v].parvar == true) {
	    		precode += "\n"+v+"=__get_Par_Var_Value('"+v+"', "+((setisset)?'true':'false')+", __job);\n";
	    		return false;
	    		}
	    	    }
	    	return false;
	    	}));
	    }
	return false;
	}));

    return {precode: precode, postcode: postcode};

}

var setVars = function(vars, task) {

    for (var sv in vars) {
	if (vars[sv].setvars && !vars[sv].parvar) {
	    task.vars[sv].value = vars[sv].value;
	    }
	}
 
    for (var v in task.vars) {
	if (task.vars[v].cached) {
	    if (task.cachedVars[v] == undefined) {
		task.cachedVars[v] = {name: v, value: undefined};
		}
	    else if (task.vars[v].value != undefined) {
		task.cachedVars[v].value = JSON.parse(JSON.stringify(task.vars[v]['value']));
		task.vars[v].value = undefined;
		}
	    }
	}
}

module.exports.escapeRegExp = function escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

module.exports.constrains = function constrains(st, task, start) {

    if (new RegExp(this.escapeRegExp("require(")).test(st)) {
	console.error('Task #' + task.taskNum + ': Line ' + start.line + ": Function 'require()' is forbidden");
	return false;
	}

    if (new RegExp(this.escapeRegExp("process.")).test(st)) {
	console.error('Task #' + task.taskNum + ': Line ' + start.line + ": Module 'process' is forbidden");
	return false;
	}
//    if (new RegExp(this.escapeRegExp("fs.")).test(st)) {
//	console.error('Task #' + task.taskNum + ': Line ' + start.line + ": Module 'fs' is forbidden");
//	return false;
//	}

    if (new RegExp(this.escapeRegExp("child_process")).test(st)) {
	console.error('Task #' + task.taskNum + ': Line ' + start.line + ": Module 'child_process' is forbidden");
	return false;
	}

//    if (task.mode == 'par' && start.value != 'for' && new RegExp(this.escapeRegExp("break")).test(st)) {
//	console.error('Task #' + task.taskNum + ': Line ' + start.line + ": 'break' in parallel context is forbidden. Replaced with 'return'.");
//	return true;
//	}

//    if (task.mode == 'par' && start.value != 'for' && new RegExp(this.escapeRegExp("continue")).test(st)) {
//	console.error('Task #' + task.taskNum + ': Line ' + start.line + ": 'continue' in parallel context is forbidden. Replaced with 'return'.");
//	return true;
//	}

    return true;
}

module.exports.functiondetector = function functiondetector(st, task, start) {
    if (start.value == 'function') {
	return true;
	}
    return false;
}
