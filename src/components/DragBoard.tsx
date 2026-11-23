import {useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {playSound} from '../services/audio';
import './picture-cards.css';

export interface Token {id:string;label:string;color?:string;image?:string;placed?:boolean;style?:CSSProperties}
export interface DropSlot {id:string;label:string;detail?:string;filled?:string;images?:string[];disabled?:boolean}
/** Pointer capture handles touch, mouse and pen. Tap-token → tap-slot is the keyboard alternative.
 * variant 'parts': tokens are picture pieces of one object (image above, label below), shown in a row.
 * While dragging, the slot that would take the piece lights up (drop-target). For 'parts' the piece sits centred on the finger
 * and a release just outside a slot (within SNAP px, e.g. in the gap between slots) goes to the nearest slot. */
const SNAP=32,SNAP_TOUCH=56; // 손가락은 마우스보다 덜 정확해서 태블릿에서는 칸 밖 56px까지 가까운 칸으로
export function DragBoard({tokens,slots,onPlace,label='카드를 끌거나, 카드와 놓을 곳을 차례로 눌러.',variant,renderTargets}:{tokens:Token[];slots:DropSlot[];onPlace:(token:string,slot:string)=>void;label?:string;variant?:'parts'|'cards';renderTargets?:(controls:{picked:string|null;place:(slot:string)=>void})=>ReactNode}){
 // parts: 한 물체의 그림 조각 줄, cards: 큰 그림 카드. 둘 다 그림 위·이름 아래, 손가락 가운데 고스트, 가까운 칸 끌어당기기.
 const parts=!!variant;
 const [picked,setPicked]=useState<string|null>(null),[ghost,setGhost]=useState<{id:string;x:number;y:number;touch?:boolean}|null>(null),[message,setMessage]=useState('');
 const gesture=useRef<{id:string;x:number;y:number;moved:boolean;touch?:boolean}|null>(null),suppressClick=useRef(false),target=useRef<HTMLElement|null>(null);
 // The slot under the point (or, for picture pieces, the nearest one within SNAP px), only inside this board or its workspace.
 function slotAt(x:number,y:number,from:Element,touch=false):HTMLElement|null{
  const board=from.closest('.drag-board'),scope=board?.closest('.workspace'),inside=(z:Element)=>!!board?.contains(z)||!!scope&&scope.contains(z);
  const zone=document.elementFromPoint(x,y)?.closest<HTMLElement>('[data-drop-slot]');if(zone&&inside(zone)&&!zone.matches(':disabled'))return zone;
  if(!parts||!board)return null;let best:HTMLElement|null=null,dist=touch?SNAP_TOUCH:SNAP;
  board.querySelectorAll<HTMLElement>('[data-drop-slot]').forEach(z=>{const r=z.getBoundingClientRect(),d=Math.hypot(Math.max(r.left-x,0,x-r.right),Math.max(r.top-y,0,y-r.bottom));if(!z.matches(':disabled')&&d<=dist){dist=d;best=z;}});
  return best;
 }
 function mark(zone:HTMLElement|null){if(target.current===zone)return;target.current?.classList.remove('drop-target');zone?.classList.add('drop-target');target.current=zone;}
 function endDrag(){gesture.current=null;setGhost(null);mark(null);delete document.documentElement.dataset.dragging;}
 function place(token:string,slot:string){if(slots.find(s=>s.id===slot)?.disabled)return;onPlace(token,slot);setMessage(`${tokens.find(t=>t.id===token)?.label} → ${slots.find(s=>s.id===slot)?.label}`);setPicked(null);playSound('drop');}
 return <div className={`drag-board${variant==='parts'?' parts-board':''}${variant==='cards'?' cards-board':''}`} aria-label={label}>
  <p className="manipulation-instruction">{label}</p>
  {renderTargets?.({picked,place:slot=>{if(picked)place(picked,slot);}})}
  <div className="drag-tokens">{tokens.map(t=><button key={t.id} className={`drag-token ${picked===t.id?'picked':''} ${t.placed?'placed':''}`} style={t.style} aria-pressed={picked===t.id} onPointerDown={e=>{if(e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);gesture.current={id:t.id,x:e.clientX,y:e.clientY,moved:false,touch:e.pointerType!=='mouse'};suppressClick.current=false;}} onPointerMove={e=>{const g=gesture.current;if(!g||g.id!==t.id)return;if(Math.hypot(e.clientX-g.x,e.clientY-g.y)>8)g.moved=true;if(g.moved){setGhost({id:t.id,x:e.clientX,y:e.clientY,touch:g.touch});mark(slotAt(e.clientX,e.clientY,e.currentTarget,g.touch));document.documentElement.dataset.dragging='true';}}} onPointerUp={e=>{const g=gesture.current;if(!g)return;endDrag();if(g.moved){suppressClick.current=true;const zone=slotAt(e.clientX,e.clientY,e.currentTarget,g.touch);if(zone)place(t.id,zone.dataset.dropSlot!);else setMessage('놓을 칸까지 끌어 봐. 카드를 누른 뒤 칸을 눌러도 돼.');}}} onPointerCancel={()=>{endDrag();suppressClick.current=true;}} onLostPointerCapture={endDrag} onClick={()=>{if(suppressClick.current){suppressClick.current=false;return;}setPicked(picked===t.id?null:t.id);playSound('select');}}>{parts?<><img className="drag-part-art" src={t.image} alt="" draggable={false}/><span className="drag-part-label">{t.label}{t.placed&&<span aria-hidden="true"> ✓</span>}</span></>:<>{t.image?<img className="drag-token-thumb" src={t.image} alt="" draggable={false} onError={e=>{e.currentTarget.style.display='none';}}/>:t.color&&<i style={{background:t.color}}/>}{t.label}{t.placed&&<span aria-hidden="true">✓</span>}</>}</button>)}</div>
  {!renderTargets&&<div className="drop-slots" style={parts?{'--slot-count':slots.length} as CSSProperties:undefined}>{slots.map(s=><button key={s.id} data-drop-slot={s.id} disabled={s.disabled} className={`drop-slot ${s.filled?'filled':''} ${picked?'awaiting':''}`} aria-label={`${s.label}${s.filled?': '+s.filled:''}에 놓기`} onClick={()=>{if(picked)place(picked,s.id);else setMessage('먼저 옮길 카드를 골라 줘.');}}><b>{s.label}</b>{s.detail&&<small>{s.detail}</small>}{!!s.images?.length&&<span className="drop-slot-art" aria-hidden="true">{s.images.map(src=><img key={src} src={src} alt="" draggable={false}/>)}</span>}<span>{s.filled||'여기에 놓기 ＋'}</span></button>)}</div>}
  <span className="sr-only" role="status">{message}</span>
  {/* The ghost is portaled to <body>: a filtered/transformed panel above the board would otherwise become the containing block of position:fixed and shift it away from the finger. */}
  {ghost&&createPortal((()=>{const t=tokens.find(x=>x.id===ghost.id);return <div className={`drag-ghost${parts?' part-ghost':''}${ghost.touch?' is-touch':''}`} style={{left:ghost.x,top:ghost.y}} aria-hidden="true">{parts&&t?.image&&<img src={t.image} alt=""/>}{t?.label}</div>;})(),document.body)}
 </div>;
}
