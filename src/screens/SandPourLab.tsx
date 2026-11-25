import {useLayoutEffect,useRef} from 'react';
import '../game/experiment-stage.css';

const sandTexture='/assets/generated/sand-quartz.webp';
const glassUrl='/assets/generated/lab-glass.webp';
const bench=262;
const vessels=[
 {name:'처음 컵',width:72,height:127,fill:76},
 {name:'넓은 용기',width:100,height:91,fill:43},
 {name:'길쭉한 용기',width:63,height:145,fill:98},
];
const fallStart=640;
const fallEnd=2040;
export const sandPourDuration=(reduced:boolean)=>reduced?420:2630;
const clamp=(value:number)=>Math.max(0,Math.min(1,value));
const ease=(value:number)=>{const t=clamp(value);return t*t*(3-2*t);};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;

export function sandPoured(elapsed:number,reduced:boolean){
 const progress=reduced?clamp(elapsed/sandPourDuration(true)):clamp((elapsed-fallStart-100)/(fallEnd-fallStart+140));
 return Math.round(1000*mix(progress,ease(progress),.48));
}

type LabFrame={volumes:number[];step:number;from:number;to:number;elapsed:number;moving:boolean;reduced:boolean};
type Point={x:number;y:number};
type Vessel=typeof vessels[number]&{x:number;top:number};
type Art={glass:HTMLImageElement;texture:CanvasPattern|null};

function heapSurface(cup:Vessel,amount:number,offset:number){
 const fill=amount/1000;
 const maxHalf=cup.width/2-3;
 const half=Math.min(maxHalf,maxHalf*Math.sqrt(fill)*1.95);
 const body=cup.fill*fill*maxHalf/Math.max(half,1);
 const ridge=Math.min(half*.48,body*1.6);
 const edge=bench-body+ridge*.45;
 const center=cup.x+offset*Math.min(half*.26,7);
 return {half,edge,center,crest:edge-ridge};
}

function drawHeap(ctx:CanvasRenderingContext2D,cup:Vessel,amount:number,offset:number,texture:CanvasPattern|null){
 ctx.save();
 ctx.beginPath();
 ctx.roundRect(cup.x-cup.width/2+2,cup.top+2,cup.width-4,cup.height+2,4);
 ctx.clip();
 const {half,edge,center,crest}=heapSurface(cup,amount,offset);
 const left=cup.x-half,right=cup.x+half;
 ctx.beginPath();
 ctx.moveTo(left,bench+2);
 ctx.lineTo(left,edge);
 ctx.bezierCurveTo(mix(left,center,.42),mix(edge,crest,.24),center-half*.25,crest-1,center,crest);
 ctx.bezierCurveTo(center+half*.26,crest+.4,mix(center,right,.58),mix(crest,edge,.77),right,edge+.8);
 ctx.lineTo(right,bench+2);
 ctx.closePath();
 ctx.fillStyle=texture??'#cfa460';
 ctx.fill();
 const shade=ctx.createLinearGradient(0,crest,0,bench+4);
 shade.addColorStop(0,'#fff4cc24');
 shade.addColorStop(.24,'#8f5b2812');
 shade.addColorStop(1,'#62391660');
 ctx.fillStyle=shade;
 ctx.fill();
 ctx.restore();
}

// The sand surface rotates toward gravity as the glass tips. Solve for the
// intercept that holds the same projected area inside the glass.
function tippedSand(ctx:CanvasRenderingContext2D,cup:Vessel,amount:number,angle:number,texture:CanvasPattern|null){
 const left=cup.x-cup.width/2+2,right=cup.x+cup.width/2-2,top=cup.top+2,bottom=bench+1;
 const vertices=[{x:left,y:top},{x:right,y:top},{x:right,y:bottom},{x:left,y:bottom}];
 const normal=angle*ease(Math.abs(angle)/1.5);
 const distances=vertices.map(p=>(p.x-cup.x)*Math.sin(normal)+(p.y-top)*Math.cos(normal));
 const clipped=(limit:number)=>{
  const points:Point[]=[];
  vertices.forEach((p,i)=>{
   const j=(i+1)%vertices.length,q=vertices[j],a=distances[i]-limit,b=distances[j]-limit;
   if(a>=0)points.push(p);
   if((a>=0)!==(b>=0))points.push({x:mix(p.x,q.x,a/(a-b)),y:mix(p.y,q.y,a/(a-b))});
  });
  return points;
 };
 let low=Math.min(...distances),high=Math.max(...distances);
 if(Math.abs(angle)<.13){
  drawHeap(ctx,cup,amount,Math.sign(angle),texture);
  return;
 }
 for(let i=0;i<12;i++){
  const limit=(low+high)/2,points=clipped(limit);
  const area=points.reduce((sum,p,j)=>{const q=points[(j+1)%points.length];return sum+p.x*q.y-q.x*p.y;},0)/2;
  if(area>(right-left)*cup.fill*amount/1000)low=limit;
  else high=limit;
 }
 const outline=clipped((low+high)/2);
 ctx.beginPath();
 outline.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
 ctx.closePath();
 ctx.fillStyle=texture??'#cfa460';
 ctx.fill();
 ctx.fillStyle='#814e281e';
 ctx.fill();
}

function drawGlass(ctx:CanvasRenderingContext2D,cup:Vessel,image:HTMLImageElement|null){
 const left=cup.x-cup.width/2;
 if(image?.naturalWidth){
  ctx.drawImage(image,left-4,cup.top-6,cup.width+8,cup.height+15);
  return;
 }
 ctx.beginPath();
 ctx.roundRect(left,cup.top,cup.width,cup.height,5);
 ctx.strokeStyle='#739a96';
 ctx.lineWidth=2;
 ctx.stroke();
 ctx.beginPath();
 ctx.ellipse(cup.x,cup.top,cup.width/2,5,0,0,Math.PI*2);
 ctx.stroke();
}

const grainColors=['#f4d698','#d8ae6b','#e8c584','#bb8b4a','#a57745','#f9e3b1'];
// Deterministic grain sizes and phases keep the stream continuous across frames and pauses.
const grains=Array.from({length:240},(_,i)=>{
 const sample=(offset:number)=>{const value=Math.sin(i*36.792+offset*22.713)*41915.713;return value-Math.floor(value);};
 return {phase:sample(1),drift:sample(2)*2-1,size:.38+sample(3)*.87,
  color:grainColors[Math.floor(sample(4)*grainColors.length)],flight:.85+sample(5)*.3};
});

function drawStream(ctx:CanvasRenderingContext2D,spout:Point,landing:Point,elapsed:number,cup:Vessel,spread:number){
 if(elapsed<fallStart||elapsed>fallEnd+340)return;
 const height=landing.y-spout.y;
 const fallTime=Math.sqrt(height)*24;
 const mouthFlow=ease((elapsed-fallStart)/160)*(1-.8*ease((elapsed-fallEnd+200)/210));
 const period=340;
 const lean=Math.sign(landing.x-spout.x);
 for(const grain of grains){
  const age=((elapsed-fallStart)+grain.phase*period)%period;
  const released=elapsed-age;
  if(released<fallStart||released>fallEnd)continue;
  const t=age/(fallTime*grain.flight);
  const scatter=grain.drift*(1.2+Math.min(t,1)*3.6);
  let x=mix(spout.x,landing.x,Math.min(t,1))+scatter;
  let y=spout.y+height*(.17*t+.83*t*t);
  let opacity=.58+.42*mouthFlow;
  if(t>1){
   const rebound=(t-1)*2.6;
   if(rebound>1||grain.phase>.45)continue;
   x=landing.x+grain.drift*(4+spread*.75*rebound)+lean*rebound;
   if(Math.abs(x-cup.x)>cup.width/2-3)continue;
   y=landing.y+rebound*spread*.29-Math.sin(rebound*Math.PI)*2.6;
   opacity*=1-rebound;
  }
  ctx.globalAlpha=opacity;
  ctx.fillStyle=grain.color;
  ctx.beginPath();
  ctx.ellipse(x,y,grain.size,grain.size*(t<1?1.22:.74),grain.drift,0,Math.PI*2);
  ctx.fill();
 }
 ctx.globalAlpha=1;
}

function paint(ctx:CanvasRenderingContext2D,frame:LabFrame,art:Art){
 const {canvas}=ctx,{volumes,from,to,elapsed,reduced}=frame;
 const scale=Math.min(canvas.width/385,canvas.height/281);
 if(!scale)return;
 const width=canvas.width/scale;
 ctx.resetTransform();
 ctx.clearRect(0,0,canvas.width,canvas.height);
 ctx.setTransform(scale,0,0,scale,0,canvas.height-281*scale);
 const cups=vessels.map((v,i)=>({...v,x:width*(i+.5)/3,top:bench-v.height}));
 const source=cups[from],target=cups[to],direction=Math.sign(target.x-source.x);
 const lifted=reduced?0:ease(elapsed/fallStart)*(1-ease((elapsed-2280)/350));
 const angle=direction*lifted*1.64;
 const lip={x:source.x+direction*(source.width/2-2),y:source.top};
 const overRim=Math.max(target.top-19,source.width+9);
 const spout={
  x:mix(lip.x,target.x-direction*11,lifted),
  y:mix(lip.y,overRim,lifted)-Math.sin(Math.PI*lifted)*23,
 };
 const receiveOffset=reduced?0:-direction*ease((elapsed-fallStart)/450)*(1-ease((elapsed-2180)/450));
 const surface=heapSurface(target,volumes[to],receiveOffset);
 const landing={x:surface.center,y:surface.crest};
 cups.forEach((cup,i)=>{
  ctx.fillStyle=i===from?`rgba(91,71,44,${.18-lifted*.1})`:'#5b472c2e';
  ctx.beginPath();
  ctx.ellipse(cup.x,bench+13,cup.width*.60,5.4,0,0,Math.PI*2);
  ctx.fill();
  if(i===from&&lifted>0)return;
  if(volumes[i]>0)drawHeap(ctx,cup,volumes[i],i===to?receiveOffset:0,art.texture);
 });
 if(!reduced)drawStream(ctx,spout,landing,elapsed,target,surface.half);
 cups.forEach((cup,i)=>{
  if(i!==from||lifted===0)drawGlass(ctx,cup,art.glass);
 });
 if(lifted>0){
  ctx.save();
  ctx.translate(spout.x,spout.y);
  ctx.rotate(angle);
  ctx.translate(-lip.x,-lip.y);
  if(volumes[from]>0)tippedSand(ctx,source,volumes[from],angle,art.texture);
  drawGlass(ctx,source,art.glass);
  ctx.restore();
 }
}

export function SandPourLab(frame:LabFrame){
 const {volumes,step,moving}=frame;
 const canvas=useRef<HTMLCanvasElement>(null),redraw=useRef<()=>void>(()=>{});
 const current=useRef(frame);
 useLayoutEffect(()=>{
  current.current=frame;
  redraw.current();
 },[frame]);
 useLayoutEffect(()=>{
  const node=canvas.current,ctx=node?.getContext('2d');
  if(!node||!ctx)return;
  const glass=new Image(),texture=new Image();
  const art:Art={glass,texture:null};
  const draw=()=>paint(ctx,current.current,art);
  redraw.current=draw;
  glass.onload=draw;
  texture.onload=()=>{
   art.texture=ctx.createPattern(texture,'repeat');
   art.texture?.setTransform(new DOMMatrix().scale(.37));
   draw();
  };
  glass.src=glassUrl;
  texture.src=sandTexture;
  const observer=new ResizeObserver(()=>{
   const ratio=Math.min(window.devicePixelRatio||1,2);
   node.width=Math.round(node.clientWidth*ratio);
   node.height=Math.round(node.clientHeight*ratio);
   draw();
  });
  observer.observe(node);
  return ()=>{
   observer.disconnect();
   glass.onload=texture.onload=null;
   redraw.current=()=>{};
  };
 },[]);
 return <figure className="experiment-canvas experiment-stage liquid-simulation sand-pour-simulation" data-sand-step={step} data-sand-moving={moving}>
  <figcaption className="experiment-stage-heading"><span className="experiment-eyebrow">모래를 옮겨 비교하기</span><strong>용기마다 모래가 어떻게 쌓이는지 살펴봐요.</strong></figcaption>
  <div className="sand-vessels" role="img" aria-label={vessels.map(({name},i)=>volumes[i]>0?`${name}에 모래가 있어요`:`${name}은 비었어요`).join('. ')}>
   <canvas className="sand-scene" ref={canvas} aria-hidden="true"/>
   <div className="sand-vessel-labels" aria-hidden="true">
    {vessels.map(({name},i)=><span className="liquid-vessel-name" key={name} data-sand-vessel={i} data-sand-amount={volumes[i]}>{name}</span>)}
   </div>
  </div>
  <p className="experiment-outline-key">모래알이 떨어지면서 쌓이는 모습을 봐요.</p>
 </figure>;
}
