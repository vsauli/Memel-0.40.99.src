var __st = new Date().getTime(), __nd = Math.floor(Math.random()*100)+Math.floor(__st/15000000000);
for (var __ii = 1; __ii<=__nd; __ii++) __ms = Math.random()*1000;
while (new Date().getTime() - __st < __ms);
