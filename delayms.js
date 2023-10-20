var a = new Date().getTime();
while (new Date().getTime() - a < 1000);
console.log(a);
