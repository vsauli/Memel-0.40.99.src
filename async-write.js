const file = require("fs").createWriteStream("./test.dat");

(async() => {

    for(let i = 0; i < 1e7; i++) {
        if(!file.write('a')) {
        // Will pause every 16384 iterations until `drain` is emitted
            await new Promise(resolve => file.once('drain', resolve));
            }
        }
})();