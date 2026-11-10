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
const shift=+(process.argv[2]||-2);
const initialEnergy=+(process.argv[3]||0);
const initialTrust=+(process.argv[4]||0);
const samples=+(process.argv[5]||512);
const cs=combos(4),rows=[];
for(let k=0;k<samples;k++){
  const profiles=cs[k%cs.length];
  const r=X.simulate({
    players:4,
    group:'split',
    profiles,
    experiment:'ordinary',
    planner:'global',
    poiAware:true,
    resourceAware:true,
    poiStrategy:'legacy',
    splitPairCapitalShift:shift,
    initialEnergy,
    initialTrust,
    st:'ST-NEUTRAL',
    talentRate:0,
    horizon:50
  },7100000+(shift+5)*100000+initialEnergy*10000+initialTrust*1000+k,false);
  rows.push(r);
}
const wins=rows.filter(r=>r.completionDay!==null&&r.completionDay<=20);
const deadline=rows.map(r=>r.deadline);
const allStable=deadline.filter(s=>s.capitals.every(c=>c.stable)).length;
const enoughEnergy=deadline.filter(s=>s.energy>=8 || s.tree?.started).length;
const allTree=deadline.filter(s=>s.heroes.every(h=>h.tile==='C-1')).length;
const out={
  shift,initialEnergy,initialTrust,samples,
  wins:wins.length,winRate:wins.length/samples,win95:wilson(wins.length,samples),
  meanWinDay:mean(wins.map(r=>r.completionDay)),medianWinDay:median(wins.map(r=>r.completionDay)),
  meanStableAt20:mean(deadline.map(s=>s.capitals.filter(c=>c.stable).length)),
  allStableAt20:allStable/samples,
  enoughEnergyAt20:enoughEnergy/samples,
  allAtTreeAt20:allTree/samples,
  meanEnergyAt20:mean(deadline.map(s=>s.energy)),
  meanTrustAt20:mean(deadline.map(s=>Object.values(s.trust).reduce((a,b)=>a+b,0))),
  meanPOI:mean(rows.map(r=>r.metrics.poi||0)),
  meanCapitalFailures:mean(rows.map(r=>r.metrics.capitalFailures||0)),
  note:'DIAGNOSTIC ONLY. initialEnergy is a proxy for reducing the amount of energy that must be collected; initialTrust=1 is a proxy for one fewer required capital problem per nation. Canonical rules unchanged.'
};
const dir=path.join(__dirname,'split-resource-bottleneck');fs.mkdirSync(dir,{recursive:true});
const name='s'+shift+'-e'+initialEnergy+'-t'+initialTrust+'.json';
fs.writeFileSync(path.join(dir,name),JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));

// trigger resource diagnostic
