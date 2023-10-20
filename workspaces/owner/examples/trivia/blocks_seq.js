// Blocks of statements parallelization demo
// Sequential mode
//
// Note that '#pragmas beginblock and endblock' have no effect in sequential mode
//
//#pragma starttime
//#pragma sequential
var k = 0;
var n1, n2, n3, n4, n5, n6, n7, n8;
//#pragma beginblock
console.log('n1 = '+(n1 = long_func(1)));
//#pragma endblock
k = k + n1;
//#pragma beginblock
console.log('n2 = '+(n2 = long_func(2)));
//#pragma endblock
k = k + n2;
//#pragma beginblock
console.log('n3 = '+(n3 = long_func(3)));
//#pragma endblock
k = k + n3;
//#pragma beginblock
console.log('n4 = '+(n4 = long_func(4)));
//#pragma endblock
k = k + n4;
//#pragma beginblock
console.log('n5 = '+(n5 = long_func(5)));
//#pragma endblock
k = k + n5;
//#pragma beginblock
console.log('n6 = '+(n6 = long_func(6)));
//#pragma endblock
k = k + n6;
//#pragma beginblock
console.log('n7 = '+(n7 = long_func(7)));
//#pragma endblock
k = k + n7;
//#pragma beginblock
console.log('n8 = '+(n8 = long_func(8)));
//#pragma endblock
k = k + n8;
//#pragma endtime
console.log('k= '+k);

function long_func(n) {
    var j=0;
    for (var i=0; i<1000000000; i++) {
        j = j + n + 1;
    }
    return j;
}