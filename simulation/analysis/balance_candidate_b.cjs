const fs=require('fs'),path=require('path'),X=require('../v2/experiment.cjs');
function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:null;}
function combos(n,start=1,p=[],out=[]){if(p.length===n){out.push([...p]);return out;}for(let i=start;i<=8;i++){p.push(i);combos(n,i+1,p,out);p.pop();}return out;}
function wilson(w,n){const z=1.96,p=w/n,d=1+z*z/n,m=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return [Math.max(0,m-h),Math.min(1,m+h)];}
const players=+(process.argv[2]||2),group=process.argv[3]||'together',samples=+(process.argv[4]||256),st=process.argv[5]||'ST-NEUTRAL';
const shift=players<=3?-2:0,pairShift=players===4?-1:0,cs=combos(players);
const rows=[];
for(let k=0;k<samples;k++){
 const profiles=cs[k%cs.length];
 const r=X.simulate({players,group,profiles,experiment:'ordinary',planner:'global',poiAware:true,resourceAware:true,poiStrategy:'legacy',
  capitalDifficultyShift:shift,splitPairCapitalShift:pairShift,teamDailyBonusActivations:1,st,talentRate:0,horizon:50},2100000+players*100000+k,false);
 rows.push(r);
}
const wins=rows.filter(r=>r.wonBy20),completion=rows.map(r=>r.completionDay).filter(x=>x!==null);
const cdf=Object.fromEntries([16,18,20,22,24,26,28].map(d=>[d,rows.filter(r=>r.completionDay!==null&&r.completionDay<=d).length/samples]));
const out={players,group,st,samples,heroCompositions:cs.length,capitalShift:shift,splitPairCapitalShift:pairShift,winsBy20:wins.length,winRate:wins.length/samples,win95:wilson(wins.length,samples),cdf,meanCompletionDay:mean(completion),meanStableAt20:mean(rows.map(r=>r.deadline.capitals.filter(c=>c.stable).length)),meanCapitalFailures:mean(rows.map(r=>r.metrics.capitalFailures||0)),meanPOI:mean(rows.map(r=>r.metrics.poi||0)),meanTrust:mean(rows.map(r=>Object.values(r.deadline.trust).reduce((a,b)=>a+b,0))),note:'DIAGNOSTIC CANDIDATE B ONLY: one shared extra team activation/day; capital DC -2 for 2/3 players; for 4 players group-of-4 canonical DC, pair -1. Cycles approved hero compositions. Canonical rules unchanged.'};
const dir=path.join(__dirname,'candidate-b');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,players+'-'+group+'-'+st+'.json'),JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));
