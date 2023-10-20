// Sequential Loop sample
//
//#pragma starttime
//#pragma sequential
var k = 0;
for (var i=0; i<8; i++) {
    console.log('i = ' + i);
    var z = 0;
    for (var j=0; j<1000000000; j++) {
        z = j + i + 1;
        }
    k = k + z;
    console.log('k = '+ k);
    }
//#pragma endtime
console.log('k = ' + k);