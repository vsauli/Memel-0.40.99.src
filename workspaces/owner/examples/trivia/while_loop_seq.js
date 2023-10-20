//#pragma sequential
//#pragma starttime
var a = 1;
var b = 2;
var k = 0;
console.log('a='+a);
while (b < 10 && a > 0) {
    b = b + 1;
    a = a + 1;
    console.log('b='+b);
    for (var i=0; i<8; i++) {
        var z = 0;
        console.log('i = ' + i);
        for (var j=0; j<1000000000; j++) {
            z = j + i + 1;
            }
        k = k + z;
        console.log('k = ' + k);
        }
    a = a +1;
    b = b +1;
    console.log('--b='+b);
    }
//#pragma endtime
console.log('k='+k);
