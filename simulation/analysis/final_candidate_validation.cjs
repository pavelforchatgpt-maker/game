const fs=require('fs'),path=require('path'),X=require('../v2/experiment.cjs');
function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:null;}
function combos(n,start=1,p=[],out=[]){if(p.length===n){out.push([...p]);return out;}for(let i=start;i<=8;i++){p.push(i);combos(n,i+1,p,out);p.pop();}return out;}
function wilson(w,n){const z=1.96,p=w/n,d=1+z*z/n,m=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return [Math.max(0,m-h),Math.min(1,m+h)];}
const players=+(process.argv[2]||2),group=process.argv[3]||'together',st=process.argv[4]||'ST-NEUTRAL',samples=+(process.argv[5]||512);
const shift=players===2?-2:players===3?-1:0,pairShift=players===4?-1:0,cs=combos(players);
const completion=[],stable=[],fails=[],poi=[],trust=[],energy=[],wins=[];
for(let k=0;k<samples;k++){
 const profiles=cs[k%cs.length];
 const r=X.simulate({players,group,profiles,experiment:'ordinary',planner:'global',poiAware:true,resourceAware:true,poiStrategy:'legacy',
  capitalDifficultyShift:shift,splitPairCapitalShift:pairShift,teamDailyBonusActivations:1,st,talentRate:0,horizon:50},1600000+players*100000+k,false);
 completion.push(r.completionDay);wins.push(r.wonBy20);stable.push(r.deadline.capitals.filter(c=>c.stable).length);fails.push(r.metrics.capitalFailures||0);
 poi.push(r.metrics.poi||0);trust.push(Object.values(r.deadline.trust).reduce((a,b)=>a+b,0));energy.push(r.deadline.energy);
}
const w=wins.filter(Boolean).length,days=[16,18,20,22,24,26,28,30],cdf=Object.fromEntries(days.map(d=>[d,completion.filter(x=>x!==null&&x<=d).length/samples]));
const out={players,group,st,samples,heroCompositions:cs.length,capitalShift:shift,splitPairCapitalShift:pairShift,
 winsBy20:w,winRate:w/samples,win95:wilson(w,samples),cdf,meanCompletionDay:mean(completion.filter(x=>x!==null)),censored:completion.filter(x=>x===null).length,
 meanStableAt20:mean(stable),meanCapitalFailures:mean(fails),meanPOI:mean(poi),meanTrust:mean(trust),meanEnergyAt20:mean(energy),
 note:'FINAL CANDIDATE DIAGNOSTIC ONLY: every normal group activation remains; one shared extra team group activation/day; capital DC: 2p -2, 3p -1, 4p group of 4 +0, 4p pair -1. Canonical rules unchanged.'};
const dir=path.join(__dirname,'final-candidate-validation');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,players+'-'+group+'-'+st+'.json'),JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));