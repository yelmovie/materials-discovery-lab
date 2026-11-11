import {useRef,useState} from 'react';
import {playSound} from '../services/audio';
import './matter-lab.css';

export function SolidLab({container,visited,enabled,onMove}:{container:number;visited:number[];enabled:boolean;onMove:(i:number)=>void}){
 const [drag,setDrag]=useState<{x:number;y:number}|null>(null),board=useRef<HTMLDivElement>(null),active=useRef(false);
 function locate(e:React.PointerEvent){const b=board.current!.getBoundingClientRect();return {x:Math.max(5,Math.min(95,(e.clientX-b.left)/b.width*100)),y:Math.max(5,Math.min(90,(e.clientY-b.top)/b.height*100))};}
 const x=drag?.x??(container<0?12:20+30*container),y=drag?.y??(container<0?19:66);
 return <div className="matter-lab solid-lab">
  <p className="lab-instruction">{enabled?'토막을 옮겨 비교해요. 용기를 눌러도 돼요.':'먼저 예상한 뒤 토막을 옮겨요.'}</p>
  <div className="matter-scene solid-scene" ref={board}>
   <div className="vessel-row">{['처음 컵','넓은 용기','길쭉한 용기'].map((name,i)=><button key={name} className={`lab-vessel vessel-${i} ${visited.includes(i)?'visited':''} ${container===i?'is-current':''}`} disabled={!enabled} aria-label={`${name}에 나무토막 옮기기`} aria-pressed={container===i} onClick={()=>{onMove(i);playSound('drop');}}><span className="vessel-outline"><span className="vessel-rim"/><img className="vessel-art" src={`${import.meta.env.BASE_URL}assets/generated/lab-glass.webp`} alt="" draggable={false}/></span><span className="vessel-label">{name} {visited.includes(i)?'✓':''}<small>{container===i?'지금 위치':visited.includes(i)?'관찰 완료':'옮겨 보기'}</small></span>{visited.includes(i)&&container!==i&&<span className="block-outline" aria-hidden="true"/>}</button>)}</div>
   <button className={`wood-block ${drag?'is-dragging':''}`} disabled={!enabled} aria-label="나무토막: 끌어서 용기로 옮기기" style={{left:`${x}%`,top:drag?`${y}%`:container<0?'max(22px, 18%)':'calc(100% - var(--vessel-label-space, 36px) - var(--wood-size, 66px) / 2)'}} onPointerDown={e=>{if(e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);active.current=true;setDrag(locate(e));}} onPointerMove={e=>{if(active.current)setDrag(locate(e));}} onPointerUp={e=>{if(!active.current)return;active.current=false;const point=locate(e);setDrag(null);if(point.y>25){onMove(Math.max(0,Math.min(2,Math.round((point.x-20)/30))));playSound('drop');}}} onPointerCancel={()=>{active.current=false;setDrag(null);}} onLostPointerCapture={()=>{active.current=false;setDrag(null);}}><svg viewBox="0 0 70 70" aria-hidden="true"><defs><linearGradient id="wood-face" x2="1" y2="1"><stop stopColor="#e2b57c"/><stop offset="1" stopColor="#bd824a"/></linearGradient></defs><path d="m5 15 13-10h47v48L53 65H5Z" fill="url(#wood-face)" stroke="#95673e" strokeWidth="2"/><path d="m5 15 48 0L65 5M53 15v50" stroke="#93663c" strokeWidth="2" fill="none"/><path d="M12 26c11-6 18 7 34 0M12 37c9-5 22 7 34 0M12 49c14-6 21 6 34-1" stroke="#a37140" strokeWidth="2" fill="none"/></svg><img className="wood-block-art" src={`${import.meta.env.BASE_URL}assets/generated/wood-block.webp`} alt="" draggable={false}/></button>
  </div>
  <div className="lab-metric"><b>점선과 토막을 비교해요</b><span>모양과 크기를 살펴봐요.</span></div>
 </div>;
}

export function AirLab({down,vent,show,enabled,onLower,onVent}:{down:boolean;vent:boolean;show:boolean;enabled:boolean;onLower:()=>void;onVent?:()=>void}){
 const [depth,setDepth]=useState<number|null>(null),start=useRef<{y:number;top:number}|null>(null);
 const top=depth??(down||onVent?54:0);
 return <div className={`matter-lab air-lab ${show?'air-highlight':''}`}>
  <p className="lab-instruction">{onVent?vent?'물과 휴지가 어떻게 달라졌나요?':'배출구를 열어 비교해요.':down?'휴지와 공기 공간을 관찰해요.':enabled?'컵을 끌거나 눌러 물속에 넣어요.':'먼저 마른 휴지를 확인해요.'}</p>
  <div className="matter-scene air-scene">
  <div className="water-tank"><div className="tank-water"/><span className="water-line">물 표면</span></div>
  <div className={`air-cup ${down?'submerged':''} ${vent?'vented':''} ${show?'show-air':''}`} style={{top:`min(${top}%, max(0px, calc(100% - 48px)))`}}>
   <img className="air-cup-art" src={`${import.meta.env.BASE_URL}assets/generated/lab-glass.webp`} alt="" draggable={false}/><button className="cup-drag-handle" aria-label="컵을 아래로 끌어 물속에 넣기" disabled={!enabled||!!onVent} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);start.current={y:e.clientY,top};}} onPointerMove={e=>{if(start.current){const h=e.currentTarget.closest('.air-scene')!.getBoundingClientRect().height;setDepth(Math.max(0,Math.min(54,start.current.top+(e.clientY-start.current.y)/h*100)));}}} onPointerUp={()=>{if(!start.current)return;start.current=null;if((depth??top)>25){onLower();playSound('air');}setDepth(null);}} onPointerCancel={()=>{start.current=null;setDepth(null);}} onLostPointerCapture={()=>{start.current=null;setDepth(null);}} onClick={()=>{if(enabled&&!onVent)onLower();}}><span className="tissue">{vent?'젖은 휴지':'마른 휴지'}</span></button>
   <div className="cup-water"/>{show&&!vent&&<span className="air-space"><i aria-hidden="true"/>공기 공간</span>}
   {onVent?<button className={`vent-switch ${vent?'open':''}`} aria-label="컵의 공기 배출구 열기" aria-pressed={vent} onClick={()=>{onVent();playSound('air');}}>{vent?'열림 ✓':'배출구 열기'}</button>:<span className="vent-plug"/>}
   {vent&&<div className="air-bubbles" aria-hidden="true"><i/><i/><i/></div>}
  </div>
  {vent&&<div className="air-flow" aria-hidden="true"><span>공기 ↑</span><span>물 ↑</span></div>}
  </div>
  <div className="lab-metric" aria-live="polite"><b>{vent?'기포와 물높이를 살펴봐요':down?'휴지와 컵 속 물높이를 살펴봐요':'입구가 아래를 향한 컵'}</b><span>{show?'노란색은 공기의 위치 표시예요.':'같은 컵을 같은 깊이로 넣어 비교해요.'}</span></div>
 </div>;
}
