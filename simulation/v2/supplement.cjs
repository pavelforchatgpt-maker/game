const fs=require('fs'),X=require('./experiment.cjs');
const which=process.argv[2]||'missing';
const mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
const configs=[[2,'together'],[3,'together'],[4,'together'],[4,'split'],[4,'dynamic']];
let jobs=[];
if(which==='missing'||which==='legacy-repaired')jobs=[{players:4,group:'split',planner:'human',experiment:'ordinary',n:384},{players:4,group:'mixed',planner:'human',experiment:'ordinary',n:384}];
if(which==='search')for(const [players,group]of configs)for(const conservativePort of [false,true])for(const trustTarget of [0,1,2])jobs.push({players,group,conservativePort,trustTarget,resourceAware:true,abilities:[8,19,9,12],planner:'global',experiment:'perfect',movementModel:'perfect',n:1});
if(which==='sensitivity')for(const [players,group]of configs)for(const st of ['ST-NEUTRAL','ST-MODERATE','ST-HARSH'])jobs.push({players,group,st,planner:'global',experiment:'ordinary',n:64});
if(which==='budget')for(const [players,group]of configs)jobs.push({players,group,planner:'global',experiment:'ordinary',n:64});
if(which==='counterfactual')for(const [players,group]of configs)for(const variant of ['base','noConditions','trust','energy'])jobs.push({players,group,planner:'global',experiment:'ordinary',n:64,variant,...(variant==='noConditions'?{noConditions:true}:variant==='trust'?{initialTrust:2}:variant==='energy'?{initialEnergy:2*players}:{})});
if(which==='preplanned')for(const [players,group]of configs){const best=JSON.parse(fs.readFileSync(__dirname+'/order-best-'+players+'.json'));jobs.push({players,group,planner:'global',experiment:'ordinary',n:256,resourceAware:true,order:best.options.order});}
if(which==='talent')for(const [players,group]of configs)jobs.push({players,group,planner:'global',experiment:'ordinary',n:64,talentRate:0.25});
const file=__dirname+'/runs/'+which+'.json';const results=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):[];
for(let j=results.length;j<jobs.length;j++){const cfg=jobs[j],rows=[];for(let k=0;k<cfg.n;k++){let r;try{r=X.simulate({st:'ST-NEUTRAL',horizon:50,...cfg},730000+k,which==='search');}catch(e){rows.push({seed:730000+k,error:e.message});continue;}let budget={};for(const d of r.ledger.filter(d=>d.day<=20))for(const [key,value]of Object.entries(d.fractions))budget[key]=(budget[key]||0)+value;const events=r.ledger.filter(d=>d.day<=20).flatMap(d=>d.events),d=r.deadline;rows.push({seed:r.seed,win:r.wonBy20,day:r.completionDay,budget,trust:d.trust,energy:d.energy,capitals:d.capitals,failures:events.filter(e=>e.type==='teamResult'&&!e.success).length,poi:events.filter(e=>e.type==='poi').length,regroups:events.filter(e=>e.type==='regroup'),crossings:events.filter(e=>e.type==='cross').length});if(which==='search'&&r.wonBy20)fs.writeFileSync(__dirname+'/candidate-'+j+'.json',JSON.stringify(r));}
results.push({cfg,rows,summary:{n:rows.length,wins:rows.filter(r=>r.win).length,meanDay:mean(rows.filter(r=>r.day).map(r=>r.day)),censored:rows.filter(r=>!r.day).length}});fs.writeFileSync(file,JSON.stringify(results,null,2));console.log(which,j,results.at(-1).summary);}

