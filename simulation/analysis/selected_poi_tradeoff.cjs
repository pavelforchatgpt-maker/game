// Diagnostic POI policy comparison under selected reduced-activation V3 balance.
// Does not modify canonical rules, map, event slots, final DC or deadline.
const fs=require('fs'),path=require('path'),X=require('../v2/experiment.cjs');
function combos(n,start=1,p=[],out=[]){if(p.length===n){out.push([...p]);return out;}for(let i=start;i<=8;i++){p.push(i);combos(n,i+1,p,out);p.pop();}return out;}
function mean(a){return a.length?a.reduce((s,x)=>s+x,0)/a.length:null;}
function median(a){if(!a.length)return null;let b=[...a].sort((x,y)=>x-y);return b[Math.floor((b.length-1)/2)];}
function wilson(w,n){const z=1.96,p=w/n,d=1+z*z/n,m=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return [Math.max(0,m-h),Math.min(1,m+h)];}
function count(r,type,pred=()=>true){let n=0;for(const d of r.ledger||[])if(d.day<=20)for(const e of d.events||[])if(e.type===type&&pred(e))n++;return n;}
const players=+(process.argv[2]||2),group=process.argv[3]||'together',variant=process.argv[4]||'legacy',samples=+(process.argv[5]||384);
if(![2,3,4].includes(players)||!['together','split','dynamic'].includes(group)||!['legacy','marginal','trust1','trust2'].includes(variant))throw Error('Invalid test configuration');
const cs=combos(players),v=[],opts={players,group,experiment:'ordinary',planner:'global',poiAware:true,resourceAware:true,poiStrategy:variant==='marginal'?'marginal':'legacy',st:'ST-NEUTRAL',talentRate:0,horizon:50};
if(variant==='trust1')opts.trustTarget=1;
if(variant==='trust2')opts.trustTarget=2;
if(players===2){opts.capitalDifficultyShift=-3;opts.teamDailyBonusActivations=1;opts.teamBonusSkipCadence=4;}
if(players===3){opts.capitalDifficultyShift=-3;opts.teamDailyBonusActivations=1;opts.teamBonusSkipCadence=6;}
if(players===4){opts.capitalDifficultyShift=0;opts.splitPairCapitalShift=-2;opts.teamDailyBonusActivations=1;opts.teamBonusCadence=2;}
const off=group==='split'?10000:group==='dynamic'?20000:group==='together'?30000:0;
for(let k=0;k<samples;k++){
 const r=X.simulate({...opts,profiles:cs[k%cs.length]},15100000+players*100000+off+k,false);
 const win=r.completionDay!==null&&r.completionDay<=20;
 v.push({win,day:win?r.completionDay:null,poi:count(r,'poi'),activations:count(r,'activation'),movement:count(r,'movement'),capital:count(r,'teamResult',e=>e.capital!==null),final:count(r,'teamResult',e=>e.final!==null),stable:r.deadline.capitals.filter(c=>c.stable).length,trust:Object.values(r.deadline.trust).reduce((a,b)=>a+b,0),energy:r.deadline.energy});
}
const wins=v.filter(r=>r.win),losses=v.filter(r=>!r.win);
const out={status:'DIAGNOSTIC; no canonical change',players,group,variant,samples,wins:wins.length,winRate:wins.length/samples,win95:wilson(wins.length,samples),meanWinDay:mean(wins.map(x=>x.day)),meanPOI:mean(v.map(x=>x.poi)),meanWinningPOI:mean(wins.map(x=>x.poi)),medianWinningPOI:median(wins.map(x=>x.poi)),meanLosingPOI:mean(losses.map(x=>x.poi)),meanActivations:mean(v.map(x=>x.activations)),meanMovementRolls:mean(v.map(x=>x.movement)),meanCapitalChecks:mean(v.map(x=>x.capital)),meanFinalChecks:mean(v.map(x=>x.final)),meanStable:mean(v.map(x=>x.stable)),meanTrust:mean(v.map(x=>x.trust)),meanEnergy:mean(v.map(x=>x.energy)),source:'simulation/v2/experiment.cjs; selected reduced-activation candidate; fixed seed/profile cycling'};
const dir=path.join(__dirname,'poi-tradeoff');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,players+'-'+group+'-'+variant+'.json'),JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));
