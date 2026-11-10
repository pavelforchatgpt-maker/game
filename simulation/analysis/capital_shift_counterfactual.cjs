const fs=require('fs'),path=require('path'),X=require('../v2/experiment.cjs');
function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:null;}
function summary(rows){const w=rows.filter(r=>r.win),done=rows.filter(r=>r.day!==null);return {
 n:rows.length,wins:w.length,winRate:w.length/rows.length,
 meanWinDay:mean(w.map(r=>r.day)),meanCompletionDay:mean(done.map(r=>r.day)),
 meanStableAt20:mean(rows.map(r=>r.stable)),meanCapitalFailures:mean(rows.map(r=>r.failures)),
 meanPOI:mean(rows.map(r=>r.poi)),meanTrust:mean(rows.map(r=>r.trust)),meanEnergy:mean(rows.map(r=>r.energy))
};}
const samples=+(process.argv[2]||24),seed0=+(process.argv[3]||940000),rows=[];
for(const players of [2,3,4])for(const shift of [0,-1,-2]){
 const group=players===4?'together':'together',out=[];
 for(let k=0;k<samples;k++){
  const r=X.simulate({players,group,experiment:'ordinary',planner:'global',poiAware:true,resourceAware:true,poiStrategy:'legacy',capitalDifficultyShift:shift,st:'ST-NEUTRAL',talentRate:0,horizon:50},seed0+players*10000+(shift+2)*1000+k,false);
  const d=r.deadline;
  out.push({win:r.wonBy20,day:r.completionDay,stable:d.capitals.filter(c=>c.stable).length,failures:r.metrics.capitalFailures||0,poi:r.metrics.poi||0,trust:Object.values(d.trust).reduce((a,b)=>a+b,0),energy:d.energy});
 }
 const s=summary(out);rows.push({players,shift,summary:s});console.log(JSON.stringify({players,shift,summary:s}));
}
fs.mkdirSync(path.join(__dirname,'capital-shift'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'capital-shift','quick.json'),JSON.stringify({label:'DIAGNOSTIC ONLY — capital difficulty shift counterfactual',samples,rows},null,2));
