// Estimate distribution of tabletop minutes from full simulated trajectories.
// Timing inputs are the documented, unmeasured profiles in DURATION_MODEL_REPORT.md.
// Canonical rules are not altered.
const fs=require('fs'),path=require('path'),X=require('../v2/experiment.cjs');
function combos(n,start=1,p=[],out=[]){if(p.length===n){out.push([...p]);return out;}for(let i=start;i<=8;i++){p.push(i);combos(n,i+1,p,out);p.pop();}return out;}
function mean(a){return a.length?a.reduce((s,x)=>s+x,0)/a.length:null;}
function q(a,p){if(!a.length)return null;const b=[...a].sort((x,y)=>x-y),x=(b.length-1)*p,i=Math.floor(x);return b[i]+(b[Math.min(b.length-1,i+1)]-b[i])*(x-i);}
function count(r,type,pred=()=>true){let n=0;for(const d of r.ledger||[])if(d.day<=20)for(const e of d.events||[])if(e.type===type&&pred(e))n++;return n;}
const profiles={
 experienced:{activation:20,movement:7,poi:70,capital:50,day:10,final:60,overheadMin:20},
 normal:{activation:35,movement:10,poi:120,capital:85,day:15,final:90,overheadMin:35},
 firstPlay:{activation:50,movement:14,poi:165,capital:120,day:20,final:120,overheadMin:50}
};
function stats(rows,kind){
 const a=rows.map(x=>x.time[kind]);
 return {n:a.length,mean:mean(a),median:q(a,.5),p10:q(a,.1),p75:q(a,.75),p90:q(a,.9),exceeds150:a.filter(v=>v>150).length,exceeds150Rate:a.filter(v=>v>150).length/a.length};
}
const players=+(process.argv[2]||2),group=process.argv[3]||'together',samples=+(process.argv[4]||512);
if(![2,3,4].includes(players))throw Error('Invalid players');
const cs=combos(players),rows=[],opts={players,group,experiment:'ordinary',planner:'global',poiAware:true,resourceAware:true,poiStrategy:'legacy',st:'ST-NEUTRAL',talentRate:0,horizon:50};
if(players===2){opts.capitalDifficultyShift=-3;opts.teamDailyBonusActivations=1;opts.teamBonusSkipCadence=4;}
if(players===3){opts.capitalDifficultyShift=-3;opts.teamDailyBonusActivations=1;opts.teamBonusSkipCadence=6;}
if(players===4){opts.capitalDifficultyShift=0;opts.splitPairCapitalShift=-2;opts.teamDailyBonusActivations=1;opts.teamBonusCadence=2;}
const offset=group==='split'?10000:group==='dynamic'?20000:group==='together'?30000:0;
for(let k=0;k<samples;k++){
 const r=X.simulate({...opts,profiles:cs[k%cs.length]},15100000+players*100000+offset+k,false);
 const win=r.completionDay!==null&&r.completionDay<=20,day=win?r.completionDay:20;
 const tally={activation:count(r,'activation'),movement:count(r,'movement'),poi:count(r,'poi'),capital:count(r,'teamResult',e=>e.capital!==null),final:count(r,'teamResult',e=>e.final!==null)};
 const time={};for(const [name,p] of Object.entries(profiles))time[name]=(p.overheadMin*60+Object.entries(tally).reduce((a,[field,num])=>a+num*p[field],0)+day*p.day)/60;
 rows.push({win,day,tally,time});
}
const winners=rows.filter(x=>x.win);
const out={status:'ESTIMATE ONLY, not observed or canonical',players,group,samples,wins:winners.length,winRate:winners.length/samples,timingProfiles:profiles,
 all:Object.fromEntries(Object.keys(profiles).map(name=>[name,stats(rows,name)])),
 winning:Object.fromEntries(Object.keys(profiles).map(name=>[name,stats(winners,name)])),
 averageWork:Object.fromEntries(['activation','movement','poi','capital','final'].map(k=>[k,mean(rows.map(x=>x.tally[k]))])),
 meanWinDay:mean(winners.map(x=>x.day)),assumptions:[
  'Session minutes = timed activation decisions, movement rolls, POI cards, capital checks, final checks, world day administration plus fixed setup/discussion overhead.',
  'The timing rates were assumed in DURATION_MODEL_REPORT, not observed in tabletop testing.',
  'Does not include extra event text length, map handling friction or human deliberation beyond fixed budgets.',
  'All-game distribution includes 20-day losses; winning distribution conditions on success.',
  'This simulator uses an information-limited but highly optimized route planner; human pace and choices may differ.'
 ]};
const dir=path.join(__dirname,'selected-duration-distribution');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,players+'-'+group+'.json'),JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));
