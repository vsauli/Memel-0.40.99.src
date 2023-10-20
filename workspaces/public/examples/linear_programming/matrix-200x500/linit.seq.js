//#pragma sequential

dfltParams = {
    NORM : 1,
    IDEF : 1,
    MXMN : -1,
    DEL : 1.e-5,
    NIU : 0.1,
    EPS : 0.0,
    DZV : 0.2
    };

var rp = true;
var params = {};
var dz = [0,0,0];
var g = [];
var h = [[0],[0],[0]];
var hm = [];
var hm1 = [];
var sm = [], sn = [], sp = [];
var x = [], y = [];
var m = [];
var z = [];
var b = [];
var h1 = [];
var xg, fg;
var iter;
var kbh;
var ppstr;
var effDEL;
var funcalls = 0, funcallsp;

var res = fs.readFileSync("linit.prm.json");
try {params = JSON.parse(res.toString(), null);}
catch(err){console.log(err.message);}

for (var p in dfltParams) {
    if (!params[p]) params[p] = dfltParams[p];
}

for (var p in params) {
    eval(p +'= params["'+p+'"]');  // I know it's ugly
}

var np1 = NP1;
var mp1 = MP1;
var n = np1-1;
var np11 = np1+1, mp11 = mp1+1 ,i;
var kbh=0;

for (i=1; i<=mp1; i++) g[i]=0;
g[1]=1;

readex(true);

pstr = "NORM="+NORM+" IDEF="+IDEF+" MXMN="+MXMN+" DEL="+DEL+" NIU="+NIU+"\n EPS="+EPS+" DZV="+DZV+" MP1="+MP1+" NP1="+NP1;

console.log(pstr);
if (rp) fs.writeFileSync('linit.rpt.jsc', pstr+'\n');

Linit();

console.log("\nsn[i] = ");
if (rp) fs.appendFileSync('linit.rpt.jsc', "\n sn[i] = ");

for (i=1;i<=np1-1;i++) {
    if (rp) fs.appendFileSync('linit.rpt.jsc',sn[i]+ "  ");
    if (i%3 == 0) {
        if (rp) fs.appendFileSync('linit.rpt.jsc', "\n");
        }
   }

if (rp) {
    fs.appendFileSync('linit.rpt.jsc', "\nXG="+xg+"   "+"FG="+fg+"\n");
    console.log("\nXG="+xg+"   "+"FG="+fg+"\n");
   }

console.log(" End of solution \n");

// Functions start here
function max(a,b) {
    return a > b ? a : b; 
    }

function min(a,b) {
    return a < b ? a : b; 
    }

function readex(fromfile) {

    var i, j;
    var data = {};
    var mp1 = MP1, np1 = NP1;

    if (fromfile) {
	    var res = fs.readFileSync("linit.data.json");
	    data = JSON.parse(res, null);
	    hm = data.hm;
	    sm = data.sm;
	    sp = data.sp;
	    }
}

function Linit() {

    var alfa, alf1;
    var lamnor, niuf;
    var xgnorm;

    var ind=0;
    var i, j, n, i_n, it_entr;
    var DELsave, DELs;
    var start_time = new Date().getTime();
    console.log(start_time);
    if (rp) fs.appendFileSync('linit.rpt.jsc', start_time + "\n");
    var finish_time;
    var elapse_time;

    n=np1-1;

    for (i=1;i<=n;i++) hm[1][i] = -1.0*MXMN*hm[1][i];

    if (NORM == 0) lamnor = Hnorm();

    if (EPS == 0) Epsdef();

    if (rp)
	    fs.appendFileSync('linit.rpt.jsc', "\nIter      F(g)     (X,g)    //X//g   Ind Nr.       Eps      Alfa  It_entry\n");
    console.log("\nIter      F(g)     (X,g)    //X//g   Ind Nr.       Eps      Alfa  It_entry\n");

    iter = 1;
    ind=0;
    DELsave = DEL;

    while (iter<=5000 && ind != 3) { 
	    DEL = DELsave;
	    ind=2;
	    it_entr = 0;
	    effDEL = DEL;
	
	    while (ind == 2) {

    	    i_n = Minxg();
    	    for (i=1;i<=n;i++) {
		        for (j=1;j<=mp1;j++) hm1[j] = hm[j][i];
		        h[2][i] = Skabg(x,hm1,1,mp1);
		        }

    	    ind=1;
            DELs = DEL;
    	    
    	    while (ind == 1) {

		        ind = Mnxgco();
		        xgnorm = Skabg(x,x,2,mp1);
		        ind = Analys(ind);

		        it_entr = it_entr + 1;
		        if (it_entr%500 == 0) {
		            DEL = DEL * 2.0;
		            if (DEL > 0.3) DEL = 0.3;
		            effDEL = DEL;
		            if (rp)
    			        fs.appendFileSync('linit.rpt.jsc',""+it_entr + "  " + DEL + "\n");
		            console.log(""+it_entr + "  " + DEL);
		            }
		        }
    	    DEL=DELs;
    	    }

	    for (i=1; i<=mp1; i++) hm1[i] = hm[i][np1];
	    dz[1] = Hb(hm1,g,mp1);
	    dz[2] = Skabg(hm1,y,1,mp1);
	    alfa = Mxmnxg();
	    alf1 = 1-alfa*y[1];
	    for (i=1; i<=mp1 ; i++) g[i] = alf1*g[i] + alfa*y[i];

	    if (rp)
    	    fs.appendFileSync('linit.rpt.jsc',strf(iter,4)+" "+strf(fg,10)+" "+strf(xg,10)+" "+strf(xgnorm,10)+" "+strf(i_n,10)+" "+strf(EPS,10)+" "+strf(alfa,10)+" "+strf(it_entr,6)+"\n");
        console.log(strf(iter,4)+" "+strf(fg,10)+" "+strf(xg,10)+" "+strf(xgnorm,10)+" "+strf(i_n,10)+" "+strf(EPS,10)+" "+strf(alfa,10)+" "+strf(it_entr,6));

	    xg = Hb(x,g,mp1);
	    niuf = 2* Math.abs(fg-xg)/ Math.abs(fg+xg);
	    if (niuf < NIU/2 ) EPS = EPS*1.25;

	    iter = iter + 1;

	    }
    if (ind != 3 ) {
	    if (rp) fs.appendFileSync('linit.rpt.jsc'," No solution after more than 200 iterations !\n");
	    console.log (" No solution after more than 200 iterations !\n");
	    }

    for (i=1; i<=np1; i++) hm[1][i] = -1*MXMN*hm[1][i];

    finish_time = new Date().getTime();
    console.log(finish_time);
    if (rp) fs.appendFileSync('linit.rpt.jsc', finish_time + "\n");
    elapse_time = (finish_time - start_time) / 1000;
    console.log("Elapse time: " + elapse_time + " sec");
    if (rp) fs.appendFileSync('linit.rpt.jsc', "Elapse time: " + elapse_time + " sec\n");

}

function strf(num, len) {

    var bl = "";
    for (var i=1; i<=len; i++) bl+=" ";
    var ns = num.toString() + bl;
    return ns.substr(0,len);
}


function Minxg() {

    var hmg = 0.;
    var i, j, i_n;

    for (i=1; i<=n ;i++) {
	    for (j=1; j<=mp1; j++) hm1[j] = hm[j][i];
	    h[1][i] = Hb(hm1,g,mp1);
	    if (h[1][i] > 0.) sn[i] = sm[i];
	    else sn[i] = sp[i];
	    }

    for (i=1; i<=mp1; i++) {
	    x[i] = hm[i][np1];
	    for (j=1; j<=n; j++) x[i] += hm[i][j]*sn[j];
	    }

    fg = Hb(x,g,mp1);

    i_n=0;

    for (i=1; i<=n; i++) {
	    for (j=1; j<=mp1; j++) hm1[j] = hm[j][i];
	    hmg = Skabg(hm1,hm1,2,mp1);
	    m[i]=0;
	    if (Math.abs(h[1][i]) <= EPS*hmg) {
    	    m[i] = 1;
    	    i_n++;
    	    }
	    }

    return(i_n);

}

function Analys(ind1) {

    var d=0., niuf=0., s=0., xgnorm=0.;
    var i, j, kt, ind = 0;

    xg = Hb(x,g,mp1);
    if (fg + xg != 0. ) {
	    niuf = 2.* Math.abs((fg-xg))/ Math.abs((fg+xg));
	    if (niuf > NIU ) {
    	    ind = 2;
    	    EPS = EPS*0.75;
    	    }
	    }

    if (ind != 2) {
	    kt = 0;
	    if (Math.abs((x[1]-xg)) > DEL ) kt = 1;
	    for (i=2; i<=mp1; i++) {
    	    if (Math.abs(x[i]) > DEL ) kt = 1;
    	    }
	    if ( kt == 0) ind = 3;
	    if ( ind != 3) {
    	    xgnorm = Skabg(x,x,2,mp1);
    	    y[1] = (x[1]-xg)/xgnorm;
    	    for (i=2; i<=mp1; i++) y[i] = x[i]/xgnorm;
    	    for (i=1; i<=n; i++) {
		        for (j=1; j<=mp1; j++) hm1[j] = hm[j][i];
		        h[2][i] = Skabg(hm1,y,1,mp1);
		        }
    	    d = 0.;
    	    for (i=1; i<=n; i++) {
		        if ( m[i] != 0 ) {
		            if (h[2][i] > 0.) s = sn[i] - sm[i];
		            else s = sn[i] - sp[i];
		            d = d + h[2][i]*s;
		            }
		        }
    	    d = d/xgnorm;
    	    if (d >= DZV) ind = 1;
    	    }
	    }

    if (ind1 == 0) return(0);
    return(ind);

}

function Mnxgco() {


    var dels = 0., del = 0., temp = 0.;
    var fdels = 0., fdels_old = 0., fdels_diff = 0.;

    var dz1, dz2, i, j;
    var iter_out = 0, iter_in = 0;

    do {
	    dz1 = 0;
	    dz2 = 0;

	    for (i=1; i<=n; i++) if (m[i]>0) m[i] = 2;

	    iter_in = 0;

	    do {

    	    if (dz1 == 0 && dz2 == 1 ) dz1 = 1;
    	    dz2 = 0;
    	    for (i=1; i<=n; i++) {
		        if ( m[i] == 2) {
		            for (j=1; j<=mp1; j++) hm1[j] = hm[j][i];
		            temp = Skabg(hm1,hm1,2,mp1);
		            del = Skabg(x,hm1,1,mp1)/(-temp*temp);
		            if (del < 0. ) dels=max(del,(sm[i]-sn[i]));
		            else dels=min(del,(sp[i]-sn[i]));
		            for (j=1; j<=mp1; j++) x[j] += dels*hm1[j];
		            sn[i] += dels;
		            if (sn[i]==sp[i] || sn[i]==sm[i]) {
			            m[i] = 1;
			            dz2 = 1;
			            }
		            }
		        }
    	    iter_in = iter_in + 1;
    	    fdels = Math.abs(dels);
    	    if (fdels < effDEL*effDEL) {
    		    return(1);
    		    }
    	    fdels_diff = (fdels_old == 0.) ? 1000. : Math.abs(fdels - fdels_old);
    	    fdels_old = fdels;
    	    } while (dz2 == 1);

	    iter_out=iter_out+1;
	    if (fdels_diff < effDEL*effDEL || iter_out%3000 == 0) {
	        effDEL = effDEL * 2.0;
	        }
	    } while(dz1==1 && dz2 == 0 && iter_out <= 7000);

    for (i=1; i<=n; i++)
        if (m[i] !=0 && sn[i]<sp[i] && sn[i] > sm[i]) m[i] = 2;

    return(1);
}


function Mxmnxg() {

    var bm = [0.,0.,1.], bp=[0.,1.,0.];
    var b = [0.,0.,1.]; 
    var z=[0.,0.,0.]; 
    h1=[0.,0.,0.];
    var i, j, itr = 0;

    Zdef(b, z);

    if (z[2] > 0.) {
	    return 0.;
	    }

    while(itr<=20) {

	    b[1] = (bp[1]+bm[1])/2.;
	    b[2] = (bp[2]+bm[2])/2.;
	    itr = itr + 1;
	    Zdef(b, z);

	    if (z[2] <= 0.) {
    	    bm[1] = b[1];
    	    bm[2] = b[2];
    	    }
	    else {
    	    bp[1] = b[1];
    	    bp[2] = b[2];
    	    }
	    }

    return(b[2]/b[1]);

}

function Zdef(b, z) {

    var sn1 = 0.;
    var i, j;

    for (i=1; i<=2; i++) {
	    z[i]=dz[i];
	    for (j=1; j<=n; j++) {
    	    h1[1]=h[1][j];
    	    h1[2]=h[2][j];
    	    if ( Hb(h1,b,2) > 0. ) sn1 = sm[j];
    	    else sn1 = sp[j];
    	    z[i] = z[i] + sn1*h[i][j];
    	    }
	    }

}

function Hnorm() {

    var lam = 0., xnor = 0.;
    var i, j;

    for (i=1; i<=n; i++) hm1[i] = hm[1][i];
    lam = Hb(hm1,hm1,n);
    lam = Math.sqrt(lam);
    for (i=1; i<=n; i++) hm[1][i]= hm[1][i]/lam;

    for (j=2; j<=mp1; j++) {
	    for (i=1; i<=n; i++) hm1[i] = hm[j][i];
	    xnor = Hb(hm1,hm1,n);
	    xnor = Math.sqrt(xnor);
	    for (i=1; i<=n; i++) hm[j][i]= hm[j][i]/xnor;
	    }

    return (lam);
}


function Epsdef () {

    var deps = [];
    var hmg = 0., ruf = 0.;
    var i, j, ip1;

    for (i=1;i<=n;i++) {
	    for (j=1;j<=mp1;j++) hm1[j] = hm[j][i];
	    hmg = Skabg(hm1,hm1,2,mp1);
	    deps[i] = Math.abs(h[1][i])/hmg;
	    }

    for (i=1;i<=n;i++) {
	    ip1=i+1;
	    for(j=ip1;j<=n;j++) {
    	    if (deps[i]<deps[j]) {
		        ruf = deps[j];
		        deps[j] = deps[i];
		        deps[i] = ruf;
		        }
    	    }
	    }

    EPS = (deps[IDEF] + deps[IDEF+1]) / 2.;

}

function Hb(hh, bb, nn) {

    var hb = 0.;
    var i;

    for (i=1; i<=nn; i++) hb += hh[i]*bb[i];

    return(hb);

}

function Skabg(a, b, i_nn, nn) {

    var ag = 0., skbg = 0.;
    var i;

    for (i=1; i<=nn; i++) ag = ag + a[i]*g[i];

    if (i_nn==1) {
	    skbg = (a[1]-ag)*b[1];
	    for (i=2;i<=nn;i++) {
    	    skbg = skbg + a[i]*b[i];
    	    }
	    return(skbg);
	    }
    else {
	    skbg = (a[1]-ag)*(a[1]-ag);
	    for (i=2;i<=nn;i++) {
    	    skbg = skbg + a[i]*a[i];
    	    }
	    }

    return(Math.sqrt(skbg));

}
