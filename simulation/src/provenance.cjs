const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'../..'),digest=x=>crypto.createHash('sha256').update(x).digest('hex');
function sourceDrift(){const c=require('../config.json');return Object.entries(c.sources).filter(([p,h])=>{const raw=fs.readFileSync(path.join(root,p),'utf8');return ![digest(raw),digest(raw.replace(/\r\n/g,'\n'))].includes(h);}).map(([p])=>p);}
function fingerprint(){const files=['simulation/config.json',...fs.readdirSync(__dirname).filter(p=>p.endsWith('.cjs')).sort().map(p=>'simulation/src/'+p),'tools/map_data.cjs'];return digest(files.map(p=>p+'\n'+fs.readFileSync(path.join(root,p),'utf8').replace(/\r\n/g,'\n')).join('\n'));}
module.exports={sourceDrift,fingerprint};
