import sharp from 'sharp';
import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {scene,FPS,WIDTH,HEIGHT,SECONDS} from './scenes.mjs';
sharp.concurrency(1);
const out=fileURLToPath(new URL('../../public/assets/concepts/',import.meta.url)),ffmpeg=process.env.FFMPEG||'D:/Tools/ffmpeg/ffmpeg.exe';
const requested=process.argv.slice(2),ids=requested.length?requested:Array.from({length:10},(_,i)=>`S${String(i+1).padStart(2,'0')}`);await mkdir(out,{recursive:true});
function encoder(file,args){const child=spawn(ffmpeg,['-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgba','-s',`${WIDTH}x${HEIGHT}`,'-r',String(FPS),'-threads','2','-i','-',...args,'-threads','2','-pix_fmt','yuv420p','-an',file],{stdio:['pipe','ignore','inherit']});const done=new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',code=>code===0?resolve():reject(new Error('Encoder exited '+code)));});done.catch(()=>{});return {async write(b){if(!child.stdin.write(b))await once(child.stdin,'drain');},async end(){child.stdin.end();await done;}};}
const records=[];
for(const id of ids){if(!/^S(0[1-9]|10)$/.test(id))throw new Error('Unknown clip '+id);const mp4=encoder(out+id+'.mp4',['-c:v','libx264','-crf','23','-preset','medium','-movflags','+faststart']),webm=encoder(out+id+'.webm',['-c:v','libvpx-vp9','-crf','33','-b:v','0','-row-mt','1','-cpu-used','5']);for(let f=0;f<SECONDS*FPS;f++){const data=await sharp(Buffer.from(scene(id,f))).ensureAlpha().raw().toBuffer();await Promise.all([mp4.write(data),webm.write(data)]);}await Promise.all([mp4.end(),webm.end()]);await sharp(Buffer.from(scene(id,SECONDS*FPS-1))).webp({quality:85}).toFile(out+id+'.webp');const files=[];for(const ext of ['mp4','webm','webp']){const name=id+'.'+ext,data=await readFile(out+name);files.push({name,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});}records.push({id,seconds:SECONDS,fps:FPS,width:WIDTH,height:HEIGHT,files});console.log(id,files.map(f=>`${f.name}: ${Math.round(f.bytes/1024)} KB`).join(', '));}
await writeFile(out+'manifest.json',JSON.stringify({created:'2026-10-22',source:'Original SVG → sharp → FFmpeg; no text, no audio',clips:records},null,2)+'\n');

