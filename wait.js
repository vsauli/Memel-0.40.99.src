var wait = function(condFunc, readyFunc, checkInterval) {
    var checkFunc = function() {
	if(condFunc()) {
             readyFunc(); 
        }
        else {
             setTimeout(checkFunc, checkInterval);
        }
    };
    checkFunc();
};

wait(
     function() { return new Date().getSeconds() == 10; }, 
     function() { console.log("Done"); },
     100
);
console.log('through');