// V1 mechanics; optional post-deadline continuation is a diagnostic only.
const base=require('../src/kernel.cjs');
module.exports={...base,nextDay(s){if((s.options?.horizon||20)===20)return base.nextDay(s);if(s.day>=(s.options.horizon||20)){s.terminal='loss';return;}if(s.day===20){s.day++;s.stage=3;for(const h of s.heroes){h.acted=false;h.daily=[];h.itemDaily=[];}s.bonus=null;return;}base.nextDay(s);},finalResult(s,index,leader,success){if(s.options?.horizon>20&&s.day===20&&!success){s.tree.retryDay=21;return;}return base.finalResult(s,index,leader,success);}};
