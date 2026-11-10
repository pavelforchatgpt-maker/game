const {tiles,pos}=require('../../tools/map_data.cjs');
const cells={};let n=0;for(let r=-2;r<=2;r++)for(let q=Math.max(-2,-r-2);q<=Math.min(2,-r+2);q++)cells[++n]=[q,r];
const dirs=[[0,-1],[1,-1],[1,0],[0,1],[-1,1],[-1,0]],sides=[[1,2,3],[3,7,12],[12,16,19],[17,18,19],[8,13,17],[1,4,8]];
const edge=(a,b)=>[a,b].sort((x,y)=>x-y).join(',');const distance=(a,b)=>Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]),Math.abs(a[0]+a[1]-b[0]-b[1]));
const cache=new Map();function graph(tile,bridge=false){let k=tile+bridge;if(cache.has(k))return cache.get(k);const t=tiles[tile],g={};for(let c=1;c<=19;c++)if(!t.blocked.includes(c))g[c]=[];for(const a of Object.keys(g).map(Number))for(const b of Object.keys(g).map(Number))if(distance(cells[a],cells[b])===1&&!t.edges.some(e=>edge(...e)===edge(a,b)&&!(tile==='A-5'&&bridge&&edge(a,b)==='10,14')))g[a].push(b);cache.set(k,g);return g;}
function path(tile,a,b,bridge=false){const g=graph(tile,bridge),queue=[[a]];const seen=new Set([a]);while(queue.length){const p=queue.shift(),x=p.at(-1);if(x===b)return p;for(const y of g[x]||[])if(!seen.has(y)){seen.add(y);queue.push([...p,y]);}}return null;}
function dist(tile,a,b,bridge=false){const p=path(tile,a,b,bridge);return p?p.length-1:Infinity;}
function mirror(tile,cell,to){let side=dirs.findIndex(d=>pos[to][0]-pos[tile][0]===d[0]&&pos[to][1]-pos[tile][1]===d[1]);if(side<0||!tiles[tile].ports.some(p=>p[0]===cell&&p[1]===to))throw Error('illegal passage');const out=sides[(side+3)%6][sides[side].indexOf(cell)];if(!tiles[to].ports.some(p=>p[0]===out&&p[1]===tile))throw Error('mirror');return out;}
module.exports={tiles,cells,graph,path,dist,mirror};
