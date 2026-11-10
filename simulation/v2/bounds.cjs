// Certified lower bound in a relaxation: travel teleports, unlimited resources,
// every capital needs one successful Help activation, final is free at C1.
const fs=require('fs');
function relaxed(players,together=false,capOnly=false){
 const full=(1<<players)-1,canon=(p,a,u)=>{const rest=p.slice(1).map((v,i)=>[v,!!(a&(1<<(i+1)))]).sort((x,y)=>x[0]-y[0]||x[1]-y[1]);return [p[0],!!(a&1),...rest.flat(),u].join(',');};
 let layer=new Map([['root',{p:Array(players).fill(5),a:0,m:0,u:false}]]),visited=0;
 const subgroups=[];for(let g=1;g<=full;g++){const n=g.toString(2).split('1').length-1;if(n===players||players===4&&!together&&n===2)subgroups.push(g);}
 function actions(x,g){const ids=Array.from({length:players},(_,i)=>i).filter(i=>g&(1<<i)),out=[];const here=x.p[ids[0]];
  for(let t=0;t<=6;t++){if(t<5&&(x.m&(1<<t))&&!x.p.includes(t))continue;const p=x.p.slice();ids.forEach(i=>p[i]=t);out.push({...x,p,a:x.a|g});}
  if(here<5&&!(x.m&(1<<here)))out.push({...x,a:x.a|g,m:x.m|(1<<here)});return out;}
 for(let day=1;day<=12;day++){
  const queue=[...layer.values()],seen=new Set(),next=new Map();
  for(let at=0;at<queue.length;at++){const x=queue[at],k=x.m+'|'+canon(x.p,x.a,x.u);if(seen.has(k))continue;seen.add(k);visited++;
   if(x.m===31&&(capOnly||x.p.every(p=>p===6)))return {days:day,states:visited,label:'EXACT MINIMUM OF RELAXED ACTIVATION MODEL; LOWER BOUND ONLY'};
   if(x.a===full){const y={...x,a:0};next.set(y.m+'|'+canon(y.p,0,y.u),y);continue;}
   for(const g of subgroups){if(g&x.a)continue;const ids=Array.from({length:players},(_,i)=>i).filter(i=>g&(1<<i));if(new Set(ids.map(i=>x.p[i])).size!==1)continue;
    for(const y of actions(x,g)){queue.push(y);if(!x.u&&(g&1))for(const z of actions({...y,u:true},g))queue.push(z);}
   }
  }layer=next;
 }throw Error('No relaxed route');
}
const results=[{players:2,group:'together',...relaxed(2)},{players:3,group:'together',...relaxed(3)},{players:4,group:'together',...relaxed(4,true)},{players:4,group:'dynamic',...relaxed(4)}];
const capitalBounds=[{players:2,...relaxed(2,false,true)},{players:3,...relaxed(3,false,true)},{players:4,group:'together',...relaxed(4,true,true)},{players:4,group:'dynamic',...relaxed(4,false,true)}];
const resourcePareto=[2,3,4].map(n=>({players:n,energy:2*n,points:Array.from({length:11},(_,trust)=>({trust,minimumPOI:2*n+trust,minimumProblems:15-trust}))}));
fs.writeFileSync(__dirname+'/bounds.json',JSON.stringify({results,capitalBounds,resourcePareto,proof:'Each POI awards at most one primary resource. Excess trust replaces its reward and therefore does not reduce E+T. Relaxation removes geometry, resource acquisition and all failures, but preserves activation exclusivity, legal group sizes, meetings and one Time bonus.'},null,2));console.log(results);
