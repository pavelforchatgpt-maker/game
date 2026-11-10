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
const cadence=+(process.argv[2]||2);
const shift=+(process.argv[3]||-1);
const samples=+(process.argv[4]||512);
const cs=combos(4),rows=[];
for(let k=0;k<samples;k++){
  const profiles=cs[k%cs.length];
  rows.push(X.simulate({
    players:4,
    group:'split',
    profiles,
    experiment:'ordinary',
    planner:'global',
    poiAware:true,
    resourceAware:true,
    poiStrategy:'legacy',
    splitPairCapitalShift:shift,
    teamDailyBonusActivations:1,
    teamBonusCadence:cadence,
    st:'ST-NEUTRAL',
    talentRate:0,
    horizon:50
  },8100000+cadence*100000+(shift+5)*10000+k,false));
}
const wins=rows.filter(r=>r.completionDay!==null&&r.completionDay<=20);
const out={
  cadence,shift,samples,
  wins:wins.length,winRate:wins.length/samples,win95:wilson(wins.length,samples),
  meanWinDay:mean(wins.map(r=>r.completionDay)),medianWinDay:median(wins.map(r=>r.completionDay)),
  meanStableAt20:mean(rows.map(r=>r.deadline.capitals.filter(c=>c.stable).length)),
  meanEnergyAt20:mean(rows.map(r=>r.deadline.energy)),
  meanTrustAt20:mean(rows.map(r=>Object.values(r.deadline.trust).reduce((a,b)=>a+b,0))),
  meanPOI:mean(rows.map(r=>r.metrics.poi||0)),
  meanCapitalFailures:mean(rows.map(r=>r.metrics.capitalFailures||0)),
  meanSharedBonusActivations:mean(rows.map(r=>r.metrics.diagnosticTeamBonusActivation||0)),
  note:'DIAGNOSTIC ONLY: 4p fixed 2+2; one shared third activation every Nth day, assigned to the more urgent pair; pair capital DC shift as specified. Canonical rules unchanged.'
};
const dir=path.join(__dirname,'split-third-activation-cadence');fs.mkdirSync(dir,{recursive:true});
const name='c'+cadence+'-s'+shift+'.json';
fs.writeFileSync(path.join(dir,name),JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
