// Diagnostic contribution of abilities, equipment and voluntary ally help
// in the 3-player, 35-day, Variant A candidate. Approved rules unchanged.
// Counterfactual disabling via opt-in flags; fixed matching seeds/hero rosters.
const fs=require('fs'),path=require('path'),X=require('../v2/experiment.cjs'),K=require('../src/kernel.cjs');
function combos(n,start=1,p=[],out=[]){if(p.length===n){out.push([...p]);return out;}for(let i=start;i<=8;i++){p.push(i);combos(n,i+1,p,out);p.pop();}return out;}
function mean(a){return a.length?a.reduce((p,x)=>p+x,0)/a.length:null;}
function q(a,p){if(!a.length)return null;const b=[...a].sort((x,y)=>x-y),v=(b.length-1)*p,i=Math.floor(v);return b[i]+(b[Math.min(b.length-1,i+1)]-b[i])*(v-i);}
function wilson(w,n){const z=1.96,p=w/n,d=1+z*z/n,m=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return [Math.max(0,m-h),Math.min(1,m+h)];}
const flags={
 all:{},noAbilities:{disableAbilities:true},noItems:{disableItems:true},
 noHelp:{disableHelp:true},noAbilityItem:{disableAbilities:true,disableItems:true},
 noAbilityHelp:{disableAbilities:true,disableHelp:true},
 noItemHelp:{disableItems:true,disableHelp:true},
 bare:{disableAbilities:true,disableItems:true,disableHelp:true}
};
const mode=process.argv[2]||'all',samples=+(process.argv[3]||512),seedOffset=+(process.argv[4]||0),
 talentRate=+(process.argv[5]||0),st=process.argv[6]||'ST-NEUTRAL';
if(!flags[mode])throw Error('Bad mode '+mode);
const options={
 players:3,group:'together',experiment:'ordinary',planner:'global',
 poiAware:true,resourceAware:true,poiStrategy:'legacy',trustTarget:1,
 poiContinueMovement:true,horizon:35,stageScaleWithHorizon:true,
 capitalDifficultyShift:-3,st,talentRate,...flags[mode]
};
const talentTags=K.cfg.cards.filter(c=>c.talents!==null&&c.talents!==undefined).length;
function count(r,type,pred=()=>true){let total=0;for(const d of r.ledger||[])if(d.day<=35)for(const e of d.events||[])if(e.type===type&&pred(e))total++;return total;}
const timing={
 normal:{activation:35,movement:10,poi:120,capital:85,final:90,day:15,overhead:35},
 firstPlay:{activation:50,movement:14,poi:165,capital:120,final:120,day:20,overhead:50}
};
const rows=[],cs=combos(3),usage={},bonusCounts={};
for(let k=0;k<samples;k++){
 const r=X.simulate({...options,profiles:cs[k%cs.length]},24100000+seedOffset+k,false);
 const win=r.completionDay!==null&&r.completionDay<=35,day=win?r.completionDay:35;
 const w={activation:count(r,'activation'),movement:count(r,'movement'),poi:count(r,'poi'),
 capital:count(r,'teamResult',e=>e.capital!==null),final:count(r,'teamResult',e=>e.final!==null)};
 const time=Object.fromEntries(Object.entries(timing).map(([name,t])=>[name,t.overhead+(day*t.day+Object.keys(w).reduce((s,key)=>s+w[key]*t[key],0))/60]));
 const ab=Object.entries(r.metrics).filter(([key])=>/^ability\d+$/.test(key));
 const it=Object.entries(r.metrics).filter(([key])=>key.startsWith('item_'));
 for(const [key,num] of ab)usage[key]=(usage[key]||0)+num;
 for(const [key,num] of it)usage[key]=(usage[key]||0)+num;
 for(const [key,num] of Object.entries(r.metrics))if(/^draftAbility\d+$/.test(key))bonusCounts[key]=(bonusCounts[key]||0)+num;
 const cityResults=(r.ledger||[]).flatMap(d=>d.day<=35?d.events:[]).filter(e=>e.type==='teamResult'&&e.capital!==null);
 rows.push({win,day,work:w,time,allyHelp:r.metrics.eventAllyHelp||0,
  allyByType:Object.fromEntries(Object.entries(r.metrics).filter(([key])=>key.startsWith('eventAllyHelp_'))),
  helperFraction:w.poi?(r.metrics.eventAllyHelp||0)/w.poi:0,
  itemAcquired:r.metrics.items||0,
  itemUsed:it.reduce((s,[,v])=>s+v,0),
  abilityUsed:ab.reduce((s,[,v])=>s+v,0),
  talentUsed:r.metrics.talentApplied||0,
  rewardItemOffered:count(r,'eventResult',e=>e.reward!==null&&e.reward!=='Доверие'&&e.reward!=='Энергия'),
  capCityRolls:cityResults.length,capHelpers:cityResults.reduce((a,e)=>a+Math.max(0,e.participants.length-1),0),
  finalRolls:count(r,'teamResult',e=>e.final!==null),
  stable:r.terminal.capitals.filter(c=>c.stable).length
 });
}
const winners=rows.filter(x=>x.win);
const summarize=a=>({n:a.length,poi:mean(a.map(x=>x.work.poi)),day:mean(a.map(x=>x.day)),
 normalMean:mean(a.map(x=>x.time.normal)),firstMean:mean(a.map(x=>x.time.firstPlay)),
 firstOver210:a.length?a.filter(x=>x.time.firstPlay>210).length/a.length:null,
 helpCount:mean(a.map(x=>x.allyHelp)),helperShare:mean(a.map(x=>x.helperFraction)),
 itemsAcquired:mean(a.map(x=>x.itemAcquired)),itemRewardCards:mean(a.map(x=>x.rewardItemOffered)),
 itemUses:mean(a.map(x=>x.itemUsed)),abilityUses:mean(a.map(x=>x.abilityUsed)),
 talentUses:mean(a.map(x=>x.talentUsed)),capTeamDice:mean(a.map(x=>x.capHelpers)),
 capitalChecks:mean(a.map(x=>x.capCityRolls)),meanStable:mean(a.map(x=>x.stable))
});
const out={status:'NONCANONICAL component audit',mode,flags:flags[mode],samples,seedOffset,talentRate,st,
 wins:winners.length,winRate:winners.length/samples,win95:wilson(winners.length,samples),
 all:summarize(rows),winning:summarize(winners),
 metrics:usage,abilityChoices:bonusCounts,
 cardsWithDefinedTalentTags:talentTags,totalCards:K.cfg.cards.length,
 note:'No abilities flag disables effects, not initial random 3-card offer. No items flag disables item benefits, not reward acquisition; noHelp disables optional within-3-cell POI assistance, not mandatory capital-city group dice. 12 canonical talents cannot be simulated literally with 88 untagged event records; talentRate is proxy. All duration estimates assume fixed timing.';
};
const dir=path.join(__dirname,'variant-a-3p-component-audit');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,mode+'-'+seedOffset+'-'+talentRate+'-'+st+'.json'),JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
