// Parallel Loop sample
//
//#pragma starttime
//#pragma sequential
var k = 0;
//#pragma wait
//#pragma parallel
//#pragma parvar k
for (var i=0; i<8; i++) {
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
//#pragma endtime
console.log('last k = ' + k);