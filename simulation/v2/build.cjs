const fs=require('fs'),path=require('path');
let s=fs.readFileSync(path.join(__dirname,'../src/scenario.cjs'),'utf8');
function replace(a,b){if(!s.includes(a))throw Error('Source hook missing: '+a.slice(0,70));s=s.replace(a,b);}
replace("const K=require('./kernel.cjs'),E=require('./effects.cjs')","const R=require('./route.cjs');const K=require('./kernel.cjs'),E=require('./effects.cjs')");
let a=s.indexOf('function chooseExit('),b=s.indexOf('function desirePOI(',a);
s=s.slice(0,a)+"function chooseExit(s,t){return R.exit(s,t);}\n"+s.slice(b);
a=s.indexOf('function desirePOI(');b=s.indexOf('function selectProblem(',a);
s=s.slice(0,a)+"function desirePOI(s,t){return R.wantPOI(s,t,territory(t,available(s,t)[0]?.[0],s.options.territory));}\n"+s.slice(b);
replace("function plan(s){if(s.terminal)return;","function plan(s){if(s.terminal)return;R.regroup(s);");
replace("s.active=[...g];E.recover(s);", "s.active=[...g];s.activationId=(s.activationId||0)+1;s.audit.push({type:'activation',id:s.activationId,group:g,positions:s.heroes.map(h=>[h.tile,h.cell]),energy:s.energy,trust:{...s.trust}});E.recover(s);");
replace("s.mode='capital';metric(s,'capitalActivations');", "s.mode='capital';s.audit.push({type:'help',tile:t});metric(s,'capitalActivations');");
replace("function step(input){let s=clone(input);s.metrics={};", "function step(input){let s=clone(input);s.metrics={};s.audit=[];");
replace("h.cell=p[steps];s.budget[i]-=steps;", "s.audit.push({type:'walk',hero:i,tile:h.tile,path:p.slice(0,steps+1),budgetBefore:s.budget[i],steps});h.cell=p[steps];s.budget[i]-=steps;");
replace("t.budget[i]=value;", "t.budget[i]=value;t.audit.push({type:'movement',hero:i,value});");
replace("s.used.push(t+':'+cell);", "s.used.push(t+':'+cell);s.audit.push({type:'poi',hero:i,tile:t,cell,deck:type});");
replace("const [cell,to]=s.target,entry=geo.mirror(t,cell,to);", "const [cell,to]=s.target,entry=geo.mirror(t,cell,to);s.audit.push({type:'cross',from:t,port:cell,to,entry,group:[...s.active],positions:s.active.map(i=>s.heroes[i].cell),budgets:{...s.budget}});");
replace("K.discard(t.decks[t.event.deck],t.card);", "t.audit.push({type:'eventResult',card:t.card,hero,attribute:p.attribute,difficulty,total,reward:total<difficulty?null:card.template==='1Х'&&total>=difficulty+2?'Энергия':p.reward,energy:t.energy,trust:{...t.trust}});K.discard(t.decks[t.event.deck],t.card);");
replace("const success=c.total>=c.diff;", "const success=c.total>=c.diff;s.audit.push({type:'teamResult',capital:c.ci??null,problem:c.pi??null,final:c.final??null,leader:c.leader,participants:c.participants,attribute:c.attr,total:c.total,difficulty:c.diff,success});");
replace("K.startFinal(s);metric(s,'finalEntryDay'", "s.audit.push({type:'finalStart',energy:s.energy,positions:s.heroes.map(h=>[h.tile,h.cell])});K.startFinal(s);metric(s,'finalEntryDay'");
replace("if(allStable(s)&&t==='C-1'&&s.heroes.every(h=>h.tile==='C-1'))", "if(allStable(s)&&s.energy>=cfg.final.requirements[s.n]&&t==='C-1'&&s.heroes.every(h=>h.tile==='C-1'))");
replace("function ownCapital(s,ci){", "function ownCapital(s,ci){if(s.rendezvous)return false;");
replace("function walk(s,i,target){E.jumpToward(s,i,target);", "function walk(s,i,target){const previous=s.heroes[i].cell;E.jumpToward(s,i,target);if(previous!==s.heroes[i].cell)s.audit.push({type:'jump',hero:i,tile:s.heroes[i].tile,from:previous,to:s.heroes[i].cell});");
replace("walk(s,s.active[j],cfg.final.anchors[j])", "walk(s,s.active[j],cfg.final.anchors[s.active[j]])");
replace("o.state.team.total+=o.value;", "o.state.team.total+=o.value;o.state.audit.push({type:'teamDie',hero:i,value:o.value,dice:o.dice});");
replace("attribute:p.attribute,difficulty,total,reward:", "attribute:p.attribute,difficulty,total,dice:o.dice,bonus:s.pending.mod+talentBonus,reward:");
replace("const zone=[s.target[0],...geo.graph(t,s.capitals[1].solved[0])[s.target[0]]];", "const zone=s.options.conservativePort?[s.target[0]]:[s.target[0],...geo.graph(t,s.capitals[1].solved[0])[s.target[0]]];");
replace("distance(s,t,s.heroes[i].cell,s.target[0])<=1", "distance(s,t,s.heroes[i].cell,s.target[0])<=(s.options.conservativePort?0:1)");
replace("let sc=chance*value;", "if(s.options.resourceAware&&r){if(r==='Энергия')value=s.energy<cfg.final.requirements[s.n]?2.5:.05;else if(r==='Доверие')value=1.6;else value=r==='Сапоги скороходы'?1.5:.2;}let sc=chance*value;");
replace("choice=pathIndex(s,pr.paths,leader,true),[attr,diff]=pr.paths[choice],participants=", "choice=pathIndex(s,pr.paths,leader,true),[attr,baseDiff]=pr.paths[choice],diff=baseDiff+(s.options.capitalDifficultyShift||0),participants=");
// Emit the day BEFORE deterministic state transitions, so mixed-day steps are not misattributed.
replace("const metric=(s,k,v=1)=>s.metrics[k]=(s.metrics[k]||0)+v;", "const metric=(s,k,v=1)=>s.metrics[k]=(s.metrics[k]||0)+v;function advance(s){s.audit.push({type:'dayEnd',day:s.day});K.nextDay(s);}");
s=s.replaceAll('K.nextDay(s);return;', 'advance(s);return;');
replace('s.options=options;', 's.options=options;if(options.heroOrder)s.groups=[options.heroOrder];');
// Restore the legacy policy in a separately generated engine for matched comparisons.
fs.writeFileSync(path.join(__dirname,'engine.cjs'),s);
let legacy=s;const original=fs.readFileSync(path.join(__dirname,'../src/scenario.cjs'),'utf8');
const lo=original.indexOf('function chooseExit('),hi=original.indexOf('function selectProblem(',lo);
const ll=legacy.indexOf('function chooseExit('),lh=legacy.indexOf('function selectProblem(',ll);
legacy=legacy.slice(0,ll)+original.slice(lo,hi)+legacy.slice(lh);legacy=legacy.replace('R.regroup(s);','');
// Compatibility repair: a policy may stop, but may not loop forever across a zero-cost portal.
legacy=legacy.replace('s.active=[...g];s.activationId=', 's.active=[...g];s.policyCrossings=[];s.activationId=');
legacy=legacy.replace('const [cell,to]=s.target,entry=', "const mark=t+':'+s.target.join(':');if(s.policyCrossings?.includes(mark)){finish(s);return;}s.policyCrossings??=[];s.policyCrossings.push(mark);const [cell,to]=s.target,entry=");
fs.writeFileSync(path.join(__dirname,'legacy.cjs'),legacy);
