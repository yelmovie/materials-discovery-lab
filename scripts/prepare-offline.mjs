import {createHash} from 'node:crypto';
import {readFile,readdir,writeFile,stat,unlink} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const dist=fileURLToPath(new URL('../dist/',import.meta.url));
async function walk(dir,prefix=''){
 const result=[];
 for(const item of await readdir(dir,{withFileTypes:true})){
  if(item.name.startsWith('._')||item.name==='.DS_Store'){
   // Vite copies exFAT metadata from public. Keep it out of the release directory.
   if(item.isFile())await unlink(path.join(dir,item.name));
   continue;
  }
  const relative=prefix+item.name;
  if(item.isDirectory())result.push(...await walk(path.join(dir,item.name),relative+'/'));
  else result.push(relative);
 }
 return result;
}
const files=(await walk(dist)).filter(p=>p==='index.html'||p==='manifest.webmanifest'||p.startsWith('assets/')&&/\.(js|css|webp|png|json|md|woff2|txt|mp4|webm|mp3|m4a)$/.test(p)).sort();
if(!files.includes('index.html')||!files.includes('manifest.webmanifest')||!files.some(p=>p.endsWith('.js')))throw new Error('Build the app before preparing offline assets.');
// A worker logic change also needs a fresh cache, even if the app files did not change.
const hash=createHash('sha256').update(await readFile(fileURLToPath(import.meta.url)));let bytes=0;
for(const file of files){const data=await readFile(path.join(dist,file));hash.update(file).update(data);bytes+=data.length;}
const version=hash.digest('hex').slice(0,16);
const source=`/* Generated from build contents by scripts/prepare-offline.mjs. */
const CACHE_PREFIX='material-workshop-offline-';
const CACHE_NAME=CACHE_PREFIX+${JSON.stringify(version)};
const FILES=${JSON.stringify(files)};
// Static hosts can redirect /index.html to /. Cache the canonical shell so the
// fallback is usable for navigation requests that cannot return a redirected response.
const indexURL=self.registration.scope;
const urls=FILES.map(file=>file==='index.html'?indexURL:new URL(file,indexURL).href);
const precached=new Set(urls);
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{const cache=await caches.open(CACHE_NAME);await cache.addAll(urls.map(url=>new Request(url,{cache:'reload'})));})());
 // No skipWaiting: an update cannot replace an active lesson.
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith(CACHE_PREFIX)&&name!==CACHE_NAME)await caches.delete(name);await self.clients.claim();})());
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 if(request.mode==='navigate'){
  event.respondWith((async()=>{const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),4000);try{const response=await fetch(request,{signal:controller.signal});if(response.ok)return response;throw new Error('Navigation unavailable');}catch{const cached=await caches.open(CACHE_NAME);return await cached.match(indexURL,{ignoreVary:true})||new Response('실험을 처음 준비하려면 인터넷에 연결해 주세요.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}finally{clearTimeout(timeout);}})());return;
 }
 // Only the reviewed static build is cached. No API, cross-origin or runtime data.
 if(!precached.has(url.href))return;
 // A module's Origin header can differ from addAll's request (Vary: Origin on
 // preview/static hosts). These exact, same-origin, content-versioned files are
 // reviewed static resources, so header variation must not turn a hit into a
 // network request. Unknown URLs and APIs never reach this branch.
 event.respondWith((async()=>{const cache=await caches.open(CACHE_NAME);const response=await cache.match(url.href,{ignoreVary:true});if(!response)return fetch(request);
  const range=request.headers.get('Range');if(!range)return response;
  const match=/^bytes=(\\d*)-(\\d*)$/.exec(range);if(!match||(!match[1]&&!match[2]))return new Response(null,{status:416});
  const bytes=await response.arrayBuffer(),length=bytes.byteLength;
  const start=match[1]?Number(match[1]):Math.max(0,length-Number(match[2]));
  const end=match[1]&&match[2]?Math.min(length-1,Number(match[2])):length-1;
  if(start>=length||start>end)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+length}});
  const headers=new Headers(response.headers);headers.set('Content-Range','bytes '+start+'-'+end+'/'+length);headers.set('Content-Length',String(end-start+1));headers.set('Accept-Ranges','bytes');
  return new Response(bytes.slice(start,end+1),{status:206,headers});})());
});
`;
new vm.Script(source,{filename:'sw.js'});
for(const file of files){if(file.includes('..')||path.isAbsolute(file)||!(await stat(path.join(dist,file))).isFile())throw new Error('Invalid precache path: '+file);}
await writeFile(path.join(dist,'sw.js'),source);
console.log(`Offline precache: ${files.length} files, ${(bytes/1024/1024).toFixed(2)} MiB, version ${version}. Syntax and file paths verified.`);

