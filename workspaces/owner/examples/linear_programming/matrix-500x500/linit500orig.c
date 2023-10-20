#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <sys/time.h>

#define max(a,b) \
  ({ __typeof__ (a) _a = (a); \
     __typeof__ (b) _b = (b); \
    _a > _b ? _a : _b; })

#define min(a,b) \
  ({ __typeof__ (a) _a = (a); \
     __typeof__ (b) _b = (b); \
    _a < _b ? _a : _b; })

#define hm(i,j) hm[(i)*np1+(j)]
#define h(i,j) h[(i)*np1+(j)]

#define dfltNORM 1
#define dfltIDEF 1
#define dfltMXMN -1
#define dfltDEL  1.e-5
#define dfltNIU  0.1
#define dfltEPS  0
#define dfltDZV  0.2

int mp1,np1;
int rp;

int NORM=dfltNORM;
int IDEF=dfltIDEF;
int MXMN=dfltMXMN;
double DEL=dfltDEL;
double NIU=dfltNIU;
double EPS=dfltEPS;
double DZV=dfltDZV;

double dz[3];

double *g;
double *h;
double *hm;
double *hm1;
double *sm, *sn, *sp;
double *x, *y;
int *m;

int psi_iter_out = 7000;
double psi_DEL_change = 2.0;

double xg, fg;
int iter;
int kbh;
FILE *rpt;
char *pstr;

struct timeval tp_now;
struct timeval tp_end;
long long ms_now;
long long ms_end;
int time_diff;

int funcalls = 0, funcallsp;

void testNULL(double *ptr);
void readprm(void);
int getprm(char *prmv, char *prmn, char *buff);
void readex(void);
void readex_old(void);
void Linit(void);
int Mnxgco(void);
int Minxg(double *fg);
int Analys(double *fg, double *xg,int ind);
double Mxmnxg(void);
void Zdef(double *z, double *b, double *h1);
double Hnorm(void);
void Epsdef (void);
double Hb(double *hh, double *bb, int n);
double Skabg(double *a, double *b, int in, int n);
void save_json(FILE *json, double mxhm);

main() {

  int np11,mp11,i;
  double *ptr;
  int *ptr1;

  kbh=0;

  readprm();

  np11=np1+1;
  mp11=mp1+1;

  hm = (double *) malloc((size_t)np11*mp11*sizeof(double));
  ptr=hm; testNULL(ptr);
  g = (double *) malloc((size_t)mp11*sizeof(double));
  ptr=g; testNULL(ptr);
  h = (double *) malloc((size_t)3*np11*sizeof(double));
  ptr=h; testNULL(ptr);
  hm1 = (double *) malloc((size_t)np11*sizeof(double));
  ptr=hm1; testNULL(ptr);
  sm = (double *) malloc((size_t)np11*sizeof(double));
  ptr=sm; testNULL(ptr);
  sn = (double *) malloc((size_t)np11*sizeof(double));
  ptr=sn; testNULL(ptr);
  sp = (double *) malloc((size_t)np11*sizeof(double));
  ptr=sp; testNULL(ptr);
  x = (double *) malloc((size_t)np11*sizeof(double));
  ptr=x; testNULL(ptr);
  y = (double *) malloc((size_t)np11*sizeof(double));
  ptr=y; testNULL(ptr);
  m = (int *) malloc((size_t)np11*sizeof(int));
  if (m == NULL ) { printf(" Out of memory ! \n"); exit(1); }

  printf("NORM=%d, IDEF=%d, MXMN=%d, DEL=%10.3G, NIU=%10.3G, \n EPS=%10.3G, DZV=%10.3G, mp1=%d, np1=%d \n ",NORM,IDEF,MXMN,DEL,NIU,EPS,DZV,mp1,np1);

  rp=1;
  if ((rpt=fopen("report500orig.lnt2","wb"))==NULL) rp=0;
  if (rp)
    fprintf(rpt,"Parameters:\nNORM=%d, IDEF=%d, MXMN=%d, DEL=%10.3G, NIU=%10.3G, \nEPS=%10.3G, DZV=%10.3G, mp1=%d, np1=%d \n\n",NORM,IDEF,MXMN,DEL,NIU,EPS,DZV,mp1,np1);

  readex(); /* инициализация исходных данных */

  for (i=1; i<=mp1;i++) g[i]=0.;
  g[1]=1.;


  Linit(); /* головная процедура лин.программирования */

  printf("\nsn[i] = ");
  if (rp) fprintf(rpt,"\n sn[i] = ");

  for (i=1;i<=np1-1;i++) {
/*
    printf("%15.7G",sn[i]);
*/
    if (rp) fprintf(rpt,"%15.7G",sn[i]);
    if (i%3 == 0) {
      printf("\n");
      if (rp) fprintf(rpt,"\n");
      }
    }


  if (rp) {
    fprintf(rpt,"\nXG=%10.8G, FG=%10.8G \n",xg,fg);
    fclose(rpt);
    }

  free((double *)hm);
  free((double *)g);
  free((double *)h);
  free((double *)hm1);
  free((double *)sm);
  free((double *)sn);
  free((double *)sp);
  free((double *)x);
  free((double *)y);
  free((int *)m);

  printf(" End of solution \n");

}

void testNULL(double *ptr) {

  if (ptr == NULL ) { printf(" Out of memory ! \n"); exit(1); }

}

void readprm(void) {

  char prmv[15];
  FILE *fprm;
  char buff[500];
  int lbuff;
  int pex;


  if ((fprm = fopen("linit.prm","rb")) == NULL ) return;
  lbuff = fread(buff,1,500,fprm); buff[lbuff+1]=NULL;
  fclose(fprm);

  if ((pex = getprm(prmv,"NORM",buff))==1)
  NORM=atoi(prmv);
  if ((pex = getprm(prmv,"IDEF",buff))==1) IDEF=atoi(prmv);
  if ((pex = getprm(prmv,"MXMN",buff))==1) MXMN=atoi(prmv);
  if ((pex = getprm(prmv,"DEL",buff))==1) DEL=(double)atof(prmv);
  if ((pex = getprm(prmv,"NIU",buff))==1) NIU=(double)atof(prmv);
  if ((pex = getprm(prmv,"EPS",buff))==1) EPS=(double)atof(prmv);
  if ((pex = getprm(prmv,"DZV",buff))==1) DZV=(double)atof(prmv);
  if ((pex = getprm(prmv,"MP1",buff))==1) mp1=atoi(prmv);
  if ((pex = getprm(prmv,"NP1",buff))==1) np1=atoi(prmv);

}

int getprm(char *prmv, char *prmn, char *buff) {

   char *ptr, tmp[15];

   prmv[0]=NULL;
   if ((ptr = strstr(buff,prmn)) == NULL ) return(0);
   ptr = strchr(ptr,'=')+1;
   strncpy(tmp,ptr,13);
   tmp[14]=NULL;
   strcpy(prmv,strtok(tmp,"\n"));
   strcat(prmv,"\0");
   if (prmv[0]==NULL ) return(0);
   else return(1);

}

void readex(void) {

  int i, j;
  double maxhm;
  FILE *json;

    maxhm = 0.;

  for(i=1;i<=mp1;i++) {
    for (j=1;j<=np1;j++) hm(i,j) = (double)(random()/1.E+9)/5.;
    }

  i=2;
  for (j=1;j<=np1;j++) {
      hm(1,j) = 1.;
      hm(i,np1) = 10.;
      if (i>1 && j!=np1) {
        hm(i,j)= 3.;
//        hm(i,j)=(double)(random()/1.E+9)+2;
        if (j>1) hm(i,j-1)=(double)(random()/1.E+9)/3.;
        if (j>2) hm(i,j-2)=(double)(random()/1.E+9)/4.;
        if (j<np1-1) hm(i,j+1)=(double)(random()/1.E+9)/3.;
        if (j<np1-2) hm(i,j+2)=(double)(random()/1.E+9)/4.;
        }
      i++;
      if (i>mp1) i=2;
//      for (i=2; i<=mp1; i++) {
//        if (j!=np1) { 
//    	    hm(i,j)=(double)(random()/1.E+9);
//    	    maxhm = max(maxhm, hm(i,j));
//    	    }
//        }
      sm[j] = -10.;
      sp[j] = 10.;
      }
  hm(1,np1)=0.;

  for (i=1;i<=mp1;i++) {
    for (j=1;j<=np1;j++) {
        fprintf(rpt,"%10.3G",hm(i,j));
        }
    fprintf(rpt,"\n");
    }

//    printf("%10.5G", maxhm);

// fclose(rpt);
// exit(0);

  if ((json=fopen("linit.data.json","wb"))==NULL) {
    printf("Cannot open file linit.data.json.\n");
    return;
    }

  save_json(json, maxhm);
  
  if (json) fclose(json);

}

void save_json(FILE *json, double mxhm) {

    int i, j;

    printf("%10.5G", mxhm);

    fprintf(json, "{\"maxhm\":%15.12G,\n", mxhm);
    fprintf(json, "\"hm\":[[],\n");
    
    for (i=1; i<=mp1; i++) {
	fprintf(json, "[0");
	for (j=1; j<=np1; j++) {
	    fprintf(json, ",%15.12G", hm(i,j));
	    }
	fprintf(json, "]");
	if (i!=mp1) fprintf(json, ",\n");
	else fprintf(json, "\n],\n");
	}

    fprintf(json, "\n\"sm\":\n[0");
    for (j=1; j<=np1-1; j++) {
	fprintf(json, ",%15.12G", sm[j]);
	}
    fprintf(json, ",0],\n");

    fprintf(json, "\n\"sp\":\n[0");
    for (j=1; j<=np1-1; j++) {
	fprintf(json, ",%15.12G", sp[j]);
	}
    fprintf(json, ",0]\n}\n");

}

void readex_old(void) {

  FILE *dat;
  int i, j, ch;
  char str1[2000], *str2;

  str2="01234567890123456789";

  for(i=1;i<=mp1;i++) {
    for (j=1;j<=np1;j++) hm(i,j) = 0.;
    sm[i] = 0.;
    sp[i] = 0.;
    }

  if ((dat=fopen("linit.dat","rb")) == NULL ) return;

  ch = NULL;

  i=1;

  while (ch !=EOF && i<=mp1) {

    pstr="\nhm[%d,j]= ";
    printf(pstr,i);
    if (rp) fprintf(rpt,pstr,i);

    j=0;
    while (ch != '\r' && ch != '\n' && ch !=EOF ) {
      str1[j]=(ch=fgetc(dat));
      j++;
      }
    str1[j]=NULL;
    j=1;
    str2=strtok(str1," ,");
    while (str2 != NULL && j<=np1) {
      hm(i,j) = (double)atof (str2);
      pstr = "%10.3G";
      printf(pstr,hm(i,j));
      if (rp) fprintf(rpt,pstr,hm(i,j));
      if (j%5 == 0) {
	printf("\n");
	if (rp) fprintf(rpt,"\n");
	}
      str2 = strtok(NULL," ,");
      j++;
      }
    i++;
    while(ch !=EOF && (ch == '\n' || ch == '\r') ) ch = fgetc(dat);

    }

  if (ch !=EOF ) {

    pstr="\nsm[j]= ";
    printf(pstr);
    if (rp) fprintf(rpt,pstr);

    j=0;
    while (ch != '\r' && ch != '\n' && ch !=EOF ) {
      str1[j]=(ch=fgetc(dat));
      j++;
      }
    str1[j]=NULL;
    j=1;
    str2=strtok(str1," ,");
    while (str2 != NULL && j<=np1) {
      sm[j] = (double)atof (str2);
      pstr = "%10.3G";
      printf(pstr,sm[j]);
      if (rp) fprintf(rpt,pstr,sm[j]);
      if (j%5 == 0) {
	printf("\n");
	if (rp) fprintf(rpt,"\n");
	}
      str2 = strtok(NULL," ,");
      j++;
      }
    i++;
    while(ch !=EOF && (ch == '\n' || ch == '\r') ) ch = fgetc(dat);

    }


  if (ch !=EOF ) {

    pstr="\nsp[j]= ";
    printf(pstr);
    if (rp) fprintf(rpt,pstr);

    j=0;
    while (ch != '\r' && ch != '\n' && ch !=EOF ) {
      str1[j]=(ch=fgetc(dat));
      j++;
      }
    str1[j]=NULL;
    j=1;
    str2=strtok(str1," ,");
    while (str2 != NULL && j<=np1) {
      sp[j] = (double)atof (str2);
      pstr = "%10.3G";
      printf(pstr,sp[j]);
      if (rp) fprintf(rpt,pstr,sp[j]);
      if (j%5 == 0) {
	printf("\n");
	if (rp) fprintf(rpt,"\n");
	}
      str2 = strtok(NULL," ,");
      j++;
      }
    i++;
    while(ch !=EOF && (ch == '\n' || ch == '\r') ) ch = fgetc(dat);

    }

  fclose(dat);


}

void Linit(void) {

  double alfa, alf1;
  double lamnor, niuf;
  double xgnorm;

  int ind=0;
  int i, j, n, in, it_entr;
  double DELsave, DELs;

  /**************************/

  n=np1-1;

  pstr="%4d %10.8G %10.8G %10.5G%10d%10.3G%10.3G%10d\n";

  for (i=1;i<=n;i++) hm(1,i) = -1.0*MXMN*hm(1,i);

  if (NORM==0) lamnor = Hnorm();

  if (EPS == 0.) Epsdef();

  if (rp)
    fprintf(rpt,"\nIter      F(g)     (X,g)    //X//g   Ind Nr.       Eps      Alfa  It_entry\n");
  printf("\nIter      F(g)     (X,g)    //X//g   Ind Nr.       Eps      Alfa  It_entry\n");


  iter = 1;
  ind=0;
  DELsave = DEL;

  while (iter<=5000 && ind != 3) {
    DEL = DELsave;
    ind=2;
    it_entr = 0;

    while (ind == 2) {

      in = Minxg(&fg);


      for (i=1;i<=n;i++) {
	for (j=1;j<=mp1;j++) hm1[j] = hm(j,i);
	h(2,i) = Skabg(x,hm1,1,mp1);
	}

//      printf("%74d",it_entr);

      ind=1;

      DELs = DEL;
      while (ind == 1) {

//	DEL = DELsave;
	ind = Mnxgco();
//	DEL = DELs;
	xgnorm = Skabg(x,x,2,mp1);
	ind = Analys(&fg,&xg,ind);

	it_entr++;
	if (it_entr%500 == 0) {
/*
	    DEL = DEL * 1.7;
	    if (DEL > 0.1) DEL = 0.1;
*/
	    if (rp)
    		fprintf(rpt,"%6d %10.3G\n",it_entr, DEL);
	    printf("%6d %10.3G\n",it_entr, DEL);
	    }
	}
      DEL=DELs;
      }

    for (i=1; i<=mp1; i++) hm1[i] = hm(i,np1);

    dz[1] = Hb(hm1,g,mp1);
    dz[2] = Skabg(hm1,y,1,mp1);
    alfa = Mxmnxg();
    alf1 = 1.-alfa*y[1];
    for (i=1; i<=mp1 ; i++) g[i] = alf1*g[i] + alfa*y[i];

    if (rp)
      fprintf(rpt,pstr,iter,fg,xg,xgnorm,in,EPS,alfa,it_entr);
      printf(pstr,iter,fg,xg,xgnorm,in,EPS,alfa,it_entr);

    xg = Hb(x,g,mp1);
    niuf = 2.* (double) fabs((double) (fg-xg))/ (double) fabs((double) (fg+xg));
    if (niuf < NIU/2. ) EPS = EPS*1.25;

    iter++;

    }
  if (ind != 3 ) {
    if (rp) fprintf (rpt," No solution after more than 200 iterations !\n");
    printf (" No solution after more than 200 iterations !\n");
    }

  for (i=1; i<=np1; i++) hm(1,i) = -1.*MXMN*hm(1,i);

}

int Minxg(double *fg) {

  double hmg;

  int i, j, in, n;

  n=np1-1;

  for (i=1; i<=n ;i++) {

    for (j=1; j<=mp1; j++) hm1[j] = hm(j,i);
    h(1,i) = Hb(hm1,g,mp1);
    if ( h(1,i) > 0. ) sn[i] = sm[i];
    else sn[i] = sp[i];
    }

  for (i=1; i<=mp1; i++) {
    x[i] = hm(i,np1);
    for (j=1; j<=n; j++) x[i] = x[i] + hm(i,j)*sn[j];
    }

  *fg = Hb(x,g,mp1);

  /* выделение подмножества "базисных" переменных m(n) */

  in=0;

  for (i=1; i<=n; i++) {

    for (j=1; j<=mp1; j++) hm1[j] = hm(j,i);
    hmg = Skabg(hm1,hm1,2,mp1);
    m[i]=0;
    if ((double) fabs((double)(h(1,i))) <= EPS*hmg) {
      m[i] = 1;
      in++;
      }
    }

  return(in);

  }

int Analys(double *fg, double *xg,int ind1) {

  double d, niuf, s, xgnorm;

  int i, j, k, n, ind ;

/*--------------------------------------------------------

  ind - индикатор разветвления для программы Linit.

  ind = 0     - пересчет вектора g и переход к следующей
		итерации;

  ind = 1     - недостаточно точно решена задача минимиза-
		ции программой Mnxgco. Переход на повтор
		минимизации;

  ind = 2     - слишком большая величина EPS, поэтому боль-
		шое различие между fg и xg. Уменьшение EPS
		и повторение программы Minxg.

  ind = 3     - решение задачи найдено. Завершение работы
		всей программы.

  ---------------------------------------------------------*/

  n = np1-1;


  ind = 0;
  *xg = Hb(x,g,mp1);
  if (*fg + *xg != 0. ) {
    niuf = 2.* (double) fabs((double) (*fg-*xg))/ (double) fabs((double) (*fg+*xg));
    if (niuf > NIU ) {
      ind = 2;
      EPS = EPS*0.75;
      }
    }

  if (ind != 2) {
    k = 0;
    if ((double)fabs((double)(x[1]-*xg)) > DEL ) k = 1;
    for (i=2; i<=mp1; i++) {
      if ((double)fabs((double)x[i]) > DEL ) k = 1;
      }
    if ( k == 0) ind = 3;
    if ( ind != 3) {
      xgnorm = Skabg(x,x,2,mp1);
      y[1] = (x[1]-*xg)/xgnorm;
      for (i=2; i<=mp1; i++) y[i] = x[i]/xgnorm;

      for (i=1; i<=n; i++) {
	for (j=1; j<=mp1; j++) hm1[j] = hm(j,i);
	h(2,i) = Skabg(hm1,y,1,mp1);
	}
      d = 0.;
      for (i=1; i<=n; i++) {
	if ( m[i] != 0 ) {
	  s = sn[i] - sp[i];
	  if (h(2,i) > 0.) s = sn[i] - sm[i];
	  d = d + h(2,i)*s;
	  }
	}
      d = d/xgnorm;
      if (d >= DZV) ind = 1;
      }
    }

  if (ind1 == 0) return(0);
  return(ind);

}

int Mnxgco(void) {

  /*-----------------------
    Минимизация методом
    покоординатного спуска
  -------------------------*/

  double dels, del, temp;
  double fdels, fdels_old, fdels_diff;
  double effDEL;

  int dz1, dz2, i, j, n;
  int iter_out, iter_in;

  n=np1-1;

  effDEL = DEL;

  iter_out = 0;
  iter_in = 0;
//  fdels_old = 0.;

  gettimeofday(&tp_now, NULL);
  ms_now = (long long) tp_now.tv_sec * 1000L + tp_now.tv_usec / 1000;
  funcalls = 0;
 
  do {
    dz1 = 0;
    dz2 = 0;

    for (i=1; i<=n; i++) if (m[i]>0) m[i] = 2;

    iter_in = 0;
    fdels_old = 0.;

    do {

      if (dz1 == 0 && dz2 == 1 ) dz1 = 1;
      dz2 = 0;

      for (i=1; i<=n; i++) {

	if ( m[i] == 2) {
	  for (j=1; j<=mp1; j++) hm1[j] = hm(j,i);
	  temp = Skabg(hm1,hm1,2,mp1);
	  del = -1.*Skabg(x,hm1,1,mp1)/(temp*temp);

	  if (del < 0 ) dels=max(del,(sm[i]-sn[i]));
	  else dels=min(del,(sp[i]-sn[i]));

	  for (j=1; j<=mp1; j++) x[j] = x[j] + dels*hm1[j];
	  sn[i] = sn[i]+dels;

	  if (sn[i]==sp[i] || sn[i]==sm[i]) {
	    m[i] = 1;
	    dz2 = 1;
	    }
	  }
	}

      iter_in++;
funcalls++;
      fdels = (double)fabs((double)dels);
      if (fdels < effDEL*effDEL) {
        return(1);
        }
funcalls++;
      fdels_diff = (double)fabs((double)fdels - (double)fdels_old);
      if (fdels_old == 0.) fdels_diff = 1000.;
      fdels_old = fdels;

      } while (dz2 == 1);

    iter_out++;
    if (fdels_diff < effDEL*effDEL || iter_out%3000 == 0) {
/*	effDEL = effDEL * psi_DEL_change; */
	if (iter_out%3000 == 0) {
	    funcallsp = funcalls;
	    funcalls = 0;
	    gettimeofday(&tp_end, NULL);
	    ms_end = (long long) tp_end.tv_sec * 1000L + tp_end.tv_usec / 1000;
	    time_diff = (int)(ms_end - ms_now);
	    ms_now = ms_end;
	    if (rp)
    		fprintf(rpt,"---%10d%9d  %10.3G  %6d  %12d\n", iter_out, iter_in, effDEL, time_diff, funcallsp);
    	    printf("---%10d %9d %10.3G  %6d  %12d\n", iter_out, iter_in, effDEL, time_diff, funcallsp);
	    }
	else {
	    if (rp)
    		fprintf(rpt,"---%10d%9d  %10.3G\n", iter_out, iter_in, effDEL);
    	    printf("---%10d %9d %10.3G\n", iter_out, iter_in, effDEL);
    	    }
    	}
    } while(dz1==1 && dz2 == 0 /* && iter_out < psi_iter_out */);

  for (i=1; i<=n; i++)
    if (m[i] !=0 && sn[i]<sp[i] && sn[i] > sm[i]) m[i] = 2;

//	if (rp)
//    	  fprintf(rpt,"%9d%9d %10.3G %10.3G %10.3G %10.3G\n", iter_out, iter_in, fdels_old, fdels, fdels-fdels_old, DEL);
//        printf("%9d%9d %10.3G %10.3G %10.3G %10.3G\n", iter_out, iter_in, fdels_old, fdels, fdels-fdels_old, DEL);

  return(1);
}


double Mxmnxg(void) {

  double b[3], bm[3], bp[3], z[3], h1[3];

  int i, j, itr, n;

  /*--------------------------
    Нахождение параметра ALFA
    для пересчета вектора g
  ----------------------------*/
funcalls++;
  n=np1-1;
  itr = 0;
  b[1] = 0.;
  b[2] = 1.;
  Zdef(z,b,h1);

  if (z[2] > 0.) {
    printf("\nProblem has no solution! \n");
    exit(1);
    }

  bp[1] =1.;
  bp[2] =0.;
  bm[1] =0.;
  bm[2] =1.;

  while(itr<=20) {

    b[1] = (bp[1]+bm[1])/2.;
    b[2] = (bp[2]+bm[2])/2.;
    itr++;
    Zdef(z,b,h1);

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

void Zdef(double *z, double *b, double *h1) {

  double sn1;
  int i, j, n;

funcalls++;
  n=np1-1;

  for (i=1; i<=2; i++) {

    z[i]=dz[i];
    for (j=1; j<=n; j++) {
      h1[1]=h(1,j);
      h1[2]=h(2,j);
      sn1 = sp[j];
      if ( Hb(h1,b,2) > 0. ) sn1 = sm[j];
      z[i] = z[i] + sn1*h(i,j);
      }
    }

}

double Hnorm(void) {

  double lam, xnor;

  int i, j, n;

funcalls++;
  n=np1-1;

  for (i=1; i<=n; i++) hm1[i] = hm(1,i);

  lam = Hb(hm1,hm1,n);
funcalls++;
  lam = (double)sqrt((double)lam);
  for (i=1; i<=n; i++) hm(1,i)= hm(1,i)/lam;

  for (j=2; j<=mp1; j++) {

    for (i=1; i<=n; i++) hm1[i] = hm(j,i);

    xnor = Hb(hm1,hm1,n);
funcalls++;
    xnor = (double)sqrt((double)xnor);
    for (i=1; i<=n; i++) hm(j,i)= hm(j,i)/xnor;
    }

  return (lam);
}


void Epsdef (void) {

  double *deps;
  double hmg, ruf;
  int i, j, ip1, n;


funcalls++;
funcalls++;
  deps = (double *) malloc((size_t)(np1+1)*sizeof(double));
  if (deps == NULL ) { printf(" Out of memory ! \n"); exit(1); }

  n=np1-1;

  for (i=1;i<=n;i++) {
    for (j=1;j<=mp1;j++) hm1[j] = hm(j,i);
    hmg = Skabg(hm1,hm1,2,mp1);
funcalls++;
    deps[i] = (double)fabs((double)h(1,i))/hmg;
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
funcalls++;
  free((double *) deps);

  }

double Hb(double *hh, double *bb, int n) {

  double hb;
  int i;

funcalls++;
  hb=0.;
  for (i=1; i<=n; i++) hb = hb + hh[i]*bb[i];

  return(hb);

  }

double Skabg(double *a, double *b, int in, int n) {

  double ag, skbg;
  int i;

funcalls++;
  ag = Hb(a,g,n);
  skbg = 0.;

  if (in==1) {
    for (i=1;i<=n;i++) {
      if (i==1) skbg = skbg + (a[i]-ag)*b[i];
      else skbg = skbg +a[i]*b[i];
      }
    return(skbg);
    }
  else {
    for (i=1;i<=n;i++) {
      if (i==1) skbg = skbg + (a[i]-ag)*(a[i]-ag);
      else skbg = skbg +a[i]*a[i];
      }
    }

funcalls++;
  return((double)sqrt((double)skbg));

}
