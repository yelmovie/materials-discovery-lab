import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';
const sources={
  "workshop-island": "references/generated/workshop-island.png",
  "researcher": "references/generated/researcher.png",
  "companion": "references/generated/companion.png",
  "umbrella": "references/generated/umbrella.png",
  "invention": "references/generated/invention.png"
};
await mkdir('public/assets/generated',{recursive:true});
const manifest=[];
for(const [name,source] of Object.entries(sources)){
 const destination=`public/assets/generated/${name}.webp`;
 const width=name==='workshop-island'?1536:['researcher','companion'].includes(name)?256:900;
 await sharp(source).resize({width,withoutEnlargement:true}).webp({quality:90}).toFile(destination);
 const {width:w,height:h,hasAlpha}=await sharp(destination).metadata();
 manifest.push({id:name,source,destination,width:w,height:h,hasAlpha,created:'2026-10-22',provider:'OpenAI image generation',purpose:name==='workshop-island'?'2.5D pixel RPG map':'2D concept / future 3D reference'});
}
await writeFile('public/assets/generated/manifest.json',JSON.stringify(manifest,null,2));
console.log(manifest.map(({id,width,height,hasAlpha})=>({id,width,height,hasAlpha})));

