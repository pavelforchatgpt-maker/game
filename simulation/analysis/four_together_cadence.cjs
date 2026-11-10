const fs=require('fs'),path=require('path'),X=require('../v2/experiment.cjs');
function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:null;}
function wilson(w,n){const z=1.96,p=w/n,d=1+z*z/n,m=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return [Math.max(0,m-h),Math.min(1,m+h)];}
const cadence=+(process.argv[2]||2),offset=+(process.argv[3]||0),samples=+(process.argv[4]||256);
const completion=[],wins=[],stable=[],fails=[],poi=[],trust=[],energy=[];
for(let k=0;k<samples;k++){
 const r=X.simulate({players:4,group:'together',experiment:'ordinary',planner:'global',poiAware:true,resourceAware:true,poiStrategy:'legacy',
  capitalDifficultyShift:0,teamDailyBonusActivations:1,largeGroupMovementBonus:1,largeGroupMovementCadence:cadence,largeGroupMovementOffset:offset,
  st:'ST-NEUTRAL',talentRate:0,horizon:50},1800000+offset*100000+k,false);
 completion.push(r.completionDay);wins.push(r.wonBy20);stable.push(r.deadline.capitals.filter(c=>c.stable).length);fails.push(r.metrics.capitalFailures||0);
 poi.push(r.metrics.poi||0);trust.push(Object.values(r.deadline.trust).reduce((a,b)=>a+b,0));energy.push(r.deadline.energy);
}
const w=wins.filter(Boolean).length,days=[16,18,20,22,24,26,28],cdf=Object.fromEntries(days.map(d=>[d,completion.filter(x=>x!==null&&x<=d).length/samples]));
const out={players:4,group:'together',cadence,offset,samples,winsBy20:w,winRate:w/samples,win95:wilson(w,samples),cdf,
 meanCompletionDay:mean(completion.filter(x=>x!==null)),censored:completion.filter(x=>x===null).length,meanStableAt20:mean(stable),
 meanCapitalFailures:mean(fails),meanPOI:mean(poi),meanTrust:mean(trust),meanEnergyAt20:mean(energy),
 note:'DIAGNOSTIC ONLY: shared extra team activation/day; canonical 4p capital DC; +1 movement to all heroes only while active group size=4 and only on cadence-eligible days. Canonical rules unchanged.'};
const dir=path.join(__dirname,'four-together-cadence');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'c'+cadence+'-o'+offset+'.json'),JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));
