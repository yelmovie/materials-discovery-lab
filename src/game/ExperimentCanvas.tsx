import {useEffect,useRef,useId,type CSSProperties} from 'react';
import Phaser from 'phaser';
import {materials,sampleColors,shortNames,resultFor,type Experiment} from '../domain/model';
import './experiment-stage.css';
export interface ExperimentProps {kind:'samples'|'solid'|'liquid'|'air'|'sand'|'bag';sample?:string;experiment?:Experiment;active?:boolean;moving?:boolean;solid?:number;volumes?:number[];airDown?:boolean;vent?:boolean;showAir?:boolean;inflated?:boolean;onAction?:(i:number)=>void;reduced?:boolean}
export default function ExperimentCanvas(props:ExperimentProps){
 if(props.kind==='samples')return <SampleExperiment {...props}/>;
 if(props.kind==='liquid')return <LiquidExperiment volumes={props.volumes??[1000,0,0]} reduced={props.reduced}/>;
 if(props.kind==='sand')return <SandExperiment/>;
 if(props.kind==='bag')return <BagExperiment inflated={!!props.inflated} reduced={props.reduced}/>;
 return <CanvasExperiment {...props}/>;
}

function SampleExperiment({sample='rubber_soft',experiment='elastic_return',active=false,moving=false,reduced=false}:ExperimentProps){
 const m=materials.find(item=>item.id===sample)??materials[0],uid=useId().replace(/:/g,''),color=sampleColors[m.id];
 const mechanical=experiment==='elastic_return'||experiment==='compression_recovery';
 const state=!active?'ready':moving?'running':'observed';
 const instructions={elastic_return:'양쪽에서 당긴 다음 손을 놓아요.',compression_recovery:'같은 힘으로 누른 다음 손을 떼어요.',light_transmission:'시료 뒤의 표시까지 빛이 가는지 살펴봐요.',water_absorption:'같은 크기의 물방울을 떨어뜨려요.'};
 const width=experiment==='elastic_return'&&moving&&m.cushioning?270:200;
 const height=experiment==='compression_recovery'&&moving&&m.cushioning?38:70;
 const sx=300-width/2,sy=153-height/2;
 return <figure className={`experiment-canvas experiment-stage sample-simulation ${state} ${reduced?'motion-reduced':''}`} data-experiment={experiment} style={{'--sample-color':color} as CSSProperties}>
  <figcaption className="experiment-stage-heading"><span className="experiment-eyebrow">{shortNames[m.id]}</span><strong>{instructions[experiment]}</strong><span className={`experiment-state ${state}`}>{!active?'준비':moving?'시험 중':'관찰'}</span></figcaption>
  <div className="experiment-scene" role="img" aria-label={!active?`${shortNames[m.id]} 시료가 도구 아래에 놓여 있어요.`:moving?'같은 조건으로 시료를 시험하고 있어요.':resultFor(experiment,m.id)}>
   <svg viewBox="0 0 600 260" aria-hidden="true">
    <defs>
     <linearGradient id={`${uid}-sample`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff" stopOpacity=".62"/><stop offset=".4" stopColor={color}/><stop offset="1" stopColor={color}/></linearGradient>
     <linearGradient id={`${uid}-light`}><stop stopColor="#fff2a0" stopOpacity=".9"/><stop offset="1" stopColor="#ffd561" stopOpacity=".2"/></linearGradient>
     <linearGradient id={`${uid}-shadow`}><stop stopColor="#283f43" stopOpacity=".22"/><stop offset="1" stopColor="#283f43" stopOpacity="0"/></linearGradient>
     <clipPath id={`${uid}-clip`}><rect x={sx} y={sy} width={width} height={height} rx="10"/></clipPath>
    </defs>
    <ellipse cx="300" cy="218" rx="214" ry="13" fill="#7c927d" opacity=".12"/>
    <path d="M54 218H546" stroke="#a9bbac" strokeWidth="2"/>
    {mechanical&&<rect x="200" y="118" width="200" height="70" rx="10" fill="none" stroke="#718d81" strokeWidth="2" strokeDasharray="6 6"/>}
    {experiment==='light_transmission'&&<>
     <path d="M72 130V178L108 167V141Z" fill="#5b7d76" stroke="#355d55" strokeWidth="3"/><rect x="43" y="137" width="31" height="34" rx="8" fill="#74978b"/>
     {active&&<><path d="M108 141 210 102V204L108 167Z" fill={`url(#${uid}-light)`}/>{m.transparent?<path d="M390 102 520 78V228L390 204Z" fill={`url(#${uid}-light)`}/>:<path d="M402 118 520 105V203L402 188Z" fill={`url(#${uid}-shadow)`}/>}</>}
     <rect x="510" y="73" width="50" height="137" rx="9" fill={active&&m.transparent?'#fff8cc':'#e3e8df'} stroke="#91a69a" strokeWidth="3"/>
     <path d="m535 129 6 15 15 1-12 10 4 16-13-9-13 9 4-16-12-10 15-1Z" fill={active&&m.transparent?'#ce9c33':'#a5b3a6'} opacity={active&&!m.transparent?.28:1}/>
    </>}
    <g className="sim-sample">
     <rect x={sx} y={sy} width={width} height={height} rx="10" fill={`url(#${uid}-sample)`} opacity={m.transparent?.68:1} stroke="#647d77" strokeWidth="3"/>
     {m.id==='wood_raw'&&<image className="sample-material-art" href={`${import.meta.env.BASE_URL}assets/generated/wood-sample.webp`} x={sx} y={sy} width={width} height={height} preserveAspectRatio="none" clipPath={`url(#${uid}-clip)`}/>}
     <g clipPath={`url(#${uid}-clip)`} opacity=".35" stroke="#fff" strokeWidth="3">
      {m.id==='wood_raw'?null:m.transparent?<><path d="m211 185 66-67M239 185l66-67" strokeWidth="9"/></>:<path d={`M${sx+10} ${sy+9}h${width-20}`} strokeWidth="4"/>}
     </g>
     {experiment==='water_absorption'&&active&&<>
      {m.waterResistant?<><path d="M300 120c-14 17-18 26 0 26s14-9 0-26Z" fill="#62badd" stroke="#318ab6" strokeWidth="2"/><path d="m294 135 3-5" stroke="white" strokeWidth="3"/></>:<><ellipse cx="300" cy="141" rx="42" ry="16" fill="#695d46" opacity=".54"/><ellipse cx="300" cy="141" rx="56" ry="21" fill="none" stroke="#6c7560" strokeWidth="2" strokeDasharray="4 5"/></>}
     </>}
    </g>
    {experiment==='water_absorption'&&<><path d="M293 42h14v31l-7 12-7-12Z" fill="#e9f3ec" stroke="#74988c" strokeWidth="2"/><path d="M289 37h22" stroke="#74988c" strokeWidth="5"/>{!active&&<path d="M300 94c-8 10-10 15 0 15s8-5 0-15Z" fill="#6bb9da"/>}</>}
    {experiment==='compression_recovery'&&<g className="sim-pressure-tool" transform={`translate(0 ${moving?sy-80:0})`}><rect x="271" y="34" width="58" height="43" rx="6" fill="#adc0ba" stroke="#59786b" strokeWidth="3"/><path d="M257 80h86" stroke="#59786b" strokeWidth="7" strokeLinecap="round"/>{moving&&<path d="M300 5v15m-8-8 8 8 8-8" fill="none" stroke="#3d7b66" strokeWidth="4"/>}</g>}
    {experiment==='elastic_return'&&moving&&<g fill="#4d8271"><path d="M145 141h-36v-10l-22 16 22 16v-10h36Z"/><path d="M455 141h36v-10l22 16-22 16v-10h-36Z"/></g>}
   </svg>
   {experiment==='light_transmission'&&<div className="experiment-position-labels" aria-hidden="true"><span>손전등</span><span>시료</span><span>뒤쪽 표시</span></div>}
   {mechanical&&<div className="experiment-outline-key"><i aria-hidden="true"/>점선은 시험 전 시료의 윤곽이에요.</div>}
  </div>

 </figure>;
}

function LiquidExperiment({volumes,reduced}:{volumes:number[];reduced?:boolean}){
 const uid=useId().replace(/:/g,''),widths=[77,110,66],heights=[133,94,157],capacities=[1400,1600,1200];
 return <figure className={`experiment-canvas experiment-stage liquid-simulation ${reduced?'motion-reduced':''}`}>
  <figcaption className="experiment-stage-heading"><span className="experiment-eyebrow">물을 옮겨 비교하기</span><strong>물높이와 용기에 담긴 모양을 살펴봐요.</strong></figcaption>
  <div className="liquid-vessels" role="img" aria-label={`처음 컵 ${Math.round(volumes[0]/10)}%, 넓은 용기 ${Math.round(volumes[1]/10)}%, 길쭉한 용기 ${Math.round(volumes[2]/10)}%. 흘리지 않아 물의 총량은 같아요.`}>
   {['처음 컵','넓은 용기','길쭉한 용기'].map((name,i)=>{
    const w=widths[i],h=heights[i],left=80-w/2,top=180-h,waterH=Math.max(0,Math.min(volumes[i]??0,capacities[i]))/capacities[i]*h,waterY=180-waterH,baseline=180-1000/capacities[0]*heights[0];
    return <div className={`liquid-vessel ${volumes[i]>0?'has-water':''}`} key={name}>
     <svg viewBox="0 0 160 204" aria-hidden="true"><defs><linearGradient id={`${uid}-glass-${i}`}><stop stopColor="#def1ed" stopOpacity=".8"/><stop offset=".5" stopColor="#fbfffc" stopOpacity=".3"/><stop offset="1" stopColor="#c2dedc" stopOpacity=".7"/></linearGradient><linearGradient id={`${uid}-water-${i}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#82d9e9"/><stop offset="1" stopColor="#3ba7c7"/></linearGradient></defs>
      <ellipse cx="80" cy="188" rx={w/2+12} ry="7" fill="#597c70" opacity=".12"/>
      <path d={`M${left} ${top}v${h-4}q0 4 4 4h${w-8}q4 0 4-4V${top}`} fill={`url(#${uid}-glass-${i})`} stroke="#668f8b" strokeWidth="3"/>
      <rect className="liquid-fill" x={left+3} y={waterY} width={w-6} height={waterH} rx="2" fill={`url(#${uid}-water-${i})`} opacity=".88"/>
      {waterH>0&&<ellipse className="liquid-surface" cx="80" cy={waterY} rx={w/2-3} ry="3" fill="#a6e7ee" stroke="#3b9fb8" strokeWidth="1.5"/>}
      {[1,2,3,4].map(tick=><path key={tick} d={`M${left+3} ${180-h*tick/5}h9`} stroke="#668f8b" opacity=".5" strokeWidth="1.5"/>)}
      <path d={`M${left+9} ${top+12}v${h-23}`} stroke="white" opacity=".7" strokeWidth="4" strokeLinecap="round"/>
      <path d={`M${left-2} ${top}h${w+4}`} stroke="#668f8b" strokeWidth="4" strokeLinecap="round"/>
      {i===0&&<path d={`M${left-8} ${baseline}h${w+16}`} stroke="#bc8445" strokeWidth="2.5" strokeDasharray="5 4"/>}
     </svg>
     <span className="liquid-vessel-name">{name}</span>
    </div>;
   })}
  </div>
  <p className="experiment-outline-key liquid-reference"><i aria-hidden="true"/>갈색 점선은 처음 컵에 담겼던 물높이예요.</p>
 </figure>;
}

function SandExperiment(){
 const uid=useId().replace(/:/g,''),sandAsset=`${import.meta.env.BASE_URL}assets/generated/sand-observation.webp`;
 return <figure className="experiment-canvas experiment-stage sand-simulation"><figcaption className="experiment-stage-heading"><span className="experiment-eyebrow">알갱이 확대 관찰</span><strong>더미와 알갱이 하나를 구분해 봐요.</strong></figcaption><div className="sand-comparison" role="img" aria-label="모래 더미는 작은 고체 알갱이로 이루어져 있어요. 더미의 모습은 달라져도 알갱이 각각은 모양을 유지해요."><div className="sand-view"><img className="sand-observation-art" src={sandAsset} alt="" draggable={false}/><span>모래 더미</span></div><span className="sand-zoom-arrow" aria-hidden="true">→</span><div className="sand-view sand-magnified"><svg viewBox="0 0 240 190" aria-hidden="true"><defs><clipPath id={`${uid}-sand-lens`}><circle cx="113" cy="86" r="66"/></clipPath></defs><circle cx="113" cy="86" r="70" fill="#f6f5ee" stroke="#658c7b" strokeWidth="7"/><g clipPath={`url(#${uid}-sand-lens)`}><image href={sandAsset} x="-410" y="-310" width="1080" height="540" preserveAspectRatio="xMidYMid meet"/></g><path d="m164 137 45 43" stroke="#658c7b" strokeWidth="16" strokeLinecap="round"/></svg><span>모양을 유지하는 알갱이</span></div></div></figure>;
}

function BagExperiment({inflated,reduced}:{inflated:boolean;reduced?:boolean}){
 const uid=useId().replace(/:/g,'');
 return <figure className={`experiment-canvas experiment-stage bag-simulation ${reduced?'motion-reduced':''}`}>
  <figcaption className="experiment-stage-heading"><span className="experiment-eyebrow">공기가 차지하는 공간</span><strong>{inflated?'공기가 들어가 주머니가 부풀었어요.':'펌프로 주머니에 공기를 넣어 봐요.'}</strong></figcaption>
  <div className="experiment-scene" role="img" aria-label={inflated?'펌프에서 나온 공기가 주머니 안을 채워 주머니가 크게 부풀었어요.':'펌프와 연결된 주머니가 납작해요.'}>
   <svg viewBox="0 0 600 260" aria-hidden="true"><defs><linearGradient id={`${uid}-bag`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff3d3"/><stop offset=".45" stopColor="#e9bd7f"/><stop offset="1" stopColor="#c49059"/></linearGradient></defs>
    <ellipse cx="322" cy="231" rx="204" ry="13" fill="#758a72" opacity=".13"/>
    <path d="M103 180v19q0 19 30 19h52q23 0 39-31" fill="none" stroke="#648b7c" strokeWidth="12"/>
    <path d="M89 109h34v105H89Z" fill="#a4bdb0" stroke="#537e6c" strokeWidth="4"/>
    <path d="M105 43v65" stroke="#537e6c" strokeWidth="9"/><path d="M70 41h72" stroke="#537e6c" strokeWidth="12" strokeLinecap="round"/>
    <path d={inflated?'M225 174C217 94 283 39 372 45C470 52 520 140 475 191C438 233 278 239 225 190Z':'M225 180C256 169 446 170 476 188C447 211 266 210 225 194Z'} fill={`url(#${uid}-bag)`} stroke="#a17748" strokeWidth="4"/>
    <path d={inflated?'M268 109q32-43 96-40':'M268 183q74-9 155 4'} fill="none" stroke="#fff8dd" strokeWidth="8" opacity=".7" strokeLinecap="round"/>
    <path d="M219 171v31" stroke="#826c42" strokeWidth="7"/>
    {inflated&&<g fill="#5d8a79"><path d="M148 151h38v-9l18 15-18 15v-9h-38Z"/><circle cx="278" cy="161" r="5"/><circle cx="360" cy="103" r="5"/><circle cx="425" cy="171" r="5"/></g>}
   </svg>
  </div>
 </figure>;
}

function CanvasExperiment(props:ExperimentProps){const host=useRef<HTMLDivElement>(null),live=useRef(props);live.current=props;
 useEffect(()=>{if(!host.current)return;
 class ExperimentScene extends Phaser.Scene {
  g!:Phaser.GameObjects.Graphics;labels:Phaser.GameObjects.Text[]=[];signature='';lastDown=!!live.current.airDown;lastVent=false;lastInflated=false;downTime=-10000;ventTime=-10000;bagTime=-10000;
  create(){this.g=this.add.graphics();if(live.current.kind==='solid'){for(let i=0;i<3;i++)this.add.zone(110+i*200,220,155,225).setInteractive({useHandCursor:true}).on('pointerdown',()=>live.current.onAction?.(i));}else if(live.current.kind==='air')this.add.zone(315,190,220,260).setInteractive({useHandCursor:true}).on('pointerdown',()=>live.current.onAction?.(0));}
  label(x:number,y:number,text:string,color='#39556a',size=24){this.labels.push(this.add.text(x,y,text,{fontFamily:'Malgun Gothic, sans-serif',fontSize:`${Math.max(size,22)}px`,wordWrap:{width:Math.max(100,Math.min(580,2*Math.min(x,630-x)-10)),useAdvancedWrap:true},color,align:'center'}).setOrigin(.5,0));}
  update(time:number){const p=live.current,g=this.g;if(!g)return;
   if(!!p.airDown!==this.lastDown){this.lastDown=!!p.airDown;this.downTime=time;}if(!!p.vent!==this.lastVent){this.lastVent=!!p.vent;this.ventTime=time;}if(!!p.inflated!==this.lastInflated){this.lastInflated=!!p.inflated;this.bagTime=time;}
   const downProgress=p.reduced?1:Math.min(1,(time-this.downTime)/900),ventProgress=p.reduced?1:Math.min(1,(time-this.ventTime)/900),bagProgress=p.reduced?1:Math.min(1,(time-this.bagTime)/650);
   const animating=!!p.moving||downProgress<1||ventProgress<1||bagProgress<1;const signature=JSON.stringify(p)+(animating?Math.floor(time/33):'');if(signature===this.signature)return;this.signature=signature;
   g.clear();this.labels.forEach(l=>l.destroy());this.labels=[];
   g.fillStyle(0xe1e9df,.7).fillEllipse(315,345,560,30);
   if(p.kind==='solid'){
    const widths=[115,165,100],heights=[185,130,220];
    for(let i=0;i<3;i++){
     const x=110+i*200,w=widths[i],h=heights[i],top=325-h;
     g.fillStyle(0xe7f3ef,.8).fillRect(x-w/2,top,w,h);
     g.lineStyle(4,0x71949e);g.beginPath();g.moveTo(x-w/2,top);g.lineTo(x-w/2,325);g.lineTo(x+w/2,325);g.lineTo(x+w/2,top);g.strokePath();this.label(x,355,['처음 컵','넓은 용기','길쭉한 용기'][i]);
     if(p.solid===i){g.lineStyle(2,0x8a9994,.7).strokeRect(x-28,254,56,62);g.fillStyle(0xce9258).fillRect(x-27,260,54,60);g.fillStyle(0xe3b77c).fillTriangle(x-27,260,x-12,244,x+42,244).fillTriangle(x-27,260,x+42,244,x+27,260);g.fillStyle(0x986e45).fillTriangle(x+27,260,x+42,244,x+42,304).fillTriangle(x+27,260,x+42,304,x+27,320);}
    }
    this.label(315,20,'같은 나무토막 · 모양과 크기를 비교해 봐');
   }else if(p.kind==='air'){
    g.fillStyle(0xdbeaf0).fillRoundedRect(95,55,440,285,15);g.fillStyle(0x78bfda,.78).fillRect(100,135,430,200);g.lineStyle(4,0x6d9baa).strokeRoundedRect(95,55,440,285,15);
    const top=p.airDown?15+150*downProgress:15,bottom=top+135;g.fillStyle(p.showAir?0xffe2a0:0xf4f8ec,.9).fillRect(250,top,130,135);
    if(p.airDown){const water=p.vent?17+103*ventProgress:17*downProgress;g.fillStyle(0x79c3df,.9).fillRect(253,bottom-water,124,water);}
    g.lineStyle(5,0x6c8795);g.beginPath();g.moveTo(250,bottom);g.lineTo(250,top);g.lineTo(380,top);g.lineTo(380,bottom);g.strokePath();g.fillStyle(p.vent&&ventProgress>.8?0x8ac4d2:0xfffef4).fillRect(286,top+13,58,25);g.lineStyle(2,0x9ca49b).strokeRect(286,top+13,58,25);
    if(p.vent&&ventProgress<1){g.lineStyle(2,0xeafcff);for(let i=0;i<5;i++){const y=155-((time/20+i*19)%75);g.strokeCircle(315+Math.sin(i)*9,y,5+i%3);}}else if(!p.vent){g.fillStyle(0xbb8762).fillRect(303,top-5,24,8);}
    this.label(315,355,p.vent?'공기 배출구 열림 · 물이 더 들어왔어':p.airDown?'공기 배출구 닫힘 · 공기 공간이 남아 있어':'컵 입구가 아래를 향하게 넣어 봐');
    if(p.showAir)this.label(470,75,'노란색은\n공기 위치 표시', '#826b40',16);
   }else{const bw=p.inflated?180+110*bagProgress:180,bh=p.inflated?35+145*bagProgress:35;g.fillStyle(0xe8b277,.8).fillEllipse(315,240,bw,bh);g.lineStyle(4,0xa17c5d).strokeEllipse(315,240,bw,bh);g.lineStyle(8,0x778d8c).lineBetween(180,240,80,290);g.fillStyle(0x779395).fillRect(40,270,50,55);this.label(315,75,p.inflated?'공기가 들어가 주머니가 부풀었어':'펌프로 주머니에 공기를 넣어 봐');}
  }
 }
 const game=new Phaser.Game({type:Phaser.CANVAS,canvas:document.createElement('canvas'),parent:host.current,width:630,height:410,transparent:true,scene:ExperimentScene,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},banner:false,audio:{noAudio:true}});return()=>game.destroy(true);
 },[props.kind]);
 return <div ref={host} className="experiment-canvas" role="img" aria-label={`${{samples:'시료 반응',solid:'세 용기와 같은 크기의 고체',liquid:'세 용기 사이 액체 이동',air:'뒤집힌 컵과 공기 공간',sand:'모래 더미와 알갱이 확대',bag:'공기 주머니'}[props.kind]} 실험. 아래 버튼으로 조작할 수 있어.`}/>;
}

