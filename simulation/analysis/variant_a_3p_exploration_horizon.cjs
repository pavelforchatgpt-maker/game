// V3 + Variant A diagnostic: how long should the planner actively pursue Trust?
// Policy only; canonical mechanics, event cards and deadline unchanged.
const fs=require('fs'),path=require('path'),X=require('../v2/experiment.cjs');
function combos(n,start=1,p=[],out=[]){if(p.length===n){out.push([...p]);return out;}for(let i=start;i<=8;i++){p.push(i);combos(n,i+1,p,out);p.pop();}return out;}
function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:null;}
function quantile(a,p){if(!a.length)return null;const b=[...a].sort((x,y)=>x-y),k=(b.length-1)*p,i=Math.floor(k);return b[i]+(b[Math.min(i+1,b.length-1)]-b[i])*(k-i);}
function wilson(w,n){const z=1.96,p=w/n,d=1+z*z/n,m=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return [Math.max(0,m-h),Math.min(1,m+h)];}
function tally(r){
 const x={activation:0,movement:0,poi:0,capital:0,final:0,cross:0,afterPoi:0};
 let used=new Set(),a=0;
 for(const row of r.ledger||[])if(row.day<=20)for(const e of row.events||[]){
  if(e.type==='activation'){x.activation++;used=new Set();a=e.id;}
  if(e.type==='movement')x.movement++;
  if(e.type==='poi'){x.poi++;if(used.has(e.hero))throw Error('Repeated POI within activation '+a+' seed '+r.seed);used.add(e.hero);}
  if(e.type==='poiResolvedContinue')x.afterPoi++;
  if(e.type==='cross')x.cross++;
  if(e.type==='teamResult'&&e.capital!==null)x.capital++;
  if(e.type==='teamResult'&&e.final!==null)x.final++;
 }
 if(x.poi!==x.afterPoi)throw Error('POI continuation count inconsistent '+r.seed);
 return x;
}
const modes=['marginal','trust1','cut05','cut07','cut09','cut11','cut12','cut13','cut14','cut15','cut17','cut19','cut20'];
const mode=process.argv[2]||'cut13',samples=+(process.argv[3]||512),seedOffset=+(process.argv[4]||0),st=process.argv[5]||'ST-NEUTRAL';
if(!modes.includes(mode)||!(samples>0))throw Error('Unsupported mode '+mode);
const opts={players:3,group:'together',experiment:'ordinary',planner:'global',poiAware:true,resourceAware:true,
 poiStrategy:mode==='marginal'?'marginal':'legacy',
 st,talentRate:0,horizon:50,
 capitalDifficultyShift:-3,teamDailyBonusActivations:1,teamBonusSkipCadence:6,
 poiContinueMovement:true};
if(mode!=='marginal'){opts.trustTarget=1;if(mode.startsWith('cut'))opts.poiTrustUntilDay=Number(mode.slice(3));}
const cs=combos(3),rows=[];
const timeProfiles={
 normal:{activation:35,movement:10,poi:120,capital:85,final:90,day:15,overhead:35},
 firstPlay:{activation:50,movement:14,poi:165,capital:120,final:120,day:20,overhead:50}
};
for(let k=0;k<samples;k++){
 const seed=15100000+3*100000+30000+seedOffset+k,profiles=cs[k%cs.length];
 const r=X.simulate({...opts,profiles},seed,false),win=r.completionDay!==null&&r.completionDay<=20,work=tally(r),day=win?r.completionDay:20;
 const duration={};
 for(const [p,c]of Object.entries(timeProfiles))
  duration[p]=c.overhead+(day*c.day+['activation','movement','poi','capital','final'].reduce((s,type)=>s+work[type]*c[type],0))/60;
 rows.push({win,day,work,duration,trust:Object.values(r.deadline.trust).reduce((a,b)=>a+b,0),stable:r.deadline.capitals.filter(c=>c.stable).length});
}
const wins=rows.filter(r=>r.win),losses=rows.filter(r=>!r.win);
function group(a){return {n:a.length,poiMean:mean(a.map(x=>x.work.poi)),poiMedian:quantile(a.map(x=>x.work.poi),.5),
 poiP25:quantile(a.map(x=>x.work.poi),.25),poiP75:quantile(a.map(x=>x.work.poi),.75),
 meanActivations:mean(a.map(x=>x.work.activation)),
 meanDay:mean(a.map(x=>x.day)),meanTrust:mean(a.map(x=>x.trust)),meanStable:mean(a.map(x=>x.stable)),
 normalMean:mean(a.map(x=>x.duration.normal)),normalP90:quantile(a.map(x=>x.duration.normal),.9),
 firstMean:mean(a.map(x=>x.duration.firstPlay)),firstP90:quantile(a.map(x=>x.duration.firstPlay),.9),
 firstOver210:a.length?a.filter(x=>x.duration.firstPlay>210).length/a.length:null,
 normalOver180:a.length?a.filter(x=>x.duration.normal>180).length/a.length:null};
}
const out={mode,samples,seedOffset,st,opts,wins:wins.length,winRate:wins.length/samples,win95:wilson(wins.length,samples),
 all:group(rows),winning:group(wins),losing:group(losses),
 targets:{winRateMin:.45,winningPOIMin:16,winningPOIMax:18,firstPlayMaxMinutes:210},
 targetSatisfied:wins.length/samples>=.45&&mean(wins.map(x=>x.work.poi))>=16&&mean(wins.map(x=>x.work.poi))<=18&&mean(rows.map(x=>x.duration.firstPlay))<=210,
 note:'Noncanonical planner exploration target timing; fixed 20-day deadline and Variant A movement rule. First-play durations are estimates, not measured.'};
const dir=path.join(__dirname,'variant-a-3p-horizon');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,mode+'-'+seedOffset+'-'+st+'.json'),JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
