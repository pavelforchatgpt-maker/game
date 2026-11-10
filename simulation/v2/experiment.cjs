const fs=require('fs'),path=require('path'),K=require('./kernel.cjs'),D=require('../src/dag.cjs');
const engines={global:require('./engine.cjs'),human:require('./legacy.cjs')},cards=Object.fromEntries(K.cfg.cards.map(c=>[c.id,c]));
const cache=new Map();let expanded=0,hits=0;
function utility(s){let x=s.capitals.reduce((a,c)=>a+1000*c.solved.filter(Boolean).length,0);x+=100*Math.min(s.energy,K.cfg.final.requirements[s.n]);for(const [n,t]of Object.entries(s.trust)){const ci=engines.global.caps.findIndex(c=>c.nation===n);x+=s.capitals[ci].stable?0:t*45;}if(s.options.preferBoots)x+=300*s.heroes.filter(h=>h.items.includes('Сапоги скороходы')).length;return x;}
function favour(s){let x=utility(s);if(s.terminal==='win')x+=1e7;if(s.terminal==='loss')x-=1e7;x+=(s.team?.total||0)*2+Object.values(s.budget||{}).reduce((a,b)=>a+b,0);if(s.card){const c=cards[s.card],h=s.heroes[s.event.hero];const need=s.energy<K.cfg.final.requirements[s.n];x+=Math.max(...c.paths.map(p=>{let v=0;if(s.options.preferBoots&&!s.claimed.includes('Сапоги скороходы')&&p.reward==='Сапоги скороходы')v+=150;for(const [r,w]of K.faces){const margin=h.attributes[p.attribute]+r-p.difficulty;if(margin>=0){const reward=c.template==='1Х'&&margin>=2?'Энергия':p.reward;v+=w*(reward==='Энергия'?(need?60:0):reward==='Доверие'?25:2);}}return v;}));}if(s.abilityOffer)x+=s.abilityOffer.reduce((a,id)=>a+({8:90,19:80,9:70,12:60}[id]||0),0);return x;}
function outcomes(input){const clean={...input};delete clean.audit;delete clean.metrics;const key=D.key(clean);if(cache.has(key)){hits++;return cache.get(key);}let out;try{out=engines[input.options.planner==='human'?'human':'global'].step(input);}catch(e){fs.writeFileSync(__dirname+'/debug-state.json',JSON.stringify(input,null,2));throw e;}const mode=input.options.experiment;
 if(mode==='perfect'||mode==='expected'){
  const movement=out.every(o=>o.state.audit?.some(e=>e.type==='movement'));
  if((!movement||mode==='perfect')&&!(input.options.randomDraft&&out.every(o=>o.state.phase==='draft'))){const values=out.map(o=>favour(o.state)),best=Math.max(...values);out=out.filter((o,i)=>Math.abs(values[i]-best)<1e-8);const mass=out.reduce((a,o)=>a+o.p,0);out=out.map(o=>({...o,p:o.p/mass}));}
 }else if(mode==='team-perfect'&&out.every(o=>o.state.phase==='teamRoll'&&o.state.team)){
  const best=Math.max(...out.map(o=>o.state.team.total));out=out.filter(o=>o.state.team.total===best);const mass=out.reduce((a,o)=>a+o.p,0);out=out.map(o=>({...o,p:o.p/mass}));
 }
 expanded++;if(cache.size>=1500)cache.delete(cache.keys().next().value);cache.set(key,out);return out;
}
function snapshot(s){return {day:s.day,phase:s.phase,heroes:s.heroes.map(h=>({profile:h.profile,tile:h.tile,cell:h.cell,ability:h.ability,items:h.items,delay:h.delay,slow:h.slow})),groups:s.groups,trust:s.trust,energy:s.energy,spent:s.spent,poi:s.used,capitals:s.capitals,tree:s.tree};}
function simulate(options,seed,trace=false){const random=D.rng(seed),engine=engines[options.planner==='human'?'human':'global'];let s=engine.initial(options.players,{policy:'WIN-MAX-HEURISTIC',st:'ST-NEUTRAL',talentRate:0,horizon:50,...options}),journal=[],days={},metrics={},deadline=null,steps=0;
 if(options.initialEnergy!==undefined)s.energy=options.initialEnergy; if(options.initialTrust!==undefined)for(const n of Object.keys(s.trust))s.trust[n]=options.initialTrust;
 const add=(day,event)=>{days[day]??={activations:{},events:[]};days[day].events.push(event);};
 for(;!s.terminal&&steps<3000;steps++){
  if(options.noConditions)for(const h of s.heroes){h.delay=0;h.slow=0;h.conditionDays={};}
  const before=s,out=outcomes(s);let x=random(),i=0;while(i<out.length-1&&x>=out[i].p)x-=out[i++].p;s=out[i].state;
  let day=before.day;for(const e of s.audit||[]){add(day,e);if(e.type==='dayEnd')day=e.day+1;}
  for(const [k,v]of Object.entries(s.metrics||{}))metrics[k]=(metrics[k]||0)+v;
  if(!deadline&&before.day<=20&&(s.day>20||s.terminal))deadline=snapshot(before.day===s.day?s:before);
  if(trace)journal.push({step:steps,fromDay:before.day,events:s.audit||[],state:snapshot(s)});
 }
 if(steps===3000)throw Error('Experiment did not terminate');
 const ledger=[];const solved=Array.from({length:5},()=>new Set());let trust={};
 for(const [d,row]of Object.entries(days)){
  const categories=new Set(),counts={};let active='continuation';
  const stable=()=>engines.global.caps.every((c,i)=>solved[i].has(0)&&solved[i].size>=3-(trust[c.nation]||0));
  for(const e of row.events){
   if(e.type==='activation'){active=String(e.id);trust=e.trust;counts[active]=new Set(['travel']);if(e.positions&&e.group.every(i=>e.positions[i][0]==='C-1')&&!e.positions.every(p=>p[0]==='C-1'))counts[active].add('assembly');}
   if(e.type==='regroup'){categories.add('freeRegroup');continue;}if(e.type==='dayEnd')continue;
   if(e.type==='eventResult')trust=e.trust;
   if(e.type==='teamResult'&&e.capital!==null&&e.success)solved[e.capital].add(e.problem);
   if(!counts[active])counts[active]=new Set();
   if(e.type==='help')counts[active].add('capital');if(e.type==='poi')counts[active].add('poi');
   if(e.type==='cross'||e.type==='walk')counts[active].add(stable()?'return':'travel');
   if(e.type==='teamResult'&&e.final!==null)counts[active].add('final');if(e.type==='teamResult'&&!e.success)counts[active].add('retry');if(e.type==='finalStart')counts[active].add('final');
  }
  const entries=Object.values(counts).filter(x=>x.size),fractions={};for(const set of entries){const category=['final','retry','capital','poi','assembly','return','travel'].find(k=>set.has(k));if(category)fractions[category]=(fractions[category]||0)+1/entries.length;for(const c of set)categories.add(c);}ledger.push({day:+d,fractions,tags:[...categories],events:row.events});
 }

 return {seed,options,wonBy20:s.terminal==='win'&&s.day<=20,completionDay:s.terminal==='win'?s.day:null,reserve:s.terminal==='win'?20-s.day:null,deadline:deadline||snapshot(s),terminal:snapshot(s),metrics,ledger,journal:trace?journal:undefined,steps};
}
function stats(){return {expanded,hits,cache:cache.size};}
module.exports={simulate,outcomes,stats,snapshot};
if(require.main===module){const group=process.argv[2]||'together',players=+(process.argv[3]||2),mode=process.argv[4]||'perfect';const r=simulate({players,group,experiment:mode,planner:'global',abilities:[8,19,9,12],movementModel:mode==='perfect'?'perfect':'ordinary'},42,true);fs.writeFileSync(path.join(__dirname,`witness-${players}-${group}-${mode}.json`),JSON.stringify(r,null,2));console.log({players,group,mode,day:r.completionDay,reserve:r.reserve,energy:r.terminal.energy,poi:r.terminal.poi.length,capitals:r.terminal.capitals.filter(c=>c.stable).length,stats:stats()});}
