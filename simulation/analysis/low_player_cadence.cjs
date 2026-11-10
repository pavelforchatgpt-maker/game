const fs=require('fs'),path=require('path'),X=require('../v2/experiment.cjs');

function combos(n,start=1,p=[],out=[]){
  if(p.length===n){out.push([...p]);return out;}
  for(let i=start;i<=8;i++){p.push(i);combos(n,i+1,p,out);p.pop();}
  return out;
}
function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:null;}
function median(a){
  if(!a.length)return null;
  const b=[...a].sort((x,y)=>x-y),m=Math.floor(b.length/2);
  return b.length%2?b[m]:(b[m-1]+b[m])/2;
}
function wilson(w,n){
  const z=1.96,p=w/n,d=1+z*z/n,m=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;
  return [Math.max(0,m-h),Math.min(1,m+h)];
}
const players=+(process.argv[2]||2);
const cadence=+(process.argv[3]||3);
const samples=+(process.argv[4]||512);
const cs=combos(players);
const rows=[];
for(let k=0;k<samples;k++){
  const profiles=cs[k%cs.length];
  const r=X.simulate({
    players,
    group:'together',
    profiles,
    experiment:'ordinary',
    planner:'global',
    poiAware:true,
    resourceAware:true,
    poiStrategy:'legacy',
    lowPlayerExtraCadence:cadence,
    st:'ST-NEUTRAL',
    talentRate:0,
    horizon:50
  },5100000+players*100000+cadence*10000+k,false);
  rows.push(r);
}
const wins=rows.filter(r=>r.completionDay!==null&&r.completionDay<=20);
const winDays=wins.map(r=>r.completionDay);
const out={
  players,
  cadence,
  samples,
  heroCompositions:cs.length,
  wins:wins.length,
  winRate:wins.length/samples,
  win95:wilson(wins.length,samples),
  meanWinDay:mean(winDays),
  medianWinDay:median(winDays),
  meanStableAt20:mean(rows.map(r=>r.deadline.capitals.filter(c=>c.stable).length)),
  meanCapitalFailures:mean(rows.map(r=>r.metrics.capitalFailures||0)),
  meanPOI:mean(rows.map(r=>r.metrics.poi||0)),
  meanTrustAt20:mean(rows.map(r=>Object.values(r.deadline.trust).reduce((a,b)=>a+b,0))),
  meanEnergyAt20:mean(rows.map(r=>r.deadline.energy)),
  meanExtraActivations:mean(rows.map(r=>r.metrics.diagnosticExtraActivation||0)),
  completionCDF:Object.fromEntries([14,15,16,17,18,19,20,21,22,24,26,28,30].map(d=>[d,rows.filter(r=>r.completionDay!==null&&r.completionDay<=d).length/samples])),
  note:'DIAGNOSTIC ONLY: canonical 20-day rules except one extra full activation for the single low-player group every Nth day. No DC/movement/energy/map changes.'
};
const dir=path.join(__dirname,'low-player-cadence');
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,players+'p-c'+cadence+'.json'),JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));

// trigger workflow registration
