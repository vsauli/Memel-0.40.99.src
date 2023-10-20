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

var NORM, // these must be explicitly defined to receive further values.
    IDEF,
    MXMN,
    DEL,
    NIU,
    EPS,
    DZV,
    NP1,
    MP1;

var rp = true;
params = {};
var dz = [0.,0.,0.];
var g = [], g_save = [];
var g5 = [[0],[0],[0],[0],[0],[0],[0],[0],[0],[0],[0]]; // prevent array from a jam by JSON.stringify
var h = [];
var hm = [];
var hm1 = [];
var sm = [], sn = [];
var sn5 = [[0],[0],[0],[0],[0],[0],[0],[0],[0],[0],[0]];
var sp = [];
var x = [], x5 = [[0],[0],[0],[0],[0],[0],[0],[0],[0],[0],[0]]; 
var y = [], y5 = [[0],[0],[0],[0],[0],[0],[0],[0],[0],[0],[0]];
var m = [];
var z = [];
var b = [];
var h1 = [];
var xg, fg;
var xg5 = [0,0,0,0,0,0,0,0,0,0,0];
var fg5 = [0,0,0,0,0,0,0,0,0,0,0];
var iter;
var kbh;
var pstr;
var effDEL;
var funcalls = 0, funcallsp;

// get params from file
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
var np11 = np1+1, mp11 = mp1+1 ,i;
var kbh=0;

for (i=1; i<=mp1; i++) g[i]=0.;
g[1]=1.;

// read initial matrices
readex(true);

pstr = "NORM="+NORM+" IDEF="+IDEF+" MXMN="+MXMN+" DEL="+DEL+" NIU="+NIU+"\n EPS="+EPS+" DZV="+DZV+" MP1="+MP1+" NP1="+NP1;
console.log(pstr);
if (rp) fs.writeFileSync('linit.rpt.jsc', pstr+'\n');

var alfa, alf1;
var lamnor, niuf;
var xgnorm, xgnorm_min;
var xgnorm5 = [0,0,0,0,0,,0,0,0,0,0];
var xg_min;
var ind=0, ind5=[0,0,0,0,0,0,0,0,0,0,0];
var i, j, k, k_max, k_min, n, ind_gt_3;
var i_n, i_n5 = [0,0,0,0,0,0,0,0,0,0,0];
var it_entr;
var DELsave, DELs;

var start_time = new Date().getTime();
console.log(start_time);
if (rp) fs.appendFileSync('linit.rpt.jsc', start_time + "\n");
var finish_time;
var elapse_time;

n=np1-1;
for (i=1;i<=n;i++) hm[1][i] = -1.*MXMN*hm[1][i];

if (NORM == 0) lamnor = Hnorm();
if (EPS == 0) Epsdef();

//#pragma wait
//#pragma cache hm
//#pragma cache sp
//#pragma cache sm
////#pragma cachefuncs
//#pragma sequential
if (rp)
    fs.appendFileSync('linit.rpt.jsc', "\nIter(k)      F(g)     (X,g)    //X//g   Ind Nr.       Eps      Alfa  It_entry\n");
console.log("\nIter(k)      F(g)     (X,g)    //X//g   Ind Nr.       Eps      Alfa  It_entry\n");

iter = 1;
ind=0;
DELsave = DEL;
var EPS5=[EPS,EPS,EPS,EPS,EPS,EPS,EPS,EPS,EPS,EPS,EPS];
var xgnorm5 = [0,0,0,0,0,0,0,0,0,0,0];
var g5 = [[0],[0],[0],[0],[0],[0],[0],[0],[0],[0],[0]];
var sn5 = [[0],[0],[0],[0],[0],[0],[0],[0],[0],[0],[0]];
var eps;
cpvec(g, g_save);

//#pragma dive
//#pragma sequential
  while (iter<=500 && ind != 3) {

    var dummy1 = EPS5; // for lexical analyzer to find EPS5 variable
    var eps = [];
    cpvec(EPS5, eps);

    DEL = DELsave;
    ind=2;

    if (iter == 1) k_max = 1;
    else k_max = 5;

//#pragma wait
//#pragma parallel
//#pragma noautoparvar
//#pragma parvar g5
//#pragma parvar sn5
//#pragma parvar x5
//#pragma parvar y5
//#pragma parvar xg5
//#pragma parvar fg5
//#pragma parvar ind5
//#pragma parvar i_n5
//#pragma parvar xgnorm5
//#pragma parvar EPS5
    for (k=1;k<=k_max;k++) {

        if (!k_min) k_min = 1;
        else EPS = eps[k_min];
//        else EPS = (k == 1)?eps[k_max]:eps[k-1]; 

// For testing another variator algorithm
// EPSmin
//    EPS = eps[1];
//    for (var i=2; i<=k_max;i++) {
//        if (EPS > eps[i]) EPS = eps[i];
//        }

// EPSmax
//    var EPSmax = eps[1];
//    for (var i=2; i<=k_max;i++) {
//        if (EPSmax < eps[i]) EPSmax = eps[i];
//        }
//    EPS = (EPS + EPSmax) / 2; 

	    effDEL = DEL;
	    it_entr = 0;

        var sn = [];
        g = g;        // for lexical analyzer
        DZV = DZV;    //  -- "" --
        m = [];
        x = [];
        fg=0;

	    cpvec(g_save, g);

	    while (ind == 2) {

    	    i_n = Minxg(k);

            for (var ii=1;ii<=n;ii++) {
		        for (j=1;j<=mp1;j++) hm1[j] = hm[j][ii];
		        if (!h[2]) h[2] = [];
		        h[2][ii] = Skabg(x,hm1,1,mp1);
		        }

            ind=1;
            DELs = DEL;

            while (ind == 1) {

	            ind = Mnxgco();
	            xgnorm = Skabg(x,x,2,mp1);
	            ind = Analys(ind);

		        it_entr=it_entr+1;
		        if (it_entr%500 == 0 && it_entr != 0) {
		            DEL = DEL * 1.7;
		            if (DEL > 0.1) DEL = 0.1;
		            effDEL = DEL;
	    
		            if (rp)
    			        fs.appendFileSync('linit.rpt.jsc',""+it_entr + "  " + DEL + "\n");
		            console.log(""+it_entr + "  " + DEL);
		            }
		        } // while (ind == 1)
	    
    	        DEL=DELs;
	        }  // while (ind == 2)
	
        xgnorm5 = __get_Par_Var_Value('xgnorm5', true, __job);
	    xgnorm5[k]=xgnorm;
        __set_Par_Var_Value('xgnorm5', xgnorm5, __job);

        if (ind == 3) {
            ind5 = __get_Par_Var_Value('ind5', true, __job);
	        ind5[k] = ind;
            __set_Par_Var_Value('ind5', ind5, __job);

            sn5 = __get_Par_Var_Value('sn5', true, __job);
//            if (!sn5[k]) sn5[k] = [];
	        cpvec(sn, sn5[k]);
            __set_Par_Var_Value('sn5', sn5, __job);
            }

	    for (i=1; i<=mp1; i++) hm1[i] = hm[i][np1];

	    dz[1] = Hb(hm1,g,mp1);
	    dz[2] = Skabg(hm1,y,1,mp1);
	    alfa = Mxmnxg();
	    if (alfa != 0) {
	        alf1 = 1.-alfa*y[1];
	        for (i=1; i<=mp1 ; i++) g[i] = alf1*g[i] + alfa*y[i];

            g5 = __get_Par_Var_Value('g5', true, __job);
//	        if (!g5[k]) g5[k] = [];
	        cpvec(g, g5[k]);
            __set_Par_Var_Value('g5', g5, __job);

	        xg = Hb(x,g,mp1);
	        if (rp)
    		    fs.appendFileSync('linit.rpt.jsc',strf(iter,4)+"("+k+") "+strf(fg,10)+" "+strf(xg,10)+" "+strf(xgnorm,10)+" "+strf(i_n,10)+" "+strf(EPS,10)+" "+strf(alfa,10)+" "+strf(it_entr,6)+"\n");
    	    console.log(strf(iter,4)+"("+k+") "+strf(fg,10)+" "+strf(xg,10)+" "+strf(xgnorm,10)+" "+strf(i_n,10)+" "+strf(EPS,10)+" "+strf(alfa,10)+" "+strf(it_entr,6));

	        niuf = 2.* Math.abs(fg-xg)/ Math.abs(fg+xg);
	        if (niuf < NIU / 2. ) {
		        EPS = EPS*1.25;
		        }

            EPS5 = __get_Par_Var_Value('EPS5', true, __job);
	        EPS5[k] = EPS;
            __set_Par_Var_Value('EPS5', EPS5, __job);
	        }
	    else {
	        console.log("Problem has no solution");
	        exit(1);
	        }
	    ind = 2;
	    } // end for
	
//#pragma wait
//#pragma sequential
    g_save = [[0]];
    if (xgnorm5){}
    ind5 = ind5;
    sn = sn;
    sn5 = sn5;
    eps = eps;
    var xgnorm_min = xgnorm5[1];
    cpvec(EPS5, eps);

    k_min = 1;
    var ki=1;
    for (ki=1; ki<=k_max; ki++) {
	    if (xgnorm5[ki] < xgnorm_min) {
	        xgnorm_min = xgnorm5[ki];
	        k_min = ki;
	        }
	    if (ind5[ki] == 3) {ind=3; k_min = ki; break;}
	    }

    cpvec(g5[k_min], g_save);
    cpvec(sn5[k_min], sn);
    xgnorm = xgnorm5[k_min];
    EPS = EPS5[k_min];    

    fs.appendFileSync('linit.rpt.jsc',"\nk_min="+k_min+"\n");
    console.log("\nk_min="+k_min+"\n");

    if (ind != 3) ind = ind5[k_min];

    iter=iter+1;
    }

//#pragma sequential
//#wait
if (ind != 3 ) {
    if (rp) fs.appendFileSync('linit.rpt.jsc'," No solution after more than 200 iterations !\n");
    console.log (" No solution after more than 200 iterations !\n");
    }

var cc = sn;
for (var i=1; i<=np1; i++) hm[1][i] = -1*MXMN*hm[1][i];

finish_time = new Date().getTime();
console.log(finish_time);
if (rp) fs.appendFileSync('linit.rpt.jsc', finish_time + "\n");
elapse_time = (finish_time - start_time) / 1000;
console.log("Elapse time: " + elapse_time + " sec");
if (rp) fs.appendFileSync('linit.rpt.jsc', "Elapse time: " + elapse_time + " sec\n");

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

// Functions
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

function cpvec(av, bv) {

    if (!av) return;
    for (var ii=0; ii<av.length; ii++ ) bv[ii] = av[ii];

}

function strf(num, len) {

    var bl = "";
    for (var i=1; i<=len; i++) bl+=" ";
    var ns = num.toString() + bl;
    return ns.substr(0,len);
}


function Minxg(k) {

    var hmg;

    var i, j, i_n, n;

    n=np1-1;

    for (i=1; i<=n ;i++) {

        for (j=1; j<=mp1; j++) hm1[j] = hm[j][i];
        if (!h[1]) h[1] = [];
        h[1][i] = Hb(hm1,g,mp1);
        hmg = Skabg(hm1,hm1,2,mp1);
//      if (h[1][i] > -0.2*EPS*hmg ) sn[i] = sm[i];
//      else sn[i] = sp[i];

        switch (k) {
	        case 1:
	            if ( h[1][i] > 1.*EPS*hmg ) sn[i] = sm[i];
	            else sn[i] = sp[i];
	            break;
	        case 2:
	            if (h[1][i] > -1.18*EPS*hmg ) sn[i] = sm[i]; // was 0.2
	            else sn[i] = sp[i];
	            break;
	        case 3:
	            if (h[1][i] > 1.18*EPS*hmg ) sn[i] = sm[i]; // was 0.2
	            else sn[i] = sp[i];
	            break;
	        case 4:
	            if (h[1][i] > -1.18*EPS*hmg ) sn[i] = sm[i]; // was 0.4
	            else sn[i] = sp[i];
	            break;
	        case 5:
	            if (h[1][i] > 1.18*EPS*hmg ) sn[i] = sm[i];  // was 0.4
	            else sn[i] = sp[i];
	            break;
	        case 6:
	            if (h[1][i] > -1.18*EPS*hmg ) sn[i] = sm[i]; // was 0.2
	            else sn[i] = sp[i];
	            break;
	        case 7:
	            if (h[1][i] > 1.18*EPS*hmg ) sn[i] = sm[i]; // was 0.2
	            else sn[i] = sp[i];
	            break;
	        case 8:
	            if (h[1][i] > -1.18*EPS*hmg ) sn[i] = sm[i]; // was 0.4
	            else sn[i] = sp[i];
	            break;
	        case 9:
	            if (h[1][i] > 1.18*EPS*hmg ) sn[i] = sm[i]; // was 0.2
	            else sn[i] = sp[i];
	            break;
	        case 10:
	            if (h[1][i] > -1.18*EPS*hmg ) sn[i] = sm[i]; // was 0.4
	            else sn[i] = sp[i];
	            break;
	        }

        }


    for (i=1; i<=mp1; i++) {
        x[i] = hm[i][np1];
        for (j=1; j<=n; j++) x[i] = x[i] + hm[i][j]*sn[j];
        }

    fg = Hb(x,g,mp1);

  
    i_n=0;

    for (i=1; i<=n; i++) {
        for (j=1; j<=mp1; j++) hm1[j] = hm[j][i];
        hmg = Skabg(hm1,hm1,2,mp1);
        m[i]=0;
        if (Math.abs(h[1][i]) <= (0.8+k*0.2)*EPS*hmg) { // was 0.8+k*0.2
            m[i] = 1;
            i_n++;
            }
        }

    return(i_n);

}

function Analys(ind1) {

    var d = 0., niuf=0., s=0., xgnorm=0.;
    var i, j, kt, n, ind;

    n = np1-1;

    ind = 0;
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
	            if (!h[2]) h[2] = [];
	            h[2][i] = Skabg(hm1,y,1,mp1);
	            }
            d = 0.;
            for (i=1; i<=n; i++) {
	            if ( m[i] != 0 ) {
	                s = sn[i] - sp[i];
	                if (!h[2]) h[2] = [];
	                if (h[2][i] > 0.) s = sn[i] - sm[i];
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

    var dz1, dz2, i, j, n;
    var iter_out = 0, iter_in = 0;

//    var cycles = 0;
//    var time_now = new Date().getTime();
//    var end_time, diff_time;
//    funcalls = 0;

    n=np1-1;

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
        iter_out = iter_out + 1;
        if (fdels_diff < effDEL*effDEL || iter_out%3000 == 0) {
	    effDEL = effDEL * 2.0;
//	    if (iter_out%3000 == 0) {
//	        funcallsp = funcalls;
//	        funcalls = 0;
//	        time_end = new Date().getTime();
//	        diff_time = time_end - time_now;
//	        time_now = time_end;
//	            }
//	if (rp)
//    	    fs.appendFileSync('linit.rpt.jsc',"---"+ iter_out+"  "+ cycles +"  "+ effDEL+"  "+ ((iter_out%3000 == 0)? diff_time + "  " + funcallsp : "") + "\n");
//    	console.log("---"+ iter_out+"  "+ cycles +"  "+ effDEL+"  "+ ((iter_out%3000 == 0)? diff_time + "  " + funcallsp : ""));
    	    }
        } while(dz1==1 && dz2 == 0 && iter_out <= 7000);

    for (i=1; i<=n; i++)
    if (m[i] !=0 && sn[i]<sp[i] && sn[i] > sm[i]) m[i] = 2;

    return(1);

}

function Mxmnxg() {

    var bm = [0.,0.,0.], bp=[0.,0.,0.]
    b = [0.,0.,0.]; z=[0.,0.,0.]; h1=[0.,0.,0.];
    var i, j, itr, n;

    n=np1-1;
    itr = 0;
    b[1] = 0.;
    b[2] = 1.;
    Zdef();

    if (z[2] > 0.) {
        return 0.;
        }

    bp[1] =1.;
    bp[2] =0.;
    bm[1] =0.;
    bm[2] =1.;

    while(itr<=20) {

        b[1] = (bp[1]+bm[1])/2.;
        b[2] = (bp[2]+bm[2])/2.;
        itr = itr + 1;
        Zdef();

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

function Zdef() {

    var sn1 = 0.;
    var i, j, n;

    n=np1-1;
    for (i=1; i<=2; i++) {
        z[i]=dz[i];
        for (j=1; j<=n; j++) {
            h1[1]=h[1][j];
            h1[2]=h[2][j];
            sn1 = sp[j];
            if ( Hb(h1,b,2) > 0. ) sn1 = sm[j];
            z[i] += sn1*h[i][j];
            }
        }

}

function Hnorm() {

    var lam = 0., xnor = 0.;
    var i, j, n;

    n=np1-1;

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
    var i, j, ip1, n;

    n=np1-1;
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

function Hb(hh, bb, n) {

    var hb = 0.;
    var i;

    for (i=1; i<=n; i++) hb += hh[i]*bb[i];

    return(hb);

}

function Skabg(a, b, i_n, n) {

    var ag = 0., skbg = 0.;
    var i;

    for (i=1; i<=n; i++) ag += a[i]*g[i];

    if (i_n==1) {
        skbg = (a[1]-ag)*b[1];
        for (i=2;i<=n;i++) {
            skbg += a[i]*b[i];
            }
        return(skbg);
        }
    else {
        skbg = (a[1]-ag)*(a[1]-ag);
        for (i=2;i<=n;i++) {
            skbg += a[i]*a[i];
            }
        }

    return(Math.sqrt(skbg));

}

