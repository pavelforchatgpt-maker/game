// Mutation tests run in separate Node processes; no source/model files are changed.
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const cwd=path.resolve(__dirname,'..');
const cases=[
 ['baseline','',0],
 ['nonadjacent blocked edge',"m.tiles['A-1'].edges.push([1,19]);",1],
 ['wrong mirrored corner',"m.tiles['B-5'].ports.find(x=>x[0]===1)[0]=4;",1],
 ['closed global boundary',"m.tiles['C-1'].ports.push([2,'B-4']);",1],
 ['A5 premature bridge',"m.tiles['A-5'].edges=m.tiles['A-5'].edges.filter(e=>!(e[0]===10&&e[1]===14));",1],
 ['C1 blocked entrance',"m.tiles['C-1'].blocked.push(8);",1],
 ['POI on exit',"m.tiles['A-1'].poi[0][0]=2;",1],
 ['missing B6 bridge',"m.tiles['B-6'].edges.push([9,10]);",1],
];
let failed=0;
for(const [name,mutate,want] of cases){const r=spawnSync(process.execPath,['-e',`const m=require('./tools/map_data.cjs');${mutate}require('./tools/map_validator.cjs');`],{cwd,encoding:'utf8'});const ok=want===0?r.status===0:r.status!==0;console.log(`${ok?'PASS':'FAIL'} ${name} (exit ${r.status})`);if(!ok)failed++;}
process.exitCode=failed?1:0;
