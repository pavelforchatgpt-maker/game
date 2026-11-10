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
const shift=+(process.argv[3]||-1);
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
    capitalDifficultyShift:shift,
    st:'ST-NEUTRAL',
    talentRate:0,
    horizon:30
  },4100000+players*100000+(shift+5)*10000+k,false);
  rows.push(r);
}
const deadline=25;
const wins=rows.filter(r=>r.completionDay!==null&&r.completionDay<=deadline);
const played=rows.map(r=>r.completionDay!==null&&r.completionDay<=deadline?r.completionDay:deadline);
const stableAt25=rows.map(r=>{
  if(r.completionDay!==null&&r.completionDay<=25)return 5;
  const snap=r.terminal?.day<=25?r.terminal:r.deadline;
  return snap?.capitals?.filter(c=>c.stable).length ?? null;
}).filter(x=>x!==null);
const out={
  players,
  capitalDifficultyShift:shift,
  samples,
  heroCompositions:cs.length,
  deadline,
  wins:wins.length,
  winRate:wins.length/samples,
  win95:wilson(wins.length,samples),
  meanWinDay:mean(wins.map(r=>r.completionDay)),
  medianWinDay:median(wins.map(r=>r.completionDay)),
  meanPlayedDays:mean(played),
  relativeTo20:mean(played)/20,
  meanStableCapitalsAt25:mean(stableAt25),
  completionCDF:Object.fromEntries([20,21,22,23,24,25,26,27,28,29,30].map(d=>[d,rows.filter(r=>r.completionDay!==null&&r.completionDay<=d).length/samples])),
  note:'DIAGNOSTIC ONLY: 25-day hypothetical deadline; no extra activations; only capital difficulty shift. Canonical rules unchanged.'
};
const dir=path.join(__dirname,'deadline25-capital-scaling');
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,players+'p-shift'+shift+'.json'),JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
