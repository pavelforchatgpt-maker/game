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
  if(!n)return [0,0];
  const z=1.96,p=w/n,d=1+z*z/n,m=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;
  return [Math.max(0,m-h),Math.min(1,m+h)];
}
const players=+(process.argv[2]||2);
const mode=process.argv[3]||'control';
const samples=+(process.argv[4]||256);
const cs=combos(players);
const rows=[];
for(let k=0;k<samples;k++){
  const profiles=cs[k%cs.length];
  const opts={
    players,group:'together',profiles,
    experiment:'ordinary',planner:'global',
    poiAware:true,resourceAware:true,poiStrategy:'legacy',
    st:'ST-NEUTRAL',talentRate:0,horizon:50
  };
  if(mode!=='control'){
    opts.lowPlayerExtraCadence=1;
    if(mode!=='full')opts.lowPlayerBonusMode=mode;
  }
  const r=X.simulate(opts,7100000+players*100000+['control','travel','explore','capital','full'].indexOf(mode)*10000+k,false);
  rows.push(r);
}
const wins=rows.filter(r=>r.completionDay!==null&&r.completionDay<=20);
const out={
  players,mode,samples,heroCompositions:cs.length,
  wins:wins.length,winRate:wins.length/samples,win95:wilson(wins.length,samples),
  meanWinDay:mean(wins.map(r=>r.completionDay)),medianWinDay:median(wins.map(r=>r.completionDay)),
  meanStableAt20:mean(rows.map(r=>r.deadline.capitals.filter(c=>c.stable).length)),
  meanPOI:mean(rows.map(r=>r.metrics.poi||0)),
  meanTrustAt20:mean(rows.map(r=>Object.values(r.deadline.trust).reduce((a,b)=>a+b,0))),
  meanEnergyAt20:mean(rows.map(r=>r.deadline.energy)),
  meanCrossings:mean(rows.map(r=>r.metrics.crossings||0)),
  meanCapitalActivations:mean(rows.map(r=>r.metrics.capitalActivations||0)),
  meanCapitalFailures:mean(rows.map(r=>r.metrics.capitalFailures||0)),
  meanBonusActivations:mean(rows.map(r=>r.metrics.diagnosticExtraActivation||0)),
  meanBonusWasted:mean(rows.map(r=>r.metrics.diagnosticBonusWasted||0)),
  note:'DIAGNOSTIC ONLY. control=no bonus; travel=bonus ordinary movement only; explore=bonus movement+POI but no capital action; capital=bonus capital action only if already eligible, otherwise wasted; full=unrestricted second activation. Canonical rules unchanged.'
};
const dir=path.join(__dirname,'activation-components');
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,players+'p-'+mode+'.json'),JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
