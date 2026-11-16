import {useId,useRef,useState} from 'react';
import {DesignModel} from './DesignModel';
import {sampleColors,shortNames,parts,type Design,partNames} from '../domain/model';
import '../screens/activity-stages.css';
interface Props {kind:'umbrella'|'box';dropTargets?:boolean;selected:string;onSelect:(part:string)=>void;exploded?:number;design?:Design;effect?:string;reduced?:boolean}
const anchors:Record<string,Record<string,[number,number]>>={umbrella:{canopy:[63,22],frame:[42,53],handle:[61,86]},box:{body:[70,58],lid:[53,29],window:[40,60],handle:[55,16],bumper:[18,78]}};
const umbrellaGlow:Record<string,[number,number,number]>={canopy:[376,92,70],frame:[250,222,52],handle:[366,361,40]};
function UmbrellaModel({selected}:{selected:string}){
 const glow=umbrellaGlow[selected];
 return <svg className="umbrella-study-model" viewBox="0 0 600 420" role="img" aria-label="펼친 우산의 천 아래에 금속 살이 있고 중심 봉 아래에는 나무 손잡이가 연결된 관찰 모형">
  <ellipse cx="330" cy="404" rx="150" ry="12" fill="#385e4c" opacity=".14"/>
  {glow&&<circle className="study-glow" cx={glow[0]} cy={glow[1]} r={glow[2]} fill="#ffe7a1" opacity=".55"/>}
  <image href="/assets/generated/umbrella.webp" x="90" y="0" width="420" height="420" preserveAspectRatio="xMidYMid meet"/>
  {glow&&<circle cx={glow[0]} cy={glow[1]} r={glow[2]} fill="none" stroke="#e0a83a" strokeWidth="5" strokeDasharray="10 8" opacity=".9"/>}
 </svg>;
}
export default function ObjectViewport(props:Props){
 const [zoom,setZoom]=useState(1),[failed,setFailed]=useState(false),[lens,setLens]=useState({x:84,y:65}),[looking,setLooking]=useState(false);const dragging=useRef(false),lensGesture=useRef<{x:number;y:number;moved:boolean}|null>(null);
 const available=props.kind==='umbrella'?['canopy','frame','handle']:props.design?['body','window','bumper']:['body','lid','window','handle','bumper'];
 const selectedName=partNames[props.selected as keyof typeof partNames];
 const scale=Math.min(1.35,zoom+(props.exploded??0)*.2);
 return <div className={`object-area learning-object ${props.kind==='umbrella'?'umbrella-object':'design-object'} ${props.effect?'testing '+props.effect:''}`}>
 <div className="object-study-heading"><span className="canvas-label">{props.kind==='umbrella'?'우산 속 부품을 찾아요':'재료가 바로 바뀌는 설계 모형'}</span>{selectedName&&<span className="object-selected-badge" role="status"><i aria-hidden="true"/>{selectedName} 관찰 중</span>}</div>
 <div className="object-canvas flat-object"><div className="object-scene">
 <div className="object-model-layer" style={{transform:`scale(${scale})`}}>{props.design?<div className="live-design"><DesignModel design={props.design} pressing={props.effect==='impact'}/></div>:props.kind==='umbrella'?<UmbrellaModel selected={props.selected}/>:!failed?<img className="object-art" src="/assets/generated/invention.webp" alt="투명 관찰창과 모서리 보호대가 있는 보관함 기본형" onError={()=>setFailed(true)}/>:<p>물체 그림을 불러오지 못했어요. 아래 부품 이름으로 계속 조사할 수 있어요.</p>}
 </div><div className="object-hotspots">{available.map((p,i)=>{const [x,y]=anchors[props.kind][p];return <button key={p} data-drop-slot={props.dropTargets?p:undefined} className={`object-marker ${props.selected===p?'selected':''}`} aria-label={`${partNames[p as keyof typeof partNames]} 살펴보기`} aria-pressed={props.selected===p} style={{left:`clamp(28px,${50+(x-50)*scale}%,calc(100% - 28px))`,top:`clamp(28px,${50+(y-50)*scale}%,calc(100% - 28px))`,transform:'translate(-50%,-50%)'}} onClick={()=>props.onSelect(p)}><span aria-hidden="true">{i+1}</span></button>;})}</div>
 {props.kind==='umbrella'&&<button className={`inspection-lens ${looking?'looking':''}`} aria-label="돋보기를 끌어 부품 확대 관찰" style={{left:`${lens.x}%`,top:`${lens.y}%`}} onPointerDown={e=>{if(e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);dragging.current=true;lensGesture.current={x:e.clientX,y:e.clientY,moved:false};setLooking(true);}} onPointerMove={e=>{if(!dragging.current)return;const gesture=lensGesture.current;if(gesture&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>6)gesture.moved=true;const r=e.currentTarget.parentElement!.getBoundingClientRect(),x=Math.max(12,Math.min(88,(e.clientX-r.left)/r.width*100)),y=Math.max(14,Math.min(84,(e.clientY-r.top)/r.height*100));setLens({x,y});const nearest=available.slice().sort((a,b)=>Math.hypot(anchors.umbrella[a][0]-x,anchors.umbrella[a][1]-y)-Math.hypot(anchors.umbrella[b][0]-x,anchors.umbrella[b][1]-y))[0];props.onSelect(nearest);}} onPointerUp={()=>{dragging.current=false;setLooking(false);}} onPointerCancel={()=>{dragging.current=false;lensGesture.current=null;setLooking(false);}} onLostPointerCapture={()=>{dragging.current=false;setLooking(false);}} onClick={()=>{const moved=lensGesture.current?.moved;lensGesture.current=null;if(!moved)setZoom(v=>v<1.4?1.4:1);}}><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="13" cy="13" r="9"/><path d="m20 20 8 8M8 13h10M13 8v10"/></svg></button>}
 {props.effect&&props.effect!=='impact'&&<div className={`test-overlay test-effect-${props.effect}`} aria-hidden="true"><svg viewBox="0 0 500 330">{props.effect==='rain'?Array.from({length:16},(_,i)=><path key={i} d={`M${30+i*30} 20l-18 46m-4 18-15 40`} stroke="#2b92bd" strokeWidth="4" strokeLinecap="round"/>):props.effect==='light'?<><path d="M0 110 380 220 0 300Z" fill="#f9dc6c" opacity=".45"/><circle cx="18" cy="205" r="22" fill="#efc144"/></>:<><path d="m400 30-90 110m0-36v36h36" stroke="#d77648" strokeWidth="10" fill="none"/><circle cx="310" cy="145" r="35" stroke="#d77648" strokeWidth="4" fill="none"/></>}</svg></div>}
 </div></div>
 {props.effect&&<p className="object-test-caption" role="status">{props.effect==='rain'?'같은 양의 물로 시험해요':props.effect==='light'?'같은 빛을 비춰요':'같은 조건으로 모서리를 눌러요'}</p>}
 <div className="object-control-deck"><div className="view-controls"><button aria-label="확대" disabled={zoom>=1.4} onClick={()=>setZoom(v=>Math.min(1.4,v+.1))} title="확대">＋</button><button aria-label="축소" disabled={zoom<=.8} onClick={()=>setZoom(v=>Math.max(.8,v-.1))} title="축소">−</button><button aria-label="처음 크기" title="처음 크기" onClick={()=>setZoom(1)}>↺</button></div>
 <div className="part-pills" aria-label="조사할 부품">{available.map((p,i)=><button key={p} aria-pressed={props.selected===p} onClick={()=>props.onSelect(p)}><span aria-hidden="true">{i+1}</span>{partNames[p as keyof typeof partNames]}</button>)}</div></div>
 {props.design&&<div className="material-preview" aria-label="내가 고른 설계 재료">{parts.map(p=><div key={p}><i className={`material-swatch texture-${props.design!.parts[p].sampleId}`} style={{backgroundColor:sampleColors[props.design!.parts[p].sampleId]}}/><span><b>{partNames[p]}</b>{shortNames[props.design!.parts[p].sampleId]}</span></div>)}</div>}
 </div>;
}
