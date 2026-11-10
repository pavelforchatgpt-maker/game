const fs=require('fs'),path=require('path');
const K=require('../src/kernel.cjs'),E=require('../v2/engine.cjs');

const dist=Object.fromEntries([2,3,4].map(n=>[n,K.distribution(n,'sum')]));
function combinations(a,n,start=0,prefix=[],out=[]){
  if(prefix.length===n){out.push(prefix.slice());return out;}
  for(let i=start;i<a.length;i++){prefix.push(a[i]);combinations(a,n,i+1,prefix,out);prefix.pop();}
  return out;
}
function success(hero,paths,n){
  return Math.max(...paths.map(([attr,diff])=>
    dist[n].reduce((s,[v,p])=>s+(hero.attributes[attr]+v>=diff?p:0),0)
  ));
}
function activations(ps){
  return 1+ps.reduce((s,p)=>s+(1-p)/p,0);
}
function composition(ids,n){
  const hs=ids.map(id=>K.cfg.heroes.find(h=>h.id===id));
  let trust0=0,trust1=0,trust2=0,best0=0,worst0=0;
  const capitals=[];
  for(const c of E.caps){
    const uniform=[],best=[],worst=[];
    for(const pr of c.problems){
      const ps=hs.map(h=>success(h,pr.paths,n));
      uniform.push(ps.reduce((a,b)=>a+b,0)/ps.length);
      best.push(Math.max(...ps));
      worst.push(Math.min(...ps));
    }
    const e0=activations(uniform);
    const e1=activations([uniform[0],Math.max(uniform[1],uniform[2])]);
    const e2=activations([uniform[0]]);
    trust0+=e0;trust1+=e1;trust2+=e2;
    best0+=activations(best);worst0+=activations(worst);
    capitals.push({capital:c.nation,p:uniform,e0,e1,e2});
  }
  return {ids,trust0,trust1,trust2,best0,worst0,capitals};
}
function stats(a,k){
  const v=a.map(x=>x[k]).sort((x,y)=>x-y);
  return {min:v[0],mean:v.reduce((x,y)=>x+y,0)/v.length,max:v.at(-1)};
}
const allIds=K.cfg.heroes.map(h=>h.id),result={assumptions:[
  'No talents, items, abilities, Tree-energy +1, Delay/Slowdown or movement costs.',
  'All group members are already legally positioned in the capital urban zone.',
  'Leader is chosen before the hidden requirement; uniform-leader baseline averages equally over legal heroes, then the revealed problem uses the leader best allowed characteristic.',
  'Trust 1 uses the easier of the two optional problems. Successes chain in the same Help Capital activation; each failure ends that activation.',
  'Expected activations formula is 1 + sum((1-p)/p) for the required sequential problems.'
],groups:{}};
for(const n of [2,3,4]){
  const rows=combinations(allIds,n).map(ids=>composition(ids,n));
  result.groups[n]={
    compositions:rows.length,
    trust0:stats(rows,'trust0'),
    trust1:stats(rows,'trust1'),
    trust2:stats(rows,'trust2'),
    bestLeaderTrust0:stats(rows,'best0'),
    worstLeaderTrust0:stats(rows,'worst0'),
    v2Profiles:composition([1,6,4,8].slice(0,n),n)
  };
}
const f=x=>x.toFixed(2);
let md='# CAPITAL PROBABILITY AUDIT V3\n\n';
md+='This is an isolated exact probability audit of the approved capital team-check mechanic. It is diagnostic, not a rule change.\n\n';
for(const a of result.assumptions)md+='- '+a+'\n';
md+='\n## Expected Help Capital activations across all hero compositions\n\n';
md+='| Players | Trust 0 each | Trust 1 each | Trust 2 each | Best-leader upper bound, Trust 0 | Worst-leader lower bound, Trust 0 |\n';
md+='|---:|---:|---:|---:|---:|---:|\n';
for(const n of [2,3,4]){
  const g=result.groups[n];
  md+=`| ${n} | ${f(g.trust0.mean)} [${f(g.trust0.min)}–${f(g.trust0.max)}] | ${f(g.trust1.mean)} [${f(g.trust1.min)}–${f(g.trust1.max)}] | ${f(g.trust2.mean)} [${f(g.trust2.min)}–${f(g.trust2.max)}] | ${f(g.bestLeaderTrust0.mean)} | ${f(g.worstLeaderTrust0.mean)} |\n`;
}
md+='\nRanges are across all combinations of 8 approved heroes of the given player count. Values are expected group activations spent on the five capitals only; travel, POIs, final checks and resource acquisition are excluded.\n';
md+='\n## V2 profile set [1,6,4,8]\n\n';
md+='| Players | Trust 0 | Trust 1 | Trust 2 |\n|---:|---:|---:|---:|\n';
for(const n of [2,3,4]){const g=result.groups[n].v2Profiles;md+=`| ${n} | ${f(g.trust0)} | ${f(g.trust1)} | ${f(g.trust2)} |\n`;}
const dir=path.join(__dirname,'capital-audit');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'capital_probability.json'),JSON.stringify(result,null,2));
fs.writeFileSync(path.join(dir,'CAPITAL_PROBABILITY_AUDIT_V3.md'),md);
console.log(md);
