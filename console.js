// define a new console
var console=(function(oldCons){
    return {
        log: function(text){
                oldCons.log(text);
                // Your code
            },
        info: function (text) {
                oldCons.info(text);
                // Your code
            },
        warn: function (text) {
                oldCons.warn(text);
                // Your code
            },
        error: function (text) {
                oldCons.error(text);
    	        // Your code
    	    }
    };
}(window.console));
                                                                                                                                                                    //Then redefine the old console
                                                                                                                                                                        window.console = console;