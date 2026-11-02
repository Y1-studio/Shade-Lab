/* PNG assets live outside project history. IndexedDB stores assets once. */
(function(root){
'use strict';
const E=root.Shade,records=new Map(),images=new Map(),stored=new Set();let dbPromise,saveQueue=Promise.resolve(),knownRevision;
function decode(record){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{if(img.naturalWidth!==record.width||img.naturalHeight!==record.height){reject(Error('PNG dimensions do not match its metadata.'));return;}resolve(img);};img.onerror=()=>reject(Error('This PNG could not be decoded.'));img.src=record.data;});}
async function importRecords(data={}){
 E.validateAssets(data);const staged=[];
 for(const [id,record]of Object.entries(data)){
  if(records.has(id)){if(records.get(id).data!==record.data)throw Error('Conflicting image asset IDs.');continue;}
  staged.push([id,E.clone(record),await decode(record)]);
 }
 for(const [id,record,img]of staged){records.set(id,record);images.set(id,img);}
}
async function put(data,width,height){
 for(const [id,a]of records)if(a.data===data)return id;
 const a={data,width,height};let id;
 if(root.crypto?.subtle){const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(data));id='png_'+[...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join('');}
 else id='png_'+E.uid();
 await importRecords({[id]:a});return id;
}
async function fromFile(file){
 if(file.size>32*1024*1024)throw Error('Use a PNG smaller than 32 MB.');
 const bytes=new Uint8Array(await file.arrayBuffer());
 if(bytes.length<24||[137,80,78,71,13,10,26,10].some((v,i)=>bytes[i]!==v))throw Error('Import a transparent PNG file.');
 const view=new DataView(bytes.buffer),width=view.getUint32(16),height=view.getUint32(20);
 if(!width||!height||width*height>16777216)throw Error('Use a PNG of at most 16 megapixels.');
 const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Could not read PNG.'));reader.readAsDataURL(new Blob([bytes],{type:'image/png'}));});
 return {id:await put(data,width,height),width,height};
}
function embedded(data){const out={};for(const id of E.assetIds(data)){if(!records.has(id))throw Error('A required PNG layer is missing. Import its original project or ball type.');out[id]=records.get(id);}return E.clone(out);}
function portable(data){return {...E.clone(data),version:3,assets:embedded(data)};}
async function prepareDocument(data){const doc=E.normalizeDocument(data);for(const id of E.assetIds(doc))if(!doc.assets?.[id]&&!records.has(id))throw Error('Missing embedded PNG: '+id);await importRecords(doc.assets||{});delete doc.assets;return doc;}
function openDB(){
 if(dbPromise)return dbPromise;
 dbPromise=new Promise((resolve,reject)=>{
  if(!root.indexedDB){reject(Error('Local database is unavailable. Use Save project to keep your work.'));return;}
  const req=indexedDB.open('shade-lab-v2',1);let finished=false;
  const timer=setTimeout(()=>{finished=true;reject(Error('Local storage is busy. Editing and JSON downloads still work.'));},5000);
  req.onupgradeneeded=()=>{const db=req.result;db.createObjectStore('documents');db.createObjectStore('assets');};
  req.onsuccess=()=>{clearTimeout(timer);if(finished){req.result.close();return;}req.result.onversionchange=()=>req.result.close();resolve(req.result);};
  req.onerror=()=>{clearTimeout(timer);reject(Error('Local storage could not be opened. Use Save project.'));};
  req.onblocked=()=>{clearTimeout(timer);reject(Error('Close other Shade Lab tabs to enable local saving.'));};
 });return dbPromise;
}
async function load(){
 const db=await openDB();const data=await new Promise((resolve,reject)=>{
  const tx=db.transaction(['documents','assets'],'readonly'),docs=tx.objectStore('documents'),p=docs.get('project'),l=docs.get('library'),revision=docs.get('revision'),keys=tx.objectStore('assets').getAllKeys(),vals=tx.objectStore('assets').getAll();
  tx.oncomplete=()=>resolve({project:p.result,library:l.result||[],revision:revision.result??null,assets:Object.fromEntries(keys.result.map((k,i)=>[k,vals.result[i]]))});tx.onabort=tx.onerror=()=>reject(Error('Could not load local studies.'));
 });
 try{
  const needed=E.assetIds([data.project,data.library]),subset=Object.fromEntries(needed.map(id=>[id,data.assets[id]]));
  await importRecords(subset);if(data.project)data.project=E.normalizeDocument(data.project);
  if(Array.isArray(data.library))data.library=data.library.map(E.normalizeDocument);
  else {if(data.library?.schema!=='shadelab.library'||data.library.version!==3||!Array.isArray(data.library.entries))throw Error('Invalid saved type library.');data.library.entries=data.library.entries.map(E.normalizeDocument);}
  for(const id of Object.keys(data.assets))stored.add(id);if(knownRevision===undefined)knownRevision=data.revision;return data;
 }catch(error){error.recovery=JSON.stringify(data);throw error;}
}
function save(project,library){
 const p=E.clone(project),l=E.clone(library),ids=E.assetIds([p,l]);
 const a=Object.fromEntries(ids.map(id=>{if(!records.has(id))throw Error('A required PNG layer is missing.');return[id,records.get(id)];}));
 const task=async()=>{const db=await openDB();await new Promise((resolve,reject)=>{
  const tx=db.transaction(['documents','assets'],'readwrite'),docs=tx.objectStore('documents'),revision=docs.get('revision');let conflict=false,nextRevision;
  revision.onsuccess=()=>{const current=revision.result??null;if(knownRevision!==undefined&&current!==knownRevision){conflict=true;tx.abort();return;}nextRevision=E.uid();docs.put(p,'project');docs.put(l,'library');docs.put(nextRevision,'revision');for(const [id,record]of Object.entries(a))if(!stored.has(id))tx.objectStore('assets').put(record,id);};
  tx.oncomplete=()=>{knownRevision=nextRevision;ids.forEach(id=>stored.add(id));resolve();};tx.onabort=tx.onerror=()=>reject(Error(conflict?'Another Shade Lab tab saved newer work. Download this project before reloading; automatic saving stopped to avoid overwriting it.':'Automatic saving is unavailable or full. Editing still works; use Save project.'));
 });};saveQueue=saveQueue.catch(()=>{}).then(task);return saveQueue;
}
function prune(documents){const keep=new Set(E.assetIds(documents));for(const id of records.keys())if(!keep.has(id)){records.delete(id);images.delete(id);}}
root.ShadeAssets={put,fromFile,importRecords,prepareDocument,portable,embedded,load,save,prune,image:id=>images.get(id),record:id=>records.get(id)};
})(globalThis);
