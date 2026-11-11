// V1 mechanics; optional post-deadline continuation is a diagnostic only.
const base=require('../src/kernel.cjs');
module.exports={...base,nextDay(s){if((s.options?.horizon||20)===20)return base.nextDay(s);if(s.day>=(s.options.horizon||20)){s.terminal='loss';return;}if(s.day===20){s.day++;s.stage=3;for(const h of s.heroes){h.acted=false;h.daily=[];h.itemDaily=[];}s.bonus=null;
 if(s.options?.stageScaleWithHorizon){
  const h=s.options.horizon||20;
  s.stage=s.day<=Math.round(8*h/20)?1:s.day<=Math.round(15*h/20)?2:3;
 }
 return;}base.nextDay(s);
 if(s.options?.stageScaleWithHorizon){
  const h=s.options.horizon||20;
  const firstEnd=Math.round(8*h/20),secondEnd=Math.round(15*h/20);
  s.stage=s.day<=firstEnd?1:s.day<=secondEnd?2:3;
 }
},finalResult(s,index,leader,success){if(s.options?.horizon>20&&s.day===20&&!success){s.tree.retryDay=21;return;}return base.finalResult(s,index,leader,success);}};
