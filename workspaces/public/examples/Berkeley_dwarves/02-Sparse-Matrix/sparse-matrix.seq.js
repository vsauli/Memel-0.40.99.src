// use --max-old-space-size=2048 with node binary
// Berkeley NESL sparce matrix format

//#pragma parvar a   // to avoid transferring 'a' to the server
//#pragma sequential
var start_time = new Date().getTime();
var finish_time;
var elapse_time;


var OPUS = 8;

var a = [];

var n = 14000;
var non_zeros = 11;
var niter = 15;
var nitcg = 25;
var rcond = 0.1;
var nzc;

var x = [];
var zeta = 0.;
var zeta1 = 0.
var zeta2 = 0.
var zetapr = 0.
var resid = 0.
var maxval = 0.

var z = [];
var r = [];
var p = [];
var q = [];
var rho = 0.;
var rho0 = 0.;
var alpha = 0.;
var beta = 0.;

var iter;
var itcg;

var aij;

makea();

finish_time = new Date().getTime();
elapse_time = (finish_time - start_time) / 1000;
console.log("Matrix creation time: " + elapse_time + " sec");
start_time = finish_time;

for (i = 0; i < n; i++) x[i] = 1.;
// main loop
iter = 1;
////#pragma dive
while (iter <= niter) {

    for (i = 0; i < n; i++) z[i] = 0.;
    rho = dotp(x, x);
    for (i = 0; i < n; i++) r[i] = x[i];
    for (i = 0; i < n; i++) p[i] = x[i];

    itcg = 1;
    ////#pragma dive
    while (itcg <= nitcg) {
    
	for (i = 0; i < n; i++) q[i] = 0.;

	// q = A*p
	////#pragma parvar q
	////#pragma parvar p   ?
	////#pragma noautoparvar
	////#pragma parallel
//	for (ch = 0; ch < OPUS; ch++) {
	var smatvec_time = new Date().getTime();
	for (i = 0; i < n; i++) {
	    q[i] = 0;
	    for (var j of a[i]) {
		q[i] = q[i] + j[1] * p[j[0]];
		}
	    }
	var fmatvec_time = new Date().getTime();
	var matvec_time = (fmatvec_time - smatvec_time) / 1000;
	////#pragma wait
	////#pragma sequential
	alpha = rho / dotp(p, q);
	for (i = 0; i < n; i++) z[i] = z[i] + alpha * p[i];
	rho0 = rho;
	for (i = 0; i < n; i++) r[i] = r[i] - alpha * q[i];
	rho = dotp(r, r);
	beta = rho / rho0;
	for (i = 0; i < n; i++) p[i] = r[i] + beta * p[i];
	
	itcg++;
//	console.log("itcg="+itcg);
	}

    // r = A*z
    ////#pragma parvar r
    //////#pragma parvar z   ?
    ////#pragma noautoparvar
    ////#pragma parallel
//    for (ch = 0; ch < OPUS; ch++) {
    for (i = 0; i < n; i++) {
	r[i] = 0;
	for (var j of a[i]) {
	    r[i] = r[i] + j[1] * z[j[0]];
	    }
	}
    ////#pragma wait
    ////#pragma sequential

    for (i = 0; i < n; i++) r[i] = x[i] - r[i];
    resid = Math.sqrt(dotp(r, r));
    zeta1 = zeta;
    zeta2 = zeta1;
    maxval = 0.;
    for (i = 0; i < n; i++) {
	var az = Math.abs(z[i]);
	if (az > maxval) maxval = az;
	}
    zeta = 1. / maxval;
    zetapr = zeta - (zeta-zeta1)*(zeta-zeta1)/(zeta-2.0*zeta1+zeta2);
    for (i = 0; i < n; i++) x[i] = z[i] * zeta;

    iter++;
//    console.log("iter="+iter);
    }

////#pragma wait
////#pragma sequential
finish_time = new Date().getTime();
elapse_time = (finish_time - start_time) / 1000;
console.log("Elapse time: " + elapse_time + " sec\n");
console.log("MATVEC time: " + matvec_time + " sec\n");

var matops = 2*nzc;
var opscg = 5*n + matops + nitcg*(matops + 10*n + 2);
var ops = niter * (opscg + n + 1);
var flops = 1.0e-6 * ops / elapse_time;

var timchk = 0;
var zetchk = 0;
var reschk = 0;

if (n == 1400) {
    timchk = 1.0538;
    zetchk = 0.10188582986104;
    reschk = 0.6241e-5;
    }
if (n == 14000) {
    timchk = 21.77;
    zetchk = 0.101249586035172;
    reschk = 3.5094e-4;
    }

console.log("Total number of operations: " + ops);
console.log("Total execution time: " + elapse_time);
console.log("Performance in mflops: " + flops);
console.log("Ratio: this machine/ymp(1cpu): " + timchk/elapse_time);
console.log("\n");
console.log("Computed zeta:   " + zetapr);
console.log("Reference value: " + zetchk);
console.log("\n");
console.log("Computed residual: " + resid);
console.log("Reference value:   " + reschk);


function makea() {

    var r = [];  // sparce array for non-zero random columns
    var sa = []; // native sparce version of matrix a
    var size;
    
    for (i = 0; i < n; i++) {
	sa[i] = [];
	}
    for (i = 0; i < n; i++) {
	r = [];
	for (j = 1; j <= non_zeros; j++) {
	    r[Math.floor(Math.random()*n)] = Math.random();
	    }
	while(r.reduce(function(t){++t}) < non_zeros) {  // while there was dublicates
	    r[Math.floor(Math.random()*n)] = Math.random();
	    }
	r[i] = 0.5;
	
	size = Math.pow(rcond, i/n);
	
	for (j in r) {
	    for (k in r) {
		if (!sa[j][k]) sa[j][k] = 0.
		sa[j][k] += r[j]*r[k]*size;
		}
	    }
	
	}

    for (i = 0; i < n; i++) {
	if (!sa[i][i]) sa[i][i] = 0.
        sa[i][i] += rcond;
        }

finish_time = new Date().getTime();
elapse_time = (finish_time - start_time) / 1000;
console.log("Base matrix creation time: " + elapse_time + " sec");
start_time = finish_time;
//    console.log(sa);

    // make compressed sparse matrix 'a' like in nesl example's SPARSE function
    nzc = 0;
    for (i = 0; i < n; i++) {
	a[i] = [];
	for (j in sa[i]) {
	    a[i].push([j*1, sa[i][j]+0.0]);
	    }
	nzc += a[i].length;
	sa[i] = null ;  // reduce memory
//	delete sa[i];
	}
//    delete sa;
    console.log("Final nonzero count: " + nzc);
//    console.log(a);

}

function dotp(v1, v2) {

    var res = 0.;

    for (var ii = 0; ii < n; ii++) res += v1[ii] * v2[ii];

    return res;
}
