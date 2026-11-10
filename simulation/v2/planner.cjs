// Oracle diagnostic adapter. Full map knowledge is intentional, not player policy.
const fs=require('fs'),vm=require('vm'),path=require('path'),{createRequire}=require('module');
const file=path.resolve(__dirname,'../src/scenario.cjs');
let source=fs.readFileSync(file,'utf8');
const start=source.indexOf('function chooseExit('),end=source.indexOf('function desirePOI(',start);
source=source.slice(0,start)+`function chooseExit(s,t){
 const required=caps.map((c,i)=>!s.capitals[i].stable&&ownCapital(s,i)?c.tile:null).filter(Boolean);
 const bit=Object.fromEntries(required.map((x,i)=>[x,1<<i])),full=(1<<required.length)-1;
 const queue=[{tile:t,cell:s.heroes[s.active[0]].cell,mask:bit[t]||0,cost:0,first:null}],seen=new Map();
 while(queue.length){queue.sort((a,b)=>a.cost-b.cost);const x=queue.shift(),key=x.tile+':'+x.cell+':'+x.mask;if(seen.has(key)&&seen.get(key)<=x.cost)continue;seen.set(key,x.cost);
 if(x.mask===full&&x.tile==='C-1')return x.first;
 for(const p of geo.tiles[x.tile].ports){const d=geo.dist(x.tile,x.cell,p[0],s.capitals[1].solved[0]||!!(x.mask&bit['A-5']));if(!Number.isFinite(d))continue;queue.push({tile:p[1],cell:geo.mirror(x.tile,p[0],p[1]),mask:x.mask|(bit[p[1]]||0),cost:x.cost+Math.max(0,d-1)+1,first:x.first||p});}}
 return null;
}
`+source.slice(end);
const localModule={exports:{}};new Function('require','module',source)(createRequire(file),localModule);module.exports=localModule.exports;
