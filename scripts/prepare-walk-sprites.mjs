// Cuts the two 4x3 magenta walk sheets in references/generated/walk into per-frame transparent sprites.
// Rows: down, right, up. Left is the right row mirrored. Every frame shares one canvas and foot baseline.
import sharp from 'sharp';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..'),rows=['down','right','up'],columns=4,sheets=['researcher','companion'];
// Largest on-screen size is about 200px tall, so the sheets do not need their full 320px.
const outputHeight=208;
const isKey=(r,g,b)=>r>120&&b>120&&g<r*.62&&g<b*.62;
async function cutCell(source,left,top,width,height){
 const {data,info}=await source.clone().extract({left,top,width,height}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let minX=width,maxX=-1,minY=height,maxY=-1;
 for(let i=0,p=0;i<data.length;i+=4,p++){
  if(isKey(data[i],data[i+1],data[i+2])){data[i+3]=0;continue;}
  const x=p%width,y=(p/width)|0;if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
 }
 // Trim the JPEG fringe: an opaque pixel touching the key colour loses its pink cast or goes.
 const clear=(x,y)=>x<0||y<0||x>=width||y>=height||data[(y*width+x)*4+3]===0,copy=Buffer.from(data);
 for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
  const i=(y*width+x)*4;if(!data[i+3]||!(clear(x-1,y)||clear(x+1,y)||clear(x,y-1)||clear(x,y+1)))continue;
  if(data[i]>data[i+1]*1.25&&data[i+2]>data[i+1]*1.1)copy[i+3]=0;
 }
 // Centre on the upper body so swinging legs do not shift the sprite sideways.
 let sum=0,count=0;const torso=minY+(maxY-minY)*.55;
 for(let y=minY;y<torso;y++)for(let x=minX;x<=maxX;x++)if(copy[(y*width+x)*4+3]){sum+=x;count++;}
 return {data:copy,info,minX,maxX,minY,maxY,center:count?sum/count:(minX+maxX)/2};
}
const manifest=[];
for(const name of sheets){
 const file=resolve(root,`references/generated/walk/${name}-sheet.png`),source=sharp(await readFile(file)),{width,height}=await source.metadata();
 const cellWidth=Math.floor(width/columns),cellHeight=Math.floor(height/rows.length),cells=[];
 for(let row=0;row<rows.length;row++)for(let column=0;column<columns;column++)cells.push({row,column,...await cutCell(source,column*cellWidth,row*cellHeight,cellWidth,cellHeight)});
 const reachLeft=Math.max(...cells.map(c=>c.center-c.minX)),reachRight=Math.max(...cells.map(c=>c.maxX-c.center)),tall=Math.max(...cells.map(c=>c.maxY-c.minY+1));
 const half=Math.ceil(Math.max(reachLeft,reachRight))+2,canvasWidth=half*2,canvasHeight=tall+4,out=resolve(root,`public/assets/generated/walk/${name}`);
 await mkdir(out,{recursive:true});
 for(const cell of cells){
  const cropped=await sharp(cell.data,{raw:{width:cell.info.width,height:cell.info.height,channels:4}}).extract({left:cell.minX,top:cell.minY,width:cell.maxX-cell.minX+1,height:cell.maxY-cell.minY+1}).png().toBuffer();
  const left=Math.round(half-(cell.center-cell.minX)),top=canvasHeight-2-(cell.maxY-cell.minY+1);
  const frame=await sharp({create:{width:canvasWidth,height:canvasHeight,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:cropped,left,top}]).png().toBuffer();
  const direction=rows[cell.row],index=cell.column+1;
  const save=(image,file)=>image.resize({height:outputHeight,kernel:'lanczos3'}).webp({quality:88,alphaQuality:100,effort:6}).toFile(resolve(out,file));
  await save(sharp(frame),`${direction}-${index}.webp`);
  if(direction==='right')await save(sharp(frame).flop(),`left-${index}.webp`);
 }
 manifest.push({id:name,source:`references/generated/walk/${name}-sheet.png`,width:Math.round(canvasWidth*outputHeight/canvasHeight),height:outputHeight,frames:16});
 console.log(name,{sheet:[width,height],canvas:[canvasWidth,canvasHeight],tall});
}
await writeFile(resolve(root,'public/assets/generated/walk/manifest.json'),JSON.stringify(manifest,null,1)+'\n');
