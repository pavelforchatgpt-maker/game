// Mechanical effect helpers. Whether to use an optional effect is a policy decision.
const K=require('./kernel.cjs');
const metric=(s,k,v=1)=>s.metrics[k]=(s.metrics[k]||0)+v;
const tileLimited=new Set([1,5,11,12,16,20]);
function ready(h,id){return h.ability===id&&!((tileLimited.has(id)?h.tileUses[h.tile]:h.daily)||[]).includes(id);}
function use(s,i,id){const h=s.heroes[i];if(!ready(h,id))throw Error('ability unavailable '+id);if(tileLimited.has(id)){h.tileUses[h.tile]??=[];h.tileUses[h.tile].push(id);}else h.daily.push(id);metric(s,'ability'+id);}
function itemReady(h,name){return h.items.includes(name)&&!h.itemDaily.includes(name);}
function item(s,i,name){const h=s.heroes[i];if(!itemReady(h,name))throw Error('item unavailable');h.itemDaily.push(name);metric(s,'item_'+name);}
function distance(s,a,b){const h=s.heroes[a],v=s.heroes[b];return h.tile===v.tile?K.geo.dist(h.tile,h.cell,v.cell,s.capitals[1].solved[0]):Infinity;}
function helper(s,leader,consume=false){
 const candidates=s.active.filter(i=>i!==leader&&s.heroes[i].tile===s.heroes[leader].tile).map(i=>{const h=s.heroes[i],d=distance(s,i,leader);let effect=null;
 if(d<=3||h.ability===7&&d<=5)effect='base';else if(itemReady(h,'Кольцо связи')&&d<=4)effect='ring';else if(ready(h,17))effect='root';return {i,effect};}).filter(x=>x.effect);
 candidates.sort((a,b)=>Number(itemReady(s.heroes[b.i],'Путевой посох'))-Number(itemReady(s.heroes[a.i],'Путевой посох')));
 if(!candidates.length)return null;const c=candidates[0];if(consume){if(c.effect==='ring')item(s,c.i,'Кольцо связи');if(c.effect==='root')use(s,c.i,17);}return c;
}
function recover(s){for(const i of s.active){const h=s.heroes[i];if(!ready(h,2))continue;const target=s.active.filter(j=>distance(s,i,j)<=3&&K.affected(s.heroes[j],'slow',s.day)).sort((a,b)=>s.heroes[b].slow-s.heroes[a].slow)[0];if(target===undefined)continue;const t=s.heroes[target];use(s,i,2);if(t.conditionDays?.slow){t.conditionDays.slow.pop();t.slow=Math.max(0,...t.conditionDays.slow);}else t.slow--;}}
function movementOptions(s,i){
 const h=s.heroes[i];if(K.affected(h,'delay',s.day)){const t=K.clone(s);let value=0;if(ready(t.heroes[i],3)){use(t,i,3);value=1;}return [{state:t,p:1,value}];}
 const out=[];for(const [face,p] of K.faces){let t=K.clone(s),hh=t.heroes[i];
 // Reroll a movement failure only; the replacement is mandatory, including another failure.
 const reroll=face===-1&&itemReady(hh,'Камень пути');if(reroll)item(t,i,'Камень пути');
 for(const [v,q]of reroll?K.faces:[[face,1]]){const u=K.clone(t),hero=u.heroes[i];let value=K.movement(hero,u.day,v)+(u.options?.movementBonus||0);
 if(!reroll){if(K.affected(hero,'slow',u.day)&&itemReady(hero,'Плащ лёгкого шага')){item(u,i,'Плащ лёгкого шага');value=Math.max(1,2+K.cfg.moveFaces[v]+(u.options?.movementBonus||0));}
 else if(itemReady(hero,'Сапоги скороходы')){item(u,i,'Сапоги скороходы');value++;}}
 if(ready(hero,8)){use(u,i,8);value+=2;}out.push({state:u,p:p*q,value});}}
 return out;
}
function jumpToward(s,i,target){const h=s.heroes[i];if(!ready(h,19))return;const [q,r]=K.geo.cells[h.cell],g=K.geo.graph(h.tile,s.capitals[1].solved[0]);const before=K.geo.dist(h.tile,h.cell,target,s.capitals[1].solved[0]);let best=h.cell,bestD=before;
 for(const c of Object.keys(g).map(Number)){const [x,y]=K.geo.cells[c];if(Math.max(Math.abs(x-q),Math.abs(y-r),Math.abs(x+y-q-r))>2)continue;const d=K.geo.dist(h.tile,c,target,s.capitals[1].solved[0]);if(d<bestD){best=c;bestD=d;}}
 if(best!==h.cell){use(s,i,19);h.cell=best;}}
function failure(s,hero,kind){let i=hero,h=s.heroes[i];if(ready(h,5)){use(s,i,5);return;}
 // Optional transfer only when the recipient can cancel the condition or is already affected.
 const recipient=s.active.find(j=>j!==i&&distance(s,i,j)<=3&&(ready(s.heroes[j],6)||ready(s.heroes[j],14))&&(ready(s.heroes[j],5)||K.affected(s.heroes[j],kind==='Задержка'?'delay':'slow',s.day+1)));
 if(recipient!==undefined){i=recipient;h=s.heroes[i];use(s,i,h.ability);}
 if(kind==='Задержка'&&itemReady(h,'Щит странника')){item(s,i,'Щит странника');kind='Замедление';}K.condition(h,kind,s.day);metric(s,kind);
}
function rawDice(n){if(n===0)return [[[],1]];return rawDice(n-1).flatMap(([a,p])=>K.faces.map(([v,q])=>[[...a,v],p*q]));}
function diceOptions(s,i,n,{ordinary=false,bracelet=false,allowReroll=true}={}){
 const out=[];for(const [dice,p]of rawDice(n)){const t=K.clone(s),h=t.heroes[i];let a=[...dice],at=a.indexOf(Math.min(...a));
 if(a[at]===-1&&ready(h,4)){use(t,i,4);a[at]=0;}else if(a[at]===-1&&bracelet&&itemReady(h,'Браслет поддержки')){item(t,i,'Браслет поддержки');a[at]=0;}
 // Policy saves a tile upgrade if every die already has its maximum result.
 at=ordinary?a.indexOf(Math.max(...a)):0;if(a[at]<4&&ready(h,12)){use(t,i,12);a[at]=({[-1]:0,0:2,2:4})[a[at]];}
 const min=a.indexOf(Math.min(...a)),reroll=allowReroll&&a[min]<=0&&ready(h,10)&&(!ordinary||Math.max(...a)<4);
 if(reroll)use(t,i,10);for(const [v,q]of reroll?K.faces:[[a[min],1]]){const u=K.clone(t),b=[...a];b[min]=v;out.push({state:u,p:p*q,dice:b,value:ordinary?Math.max(...b):b.reduce((x,y)=>x+y,0)});}}
 return out;
}
function heart(s,i,total,difficulty){if(total===difficulty-1&&s.energy>0&&ready(s.heroes[i],20)){use(s,i,20);return 1;}return 0;}
function award(s,reward,territory,i){
 if(['Энергия','Доверие'].includes(reward))return K.reward(s,reward,territory,s.heroes[i]);
 const h=s.heroes[i];if(h.items.length>=2){const ally=s.heroes.find(x=>x!==h&&x.tile===h.tile&&x.items.length<2);if(ally)return K.reward(s,reward,territory,ally);}
 return K.reward(s,reward,territory,h);
}
module.exports={ready,use,itemReady,item,distance,helper,recover,movementOptions,jumpToward,failure,diceOptions,heart,award,rawDice};
