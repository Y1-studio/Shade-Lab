// Run every registered source or portable suite and retain compact release evidence.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),pkg=require('../package.json'),mode=process.argv.includes('--portable')?'portable':'source';
const folder=path.join(root,'tests/output/csp-square',mode);fs.mkdirSync(folder,{recursive:true});
const retry=process.argv.includes('--retry'),only=process.argv.find(x=>x.startsWith('--suite='))?.slice(8),recordPath=path.join(folder,'checks.json'),prior=retry||only?JSON.parse(fs.readFileSync(recordPath,'utf8')):null,results=prior?.results||[];
for(const step of pkg.scripts.test.split('&&')){
 const key=step.trim().replace(/^npm run /,'');
 for(const cmd of pkg.scripts[key].split('&&')){
  const args=cmd.trim().split(/\s+/);if(args.shift()!=='node')throw Error('Expected a Node suite: '+cmd);if(mode==='portable')args.push('--portable');
  if(only&&args[0]!==only)continue;
  if(retry&&!results.some(r=>r.suite===args[0]&&r.code!==0))continue;
  const r=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',maxBuffer:10*1024*1024}),output=(r.stdout||'')+(r.stderr||''),passes=(output.match(/^PASS /gm)||[]).length,failures=(output.match(/^FAIL /gm)||[]).length;
  fs.writeFileSync(path.join(folder,path.basename(args[0])+'.txt'),output);
  const item={suite:args[0],code:r.status,passes,failures},index=results.findIndex(r=>r.suite===args[0]);if(index<0)results.push(item);else results[index]=item;console.log(`${r.status===0?'PASS':'FAIL'} ${mode} ${args[0]} (${passes} checks)`);if(r.status!==0)console.log(output);
 }
}
const record={mode,appSHA256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'Shade Lab.html'))).digest('hex'),results,passes:results.reduce((n,r)=>n+r.passes,0)};
fs.writeFileSync(recordPath,JSON.stringify(record,null,2)+'\n');process.exitCode=results.some(r=>r.code!==0)?1:0;
