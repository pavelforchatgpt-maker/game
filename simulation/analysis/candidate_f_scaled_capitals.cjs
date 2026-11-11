const fs=require('fs'),path=require('path'),X=require('../v2/experiment.cjs');

function combos(n,start=1,p=[],out=[]){if(p.length===n){out.push([...p]);return out;}for(let i=start;i<=8;i++){p.push(i);combos(n,i+1,p,out);p.pop();}return out;}
function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:null;}
function wilson(w,n){const z=1.96,p=w/n,d=1+z*z/n,m=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return [Math.max(0,m-h),Math.min(1,m+h)];}
function countTo20(r,type,pred=()=>true){let n=0;for(const d of r.ledger||[]){if(d.day>20)continue;for(const e of d.events||[])if(e.type===type&&pred(e))n++;}return n;}

const players=+(process.argv[2]||2),shift=+(process.argv[3]||0),samples=+(process.argv[4]||256),cs=combos(players),rows=[];
const offset=players===2?2:1;
for(let k=0;k<samples;k++){
 const profiles=cs[k%cs.length];
 const r=X.simulate({
   players,group:'together',profiles,
   experiment:'ordinary',planner:'global',
   poiAware:true,resourceAware:true,poiStrategy:'legacy',
   capitalDifficultyShift:shift,
   capitalTrustOffset:offset,
   st:'ST-NEUTRAL',talentRate:0,horizon:50
 },12100000+players*100000+(shift+4)*10000+k,false);
 rows.push(r);
}
const wins=rows.filter(r=>r.completionDay!==null&&r.completionDay<=20);
const out={
 players,capitalShift:shift,capitalTrustOffset:offset,samples,
 wins:wins.length,winRate:wins.length/samples,win95:wilson(wins.length,samples),
 meanWinDay:mean(wins.map(r=>r.completionDay)),
 meanActivationsTo20:mean(rows.map(r=>countTo20(r,'activation'))),
 meanMovementRollsTo20:mean(rows.map(r=>countTo20(r,'movement'))),
 meanPOITo20:mean(rows.map(r=>countTo20(r,'poi'))),
 meanCapitalChecksTo20:mean(rows.map(r=>countTo20(r,'teamResult',e=>e.capital!==null))),
 meanStableAt20:mean(rows.map(r=>r.deadline.capitals.filter(c=>c.stable).length)),
 meanTrustAt20:mean(rows.map(r=>Object.values(r.deadline.trust).reduce((a,b)=>a+b,0))),
 meanEnergyAt20:mean(rows.map(r=>r.deadline.energy)),
 note:'DIAGNOSTIC Candidate F: no bonus activations; 2p capitalTrustOffset=2 (key only), 3p offset=1; varied capital DC shift. Canonical rules unchanged.'
};
const dir=path.join(__dirname,'candidate-f-scaled-capitals');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,players+'p-s'+shift+'.json'),JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));
// trigger workflow registration
