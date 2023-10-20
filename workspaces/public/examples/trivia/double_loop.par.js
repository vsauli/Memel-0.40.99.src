//#pragma sequential
//#pragma starttime
var a = 1;
var b = 2;
var k = 0;
var c = 0;
console.log('a='+a);
//#pragma dive
//#pragma wait
while (b < 10 && a > 0) {
    b = b + 1;
    a = a + 1;
    console.log('b='+b);
    c = 0;
    //#pragma dive
    //#pragma wait
    while (c < 4) {
	    var x = 0;
	    //#pragma wait
	    //#pragma parallel
	    //#pragma parvar k
	    for (var i=0; i<8; i++) {
    	    //#pragma sequential
    	    var z = 0;
    	    console.log('i = ' + i);
    	    for (var j=0; j<1000000000; j++) {
        	z = j + i + 1;
        	}
    	    k = k + z;
    	    console.log('k = ' + k);
    	    }
	    //#pragma wait
	    //#pragma sequential
	    a = a +1;
//	    b = b +1;
	    c = c +1;
	    console.log("inner loop " + c);
	    }
	console.log("outer loop " + a)
    }
//#pragma endtime
console.log('k='+k);
