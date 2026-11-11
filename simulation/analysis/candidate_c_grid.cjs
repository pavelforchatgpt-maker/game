const fs=require('fs'),path=require('path'),X=require('../v2/experiment.cjs');

function combos(n,start=1,p=[],out=[]){
  if(p.length===n){out.push([...p]);return out;}
  for(let i=start;i<=8;i++){p.push(i);combos(n,i+1,p,out);p.pop();}
  return out;
}
function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:null;}
function wilson(w,n){
  const z=1.96,p=w/n,d=1+z*z/n,m=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;
  return [Math.max(0,m-h),Math.min(1,m+h)];
}
function countTo20(r,type,pred=()=>true){
  let n=0;
  for(const d of r.ledger||[]){
    if(d.day>20)continue;
    for(const e of d.events||[])if(e.type===type&&pred(e))n++;
  }
  return n;
}
const players=+(process.argv[2]||2);
const group=process.argv[3]||'together';
const shift=+(process.argv[4]||-2);
const pairShift=+(process.argv[5]||-1);
const samples=+(process.argv[6]||256);
const cs=combos(players),rows=[];
for(let k=0;k<samples;k++){
 const profiles=cs[k%cs.length];
 const r=X.simulate({
  players,group,profiles,
  experiment:'ordinary',planner:'global',
  poiAware:true,resourceAware:true,poiStrategy:'legacy',
  capitalDifficultyShift:players<=3?shift:0,
  splitPairCapitalShift:players===4?pairShift:0,
  teamDailyBonusActivations:1,teamBonusCadence:2,
  st:'ST-NEUTRAL',talentRate:0,horizon:50
 },9100000+players*100000+(shift+6)*10000+(pairShift+4)*1000+k,false);
 rows.push(r);
}
const wins=rows.filter(r=>r.completionDay!==null&&r.completionDay<=20);
const out={
 players,group,capitalShift:players<=3?shift:0,splitPairCapitalShift:players===4?pairShift:0,
 teamBonusCadence:2,samples,wins:wins.length,winRate:wins.length/samples,win95:wilson(wins.length,samples),
 meanWinDay:mean(wins.map(r=>r.completionDay)),
 meanActivationsTo20:mean(rows.map(r=>countTo20(r,'activation'))),
 meanPOITo20:mean(rows.map(r=>countTo20(r,'poi'))),
 meanCapitalChecksTo20:mean(rows.map(r=>countTo20(r,'teamResult',e=>e.capital!==null))),
 meanStableAt20:mean(rows.map(r=>r.deadline.capitals.filter(c=>c.stable).length)),
 meanTrustAt20:mean(rows.map(r=>Object.values(r.deadline.trust).reduce((a,b)=>a+b,0))),
 meanEnergyAt20:mean(rows.map(r=>r.deadline.energy)),
 note:'DIAGNOSTIC Candidate C grid: shared bonus activation every 2nd day + capital scaling. Canonical rules unchanged.'
};
const dir=path.join(__dirname,'candidate-c-grid');fs.mkdirSync(dir,{recursive:true});
const name=players+'-'+group+'-s'+(players<=3?shift:0)+'-p'+(players===4?pairShift:0)+'.json';
fs.writeFileSync(path.join(dir,name),JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
