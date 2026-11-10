const fs=require('fs'),path=require('path');
const D=require('../src/dag.cjs'),E=require('../v2/engine.cjs');

function averageStable(r){
  let x=0;for(let i=0;i<=5;i++)x+=i*(r.terminalSummary['stableCapitals'+i]||0);
  return x/r.samples;
}
function problems(r){
  return Object.entries(r.means||{}).filter(([k])=>k.startsWith('problems_')).reduce((a,[,v])=>a+v,0);
}
const players=+(process.argv[2]||2);
const shift=+(process.argv[3]||0);
const samples=+(process.argv[4]||1024);
if(![2,3].includes(players))throw Error('players must be 2 or 3');
const initial=E.initial(players,{
  policy:'WIN-MAX-HEURISTIC',
  st:'ST-NEUTRAL',
  talentRate:0,
  group:'together',
  capitalDifficultyShift:shift,
  territory:'alternate'
});
const r=D.sample(initial,E.step,{samples,seed:880000+players*100+shift,maxSteps:1800});
const out={
  players,capitalDifficultyShift:shift,samples,
  winRate:r.winRate,win95:r.win95,meanWinDay:r.meanWinDay,medianWinDay:r.medianWinDay,
  averageStableCapitals:averageStable(r),averageProblemsSolved:problems(r),
  meanPOI:r.means?.poi||0,meanCapitalFailures:r.means?.capitalFailures||0,
  terminalSummary:r.terminalSummary,graph:r.graph,
  note:'Diagnostic counterfactual only. All canonical rules remain unchanged; shift modifies only capital team-check difficulty and the route heuristic estimate.'
};
const dir=path.join(__dirname,'capital-scaling');fs.mkdirSync(dir,{recursive:true});
const tag=shift===0?'base':shift<0?'minus'+Math.abs(shift):'plus'+shift;
fs.writeFileSync(path.join(dir,`${players}-${tag}.json`),JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
