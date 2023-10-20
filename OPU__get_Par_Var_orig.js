function __get_Par_Var_Value(pvar, lock, __job) {

    var pval = null;
    var undef_cnt = 0;

    while(true) {
	var snd = __job.socket.write(JSON.stringify({pvar: pvar, lock: lock, command: 'getvar', tasknum: __job.data.taskNum, opu_nr: __job.opu_nr}));
	__job.socket.blocking(true);

	var chunk = '';
	var res = '';
	var last = '';
	undef_cnt = 0;
	while (true) {
	    chunk = __job.socket.read(102400, true);
	    if (chunk != undefined && chunk.length != 0) { res += chunk.toString(); last = chunk.toString().length;}
	    else if (chunk == undefined && last == 102400) break; // in case file length is multiply of 1024
	    if (!chunk || chunk == undefined) undef_cnt++;
	    if (undef_cnt > 100) break;
    	    for (var i=0; i<50000; i++) {}
	    if (chunk && chunk.length < 102400) break;
	    }

	var response = JSON.parse(res.toString());
	if (undef_cnt > 100) {
	    console.log("after 100 undefineds res.length= " + res.length);
	    break;
	    }
    	if (response && (response.locked == lock || !lock)) break;
    	for (var i=0; i<500000; i++) {}
	}
    return response.pval;
}
