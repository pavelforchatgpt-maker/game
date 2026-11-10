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
const group=process.argv[3]||'together';
const shift=+(process.argv[4]||-1);
const samples=+(process.argv[5]||512);
const cs=combos(players);
const rows=[];
for(let k=0;k<samples;k++){
  const profiles=cs[k%cs.length];
  const options={
    players,group,profiles,
    experiment:'ordinary',
    planner:'global',
    poiAware:true,
    resourceAware:true,
    poiStrategy:'legacy',
    st:'ST-NEUTRAL',
    talentRate:0,
    horizon:50
  };
  if(players<4){
    options.lowPlayerExtraCadence=1;
    options.capitalDifficultyShift=shift;
  }else{
    options.splitPairCapitalShift=shift;
  }
  const seed=6100000+players*100000+(group==='split'?10000:group==='dynamic'?20000:0)+(shift+5)*1000+k;
  rows.push(X.simulate(options,seed,false));
}
const wins=rows.filter(r=>r.completionDay!==null&&r.completionDay<=20);
const out={
  players,group,shift,samples,heroCompositions:cs.length,
  lowPlayerDailySecondActivation:players<4,
  wins:wins.length,
  winRate:wins.length/samples,
  win95:wilson(wins.length,samples),
  meanWinDay:mean(wins.map(r=>r.completionDay)),
  medianWinDay:median(wins.map(r=>r.completionDay)),
  meanStableAt20:mean(rows.map(r=>r.deadline.capitals.filter(c=>c.stable).length)),
  meanCapitalFailures:mean(rows.map(r=>r.metrics.capitalFailures||0)),
  meanPOI:mean(rows.map(r=>r.metrics.poi||0)),
  meanTrustAt20:mean(rows.map(r=>Object.values(r.deadline.trust).reduce((a,b)=>a+b,0))),
  meanEnergyAt20:mean(rows.map(r=>r.deadline.energy)),
  completionCDF:Object.fromEntries([16,17,18,19,20,21,22,24,26,28,30].map(d=>[d,rows.filter(r=>r.completionDay!==null&&r.completionDay<=d).length/samples])),
  note:'DIAGNOSTIC ONLY. 2p/3p: daily second group activation + capital DC shift. 4p split/dynamic: canonical two normal group activations, pair-only capital DC shift. Canonical rules unchanged.'
};
const dir=path.join(__dirname,'action-capital-grid');
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,players+'p-'+group+'-shift'+shift+'.json'),JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
