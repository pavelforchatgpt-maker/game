const fs=require('fs'),path=require('path');
const D=require('../src/dag.cjs'),E=require('../v2/engine.cjs');

function averageStable(r){let x=0;for(let i=0;i<=5;i++)x+=i*(r.terminalSummary['stableCapitals'+i]||0);return x/r.samples;}
function problems(r){return Object.entries(r.means||{}).filter(([k])=>k.startsWith('problems_')).reduce((a,[,v])=>a+v,0);}
function trustMean(r){return Object.entries(r.means||{}).filter(([k])=>k.startsWith('trust_')).reduce((a,[,v])=>a+v,0);}
const players=+(process.argv[2]||2),shift=+(process.argv[3]||0),trustTarget=+(process.argv[4]||0),samples=+(process.argv[5]||256);
const order=players===2?[2,1,0,3,4]:[4,3,0,2,1];
const initial=E.initial(players,{
 policy:'WIN-MAX-HEURISTIC',st:'ST-NEUTRAL',talentRate:0,group:'together',
 order,trustTarget,resourceAware:true,poiAware:true,capitalDifficultyShift:shift,territory:'alternate'
});
const r=D.sample(initial,E.step,{samples,seed:930000+players*1000+(shift+3)*100+trustTarget,maxSteps:1800});
const out={players,shift,trustTarget,samples,order,winRate:r.winRate,win95:r.win95,meanWinDay:r.meanWinDay,
 averageStableCapitals:averageStable(r),averageProblemsSolved:problems(r),meanPOI:r.means?.poi||0,
 meanEnergyAwards:r.means?.energy||0,meanTrustAwards:trustMean(r),meanCapitalFailures:r.means?.capitalFailures||0,
 terminalSummary:r.terminalSummary,graph:r.graph,
 note:'Diagnostic only. POI type/territory-aware information-limited policy; canonical game rules unchanged.'};
const dir=path.join(__dirname,'poi-aware');fs.mkdirSync(dir,{recursive:true});
const tag=`${players}-s${shift}-t${trustTarget}`;fs.writeFileSync(path.join(dir,tag+'.json'),JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));