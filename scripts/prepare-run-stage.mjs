// Cuts the 2026-11-17 GPT image sources for the S03 3D walkway into game assets.
// Sources: references/generated/run-stage-20261117 (material surfaces 3x2, lab wall, props 3x2,
// cabinet front + floor sheet, researcher action strip 6x1).
// Run: node scripts/prepare-run-stage.mjs
import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';

const src='references/generated/run-stage-20261117',out='public/assets/run-stage';
await mkdir(out,{recursive:true});

// Material surfaces: the middle of each cell, away from the white gutters.
const surfaces=['rubber_soft','metal_plate','glass_clear','plastic_clear','wood_raw','plastic_opaque'];
if(existsSync(`${src}/material-surfaces.png`)){
 const {width,height}=await sharp(`${src}/material-surfaces.png`).metadata();
 const cw=Math.floor(width/3),ch=Math.floor(height/2),inset=Math.round(cw*.09),size=Math.min(cw,ch)-inset*2;
 for(const [i,id] of surfaces.entries())
  await sharp(`${src}/material-surfaces.png`).extract({left:(i%3)*cw+Math.round((cw-size)/2),top:Math.floor(i/3)*ch+Math.round((ch-size)/2),width:size,height:size}).resize(256,256).webp({quality:84}).toFile(`${out}/material-${id}.webp`);
}else console.warn('missing material-surfaces.png');

// Cabinet front (top half) and floor planks (bottom half) share one sheet; a margin keeps the white divider out.
if(existsSync(`${src}/textures-sheet.png`)){
 const file=`${src}/textures-sheet.png`,{width,height}=await sharp(file).metadata(),half=Math.floor(height/2),margin=Math.round(half*.06);
 await sharp(file).extract({left:0,top:margin,width,height:half-margin*2}).resize({width:1024}).webp({quality:84}).toFile(`${out}/cabinet-front.webp`);
 await sharp(file).extract({left:0,top:half+margin,width,height:half-margin*2}).resize({width:1024}).webp({quality:82}).toFile(`${out}/floor-tile.webp`);
}else console.warn('missing textures-sheet.png');

// Far wall of the lab.
if(existsSync(`${src}/backdrop-wall.png`))await sharp(`${src}/backdrop-wall.png`).resize({width:1536}).webp({quality:82}).toFile(`${out}/backdrop-wall.webp`);
else console.warn('missing backdrop-wall.png');

// Painted glow and edge fringe are cut away: pixels that are mostly see-through become fully clear.
async function cutout(input,region){
 const {data,info}=await sharp(input).extract(region).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let i=3;i<data.length;i+=4)if(data[i]<150)data[i]=0;
 return sharp(data,{raw:info}).png().toBuffer();
}

// Props and counter decorations: 3x2 cells, each trimmed to its own picture.
const props=['prop-torch','prop-pipette','prop-post','decor-plant','decor-jars','decor-crate'];
if(existsSync(`${src}/props-sheet.png`)){
 const file=`${src}/props-sheet.png`,{width,height}=await sharp(file).metadata(),cw=Math.floor(width/3),ch=Math.floor(height/2);
 for(const [i,name] of props.entries()){
  const cell=await cutout(file,{left:(i%3)*cw,top:Math.floor(i/3)*ch,width:cw,height:ch});
  await sharp(cell).trim({threshold:6}).resize({width:256,height:256,fit:'inside'}).webp({quality:88,alphaQuality:92}).toFile(`${out}/${name}.webp`);
 }
}else console.warn('missing props-sheet.png');

// Researcher actions: six poses found by the empty columns between them (the painter does not keep an exact grid),
// then set on one baseline at one scale in 256x256 cells so the body stays the same size from frame to frame.
if(existsSync(`${src}/researcher-actions.png`)){
 const file=`${src}/researcher-actions.png`,{width,height}=await sharp(file).metadata(),cell=256;
 const whole=await cutout(file,{left:0,top:0,width,height});
 const {data}=await sharp(whole).raw().toBuffer({resolveWithObject:true});
 const filled=Array.from({length:width},(_,x)=>{for(let y=0;y<height;y++)if(data[(y*width+x)*4+3]>0)return true;return false;});
 const runs=[];let start=-1;
 for(let x=0;x<=width;x++){if(x<width&&filled[x]){if(start<0)start=x;}else if(start>=0){if(runs.length&&start-runs.at(-1)[1]<24)runs.at(-1)[1]=x;else runs.push([start,x]);start=-1;}}
 const poses=runs.filter(([a,b])=>b-a>60);
 if(poses.length!==6)throw new Error(`expected 6 poses, found ${poses.length}`);
 const cuts=[];
 for(const [a,b] of poses){const column=await sharp(whole).extract({left:a,top:0,width:b-a,height}).png().toBuffer();cuts.push(await sharp(column).trim({threshold:1}).png().toBuffer({resolveWithObject:true}));}
 const scale=Math.min(...cuts.map(p=>Math.min((cell-8)/p.info.width,(cell-8)/p.info.height)));
 const layers=[];
 for(const [i,p] of cuts.entries()){
  const w=Math.round(p.info.width*scale),h=Math.round(p.info.height*scale);
  layers.push({input:await sharp(p.data).resize(w,h).png().toBuffer(),left:i*cell+Math.round((cell-w)/2),top:cell-4-h});
 }
 await sharp({create:{width:cell*6,height:cell,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers).webp({quality:88,alphaQuality:92}).toFile(`${out}/researcher-actions.webp`);
}else console.warn('missing researcher-actions.png');
console.log('run stage art ready');
