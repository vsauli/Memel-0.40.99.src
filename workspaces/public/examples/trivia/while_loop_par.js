//#pragma sequential
//#pragma starttime
var a = 1;
var b = 2;
var k = 0;
console.log('a='+a);
//#pragma dive
//#pragma wait
while (b < 10 && a > 0) {
    b = b + 1;
    a = a + 1;
    console.log('b='+b);
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
    b = b +1;
    }
//#pragma endtime
console.log('k='+k);
