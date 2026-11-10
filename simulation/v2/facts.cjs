const fs=require('fs'),X=require('./experiment.cjs'),K=require('./kernel.cjs'),R=require('./route.cjs'),assert=require('assert/strict');
// Reconfiguration legality and retained activation flags are tested independently of policy choices.
let s=require('./engine.cjs').initial(4,{group:'dynamic',abilities:[8,19,9,12]});
R.setGroups(s,[[0,2],[1,3]]);assert.deepEqual(s.groups,[[0,2],[1,3]]);
s.heroes[0].acted=s.heroes[2].acted=true;R.setGroups(s,[[0,1,2,3]]);assert.deepEqual(s.heroes.map(h=>h.acted),[true,false,true,false]);
s.heroes.forEach(h=>h.acted=false);R.setGroups(s,[[0,3],[1,2]]);assert.deepEqual(s.groups,[[0,3],[1,2]]);
assert.throws(()=>R.setGroups(s,[[0],[1,2,3]]));s.heroes[1].tile='B-1';assert.throws(()=>R.setGroups(s,[[0,1],[2,3]]));
// Exact unweighted macro route: all capitals, then Tree; resources/local movement are excluded.
const cities=['A-3','A-5','A-7','A-9','A-11'];let q=[{t:'A-1',m:0,path:['A-1']}],seen=new Set(),result;
for(let i=0;i<q.length;i++){let x=q[i],key=x.t+':'+x.m;if(seen.has(key))continue;seen.add(key);if(x.t==='C-1'&&x.m===31){result=x;break;}for(const [,t]of K.geo.tiles[x.t].ports){let j=cities.indexOf(t);q.push({t,m:x.m|(j<0?0:1<<j),path:[...x.path,t]});}}
const movement=[2,3,4].map(n=>{let d=[[Infinity,1]];for(let i=0;i<n;i++)d=d.flatMap(([v,p])=>[[1,1/6],[2,2/6],[3,2/6],[4,1/6]].map(([w,r])=>[Math.min(v,w),p*r]));return {players:n,meanIndividual:2.5,meanMinimum:d.reduce((a,[v,p])=>a+v*p,0)};});
fs.writeFileSync(__dirname+'/verified-facts.json',JSON.stringify({reconfigurationTests:'PASS',macroTransitions:result.path.length-1,macroRoute:result.path,movement},null,2));console.log(result.path,movement);
