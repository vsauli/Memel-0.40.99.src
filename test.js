// Test sample
//#pragma parallel
for (var i=0; i<8; i++) {
    //#pragma sequential
    var k=0;
    for (var j=0; j<1000000000; j++) {
        k = k + i + 1;
        }
    }
//#pragma wait
