// Diagnostic only. Test 20-23-day extensions for 3-player Variant A under
// either early Trust exploration (cut13) or persistent Trust target (trust1).
// Uses existing optional V2 horizon continuation. Canonical 20-day rules stay unchanged.
const fs=require('fs'),path=require('path'),X=require('../v2/experiment.cjs');
function combos(n,start=1,p=[],out=[]){if(p.length===n){out.push([...p]);return out;}for(let i=start;i<=8;i++){p.push(i);combos(n,i+1,p,out);p.pop();}return out;}
function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:null;}
function quantile(a,p){if(!a.length)return null;let b=[...a].sort((a,b)=>a-b),x=(b.length-1)*p,i=Math.floor(x);return b[i]+(b[Math.min(i+1,b.length-1)]-b[i])*(x-i);}
function wilson(w,n){const z=1.96,p=w/n,d=1+z*z/n,m=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return [Math.max(0,m-h),Math.min(1,m+h)];}
function count(r,type,h,pred=()=>true){let a=0;for(const d of r.ledger||[])if(d.day<=h)for(const e of d.events||[])if(e.type===type&&pred(e))a++;return a;}
const mode=process.argv[2]||'cut13',deadline=+(process.argv[3]||22),samples=+(process.argv[4]||512),
 seedOffset=+(process.argv[5]||7000000),st=process.argv[6]||'ST-NEUTRAL';
if(!['cut13','trust1'].includes(mode)||deadline<20||deadline>23)throw Error('Invalid config');
const opts={players:3,group:'together',experiment:'ordinary',planner:'global',poiAware:true,resourceAware:true,
 poiStrategy:'legacy',trustTarget:1,poiContinueMovement:true,st,talentRate:0,horizon:deadline,
 capitalDifficultyShift:-3,teamDailyBonusActivations:1,teamBonusSkipCadence:6};
if(mode==='cut13')opts.poiTrustUntilDay=13;
const cs=combos(3),rows=[];
const profiles={
 normal:{activation:35,movement:10,poi:120,capital:85,final:90,day:15,overheadMin:35},
 firstPlay:{activation:50,movement:14,poi:165,capital:120,final:120,day:20,overheadMin:50}
};
for(let k=0;k<samples;k++){
 const r=X.simulate({...opts,profiles:cs[k%cs.length]},15100000+300000+30000+seedOffset+k,false);
 const won=r.completionDay!==null&&r.completionDay<=deadline,d=won?r.completionDay:deadline;
 const x={activation:count(r,'activation',deadline),movement:count(r,'movement',deadline),poi:count(r,'poi',deadline),
   capital:count(r,'teamResult',deadline,e=>e.capital!==null),final:count(r,'teamResult',deadline,e=>e.final!==null),
   continue:count(r,'poiResolvedContinue',deadline)};
 if(x.poi!==x.continue)throw Error('POI completion invariant failed');
 const duration=Object.fromEntries(Object.entries(profiles).map(([name,c])=>[name,
   c.overheadMin + (d*c.day+['activation','movement','poi','capital','final'].reduce((sum,key)=>sum+c[key]*x[key],0))/60]));
 rows.push({won,day:d,poi:x.poi,duration,energy:r.terminal.energy,stable:r.terminal.capitals.filter(c=>c.stable).length});
}
const wins=rows.filter(x=>x.won);
function group(a){return {count:a.length,meanPOI:mean(a.map(x=>x.poi)),medianPOI:quantile(a.map(x=>x.poi),.5),
  meanDurationNormal:mean(a.map(x=>x.duration.normal)),p90Normal:quantile(a.map(x=>x.duration.normal),.9),
  meanDurationFirst:mean(a.map(x=>x.duration.firstPlay)),p90First:quantile(a.map(x=>x.duration.firstPlay),.9),
  firstOver210:a.length?a.filter(x=>x.duration.firstPlay>210).length/a.length:null,
  normalOver180:a.length?a.filter(x=>x.duration.normal>180).length/a.length:null,
  meanStable:mean(a.map(x=>x.stable)),meanDays:mean(a.map(x=>x.day))};}
const out={status:'NONCANONICAL EXPERIMENT',mode,deadline,samples,seedOffset,st,config:opts,wins:wins.length,winRate:wins.length/samples,
 win95:wilson(wins.length,samples),all:group(rows),winning:group(wins),losing:group(rows.filter(x=>!x.won)),
 note:'Continued V2 horizon after day 20, retaining stage III; no narrative/event card changes, no canon change. Time is estimate.'};
const dir=path.join(__dirname,'variant-a-3p-deadline');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,mode+'-d'+deadline+'-'+st+'.json'),JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));
