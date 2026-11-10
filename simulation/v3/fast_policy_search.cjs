const fs=require('fs'),path=require('path'),X=require('../v2/experiment.cjs');
const nations=['Рост','Поток','Искра','Слово','Камень'];
function rng(seed){let x=seed>>>0;return()=>{x=(1664525*x+1013904223)>>>0;return x/2**32;};}
function shuffle(a,r){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function policy(r,players,group){const trustTargets={};for(const n of nations){const x=r();trustTargets[n]=x<.6?0:x<.92?1:2;}const p={order:shuffle([0,1,2,3,4],r),trustTargets,trustWeight:[.5,.8,1,1.3,1.7][Math.floor(r()*5)],poiAware:true,resourceAware:true,strongSuccessChoice:true,poiStrategy:r()<.75?'marginal':'default'};if(players===4&&(group==='split'||group==='dynamic'))p.splitDay=1+Math.floor(r()*8);if(players===4&&group==='split')p.pairing=Math.floor(r()*3);return p;}
function scoreRun(x,players){const d=x.deadline,st=d.capitals.filter(c=>c.stable).length,sol=d.capitals.reduce((a,c)=>a+c.solved.filter(Boolean).length,0),tr=Object.values(d.trust).reduce((a,b)=>a+b,0);let s=st*200+sol*15+Math.min(2*players,d.energy)*20+tr*3;if(x.wonBy20)s+=2500+(20-x.completionDay)*50;else if(x.completionDay!==null)s+=Math.max(0,50-x.completionDay)*2;return s;}
function evalPolicy(players,group,p,seeds){const rows=seeds.map(seed=>X.simulate({players,group,experiment:'ordinary',planner:'global',st:'ST-NEUTRAL',talentRate:0,horizon:50,randomDraft:true,...p},seed,false));const wins=rows.filter(x=>x.wonBy20);return {policy:p,n:rows.length,wins:wins.length,winRate:wins.length/rows.length,meanScore:rows.reduce((a,x)=>a+scoreRun(x,players),0)/rows.length,meanWinDay:wins.length?wins.reduce((a,x)=>a+x.completionDay,0)/wins.length:null,meanCompletion:rows.filter(x=>x.completionDay!==null).reduce((a,x,_,arr)=>a+x.completionDay/arr.length,0)};}
const players=+(process.argv[2]||2),group=process.argv[3]||'together',r=rng(991000+players*100+(group==='split'?10:group==='dynamic'?20:0));
const baseline={order:[0,1,2,3,4],trustTargets:Object.fromEntries(nations.map(n=>[n,0])),trustWeight:1,poiAware:true,resourceAware:true,strongSuccessChoice:true,poiStrategy:'marginal',...(players===4&&(group==='split'||group==='dynamic')?{splitDay:1}:{}),...(players===4&&group==='split'?{pairing:0}:{})};
const candidates=[baseline];while(candidates.length<18)candidates.push(policy(r,players,group));
const scoutSeeds=[1101,1102,1103,1104,1105,1106];
const scout=candidates.map(p=>evalPolicy(players,group,p,scoutSeeds)).sort((a,b)=>b.winRate-a.winRate||b.meanScore-a.meanScore);
const validationSeeds=Array.from({length:64},(_,i)=>20000+i);
const final=scout.slice(0,4).map(x=>evalPolicy(players,group,x.policy,validationSeeds)).sort((a,b)=>b.winRate-a.winRate||b.meanScore-a.meanScore);
const result={players,group,scoutTop:scout.slice(0,8),final};
const dir=path.join(__dirname,'fast-results');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,players+'-'+group+'.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
