const K=require('../src/kernel.cjs'),G=K.geo;
const cities=['A-3','A-5','A-7','A-9','A-11'],nations=['Рост','Поток','Искра','Слово','Камень'],keys=[[10],[10,14],[10],[10],[11]];
const memo=new Map();
class Heap{constructor(){this.a=[];}push(x){let a=this.a,i=a.length;a.push(x);while(i){let p=(i-1)>>1;if(a[p].cost<=x.cost)break;a[i]=a[p];i=p;}a[i]=x;}pop(){let a=this.a,r=a[0],x=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let j=i*2+1;if(j+1<a.length&&a[j+1].cost<a[j].cost)j++;if(a[j].cost>=x.cost)break;a[i]=a[j];i=j;}a[i]=x;}return r;}get length(){return this.a.length;}}
function speed(s,g){let d=[[[],1]];for(const i of g)d=d.flatMap(([a,p])=>[[1,1/6],[2,2/6],[3,2/6],[4,1/6]].map(([m,q])=>[[...a,m+(s.options.movementBonus||0)+([8,19].includes(s.heroes[i].ability)?2:0)],p*q]));return d.reduce((a,[v,p])=>a+Math.min(...v)*p,0);}
function probability(s,g){const distributions=K.distribution(g.length);let best=0;for(const i of g){const a=Object.values(s.heroes[i].attributes);let p=0,count=0;for(let j=0;j<5;j++)for(let k=j+1;k<5;k++){for(const dc0 of [9,10]){const dc=dc0+(s.options.capitalDifficultyShift||0);p+=distributions.reduce((v,[r,w])=>v+(Math.max(a[j],a[k])+r>=dc?w:0),0);count++;}}best=Math.max(best,p/count);}return Math.max(.05,best);}
function mask(s){return s.capitals.reduce((a,c,i)=>a|(!c.stable?1<<i:0),0);}
// Exact shortest path in a RELAXED weighted service graph. Its cost is a heuristic, not a game-day proof.
function tour(s,g,required=mask(s),target='C-1'){
 const h=s.heroes[g[0]],v=s.options.movementModel==='perfect'?4:speed(s,g),p=probability(s,g),bridge=s.capitals[1].solved[0];
 const trust=nations.map(n=>s.trust[n]);const key=[h.tile,h.cell,required,target,v.toFixed(3),p.toFixed(3),trust.join(''),bridge,!!s.options.conservativePort].join('|');if(memo.has(key))return memo.get(key);
 const q=new Heap(),seen=new Map();q.push({tile:h.tile,cell:h.cell,done:0,cost:0,first:null,order:[]});let result={cost:Infinity,first:null,order:[]};
 while(q.length){const x=q.pop(),key=x.tile+':'+x.cell+':'+x.done;if((seen.get(key)??Infinity)<=x.cost)continue;seen.set(key,x.cost);if((x.done&required)===required&&x.tile===target){result=x;break;}
 const ci=cities.indexOf(x.tile),open=bridge||!!(x.done&2);
 if(ci>=0&&(required&(1<<ci))&&!(x.done&(1<<ci))){for(const cell of keys[ci]){const d=G.dist(x.tile,x.cell,cell,open);if(!Number.isFinite(d))continue;const problems=3-trust[ci],service=1+problems*(1-p)/p;q.push({...x,cell,done:x.done|(1<<ci),cost:x.cost+d/v+service,order:[...x.order,ci]});}}
 for(const port of G.tiles[x.tile].ports){const d=G.dist(x.tile,x.cell,port[0],open);if(!Number.isFinite(d))continue;q.push({...x,tile:port[1],cell:G.mirror(x.tile,port[0],port[1]),cost:x.cost+Math.max(0,d-(s.options.conservativePort?0:1))/v+.001,first:x.first||port});}
 }
 if(memo.size>20000)memo.clear();memo.set(key,result);return result;
}
function ownership(s,g){let m=mask(s);for(let i=0;i<5;i++){const job=s.jobs?.[cities[i]];if(job&&!job.some(j=>g.includes(j)))m&=~(1<<i);}return m;}
function score(s,g){const route=tour(s,g,ownership(s,g));const need=Math.max(0,K.cfg.final.requirements[s.n]-s.energy),resource=need/(.5*g.length);return {remainingDays:route.cost+resource,slack:21-s.day-route.cost-resource,energyDeficit:need,routeCost:route.cost,problems:nations.reduce((a,n,i)=>a+(s.capitals[i].stable?0:3-s.trust[n]),0),probability:probability(s,g),route};}
function exit(s,t){if(s.rendezvous)return tour(s,s.active,0,s.rendezvous).first;const required=ownership(s,s.active);if(!required&&s.energy<K.cfg.final.requirements[s.n]){const candidates=Object.keys(G.tiles).filter(id=>G.tiles[id].poi.some(([c])=>!s.used.includes(id+':'+c)));const routes=candidates.map(id=>tour(s,s.active,0,id)).filter(r=>r.first).sort((a,b)=>a.cost-b.cost);if(routes.length)return routes[0].first;}if(s.options.order){const next=s.options.order.find(i=>required&(1<<i));if(next!==undefined)return tour(s,s.active,0,cities[next]).first;}return tour(s,s.active,required).first;}
function wantPOI(s,t,territory){const need=Math.max(0,K.cfg.final.requirements[s.n]-s.energy);if(need)return true;const ci=nations.indexOf(territory);if(ci<0||s.capitals[ci].stable||s.trust[territory]>=2)return false;if(s.options.trustTarget!==undefined)return s.trust[territory]<s.options.trustTarget;const p=probability(s,s.active),saved=(1-p)/p;return (s.options.trustWeight??1)*.45*saved>1/s.active.length+.15;}
const poiPrior={
 'Исследование':{energy:.44,trust:.75,item:.19},
 'Встреча':{energy:.62,trust:.94,item:.06},
 'Испытание':{energy:.78,trust:.28,item:.17}
};
function choosePOI(s,t,hero,candidates,territoryOf){
 if(!s.options.poiAware)return null;
 const h=s.heroes[hero],energyNeed=Math.max(0,K.cfg.final.requirements[s.n]-s.energy);
 const marginal=s.options.poiStrategy==='marginal';
 const next=exit(s,t),open=s.capitals[1].solved[0],v=Math.max(.75,speed(s,s.active||[hero]));
 const direct=next?Math.max(0,G.dist(t,h.cell,next[0],open)-(s.options.conservativePort?0:1)):0;
 let best=null;
 for(const [cell,type] of candidates){
  const d=G.dist(t,h.cell,cell,open);if(!Number.isFinite(d))continue;
  const terr=territoryOf(t,cell),pr=poiPrior[type]||{energy:.5,trust:.5,item:.1};
  const ci=nations.indexOf(terr);
  const trustTarget=s.options.trustTarget??0;
  const trustNeed=ci>=0&&!s.capitals[ci].stable?Math.max(0,Math.min(2,trustTarget)-s.trust[terr]):0;
  const effectiveEnergy=pr.energy+(terr==='wild'?pr.trust*.55:0);
  let utility;
  let detour=d;
  if(next){
   const after=G.dist(t,cell,next[0],open);
   if(Number.isFinite(after))detour=Math.max(0,d+Math.max(0,after-(s.options.conservativePort?0:1))-direct);
  }
  if(marginal){
   // Value resources by expected world-days saved, not by raw reward count.
   // One Trust removes one required capital problem. With success probability p,
   // the expected retry overhead of that problem is (1-p)/p; add a small
   // positioning/service term because a removed problem also shortens the city sequence.
   const p=probability(s,s.active||[hero]);
   const trustMarginal=ci>=0&&!s.capitals[ci].stable&&s.trust[terr]<2
     ? pr.trust*(0.35+(1-p)/p)
     : 0;
   // Energy is mandatory only while below the final requirement. Approximate the
   // replacement cost of finding another useful POI as one group activation share.
   const energyMarginal=energyNeed>0?effectiveEnergy*(0.65+1/Math.max(1,(s.active||[hero]).length)):0;
   // POI activation ends this hero's movement; detours are charged in expected
   // movement-days. This deliberately penalizes off-route farming.
   const actionCost=0.18+detour/v;
   utility=energyMarginal+trustMarginal-actionCost;
  }else{
   utility=(energyNeed?2.4*effectiveEnergy:0)+(trustNeed?2.0*pr.trust:0);
   if(!energyNeed&&!trustNeed)utility=0;
   utility-=.14*d;
  }
  if(!best||utility>best.utility)best={cell,type,territory:terr,distance:d,detour,utility};
 }
 return best&&best.utility>0?best:null;
}
function arrangements(){return [[[0,1,2,3]],[[0,1],[2,3]],[[0,2],[1,3]],[[0,3],[1,2]]];}
function setGroups(s,groups){const flat=groups.flat();if(flat.length!==4||new Set(flat).size!==4||flat.some(i=>i<0||i>3)||groups.some(g=>g.length<2||new Set(g.map(i=>s.heroes[i].tile)).size!==1))throw Error('Illegal regroup');s.groups=groups.map(g=>[...g]);}
function regroup(s){if(s.n!==4||s.heroes.some(h=>h.acted))return;
 if(s.options.group!=='dynamic'&&s.options.group!=='split')return;
 if(new Set(s.heroes.map(h=>h.tile)).size!==1){
  if(s.options.group!=='dynamic'||s.groups.length!==2||s.rendezvous)return;
  const separate=Math.max(...s.groups.map(g=>tour(s,g,ownership(s,g)).cost));let best=null;
  for(const target of new Set(s.heroes.map(h=>h.tile))){const arrive=Math.max(...s.groups.map(g=>tour(s,g,0,target).cost));const hypothetical={...s,heroes:s.heroes.map(h=>({...h,tile:target,cell:G.tiles[target].city[0]||s.heroes.find(h=>h.tile===target).cell}))};const cost=arrive+tour(hypothetical,[0,1,2,3]).cost+1;if(cost<separate-.5&&(!best||cost<best.cost))best={target,cost};}
  if(best){s.rendezvous=best.target;s.audit?.push({type:'rendezvous',target:best.target});}return;
 }
 if(s.rendezvous){setGroups(s,[[0,1,2,3]]);s.jobs={};delete s.rendezvous;s.holdTogetherUntil=s.day+1;s.metrics.regroups=(s.metrics.regroups||0)+1;s.audit?.push({type:'regroup',groups:s.groups,positions:s.heroes.map(h=>[h.tile,h.cell])});return;}
 if(s.holdTogetherUntil>=s.day)return;
 if(s.options.group==='split'&&s.regrouped)return;
 const m=mask(s);let best=null;
 for(const groups of s.options.group==='split'?[arrangements()[1]]:arrangements()){
  if(groups.length===1){const cost=tour(s,groups[0],m).cost;if(!best||cost<best.cost)best={groups,cost,jobs:{}};continue;}
  for(let a=m;;a=(a-1)&m){const b=m^a;let valid=true;for(let i=0;i<5;i++)for(let j=0;j<3;j++){const leader=s.capitals[i].leaders[j];if(leader!==null&&!s.capitals[i].solved[j]&&(m&(1<<i))){const assigned=(a&(1<<i))?groups[0]:groups[1];if(!assigned.includes(leader))valid=false;}}if(valid){const cost=Math.max(tour(s,groups[0],a).cost,tour(s,groups[1],b).cost)+.4;const jobs=Object.fromEntries(cities.map((t,i)=>[t,(a&(1<<i))?groups[0]:groups[1]]));if(!best||cost<best.cost)best={groups,cost,jobs};}if(a===0)break;}
 }
 if(best){const old=JSON.stringify(s.groups);setGroups(s,best.groups);s.jobs=best.jobs;s.regrouped=true;if(old!==JSON.stringify(s.groups)){s.metrics.regroups=(s.metrics.regroups||0)+1;s.audit?.push({type:'regroup',groups:s.groups,positions:s.heroes.map(h=>[h.tile,h.cell])});}}
}
module.exports={tour,exit,score,wantPOI,choosePOI,regroup,setGroups,arrangements,mask,ownership,speed,probability};
