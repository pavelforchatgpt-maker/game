const fs=require('fs'),path=require('path'),X=require('../v2/experiment.cjs');
function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:null;}
const group=process.argv[2]||'together',bonus=+(process.argv[3]||0),samples=+(process.argv[4]||128);
const completion=[],stable20=[],fails=[],poi=[],trust=[],energy=[];
for(let k=0;k<samples;k++){
 const r=X.simulate({players:4,group,experiment:'ordinary',planner:'global',poiAware:true,resourceAware:true,poiStrategy:'legacy',
  capitalDifficultyShift:0,teamDailyBonusActivations:1,largeGroupMovementBonus:bonus,st:'ST-NEUTRAL',talentRate:0,horizon:50},1300000+bonus*10000+k,false);
 completion.push(r.completionDay);stable20.push(r.deadline.capitals.filter(c=>c.stable).length);fails.push(r.metrics.capitalFailures||0);
 poi.push(r.metrics.poi||0);trust.push(Object.values(r.deadline.trust).reduce((a,b)=>a+b,0));energy.push(r.deadline.energy);
}
const days=[16,18,20,22,24,26,28],cdf=Object.fromEntries(days.map(d=>[d,completion.filter(x=>x!==null&&x<=d).length/samples]));
const finished=completion.filter(x=>x!==null),out={players:4,group,largeGroupMovementBonus:bonus,samples,cdf,meanCompletionDay:mean(finished),censored:completion.filter(x=>x===null).length,
 meanStableCapitalsAt20:mean(stable20),meanCapitalFailures:mean(fails),meanPOI:mean(poi),meanTrust:mean(trust),meanEnergyAt20:mean(energy),
 note:'DIAGNOSTIC ONLY: shared extra activation/day; 4p capital DC canonical; movement bonus applies only while active group size is 4.'};
const dir=path.join(__dirname,'large-group-move');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,group+'-b'+bonus+'.json'),JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));