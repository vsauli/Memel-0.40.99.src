// use --max-old-space-size=2048 with node binary
// Embarrassingly parallel NAS benchmark

//#pragma sequential
var start_time = new Date().getTime();
var finish_time;
var elapse_time;
console.log("Program started");

var OPUS = 1;

var n = 268435456;  // 2^28  - Class A
//var n = 1073741824; // 2^30  - Class B

var x1, x2, sx = 0, sy = 0;
var t1, t2, t3, t4;
var l;
var q = [0,0,0,0,0,0,0,0,0,0];

for (var i = 0; i < n; i++) {
    x1 = 2 * Math.random() - 1;
    x2 = 2 * Math.random() - 1;
    t1 = x1 * x1 + x2 * x2;
    if (t1 <= 1.0) {
	t2 = Math.sqrt(-2.0 * Math.log(t1) / t1);
	t3 = x1 * t2;
	t4 = x2 * t2;
	l = Math.floor(Math.max(Math.abs(t3), Math.abs(t4)));
	q[l] = q[l] + 1;
	sx += t3;
	sy += t4;
	}
    }


finish_time = new Date().getTime();
elapse_time = (finish_time - start_time) / 1000;
console.log("Elapse time: " + elapse_time + " sec\n");


var timchk = 0;
var sxtchk = 0;
var syschk = 0;
var qchk = [];

if (n == 268435456) {
    timchk = 70.0;
    sxchk = -4.295875165629892e3;
    sychk = -1.580732573678431e4;
    qchk = [98257395, 93827014, 17611549, 1110028, 26536, 245, 0, 0, 0, 0];
    }
if (n == 1073741824) {
    timchk = 267.5;
    sxchk = 4.033815542441498e4;
    sychk = -2.660669192809235e4;
    qchk = [393058470, 375280898, 70460742, 4438852, 105691, 948, 5, 0, 0, 0];
    }


console.log("Problem size: n = " + n);
console.log("Total execution time:     " + elapse_time);
console.log("Reference execution time: " + timchk);

console.log("\n");
console.log("Computed sx:     " + sx);
console.log("Reference value: " + sxchk);
console.log("\n");
console.log("Computed sy:     " + sy);
console.log("Reference value: " + sychk);
console.log("\n");
console.log("Q values: ");
console.log(q);
console.log("Reference Q values: ");
console.log(qchk);


