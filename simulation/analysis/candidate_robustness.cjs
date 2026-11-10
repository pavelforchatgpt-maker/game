const fs=require('fs'),path=require('path'),X=require('../v2/experiment.cjs');
function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:null;}
function combos(n,start=1,p=[],out=[]){if(p.length===n){out.push([...p]);return out;}for(let i=start;i<=8;i++){p.push(i);combos(n,i+1,p,out);p.pop();}return out;}
const players=+(process.argv[2]||2),group=process.argv[3]||'together',st=process.argv[4]||'ST-NEUTRAL',samples=+(process.argv[5]||192);
const shift=players===2?-2:players===3?-1:0,cs=combos(players),completion=[],stable=[],fail=[],poi=[],trust=[],energy=[],byProfile={};
for(let k=0;k<samples;k++){
 const profiles=cs[k%cs.length],key=profiles.join('-');
 const r=X.simulate({players,group,profiles,experiment:'ordinary',planner:'global',poiAware:true,resourceAware:true,poiStrategy:'legacy',
  capitalDifficultyShift:shift,teamDailyBonusActivations:1,st,talentRate:0,horizon:50},1400000+players*100000+k,false);
 completion.push(r.completionDay);stable.push(r.deadline.capitals.filter(c=>c.stable).length);fail.push(r.metrics.capitalFailures||0);poi.push(r.metrics.poi||0);
 trust.push(Object.values(r.deadline.trust).reduce((a,b)=>a+b,0));energy.push(r.deadline.energy);
 byProfile[key]??={n:0,w:0};byProfile[key].n++;if(r.wonBy20)byProfile[key].w++;
}
const days=[16,18,20,22,24,26],cdf=Object.fromEntries(days.map(d=>[d,completion.filter(x=>x!==null&&x<=d).length/samples]));
const rates=Object.entries(byProfile).filter(([,v])=>v.n>=2).map(([k,v])=>({profiles:k,n:v.n,rate:v.w/v.n})).sort((a,b)=>a.rate-b.rate);
const out={players,group,st,samples,compositions:cs.length,shift,cdf,meanCompletionDay:mean(completion.filter(x=>x!==null)),censored:completion.filter(x=>x===null).length,
 meanStableAt20:mean(stable),meanCapitalFailures:mean(fail),meanPOI:mean(poi),meanTrust:mean(trust),meanEnergyAt20:mean(energy),
 observedProfileRateRange:rates.length?{low:rates.slice(0,5),high:rates.slice(-5)}:null,
 note:'ROBUSTNESS DIAGNOSTIC ONLY. Cycles all approved hero combinations; random event/dice/ability outcomes. Shared team bonus activation/day; capital shift by total player count. Canonical rules unchanged.'};
const dir=path.join(__dirname,'candidate-robustness');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,players+'-'+group+'-'+st+'.json'),JSON.stringify(out,null,2));console.log(JSON.stringify({...out,observedProfileRateRange:undefined},null,2));