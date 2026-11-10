const fs=require('fs'),path=require('path');
const D=require('../src/dag.cjs'),E=require('../v2/engine.cjs');

const nations=['Рост','Поток','Искра','Слово','Камень'];

function rng(seed){let x=seed>>>0;return()=>{x=(1664525*x+1013904223)>>>0;return x/2**32;};}
function shuffle(a,r){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function averageStable(r){let x=0;for(let i=0;i<=5;i++)x+=i*(r.terminalSummary['stableCapitals'+i]||0);return x/r.samples;}
function problems(r){return Object.entries(r.means||{}).filter(([k])=>k.startsWith('problems_')).reduce((a,[,v])=>a+v,0);}
function rankMetric(r){
  if(r.error)return -Infinity;
  const stable=averageStable(r),probs=problems(r),wins=r.winRate||0,dead=r.means?.provenCapitalBudgetDead||0;
  const poi=r.means?.poi||0,energy=r.means?.energy||0,fail=r.means?.capitalFailures||0;
  return wins*1e8+stable*1e5+probs*1e3+energy*120-poi*15-fail*250-dead*100;
}
function stateSummary(s){if(!s)return null;return {day:s.day,phase:s.phase,groups:s.groups,active:s.active,positions:s.heroes?.map((h,i)=>({i,tile:h.tile,cell:h.cell,acted:h.acted,ability:h.ability})),energy:s.energy,trust:s.trust,capitals:s.capitals?.map(c=>({stable:c.stable,solved:c.solved,leaders:c.leaders,retryDay:c.retryDay})),target:s.target,rendezvous:s.rendezvous,jobs:s.jobs,bonus:s.bonus};}
function evaluate(cfg,samples,seed){
  const initial=E.initial(cfg.players,{
    policy:'WIN-MAX-HEURISTIC',st:'ST-NEUTRAL',talentRate:0,group:cfg.group,
    order:cfg.order,trustTargets:cfg.trustTargets,trustWeight:cfg.trustWeight,
    resourceAware:true,poiAware:true,poiStrategy:cfg.poiStrategy,strongSuccessChoice:true,
    splitDay:cfg.splitDay,pairing:cfg.pairing,territory:'alternate'
  });
  let failedState=null;
  const step=s=>{try{return E.step(s);}catch(err){failedState=structuredClone(s);throw err;}};
  try{
    const r=D.sample(initial,step,{samples,seed,maxSteps:1800});
    return {...cfg,samples,winRate:r.winRate,win95:r.win95,meanWinDay:r.meanWinDay,
      avgStable:averageStable(r),avgProblems:problems(r),poi:r.means?.poi||0,
      capitalFailures:r.means?.capitalFailures||0,energyEvents:r.means?.energy||0,
      dead:r.means?.provenCapitalBudgetDead||0,graph:r.graph,terminalSummary:r.terminalSummary,
      means:r.means,score:rankMetric(r)};
  }catch(err){return {...cfg,samples,error:err.message,failedState:stateSummary(failedState),score:-Infinity};}
}
function randomTrust(r){const out={};for(const n of nations){const x=r();out[n]=x<.55?0:x<.9?1:2;}return out;}
function randomCandidate(players,group,r){
  const c={players,group,order:shuffle([0,1,2,3,4],r),trustTargets:randomTrust(r),
    trustWeight:[.5,.75,1,1.25,1.5,2][Math.floor(r()*6)],
    poiStrategy:r()<.7?'marginal':'default'};
  if(players===4&&(group==='split'||group==='dynamic'))c.splitDay=1+Math.floor(r()*8);
  if(players===4&&group==='split')c.pairing=Math.floor(r()*3);
  return c;
}
function baseline(players,group){const c={players,group,order:[0,1,2,3,4],trustTargets:Object.fromEntries(nations.map(n=>[n,0])),trustWeight:1,poiStrategy:'marginal'};if(players===4&&(group==='split'||group==='dynamic'))c.splitDay=1;if(players===4&&group==='split')c.pairing=0;return c;}
function mutate(base,r){
  const c=structuredClone(base),op=Math.floor(r()*7);
  if(op===0){const i=Math.floor(r()*5),j=Math.floor(r()*5);[c.order[i],c.order[j]]=[c.order[j],c.order[i]];}
  else if(op===1){const n=nations[Math.floor(r()*5)];c.trustTargets[n]=Math.floor(r()*3);}
  else if(op===2)c.trustWeight=[.5,.75,1,1.25,1.5,2][Math.floor(r()*6)];
  else if(op===3)c.poiStrategy=c.poiStrategy==='marginal'?'default':'marginal';
  else if(op===4&&c.players===4&&(c.group==='split'||c.group==='dynamic'))c.splitDay=1+Math.floor(r()*8);
  else if(op===5&&c.players===4&&c.group==='split')c.pairing=Math.floor(r()*3);
  else {const i=Math.floor(r()*5);c.order=shuffle(c.order,r);if(i<5)c.trustTargets[nations[i]]=Math.floor(r()*3);}
  return c;
}
function key(c){return JSON.stringify([c.order,c.trustTargets,c.trustWeight,c.poiStrategy,c.splitDay??null,c.pairing??null]);}
function search(players,group){
  const rr=rng(810000+players*100+(group==='split'?11:group==='dynamic'?22:0));
  let pool=[baseline(players,group)];
  while(pool.length<30)pool.push(randomCandidate(players,group,rr));
  const history=[];
  for(let gen=0;gen<3;gen++){
    const seed=320000+gen*10000+players*100;
    let scored=[...new Map(pool.map(c=>[key(c),c])).values()].map((c,i)=>evaluate(c,8,seed+i*17)).sort((a,b)=>b.score-a.score);
    history.push({generation:gen,top:scored.slice(0,10)});
    const elite=scored.filter(x=>!x.error).slice(0,8).map(x=>({players:x.players,group:x.group,order:x.order,trustTargets:x.trustTargets,trustWeight:x.trustWeight,poiStrategy:x.poiStrategy,splitDay:x.splitDay,pairing:x.pairing}));
    pool=[...elite];
    while(pool.length<30)pool.push(mutate(elite[Math.floor(rr()*elite.length)]||baseline(players,group),rr));
  }
  const last=history.at(-1).top.filter(x=>!x.error);
  const medium=last.slice(0,8).map((x,i)=>evaluate(x,128,440000+i*101+players*100)).sort((a,b)=>b.score-a.score);
  const final=medium.slice(0,3).map((x,i)=>evaluate(x,1024,550000+i*1009+players*100)).sort((a,b)=>b.score-a.score);
  return {players,group,method:{search:'30 candidates × 3 evolutionary generations; per-nation Trust targets 0/1/2, capital order, POI strategy, Trust weight; split day/pairing where legal',scout:'8 trajectories',medium:'top 8 × 128',final:'top 3 × 1024',note:'Ordinary information-limited engine; no future card/die knowledge.'},history,medium,final};
}

const players=+(process.argv[2]||2),group=process.argv[3]||'together';
if(![[2,'together'],[3,'together'],[4,'together'],[4,'split'],[4,'dynamic']].some(x=>x[0]===players&&x[1]===group))throw Error('bad config');
const result=search(players,group);
const dir=path.join(__dirname,'results');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,players+'-'+group+'.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({players,group,final:result.final.map(x=>({order:x.order,trustTargets:x.trustTargets,trustWeight:x.trustWeight,poiStrategy:x.poiStrategy,splitDay:x.splitDay,pairing:x.pairing,winRate:x.winRate,win95:x.win95,meanWinDay:x.meanWinDay,avgStable:x.avgStable,avgProblems:x.avgProblems,poi:x.poi,capitalFailures:x.capitalFailures,graph:x.graph,error:x.error}))},null,2));
