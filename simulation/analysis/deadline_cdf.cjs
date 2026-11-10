const fs=require('fs'),path=require('path'),X=require('../v2/experiment.cjs');
const players=+(process.argv[2]||2),group=process.argv[3]||'together',shift=+(process.argv[4]||0),samples=+(process.argv[5]||128);
const order=players===2?[2,1,0,3,4]:players===3?[4,3,0,2,1]:undefined;
const days=[20,22,24,26,28,30,35,40,50],completion=[],stable20=[],fail20=[];
for(let k=0;k<samples;k++){
 const r=X.simulate({players,group,experiment:'ordinary',planner:'global',poiAware:true,resourceAware:true,poiStrategy:'legacy',
  capitalDifficultyShift:shift,order,st:'ST-NEUTRAL',talentRate:0,horizon:50},980000+players*10000+(shift+3)*1000+k,false);
 completion.push(r.completionDay);
 stable20.push(r.deadline.capitals.filter(c=>c.stable).length);
 fail20.push(r.metrics.capitalFailures||0);
}
const cdf=Object.fromEntries(days.map(d=>[d,completion.filter(x=>x!==null&&x<=d).length/samples]));
const finished=completion.filter(x=>x!==null),mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
const out={players,group,shift,samples,order,cdf,meanCompletionDay:mean(finished),censored:completion.filter(x=>x===null).length,
 meanStableCapitalsAt20:mean(stable20),meanCapitalFailures:mean(fail20),
 completionDays:completion,note:'DIAGNOSTIC ONLY. Horizon 50 is not a rule change; CDF shows hypothetical deadline sensitivity.'};
const dir=path.join(__dirname,'deadline-cdf');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,players+'-'+group+'-s'+shift+'.json'),JSON.stringify(out,null,2));
console.log(JSON.stringify({...out,completionDays:undefined},null,2));