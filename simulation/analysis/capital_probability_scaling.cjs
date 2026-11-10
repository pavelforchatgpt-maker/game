const fs=require('fs'),path=require('path');
const K=require('../src/kernel.cjs'),E=require('../v2/engine.cjs');
const dist=Object.fromEntries([2,3,4].map(n=>[n,K.distribution(n,'sum')]));
function combinations(a,n,start=0,prefix=[],out=[]){if(prefix.length===n){out.push(prefix.slice());return out;}for(let i=start;i<a.length;i++){prefix.push(a[i]);combinations(a,n,i+1,prefix,out);prefix.pop();}return out;}
function success(hero,paths,n,shift){return Math.max(...paths.map(([attr,diff])=>dist[n].reduce((s,[v,p])=>s+(hero.attributes[attr]+v>=diff+shift?p:0),0)));}
function activations(ps){return 1+ps.reduce((s,p)=>s+(1-p)/p,0);}
function composition(ids,n,shift){
 const hs=ids.map(id=>K.cfg.heroes.find(h=>h.id===id));let trust0=0,trust1=0,trust2=0,best0=0;
 for(const c of E.caps){
  const uniform=[],best=[];
  for(const pr of c.problems){const ps=hs.map(h=>success(h,pr.paths,n,shift));uniform.push(ps.reduce((a,b)=>a+b,0)/ps.length);best.push(Math.max(...ps));}
  trust0+=activations(uniform);trust1+=activations([uniform[0],Math.max(uniform[1],uniform[2])]);trust2+=activations([uniform[0]]);best0+=activations(best);
 }
 return {trust0,trust1,trust2,best0};
}
function stats(rows,k){const v=rows.map(x=>x[k]).sort((a,b)=>a-b);return {min:v[0],mean:v.reduce((a,b)=>a+b,0)/v.length,max:v.at(-1)};}
const ids=K.cfg.heroes.map(h=>h.id),out={note:'DIAGNOSTIC ONLY. Difficulty shift applies to capital team checks; canonical rules unchanged.',groups:{}};
for(const n of [2,3,4]){out.groups[n]={};for(const shift of [0,-1,-2]){const rows=combinations(ids,n).map(c=>composition(c,n,shift));out.groups[n][shift]={trust0:stats(rows,'trust0'),trust1:stats(rows,'trust1'),trust2:stats(rows,'trust2'),bestLeaderTrust0:stats(rows,'best0'),v2Profiles:composition([1,6,4,8].slice(0,n),n,shift)};}}
const dir=path.join(__dirname,'capital-scaling');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'exact.json'),JSON.stringify(out,null,2));
for(const n of [2,3,4])for(const shift of [0,-1,-2]){const g=out.groups[n][shift];console.log(JSON.stringify({players:n,shift,trust0:g.trust0.mean,trust1:g.trust1.mean,trust2:g.trust2.mean,best0:g.bestLeaderTrust0.mean,v2:g.v2Profiles}));}
