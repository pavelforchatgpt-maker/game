const fs=require('fs'),path=require('path');
const D=require('../src/dag.cjs'),E=require('../v2/engine.cjs');

function permutations(a){
  if(a.length<=1)return [a.slice()];
  const out=[];
  for(let i=0;i<a.length;i++){
    const rest=a.slice(0,i).concat(a.slice(i+1));
    for(const p of permutations(rest))out.push([a[i],...p]);
  }
  return out;
}
function averageStable(r){
  let x=0;
  for(let i=0;i<=5;i++)x+=i*(r.terminalSummary['stableCapitals'+i]||0);
  return x/r.samples;
}
function problems(r){
  return Object.entries(r.means||{}).filter(([k])=>k.startsWith('problems_')).reduce((a,[,v])=>a+v,0);
}
function rankMetric(r){
  const stable=averageStable(r), probs=problems(r), wins=r.winRate||0;
  const dead=r.means?.provenCapitalBudgetDead||0;
  return wins*1e8 + stable*1e5 + probs*1e3 - dead*100;
}
function evaluate(cfg,samples,seed){
  const initial=E.initial(cfg.players,{
    policy:'WIN-MAX-HEURISTIC',
    st:'ST-NEUTRAL',
    talentRate:0,
    group:cfg.group,
    order:cfg.order,
    trustTarget:cfg.trustTarget,
    resourceAware:true,
    territory:'alternate'
  });
  const r=D.sample(initial,E.step,{samples,seed,maxSteps:1800});
  return {
    ...cfg,samples,
    winRate:r.winRate,win95:r.win95,meanWinDay:r.meanWinDay,
    avgStable:averageStable(r),avgProblems:problems(r),
    poi:r.means?.poi||0,capitalFailures:r.means?.capitalFailures||0,
    energyEvents:r.means?.energy||0,dead:r.means?.provenCapitalBudgetDead||0,
    graph:r.graph,terminalSummary:r.terminalSummary,score:rankMetric(r)
  };
}
function key(c){return c.order.join('')+'|'+c.trustTarget;}
const players=+(process.argv[2]||2),group=process.argv[3]||'together';
if(![[2,'together'],[3,'together'],[4,'together'],[4,'split'],[4,'dynamic']].some(x=>x[0]===players&&x[1]===group))throw Error('bad config');
const orders=permutations([0,1,2,3,4]),trustTargets=[0,1,2];
const coarse=[];
let idx=0;
for(const order of orders)for(const trustTarget of trustTargets){
  coarse.push(evaluate({players,group,order,trustTarget},8,310000+idx++));
}
coarse.sort((a,b)=>b.score-a.score);
const topKeys=new Set(coarse.slice(0,12).map(key));
const medium=[];
idx=0;
for(const c of coarse)if(topKeys.has(key(c))){
  medium.push(evaluate({players,group,order:c.order,trustTarget:c.trustTarget},128,410000+idx++));
}
medium.sort((a,b)=>b.score-a.score);
const final=[];
idx=0;
for(const c of medium.slice(0,3)){
  final.push(evaluate({players,group,order:c.order,trustTarget:c.trustTarget},1024,510000+idx++));
}
final.sort((a,b)=>b.score-a.score);
const result={players,group,method:{
  coarse:'120 capital orders × Trust target 0/1/2; 8 DAG trajectories each',
  medium:'top 12 policies; 128 DAG trajectories each',
  final:'top 3 policies; 1024 DAG trajectories each',
  note:'Information-limited ordinary engine outcomes; event/card/dice futures are not exposed to policy. Ranking falls back to capitals/problems solved when wins are rare.'
},coarseTop:coarse.slice(0,20),medium,final};
const dir=path.join(__dirname,'results');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,`${players}-${group}.json`),JSON.stringify(result,null,2));
console.log(JSON.stringify({players,group,final:final.map(x=>({order:x.order,trustTarget:x.trustTarget,winRate:x.winRate,win95:x.win95,meanWinDay:x.meanWinDay,avgStable:x.avgStable,avgProblems:x.avgProblems,poi:x.poi,capitalFailures:x.capitalFailures,graph:x.graph}))},null,2));
