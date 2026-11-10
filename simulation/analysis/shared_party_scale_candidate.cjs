const fs=require('fs'),path=require('path'),X=require('../v2/experiment.cjs');
function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:null;}
const players=+(process.argv[2]||2),group=process.argv[3]||'together',samples=+(process.argv[4]||128);
const shift=players===2?-2:players===3?-1:0;
const completion=[],stable20=[],fails=[],poi=[],trust=[],energy=[],bonus=[];
for(let k=0;k<samples;k++){
 const r=X.simulate({players,group,experiment:'ordinary',planner:'global',poiAware:true,resourceAware:true,poiStrategy:'legacy',
  capitalDifficultyShift:shift,teamDailyBonusActivations:1,st:'ST-NEUTRAL',talentRate:0,horizon:50},1200000+players*10000+k,false);
 completion.push(r.completionDay);stable20.push(r.deadline.capitals.filter(c=>c.stable).length);fails.push(r.metrics.capitalFailures||0);
 poi.push(r.metrics.poi||0);trust.push(Object.values(r.deadline.trust).reduce((a,b)=>a+b,0));energy.push(r.deadline.energy);
 bonus.push(r.metrics.diagnosticTeamBonusActivation||0);
}
const days=[16,18,20,22,24,26,28,30],cdf=Object.fromEntries(days.map(d=>[d,completion.filter(x=>x!==null&&x<=d).length/samples]));
const finished=completion.filter(x=>x!==null),out={players,group,shift,samples,cdf,meanCompletionDay:mean(finished),censored:completion.filter(x=>x===null).length,
 meanStableCapitalsAt20:mean(stable20),meanCapitalFailures:mean(fails),meanPOI:mean(poi),meanTrust:mean(trust),meanEnergyAt20:mean(energy),
 meanTeamBonusActivations:mean(bonus),
 note:'DIAGNOSTIC ONLY: one shared extra team activation/day; capital DC scales by total player count only: 2p -2, 3p -1, 4p 0. Splitting 4p does not lower DC. Canonical rules unchanged.'};
const dir=path.join(__dirname,'candidate-shared-party-scale');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,players+'-'+group+'.json'),JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));