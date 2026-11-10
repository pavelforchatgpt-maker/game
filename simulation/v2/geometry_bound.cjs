const fs=require('fs'),G=require('../src/geometry.cjs');
// Optimistic super-hero: speed 7, no obstacles, free placement anywhere in
// an entry zone, free Trust/resources, one Help per capital, free final.
// Unlike a witness, this intentionally grants MORE power than the rules.
const ids=Object.keys(G.tiles),cities=['A-3','A-5','A-7','A-9','A-11'];
const node=(t,c)=>ids.indexOf(t)*19+c-1,decode=v=>[ids[Math.floor(v/19)],v%19+1],g=Array.from({length:361},()=>[]);
const hex=(a,b)=>{const x=G.cells[a],y=G.cells[b];return Math.max(Math.abs(x[0]-y[0]),Math.abs(x[1]-y[1]),Math.abs(x[0]+x[1]-y[0]-y[1]));};
for(const t of ids)for(let a=1;a<=19;a++){
 for(let b=1;b<=19;b++)if(hex(a,b)===1)g[node(t,a)].push([node(t,b),1]);
 for(const [port,to]of G.tiles[t].ports)if(hex(a,port)<=1){const entry=G.mirror(t,port,to);for(let b=1;b<=19;b++)if(hex(entry,b)<=1)g[node(t,a)].push([node(to,b),0]);}
}
const reach=g.map((_,start)=>{const d=Array(361).fill(Infinity),q=[start];d[start]=0;for(let i=0;i<q.length;i++){const a=q[i];for(const [b,w]of g[a])if(d[a]+w<=7&&d[b]>d[a]+w){d[b]=d[a]+w;q.push(b);}}return d.flatMap((v,i)=>v<=7?[i]:[]);});
let frontier=new Set([node('A-1',18)]),seen=new Set(frontier),answer=null;
for(let activations=0;activations<20&&!answer;activations++){
 const next=new Set();for(const value of frontier){const m=Math.floor(value/361),v=value%361,[t,c]=decode(v);if(m===31&&t==='C-1'){answer={minimumActivations:activations,lowerBoundDaysWithTime:activations-1,states:seen.size};break;}
 const add=(mask,pos)=>{const k=mask*361+pos;if(!seen.has(k)){seen.add(k);next.add(k);}};
 for(const w of reach[v])add(m,w);const ci=cities.indexOf(t);if(ci>=0&&!(m&(1<<ci))&&G.tiles[t].city.includes(c))for(const end of G.tiles[t].city)add(m|(1<<ci),node(t,end));
 }frontier=next;
}
fs.writeFileSync(__dirname+'/geometry-bound.json',JSON.stringify({scope:'single group only; optimistic relaxation, not an attainable game route',...answer},null,2));console.log(answer);
