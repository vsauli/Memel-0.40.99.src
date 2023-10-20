// Parallel function calls demo
//
//#pragma starttime
//#pragma sequential
var n1, n2, n3, n4, n5, n6, n7, n8;
//#pragma wait
//#pragma parallel
console.log('n1 = '+(n1 = long_func(1)));
console.log('n2 = '+(n2 = long_func(2)));
console.log('n3 = '+(n3 = long_func(3)));
console.log('n4 = '+(n4 = long_func(4)));
console.log('n5 = '+(n5 = long_func(5)));
console.log('n6 = '+(n6 = long_func(6)));
console.log('n7 = '+(n7 = long_func(7)));
console.log('n8 = '+(n8 = long_func(8)));
//#pragma wait
//#pragma sequential
var k = n1 + n2 + n3 + n4 + n5 + n6 + n7 + n8;
//#pragma endtime
console.log('k= '+k);

function long_func(n) {
    var j=0;
    for (var i=0; i<1000000000; i++) {
        j = j + n + 1;
    }
    return j;
}