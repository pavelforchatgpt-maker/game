// Isolated exact movement model; not a substitute for tile-aware simulation.
const fs=require('fs'),path=require('path');
const moves=[[1,1/6],[2,2/6],[3,2/6],[4,1/6]];
const rows=[];
for(const length of [1,2,3,4,5,8,12]){
 let remaining=new Map([[length,1]]),cdf=[0];
 for(let day=1;day<=length;day++){
  const next=new Map();for(const [r,p]of remaining)for(const [m,q]of moves){const v=Math.max(0,r-m);next.set(v,(next.get(v)||0)+p*q);}remaining=next;cdf.push(remaining.get(0)||0);
 }
 for(const n of [2,3,4])rows.push({distance:length,players:n,expectedArrivalDay:cdf.slice(0,-1).reduce((a,p)=>a+1-p**n,0),arriveByDay2:(cdf[Math.min(2,length)]||0)**n});
}
const result={label:'EXACT isolated common destination: independent ordinary movement, no items, magic, conditions or events',minimumDailyMove:[2,3,4].map(n=>({players:n,expectation:1+(5/6)**n+(1/2)**n+(1/6)**n})),rows};
fs.writeFileSync(path.join(__dirname,'../results/exact_travel.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result.rows.filter(r=>r.distance===5),null,2));
