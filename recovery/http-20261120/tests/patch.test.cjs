const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
test('Candidate hashes and HTML/service-worker app URLs agree',()=>{
 for(const [file,hash] of Object.entries(manifest.candidate_sha256))assert.equal(sha(path.join(root,'source',file)),hash,file);
 const html=fs.readFileSync(path.join(root,'source/index.html'),'utf8');const sw=fs.readFileSync(path.join(root,'source/sw.js'),'utf8');
 const script=html.match(/src="\.\/(app\.js\?v=[^"]+)"/)[1];assert.ok(sw.includes("'./"+script+"'"));
 assert.equal(manifest.complete_site,false);assert.equal(manifest.production_deployed,false);
});
test('Reverse patch reconstructs exact original files; forward patch restores candidate',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'mwg-http-patch-'));
 try{
  for(const file of Object.keys(manifest.candidate_sha256))fs.copyFileSync(path.join(root,'source',file),path.join(temp,file));
  const apply=reverse=>{
   const result=spawnSync('git',['apply','--unidiff-zero',...(reverse?['-R']:[]),path.join(root,'http-recovery.patch')],{cwd:temp,encoding:'utf8'});
   assert.equal(result.status,0,result.stderr);
  };
  apply(true);
  for(const [file,hash] of Object.entries(manifest.baseline_sha256))assert.equal(sha(path.join(temp,file)),hash,'rollback '+file);
  apply(false);
  for(const [file,hash] of Object.entries(manifest.candidate_sha256))assert.equal(sha(path.join(temp,file)),hash,'candidate '+file);
 }finally{fs.rmSync(temp,{recursive:true,force:true})}
});
