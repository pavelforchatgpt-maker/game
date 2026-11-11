const fs=require('fs'),path=require('path'),X=require('../v2/experiment.cjs');
function combos(n,start=1,p=[],out=[]){if(p.length===n){out.push([...p]);return out;}for(let i=start;i<=8;i++){p.push(i);combos(n,i+1,p,out);p.pop();}return out;}
function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:null;}
function median(a){if(!a.length)return null;const b=[...a].sort((x,y)=>x-y),m=Math.floor(b.length/2);return b.length%2?b[m]:(b[m-1]+b[m])/2;}
function wilson(w,n){const z=1.96,p=w/n,d=1+z*z/n,m=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return [Math.max(0,m-h),Math.min(1,m+h)];}
function countTo20(r,type,pred=()=>true){let n=0;for(const d of r.ledger||[]){if(d.day>20)continue;for(const e of d.events||[])if(e.type===type&&pred(e))n++;}return n;}

const players=+(process.argv[2]||2),group=process.argv[3]||'together',samples=+(process.argv[4]||512),cs=combos(players),rows=[];
const opts={players,group,experiment:'ordinary',planner:'global',poiAware:true,resourceAware:true,poiStrategy:'legacy',st:'ST-NEUTRAL',talentRate:0,horizon:50};
if(players===2){opts.capitalDifficultyShift=-3;opts.teamDailyBonusActivations=1;opts.teamBonusSkipCadence=4;}
if(players===3){opts.capitalDifficultyShift=-3;opts.teamDailyBonusActivations=1;opts.teamBonusSkipCadence=6;}
if(players===4){opts.capitalDifficultyShift=0;opts.splitPairCapitalShift=-2;opts.teamDailyBonusActivations=1;opts.teamBonusCadence=2;}
for(let k=0;k<samples;k++){
  const profiles=cs[k%cs.length];
  const r=X.simulate({...opts,profiles},15100000+players*100000+(group==='split'?10000:group==='dynamic'?20000:group==='together'?30000:0)+k,false);
  rows.push(r);
}
const wins=rows.filter(r=>r.completionDay!==null&&r.completionDay<=20);
const out={players,group,samples,config:opts,wins:wins.length,winRate:wins.length/samples,win95:wilson(wins.length,samples),
 meanWinDay:mean(wins.map(r=>r.completionDay)),medianWinDay:median(wins.map(r=>r.completionDay)),
 meanActivationsTo20:mean(rows.map(r=>countTo20(r,'activation'))),meanMovementRollsTo20:mean(rows.map(r=>countTo20(r,'movement'))),
 meanPOITo20:mean(rows.map(r=>countTo20(r,'poi'))),meanCapitalChecksTo20:mean(rows.map(r=>countTo20(r,'teamResult',e=>e.capital!==null))),
 meanFinalChecksTo20:mean(rows.map(r=>countTo20(r,'teamResult',e=>e.final!==null))),meanCrossingsTo20:mean(rows.map(r=>countTo20(r,'cross'))),
 meanStableAt20:mean(rows.map(r=>r.deadline.capitals.filter(c=>c.stable).length)),meanTrustAt20:mean(rows.map(r=>Object.values(r.deadline.trust).reduce((a,b)=>a+b,0))),
 meanEnergyAt20:mean(rows.map(r=>r.deadline.energy)),
 note:'DIAGNOSTIC selected reduced-activation balance candidate. Canonical rules unchanged.'};
const dir=path.join(__dirname,'selected-balance-validation');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,players+'-'+group+'.json'),JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));