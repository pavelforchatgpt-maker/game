// Independent ranges of the same suite, for bounded parallel workers.
const fs=require('fs'),path=require('path'),S=require('../src/scenario.cjs'),D=require('../src/dag.cjs'),P=require('../src/provenance.cjs');
if(P.sourceDrift().length)throw Error('Source drift');
const start=+process.argv[2],end=+process.argv[3],samples=+(process.argv[4]||128),fingerprint=P.fingerprint();
const configurations=[];
for(const [players,group]of [[2,'together'],[3,'together'],[4,'together'],[4,'split'],[4,'mixed']])for(const policy of ['WIN-MAX-HEURISTIC','BALANCED HUMAN','EXPLORER','TRUST-FIRST','ENERGY-FIRST','IMPERFECT'])for(const st of ['ST-NEUTRAL','ST-MODERATE','ST-HARSH'])configurations.push({players,group,policy,st,talentRate:0});
if(!(start>=0&&end<=configurations.length&&end>start))throw Error('range');
const file=path.join(__dirname,`../results/main-range-${start}-${end}.json`);
let result=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):{fingerprint,samples,start,end,runs:[]};
if(result.fingerprint!==fingerprint||result.samples!==samples)throw Error('Checkpoint version mismatch');
for(let index=start+result.runs.length;index<end;index++){
 const configuration=configurations[index],seed=20261026+index*103;
 const r=D.sample(S.initial(configuration.players,configuration),S.step,{samples,seed});
 result.runs.push({configurationIndex:index,configuration,seed,...r});fs.writeFileSync(file,JSON.stringify(result,null,2));console.log(`range ${index+1}/${end}: win=${r.winRate}`);
}
