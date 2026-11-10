const fs=require('fs'),path=require('path');
const D=require('../src/dag.cjs'),E=require('../v2/engine.cjs');
function stable(r){let x=0;for(let i=0;i<=5;i++)x+=i*(r.terminalSummary['stableCapitals'+i]||0);return x/r.samples;}
function sumMean(r,prefix){return Object.entries(r.means||{}).filter(([k])=>k.startsWith(prefix)).reduce((a,[,v])=>a+v,0);}
const players=+(process.argv[2]||2),samples=+(process.argv[3]||256),shift=players===2?-2:-1;
const order=players===2?[2,1,0,3,4]:[4,3,0,2,1];
const initial=E.initial(players,{policy:'WIN-MAX-HEURISTIC',st:'ST-NEUTRAL',talentRate:0,group:'together',
 order,trustTarget:1,resourceAware:true,poiAware:true,strongSuccessChoice:true,capitalDifficultyShift:shift,territory:'alternate'});
const r=D.sample(initial,E.step,{samples,seed:970000+players,maxSteps:1800});
const out={players,samples,shift,order,strongSuccessChoice:true,winRate:r.winRate,win95:r.win95,meanWinDay:r.meanWinDay,
 averageStableCapitals:stable(r),averageProblemsSolved:sumMean(r,'problems_'),meanPOI:r.means?.poi||0,
 meanEnergyAwards:r.means?.energy||0,meanTrustAwards:sumMean(r,'trust_'),meanCapitalFailures:r.means?.capitalFailures||0,
 terminalSummary:r.terminalSummary,graph:r.graph,
 note:'Diagnostic only: on 1X strong success, policy may keep Trust instead of replacing it with Energy when Trust target is unmet. Exactly one reward remains.'};
const dir=path.join(__dirname,'strong-choice');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,players+'.json'),JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));