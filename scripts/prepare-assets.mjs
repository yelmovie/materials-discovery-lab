import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const jobs=[];
for(const dir of ['backgrounds','characters'])await mkdir(new URL(`public/assets/${dir}/`,root),{recursive:true});
const manifest=[];
for(const [stage,source] of [[1,34],[2,41],[3,38],[4,42],[5,43]]){
 const from=`references/images/chatgpt_generated_${String(source).padStart(3,'0')}.png`,to=`public/assets/backgrounds/stage-${stage}.webp`;
 jobs.push(sharp(fileURLToPath(new URL(from,root))).resize({width:1440,withoutEnlargement:true}).webp({quality:80}).toFile(fileURLToPath(new URL(to,root))));manifest.push({from,to,operation:'resize 1440px, WebP quality 80'});
}
for(const [id,source,rect] of [['moru',51,[.32,.015,.17,.32]],['dandani',52,[.335,.055,.145,.28]],['banguli',53,[.33,.015,.16,.35]],['barami',54,[.33,.04,.17,.29]],['tori',55,[.285,.01,.15,.37]]]){
 const from=`references/images/chatgpt_generated_${String(source).padStart(3,'0')}.png`,to=`public/assets/characters/${id}.webp`,path=fileURLToPath(new URL(from,root));const meta=await sharp(path).metadata();const [x,y,w,h]=rect;const region={left:Math.floor(meta.width*x),top:Math.floor(meta.height*y),width:Math.floor(meta.width*w),height:Math.floor(meta.height*h)};
 jobs.push(sharp(path).extract(region).resize({width:240}).webp({quality:88}).toFile(fileURLToPath(new URL(to,root))));manifest.push({from,to,operation:'portrait crop',region});
}
const logoFrom='references/images/chatgpt_generated_050.png',logoTo='public/assets/logo.webp';jobs.push(sharp(fileURLToPath(new URL(logoFrom,root))).trim().resize({width:900}).webp({quality:90}).toFile(fileURLToPath(new URL(logoTo,root))));manifest.push({from:logoFrom,to:logoTo,operation:'transparent trim, 900px WebP'});
await Promise.all(jobs);await writeFile(new URL('public/assets/manifest.json',root),JSON.stringify(manifest,null,2));console.log(`Prepared ${manifest.length} assets; source files preserved.`);
