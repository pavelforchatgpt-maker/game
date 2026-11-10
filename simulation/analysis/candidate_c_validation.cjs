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
const samples=+(process.argv[4]||1024);
const cs=combos(players),rows=[];
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
    options.capitalDifficultyShift=-2;
  }else{
    options.splitPairCapitalShift=-2;
    options.teamDailyBonusActivations=1;
    options.teamBonusCadence=2;
  }
  rows.push(X.simulate(options,9100000+players*100000+(group==='dynamic'?20000:group==='split'?10000:0)+k,false));
}
function countEvents(r,type){
  return r.ledger.filter(x=>x.day<=20).reduce((n,row)=>n+row.events.filter(e=>e.type===type).length,0);
}
const wins=rows.filter(r=>r.completionDay!==null&&r.completionDay<=20);
const playedDays=rows.map(r=>r.completionDay!==null&&r.completionDay<=20?r.completionDay:20);
const activations=rows.map(r=>countEvents(r,'activation'));
const pois=rows.map(r=>countEvents(r,'poi'));
const helps=rows.map(r=>countEvents(r,'help'));
const teamResults=rows.map(r=>countEvents(r,'teamResult'));
const out={
  players,group,samples,heroCompositions:cs.length,
  wins:wins.length,winRate:wins.length/samples,win95:wilson(wins.length,samples),
  meanWinDay:mean(wins.map(r=>r.completionDay)),medianWinDay:median(wins.map(r=>r.completionDay)),
  meanPlayedDays:mean(playedDays),
  meanActivationsToDeadlineOrWin:mean(activations),
  medianActivationsToDeadlineOrWin:median(activations),
  meanPOIToDeadlineOrWin:mean(pois),
  meanCapitalHelpActivationsToDeadlineOrWin:mean(helps),
  meanTeamResultsToDeadlineOrWin:mean(teamResults),
  meanStableAt20:mean(rows.map(r=>r.deadline.capitals.filter(c=>c.stable).length)),
  ruleProxy:players<4?'2 activations/day + capital team result +2':'2 pair activations/day + one shared extra every 2nd day + capital team result +2 for pair',
  note:'FINAL CANDIDATE VALIDATION, diagnostic only. Canonical rules unchanged.'
};
const dir=path.join(__dirname,'candidate-c-validation');fs.mkdirSync(dir,{recursive:true});
const name=players+'p-'+group+'.json';
fs.writeFileSync(path.join(dir,name),JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
