const fs=require('fs'),path=require('path'),X=require('./experiment.cjs');

function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:null;}
function wilson(w,n){const z=1.96,p=w/n,d=1+z*z/n,m=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return [Math.max(0,m-h),Math.min(1,m+h)];}
function summarize(rows){
 const wins=rows.filter(r=>r.win), completed=rows.filter(r=>r.day!==null);
 return {
  n:rows.length,
  wins:wins.length,
  winRate:wins.length/rows.length,
  win95:wilson(wins.length,rows.length),
  meanCompletionDay:mean(completed.map(r=>r.day)),
  meanWinningDay:mean(wins.map(r=>r.day)),
  meanReserve:mean(wins.map(r=>20-r.day)),
  meanPOI:mean(rows.map(r=>r.poi)),
  meanTrust:mean(rows.map(r=>r.trust)),
  meanEnergyAtDeadline:mean(rows.map(r=>r.energy)),
  meanStableCapitalsAtDeadline:mean(rows.map(r=>r.stable)),
  meanCapitalFailures:mean(rows.map(r=>r.failures)),
  meanCrossings:mean(rows.map(r=>r.crossings))
 };
}
const configs=[];
for(const [players,group] of [[2,'together'],[3,'together'],[4,'together'],[4,'split'],[4,'dynamic']])
 for(const poiStrategy of ['legacy','marginal'])
  configs.push({players,group,poiStrategy});

const samples=+(process.argv[2]||192), baseSeed=+(process.argv[3]||910000);
const results=[];
for(let ci=0;ci<configs.length;ci++){
 const c=configs[ci],rows=[];
 for(let k=0;k<samples;k++){
  const r=X.simulate({
   players:c.players,group:c.group,experiment:'ordinary',planner:'global',
   poiAware:true,resourceAware:true,poiStrategy:c.poiStrategy,
   st:'ST-NEUTRAL',talentRate:0,horizon:50
  },baseSeed+ci*10000+k,false);
  const d=r.deadline;
  rows.push({
   win:r.wonBy20,day:r.completionDay,
   poi:r.metrics.poi||0,
   trust:Object.values(d.trust).reduce((a,b)=>a+b,0),
   energy:d.energy,
   stable:d.capitals.filter(x=>x.stable).length,
   failures:r.metrics.capitalFailures||0,
   crossings:r.metrics.crossings||0
  });
 }
 const summary=summarize(rows);
 results.push({configuration:c,summary});
 console.log(JSON.stringify({configuration:c,summary}));
}
const out={label:'POI POLICY A/B — ordinary randomness, non-cheating global planner',samples,baseSeed,results};
fs.writeFileSync(path.join(__dirname,'poi-policy-benchmark.json'),JSON.stringify(out,null,2));
