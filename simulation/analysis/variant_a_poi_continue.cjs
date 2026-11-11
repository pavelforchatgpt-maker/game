// Diagnostic V3 / Variant A: an explored POI does not consume remaining movement.
// Every hero can resolve no more than one POI per group activation, including across tile crossings.
// This test changes only simulation/v2/engine.cjs behind options.poiContinueMovement=true.
// Canonical RULES.md and balance configuration remain untouched.
const fs=require('fs'),path=require('path'),X=require('../v2/experiment.cjs');
function combos(n,start=1,p=[],out=[]){if(p.length===n){out.push([...p]);return out;}for(let i=start;i<=8;i++){p.push(i);combos(n,i+1,p,out);p.pop();}return out;}
function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:null;}
function q(a,p){if(!a.length)return null;const b=[...a].sort((x,y)=>x-y),z=(b.length-1)*p,i=Math.floor(z);return b[i]+(b[Math.min(b.length-1,i+1)]-b[i])*(z-i);}
function wilson(w,n){const z=1.96,p=w/n,d=1+z*z/n,m=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return [Math.max(0,m-h),Math.min(1,m+h)];}
const timing={
 normal:{activation:35,movement:10,poi:120,capital:85,day:15,final:90,overheadMin:35},
 firstPlay:{activation:50,movement:14,poi:165,capital:120,day:20,final:120,overheadMin:50}
};
function audit(r,variant){
 const n={activation:0,movement:0,poi:0,capital:0,final:0,cross:0,postPOIWalkSteps:0,poiContinueResolutions:0,unspentMovementAtPOI:0};
 let latest={};let visits=new Set(),active=-1,marked=new Set();
 for(const row of r.ledger||[])if(row.day<=20)for(const e of row.events||[]){
  if(e.type==='activation'){n.activation++;active=e.id;visits=new Set();marked=new Set();continue;}
  if(e.type==='movement')n.movement++;
  if(e.type==='poi'){
   n.poi++;
   const key=String(e.hero);
   if(variant&&visits.has(key))throw Error('A violates one POI per hero per activation: '+r.seed+' activation '+active+' hero '+key);
   visits.add(key);
  }
  if(e.type==='poiResolvedContinue'){
   n.poiContinueResolutions++;
   if(e.remainingBudget>0)n.unspentMovementAtPOI++;
   marked.add(e.hero);
  }
  if(e.type==='walk'&&e.steps>0&&marked.has(e.hero))n.postPOIWalkSteps+=e.steps;
  if(e.type==='cross')n.cross++;
  if(e.type==='teamResult'&&e.capital!==null)n.capital++;
  if(e.type==='teamResult'&&e.final!==null)n.final++;
 }
 if(variant&&n.poiContinueResolutions!==n.poi)throw Error('A resolved / POI mismatch: '+n.poiContinueResolutions+' vs '+n.poi+' seed '+r.seed);
 return n;
}
function time(row,kind){
 const p=timing[kind],v=row.work;let sec=p.overheadMin*60+row.day*p.day;
 for(const field of ['activation','movement','poi','capital','final'])sec+=v[field]*p[field];
 return sec/60;
}
function stats(rows,field,kind){
 const a=rows.map(x=>field==='time'?x.time[kind]:x[field]);
 return {mean:mean(a),median:q(a,.5),p75:q(a,.75),p90:q(a,.9)};
}
const players=Number(process.argv[2]||2),group=process.argv[3]||'together',
 policy=process.argv[4]||'legacy',variant=process.argv[5]||'A',samples=Number(process.argv[6]||384);
if(![2,3,4].includes(players)||!['together','split','dynamic'].includes(group)||!['legacy','marginal','trust1','trust2'].includes(policy)||!['A','control'].includes(variant))throw Error('Invalid args');
const cs=combos(players),rows=[];
const opts={players,group,experiment:'ordinary',planner:'global',poiAware:true,resourceAware:true,poiStrategy:policy==='marginal'?'marginal':'legacy',st:'ST-NEUTRAL',talentRate:0,horizon:50};
if(policy==='trust1')opts.trustTarget=1;
if(policy==='trust2')opts.trustTarget=2;
if(players===2){opts.capitalDifficultyShift=-3;opts.teamDailyBonusActivations=1;opts.teamBonusSkipCadence=4;}
if(players===3){opts.capitalDifficultyShift=-3;opts.teamDailyBonusActivations=1;opts.teamBonusSkipCadence=6;}
if(players===4){opts.capitalDifficultyShift=0;opts.splitPairCapitalShift=-2;opts.teamDailyBonusActivations=1;opts.teamBonusCadence=2;}
if(variant==='A')opts.poiContinueMovement=true;
const offset=group==='split'?10000:group==='dynamic'?20000:group==='together'?30000:0;
for(let k=0;k<samples;k++){
 const r=X.simulate({...opts,profiles:cs[k%cs.length]},15100000+players*100000+offset+k,false);
 const win=r.completionDay!==null&&r.completionDay<=20;
 const work=audit(r,variant==='A'),day=win?r.completionDay:20;
 const row={win,day,poi:work.poi,work,trust:Object.values(r.deadline.trust).reduce((a,b)=>a+b,0),stable:r.deadline.capitals.filter(c=>c.stable).length,
 energy:r.deadline.energy,time:{}};
 for(const kind of Object.keys(timing))row.time[kind]=time(row,kind);
 rows.push(row);
}
const wins=rows.filter(x=>x.win),losses=rows.filter(x=>!x.win);
const duration=(slice,kind)=>({
 mean:stats(slice,'time',kind).mean,
 median:stats(slice,'time',kind).median,p75:stats(slice,'time',kind).p75,p90:stats(slice,'time',kind).p90,
 above150:slice.filter(x=>x.time[kind]>150).length/slice.length,
 above180:slice.filter(x=>x.time[kind]>180).length/slice.length,
 above210:slice.filter(x=>x.time[kind]>210).length/slice.length
});
const out={
 status:'DIAGNOSTIC ONLY; NONCANONICAL',players,group,policy,variant,samples,wins:wins.length,winRate:wins.length/samples,win95:wilson(wins.length,samples),
 meanWinDay:mean(wins.map(x=>x.day)),
 poi:{all:mean(rows.map(x=>x.poi)),wins:mean(wins.map(x=>x.poi)),losses:mean(losses.map(x=>x.poi)),medianWinning:q(wins.map(x=>x.poi),.5),p75Winning:q(wins.map(x=>x.poi),.75)},
 averageWork:Object.fromEntries(['activation','movement','poi','capital','final','cross','postPOIWalkSteps','poiContinueResolutions','unspentMovementAtPOI'].map(k=>[k,mean(rows.map(x=>x.work[k]))])),
 avgTrust:mean(rows.map(x=>x.trust)),avgStable:mean(rows.map(x=>x.stable)),avgEnergy:mean(rows.map(x=>x.energy)),
 session:{all:Object.fromEntries(Object.keys(timing).map(k=>[k,duration(rows,k)])),winning:Object.fromEntries(Object.keys(timing).map(k=>[k,duration(wins,k)]))},
 seedFormula:'15100000 + players*100000 + groupOffset + k, same across control/A',
 note:'No changes to approved rules, 20-day deadline, 88 card slots, stage assumptions, resource requirements, hero roster or capital checks. Card-time values are assumed and not measured. Exploration policy affects event count.'
};
const dir=path.join(__dirname,'variant-a-poi-continue');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,players+'-'+group+'-'+policy+'-'+variant+'.json'),JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
