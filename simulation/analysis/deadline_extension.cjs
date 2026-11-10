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
function percentile(a,q){
  if(!a.length)return null;
  const b=[...a].sort((x,y)=>x-y),i=(b.length-1)*q,lo=Math.floor(i),hi=Math.ceil(i);
  return b[lo]+(b[hi]-b[lo])*(i-lo);
}
const players=+(process.argv[2]||2);
const group=process.argv[3]||'together';
const samples=+(process.argv[4]||512);
const cs=combos(players);
const rows=[];
for(let k=0;k<samples;k++){
  const profiles=cs[k%cs.length];
  const r=X.simulate({
    players,group,profiles,
    experiment:'ordinary',
    planner:'global',
    poiAware:true,
    resourceAware:true,
    poiStrategy:'legacy',
    st:'ST-NEUTRAL',
    talentRate:0,
    horizon:30
  },3100000+players*100000+(group==='split'?10000:group==='dynamic'?20000:0)+k,false);
  rows.push(r);
}
const deadlines=[20,25,30];
const summary={players,group,samples,heroCompositions:cs.length,mode:'CANONICAL ordinary/global, ST-NEUTRAL, no rule compensation',deadlines:{}};
for(const d of deadlines){
  const wins=rows.filter(r=>r.completionDay!==null&&r.completionDay<=d);
  const played=rows.map(r=>r.completionDay!==null&&r.completionDay<=d?r.completionDay:d);
  const winDays=wins.map(r=>r.completionDay);
  summary.deadlines[d]={
    wins:wins.length,
    winRate:wins.length/samples,
    meanWinDay:mean(winDays),
    medianWinDay:median(winDays),
    p25WinDay:percentile(winDays,.25),
    p75WinDay:percentile(winDays,.75),
    meanPlayedDays:mean(played),
    medianPlayedDays:median(played),
    meanPlayedDaysVs20:mean(played)/20
  };
}
summary.completionCDF=Object.fromEntries([16,18,20,22,24,25,26,28,30].map(d=>[d,rows.filter(r=>r.completionDay!==null&&r.completionDay<=d).length/samples]));
summary.censoredAt30=rows.filter(r=>r.completionDay===null||r.completionDay>30).length;
const dir=path.join(__dirname,'deadline-extension');
fs.mkdirSync(dir,{recursive:true});
const file=path.join(dir,players+'-'+group+'.json');
fs.writeFileSync(file,JSON.stringify(summary,null,2));
console.log(JSON.stringify(summary,null,2));
