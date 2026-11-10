const fs=require('fs'),path=require('path'),S=require('../src/scenario.cjs'),D=require('../src/dag.cjs'),P=require('../src/provenance.cjs');
const players=+(process.argv[2]||2),group=process.argv[3]||'together',seed=+(process.argv[4]||42),policy=process.argv[5]||'WIN-MAX-HEURISTIC';
const options={players,group,policy,st:'ST-NEUTRAL',talentRate:0};let s=S.initial(players,options),random=D.rng(seed),trace=[];
for(let step=0;!s.terminal&&step<1500;step++){
 const before=s,out=S.step(s);let value=random(),i=0;while(i<out.length-1&&value>=out[i].p)value-=out[i++].p;s=out[i].state;
 trace.push({step,day:s.day,beforePhase:before.phase,phase:s.phase,card:before.card||s.card||null,positions:s.heroes.map(h=>`${h.tile}:${String(h.cell).padStart(2,'0')}`),budget:s.budget||null,energy:s.energy,trust:s.trust,stable:s.capitals.filter(c=>c.stable).length,metrics:s.metrics,terminal:s.terminal});
}
const name=`trace-${players}-${group}-${seed}`,result={fingerprint:P.fingerprint(),options,seed,terminal:s.terminal,trace};
fs.writeFileSync(path.join(__dirname,'../results',name+'.json'),JSON.stringify(result,null,2));
let md=`# Диагностическая история: ${players}, ${group}\n\nСтратегия ${policy}, seed ${seed}, ST-NEUTRAL. Это одна выбранная ветвь, не статистическая оценка.\n\n| День | Фаза | Позиции героев | Энергия | Столиц | Изменения |\n|---|---|---|---:|---:|---|\n`;
for(const r of trace)if(Object.keys(r.metrics||{}).length||r.terminal)md+=`| ${r.day} | ${r.beforePhase} → ${r.phase}${r.card?' / '+r.card:''} | ${r.positions.join(', ')} | ${r.energy} | ${r.stable} | ${JSON.stringify(r.metrics)}${r.terminal?' / '+r.terminal:''} |\n`;
fs.writeFileSync(path.join(__dirname,'../results',name+'.md'),md);console.log(name,s.terminal,'capital count',s.capitals.filter(c=>c.stable).length);
