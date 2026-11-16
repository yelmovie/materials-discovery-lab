// Cuts the 2026-11-16 GPT image sources into game assets.
// Sources: references/generated/ux-20261116 (materials sheet 3x2, quest-1..5 still lifes).
import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';

const src='references/generated/ux-20261116';
const materials=['wood_raw','metal_plate','glass_clear','plastic_clear','plastic_opaque','rubber_soft'];
await mkdir('public/assets/generated/materials',{recursive:true});
await mkdir('public/assets/generated/quests',{recursive:true});

const sheet=sharp(`${src}/materials.png`);
const {width,height}=await sheet.metadata();
const cw=Math.floor(width/3),ch=Math.floor(height/2);
for(const [i,id] of materials.entries()){
 const cell=await sharp(`${src}/materials.png`).extract({left:(i%3)*cw,top:Math.floor(i/3)*ch,width:cw,height:ch}).png().toBuffer();
 await sharp(cell).trim({threshold:8}).resize({width:200,height:160,fit:'inside'}).webp({quality:86,alphaQuality:90}).toFile(`public/assets/generated/materials/${id}.webp`);
}
for(let n=1;n<=5;n++){
 const file=`${src}/quest-${n}.png`;
 if(!existsSync(file)){console.warn('missing',file);continue;}
 await sharp(file).trim({threshold:8}).resize({width:480,height:320,fit:'inside'}).webp({quality:84,alphaQuality:88}).toFile(`public/assets/generated/quests/quest-${n}.webp`);
}
console.log('flow art ready');
if(existsSync(`${src}/lab-bench.png`))await sharp(`${src}/lab-bench.png`).resize({width:1600}).webp({quality:80}).toFile('public/assets/generated/lab-bench.webp');
if(existsSync(`${src}/glass-tank.png`))await sharp(`${src}/glass-tank.png`).trim({threshold:8}).resize({width:1200}).webp({quality:84,alphaQuality:90}).toFile('public/assets/generated/glass-tank.webp');
if(existsSync(`${src}/material-core.png`))await sharp(`${src}/material-core.png`).trim({threshold:8}).resize({width:600}).webp({quality:86,alphaQuality:90}).toFile('public/assets/generated/material-core.webp');
