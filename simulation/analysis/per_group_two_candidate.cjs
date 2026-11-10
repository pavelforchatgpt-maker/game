const fs=require('fs'),path=require('path'),X=require('../v2/experiment.cjs');
function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:null;}
const players=+(process.argv[2]||2),group=process.argv[3]||'together',samples=+(process.argv[4]||128);
const completion=[],stable20=[],fails=[],poi=[],trust=[],energy=[],extra=[];
for(let k=0;k<samples;k++){
 const r=X.simulate({players,group,experiment:'ordinary',planner:'global',poiAware:true,resourceAware:true,poiStrategy:'legacy',
  participantScaledCapital:true,perGroupDailyActivations:2,st:'ST-NEUTRAL',talentRate:0,horizon:50},1000000+players*10000+k,false);
 completion.push(r.completionDay);stable20.push(r.deadline.capitals.filter(c=>c.stable).length);fails.push(r.metrics.capitalFailures||0);
 poi.push(r.metrics.poi||0);trust.push(Object.values(r.deadline.trust).reduce((a,b)=>a+b,0));energy.push(r.deadline.energy);
 extra.push(r.metrics.diagnosticExtraActivation||0);
}
const days=[16,18,20,22,24,26,28,30],cdf=Object.fromEntries(days.map(d=>[d,completion.filter(x=>x!==null&&x<=d).length/samples]));
const finished=completion.filter(x=>x!==null),out={players,group,samples,cdf,meanCompletionDay:mean(finished),censored:completion.filter(x=>x===null).length,
 meanStableCapitalsAt20:mean(stable20),meanCapitalFailures:mean(fails),meanPOI:mean(poi),meanTrust:mean(trust),meanEnergyAt20:mean(energy),
 meanDiagnosticExtraActivations:mean(extra),
 note:'DIAGNOSTIC ONLY: each existing group gets up to 2 activations/day; capital DC shift by actual participants (2:-2,3:-1,4:0). Canonical rules unchanged. Ability #9 interaction is conservative in current engine.'};
const dir=path.join(__dirname,'candidate-per-group-two');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,players+'-'+group+'.json'),JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));