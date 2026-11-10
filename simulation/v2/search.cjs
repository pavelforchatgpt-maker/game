// Feasibility witness only: deliberately chooses favourable random outcomes.
// It MUST NOT be used as a playable policy or a win-rate estimate.
const fs=require('fs'),path=require('path'),S=require('./planner.cjs'),K=require('../src/kernel.cjs'),P=require('../src/provenance.cjs');
const cards=Object.fromEntries(K.cfg.cards.map(c=>[c.id,c]));
function score(s){let x=s.terminal==='win'?1e9:s.terminal==='loss'?-1e9:0;x+=s.capitals.reduce((a,c)=>a+c.solved.filter(Boolean).length,0)*10000+s.energy*100+Object.values(s.trust).reduce((a,b)=>a+b,0)*70;
 x+=(s.team?.total||0)*10+Object.values(s.budget||{}).reduce((a,b)=>a+b,0);
 if(s.abilityOffer)x+=s.abilityOffer.reduce((a,id)=>a+({8:100,19:90,12:80,9:70}[id]||0),0);
 if(s.card){const c=cards[s.card];x+=Math.max(...c.paths.map(p=>20-p.difficulty+(p.reward==='Доверие'?10:p.reward==='Энергия'?12:0)));}return x;}
const results=[];
for(const [players,group]of [[2,'together'],[3,'together'],[4,'together'],[4,'split']]){
 let s=S.initial(players,{players,group,policy:'WIN-MAX-HEURISTIC',st:'ST-NEUTRAL',talentRate:0}),logProbability=0,steps=0;const trace=[];
 for(;!s.terminal&&steps<1500;steps++){const out=S.step(s).sort((a,b)=>score(b.state)-score(a.state)||b.p-a.p),o=out[0];logProbability+=Math.log(o.p);s=o.state;if(Object.keys(s.metrics||{}).length)trace.push({day:s.day,phase:s.phase,metrics:s.metrics,energy:s.energy,positions:s.heroes.map(h=>h.tile+':'+h.cell)});}
 results.push({players,group,terminal:s.terminal,day:s.day,stableCapitals:s.capitals.filter(c=>c.stable).length,energy:s.energy,logProbability,steps,trace});console.log(players,group,s.terminal,s.day,'capitals',results.at(-1).stableCapitals);
}
fs.writeFileSync(path.join(__dirname,'results.json'),JSON.stringify({label:'FAVOURABLE OUTCOME WITNESS, not a valid information-limited strategy or probability estimate',fingerprint:P.fingerprint(),results},null,2));
