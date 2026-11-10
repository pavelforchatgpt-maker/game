const fs=require('fs'),path=require('path'),X=require('../v2/experiment.cjs');
function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:null;}
function combos(n,start=1,p=[],out=[]){if(p.length===n){out.push([...p]);return out;}for(let i=start;i<=8;i++){p.push(i);combos(n,i+1,p,out);p.pop();}return out;}
const group=process.argv[2]||'dynamic',pairShift=+(process.argv[3]||-1),samples=+(process.argv[4]||192),cs=combos(4);
const completion=[],stable=[],fails=[],poi=[],trust=[],energy=[];
for(let k=0;k<samples;k++){
 const profiles=cs[k%cs.length];
 const r=X.simulate({players:4,group,profiles,experiment:'ordinary',planner:'global',poiAware:true,resourceAware:true,poiStrategy:'legacy',
  capitalDifficultyShift:0,splitPairCapitalShift:pairShift,teamDailyBonusActivations:1,st:'ST-NEUTRAL',talentRate:0,horizon:50},1500000+k,false);
 completion.push(r.completionDay);stable.push(r.deadline.capitals.filter(c=>c.stable).length);fails.push(r.metrics.capitalFailures||0);
 poi.push(r.metrics.poi||0);trust.push(Object.values(r.deadline.trust).reduce((a,b)=>a+b,0));energy.push(r.deadline.energy);
}
const days=[16,18,20,22,24,26,28],cdf=Object.fromEntries(days.map(d=>[d,completion.filter(x=>x!==null&&x<=d).length/samples]));
const out={group,pairShift,samples,cdf,meanCompletionDay:mean(completion.filter(x=>x!==null)),censored:completion.filter(x=>x===null).length,
 meanStableAt20:mean(stable),meanCapitalFailures:mean(fails),meanPOI:mean(poi),meanTrust:mean(trust),meanEnergyAt20:mean(energy),
 note:'DIAGNOSTIC ONLY. 4p; one shared bonus activation/day; 2-hero subgroup gets pairShift; 4-hero group gets canonical DC.'};
const dir=path.join(__dirname,'split-pair-shift');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,group+'-s'+pairShift+'.json'),JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));