// Noncanonical diagnostic: replace artificial team bonus activations with one
// ordinary group activation per day and extend deadline. Hero skill and item
// effects remain in the engine; talentRate is explicitly a proxy on POI checks
// because canonical cards currently have talents:null (no narrative tags).
const fs=require('fs'),path=require('path'),X=require('../v2/experiment.cjs');
function combos(n,start=1,p=[],out=[]){if(p.length===n){out.push([...p]);return out;}for(let i=start;i<=8;i++){p.push(i);combos(n,i+1,p,out);p.pop();}return out;}
function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:null;}
function q(a,p){if(!a.length)return null;const b=[...a].sort((x,y)=>x-y),x=(b.length-1)*p,i=Math.floor(x);return b[i]+(b[Math.min(i+1,b.length-1)]-b[i])*(x-i);}
function wilson(w,n){if(!n)return [0,0];const z=1.96,p=w/n,d=1+z*z/n,m=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return [Math.max(0,m-h),Math.min(1,m+h)];}
function count(r,type,day,fn=()=>true){return (r.ledger||[]).reduce((a,d)=>a+(d.day<=day?(d.events||[]).filter(e=>e.type===type&&fn(e)).length:0),0);}
const days=+(process.argv[2]||35),policy=process.argv[3]||'trust1',samples=+(process.argv[4]||512),
 talentRate=+(process.argv[5]||0),st=process.argv[6]||'ST-NEUTRAL',seedOffset=+(process.argv[7]||0),capitalShift=process.argv[8]===undefined?-3:Number(process.argv[8]),stageScaleWithHorizon=process.argv[9]==='scaled';
if(days<20||days>50||!['trust1','cut13','legacy','marginal'].includes(policy)||samples<1||talentRate<0||talentRate>1)throw Error('invalid args');
const base={players:3,group:'together',experiment:'ordinary',planner:'global',poiAware:true,resourceAware:true,
 poiContinueMovement:true,st,talentRate,horizon:days,poiStrategy:policy==='marginal'?'marginal':'legacy',
 capitalDifficultyShift:capitalShift,stageScaleWithHorizon};
if(policy==='trust1'||policy==='cut13')base.trustTarget=1;
if(policy==='cut13')base.poiTrustUntilDay=13;
// No teamDailyBonusActivations, no lowPlayerExtraCadence, no group activation slots.
// Ability 9 may still create its one canonically defined extra activation.
const samplesByHero=combos(3),rows=[];
const timing={
 normal:{activation:35,movement:10,poi:120,capital:85,final:90,day:15,overhead:35},
 firstPlay:{activation:50,movement:14,poi:165,capital:120,final:120,day:20,overhead:50}
};
for(let i=0;i<samples;i++){
 const opts={...base,profiles:samplesByHero[i%samplesByHero.length]};
 const r=X.simulate(opts,24100000+seedOffset+i,false);
 const win=r.completionDay!==null&&r.completionDay<=days,played=win?r.completionDay:days;
 const work={activation:count(r,'activation',days),movement:count(r,'movement',days),poi:count(r,'poi',days),capital:count(r,'teamResult',days,e=>e.capital!==null),final:count(r,'teamResult',days,e=>e.final!==null)};
 const time={};for(const [name,t] of Object.entries(timing))time[name]=t.overhead+(t.day*played+Object.keys(work).reduce((v,k)=>v+work[k]*t[k],0))/60;
 rows.push({win,played,work,time,trust:Object.values(r.terminal.trust).reduce((a,b)=>a+b,0),
 stable:r.terminal.capitals.filter(c=>c.stable).length,metrics:r.metrics,
 abilitiesUsed:Object.entries(r.metrics).filter(([k])=>/^ability\d+$/.test(k)).reduce((a,[,v])=>a+v,0),
 itemsUsed:Object.entries(r.metrics).filter(([k])=>k.startsWith('item_')).reduce((a,[,v])=>a+v,0),
 talentUses:r.metrics.talentApplied||0,provenDeadMarked:r.metrics.provenCapitalBudgetDead||0});
}
const wins=rows.filter(x=>x.win),loss=rows.filter(x=>!x.win);
function summary(a){return {n:a.length,POI:mean(a.map(x=>x.work.poi)),POIMedian:q(a.map(x=>x.work.poi),.5),
 p25POI:q(a.map(x=>x.work.poi),.25),p75POI:q(a.map(x=>x.work.poi),.75),
 activations:mean(a.map(x=>x.work.activation)),movementRolls:mean(a.map(x=>x.work.movement)),capitalChecks:mean(a.map(x=>x.work.capital)),
 meanPlayedDays:mean(a.map(x=>x.played)),normalMean:mean(a.map(x=>x.time.normal)),normalP90:q(a.map(x=>x.time.normal),.9),
 normalOver180:a.length?a.filter(x=>x.time.normal>180).length/a.length:null,
 firstMean:mean(a.map(x=>x.time.firstPlay)),firstP90:q(a.map(x=>x.time.firstPlay),.9),
 firstOver210:a.length?a.filter(x=>x.time.firstPlay>210).length/a.length:null,
 abilitiesUsed:mean(a.map(x=>x.abilitiesUsed)),itemsUsed:mean(a.map(x=>x.itemsUsed)),talentUses:mean(a.map(x=>x.talentUses)),
 capitalDeadMetric:mean(a.map(x=>x.provenDeadMarked)),trust:mean(a.map(x=>x.trust)),stable:mean(a.map(x=>x.stable))};}
const out={status:'NONCANONICAL, not tabletop-measured',players:3,days,policy,samples,st,talentRate,seedOffset,capitalShift,stageScaleWithHorizon,
 wins:wins.length,winRate:wins.length/samples,win95:wilson(wins.length,samples),
 all:summary(rows),winning:summary(wins),losing:summary(loss),
 notes:[
 'One ordinary activation per group per day; no systematic bonus activations. Ability #9 retains its approved once-per-game exception.',
 'Variant A POI continuation enabled; -3 capital difficulty shift carried over as diagnostic only.',
 '12 talent categories not mapped to mechanically abstract event cards: talentRate is only a per-POI-check Bernoulli +1 proxy (not true talents, not capital checks).',
 'Talents 0 baseline vs .2/.4/.6 sensitivity must not be described as accurate full talents.',
 'ST stages are not rescaled: stage III remains days >=16, across the entire extended horizon.',
 'Days, card reading and all timing are estimated, not physical playtests.',
 'Planner is map-aware optimising virtual agent, not a human family.'
 ]};
fs.mkdirSync(path.join(__dirname,'variant-a-no-bonus-day-count'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'variant-a-no-bonus-day-count',policy+'-d'+days+'-t'+talentRate+'-'+st+'-'+seedOffset+'-s'+capitalShift+'-'+(stageScaleWithHorizon?'scaled':'fixed')+'.json'),JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
