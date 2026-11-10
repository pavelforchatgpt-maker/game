const fs = require('fs');
const assert = require('node:assert/strict');
const path = require('path');
const root = path.resolve(__dirname, '..');
const text = fs.readFileSync(path.join(root, 'events/EVENT_SLOT_MATRIX.md'), 'utf8');
const rows = text.split(/\r?\n/).filter(l => /^\| (ИСС|ВСТ|ИСП)-\d{2} /.test(l)).map(l => l.split('|').slice(1,-1).map(x => x.trim()));
const attrs = {}; const items = [];
const specs = [
 ['ИСС',36,22,14,26,10,12,[15,7,5,2,7],[4,8,8,2],['Перчатки ловкости','Линза мудреца','Оберег стойкости','Сапоги скороходы','Кольцо связи','Плащ лёгкого шага','Камень пути']],
 ['ВСТ',34,13,21,28,6,11,[11,2,2,0,19],[5,5,3,0],['Печать посланника','Путевой посох']],
 ['ИСП',18,14,4,8,10,6,[3,11,1,2,1],[0,5,7,2],['Пояс великана','Щит странника','Браслет поддержки']]
];
assert.equal(rows.length,88); assert.equal(new Set(rows.map(r=>r[0])).size,88);
for(const [prefix,n,a,b,slow,delay,stage,categories,difficulties,expectedItems] of specs){
 const rr=rows.filter(r=>r[0].startsWith(prefix+'-')); const cats=[0,0,0,0,0],diff=[0,0,0,0],localItems=[];
 assert.deepEqual(rr.map(r=>r[0]),Array.from({length:n},(_,i)=>prefix+'-'+String(i+1).padStart(2,'0')));
 assert.equal(rr.filter(r=>r[1]==='1Х').length,a); assert.equal(rr.filter(r=>r[1]==='2Х').length,b);
 assert.equal(rr.filter(r=>r[4]==='Замедление').length,slow); assert.equal(rr.filter(r=>r[4]==='Задержка').length,delay);
 assert.equal(rr.filter(r=>r[5]==='СТ').length,stage); assert.equal(rr.filter(r=>r[5]==='—').length,n-stage);
 for(const r of rr){
  const pp=r.slice(2,4).filter(x=>x!=='—').map(x=>{const m=x.match(/^(Сила|Ловкость|Разум|Воля|Общение) (7|8|9|10) → (.+)$/);assert.ok(m,r[0]);attrs[m[1]]=(attrs[m[1]]||0)+1;return {attr:m[1],difficulty:+m[2],reward:m[3]};});
  assert.equal(pp.length,r[1]==='1Х'?1:2);if(pp.length===2)assert.notEqual(pp[0].attr,pp[1].attr);
  const rewards=pp.map(p=>['Доверие','Энергия'].includes(p.reward)?p.reward:'Предмет');
  if(pp.length===1){assert.ok(rewards[0]!=='Предмет');cats[rewards[0]==='Доверие'?0:1]++;diff[pp[0].difficulty-7]++;}
  else {const key=rewards.join('/');const ci={'Предмет/Доверие':2,'Предмет/Энергия':3,'Доверие/Энергия':4}[key];assert.ok(ci!==undefined);cats[ci]++;}
  pp.forEach((p,i)=>{if(rewards[i]==='Предмет'){localItems.push(p.reward);items.push(p.reward);}});
 }
 assert.deepEqual(cats,categories);assert.deepEqual(diff,difficulties);assert.deepEqual(localItems.sort(),expectedItems.sort());
}
assert.deepEqual(attrs,{Разум:26,Ловкость:25,Воля:25,Сила:24,Общение:27});assert.equal(Object.values(attrs).reduce((a,b)=>a+b),127);assert.equal(items.length,12);assert.equal(new Set(items).size,12);
console.log('PASS: 88 IDs; 49/39 templates; 127 attribute appearances; 12 unique items; reward categories, difficulty distributions, consequences and 29 stage flags.');
