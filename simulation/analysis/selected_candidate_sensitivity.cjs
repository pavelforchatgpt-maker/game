// Diagnostic for the selected reduced-activation candidate.
// No canonical rules or balance configuration are modified.
const fs=require('fs'),path=require('path'),X=require('../v2/experiment.cjs');
function combinations(n,start=1,acc=[],out=[]){
 if(acc.length===n){out.push([...acc]);return out;}
 for(let i=start;i<=8;i++){acc.push(i);combinations(n,i+1,acc,out);acc.pop();}
 return out;
}
function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:null;}
function median(a){
 if(!a.length)return null;
 const b=[...a].sort((x,y)=>x-y),i=Math.floor(b.length/2);
 return b.length%2?b[i]:(b[i-1]+b[i])/2;
}
function wilson(w,n){
 const z=1.96,p=w/n,d=1+z*z/n,m=(p+z*z/(2*n))/d,
 h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;
 return [Math.max(0,m-h),Math.min(1,m+h)];
}
function count(r,type,pred=()=>true){
 let n=0;
 for(const d of r.ledger||[])if(d.day<=20)
  for(const e of d.events||[])if(e.type===type&&pred(e))n++;
 return n;
}
const players=+(process.argv[2]||2),
 group=process.argv[3]||'together',
 st=process.argv[4]||'ST-NEUTRAL',
 samples=+(process.argv[5]||384);
if(![2,3,4].includes(players)||!['together','split','dynamic'].includes(group)||!['ST-NEUTRAL','ST-MODERATE','ST-HARSH'].includes(st))throw Error('Invalid configuration');
const cs=combinations(players),entries=[],byProfile={};
const opts={players,group,experiment:'ordinary',planner:'global',poiAware:true,resourceAware:true,poiStrategy:'legacy',st,talentRate:0,horizon:50};
if(players===2){opts.capitalDifficultyShift=-3;opts.teamDailyBonusActivations=1;opts.teamBonusSkipCadence=4;}
if(players===3){opts.capitalDifficultyShift=-3;opts.teamDailyBonusActivations=1;opts.teamBonusSkipCadence=6;}
if(players===4){opts.capitalDifficultyShift=0;opts.splitPairCapitalShift=-2;opts.teamDailyBonusActivations=1;opts.teamBonusCadence=2;}
const suffix=group==='split'?10000:group==='dynamic'?20000:group==='together'?30000:0;
for(let k=0;k<samples;k++){
 const profiles=cs[k%cs.length],key=profiles.join('-');
 const r=X.simulate({...opts,profiles},15100000+players*100000+suffix+k,false);
 const win=r.completionDay!==null&&r.completionDay<=20;
 const item={win,day:win?r.completionDay:null,
  poi:count(r,'poi'),activations:count(r,'activation'),
  movement:count(r,'movement'),
  capital:count(r,'teamResult',e=>e.capital!==null),
  final:count(r,'teamResult',e=>e.final!==null),
  stable:r.deadline.capitals.filter(c=>c.stable).length,
  trust:Object.values(r.deadline.trust).reduce((a,b)=>a+b,0),
  energy:r.deadline.energy};
 entries.push(item);
 const p=byProfile[key]??={n:0,wins:0};p.n++;if(win)p.wins++;
}
const wins=entries.filter(x=>x.win),losses=entries.filter(x=>!x.win);
const profileRows=Object.entries(byProfile).map(([profile,v])=>({profile,...v,rate:v.wins/v.n}));
const out={
 status:'DIAGNOSTIC ONLY, NOT CANONICAL',
 engine:'simulation/v2/experiment.cjs',
 config:opts,seedRule:'15100000 + players*100000 + groupOffset + k, as selected validation',
 samples,wins:wins.length,winRate:wins.length/samples,win95:wilson(wins.length,samples),
 meanWinDay:mean(wins.map(x=>x.day)),medianWinDay:median(wins.map(x=>x.day)),
 all:{
  activations:mean(entries.map(x=>x.activations)),
  movementRolls:mean(entries.map(x=>x.movement)),
  poi:mean(entries.map(x=>x.poi)),
  capitalChecks:mean(entries.map(x=>x.capital)),
  finalChecks:mean(entries.map(x=>x.final)),
  stableCapitals:mean(entries.map(x=>x.stable)),
  trust:mean(entries.map(x=>x.trust)),
  energy:mean(entries.map(x=>x.energy))
 },
 winning:{
  poi:mean(wins.map(x=>x.poi)),medianPOI:median(wins.map(x=>x.poi)),
  activations:mean(wins.map(x=>x.activations)),
  capitalChecks:mean(wins.map(x=>x.capital))
 },
 losing:{
  poi:mean(losses.map(x=>x.poi)),
  activations:mean(losses.map(x=>x.activations)),
  stableCapitals:mean(losses.map(x=>x.stable))
 },
 goals:{poi:players===2?[18,20]:players===3?[23,26]:[29,32]},
 heroCompositions:cs.length,
 profileRates:profileRows
};
const dir=path.join(__dirname,'selected-candidate-sensitivity');
fs.mkdirSync(dir,{recursive:true});
const name=players+'-'+group+'-'+st+'.json';
fs.writeFileSync(path.join(dir,name),JSON.stringify(out,null,2));
console.log(JSON.stringify({...out,profileRates:undefined},null,2));
