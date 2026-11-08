import {useRef,useState} from 'react';
import {playSound} from '../services/audio';

export interface Token {id:string;label:string;color?:string;placed?:boolean}
export interface DropSlot {id:string;label:string;detail?:string;filled?:string}
/** Pointer capture handles touch, mouse and pen. Tap-token → tap-slot is the keyboard alternative. */
export function DragBoard({tokens,slots,onPlace,label='카드를 끌거나, 카드와 놓을 곳을 차례로 눌러.'}:{tokens:Token[];slots:DropSlot[];onPlace:(token:string,slot:string)=>void;label?:string}){
 const [picked,setPicked]=useState<string|null>(null),[ghost,setGhost]=useState<{id:string;x:number;y:number}|null>(null),[message,setMessage]=useState('');
 const gesture=useRef<{id:string;x:number;y:number;moved:boolean}|null>(null),suppressClick=useRef(false);
 function place(token:string,slot:string){onPlace(token,slot);setMessage(`${tokens.find(t=>t.id===token)?.label} → ${slots.find(s=>s.id===slot)?.label}`);setPicked(null);playSound('drop');}
 return <div className="drag-board" aria-label={label}>
  <p className="manipulation-instruction">{label}</p>
  <div className="drag-tokens">{tokens.map(t=><button key={t.id} className={`drag-token ${picked===t.id?'picked':''} ${t.placed?'placed':''}`} aria-pressed={picked===t.id} onPointerDown={e=>{if(e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);gesture.current={id:t.id,x:e.clientX,y:e.clientY,moved:false};suppressClick.current=false;}} onPointerMove={e=>{const g=gesture.current;if(!g||g.id!==t.id)return;if(Math.hypot(e.clientX-g.x,e.clientY-g.y)>8)g.moved=true;if(g.moved)setGhost({id:t.id,x:e.clientX,y:e.clientY});}} onPointerUp={e=>{const g=gesture.current;if(!g)return;gesture.current=null;setGhost(null);if(g.moved){suppressClick.current=true;const zone=document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>('[data-drop-slot]');if(zone&&e.currentTarget.closest('.drag-board')?.contains(zone))place(t.id,zone.dataset.dropSlot!);else setMessage('놓을 칸까지 끌어 봐. 카드를 누른 뒤 칸을 눌러도 돼.');}}} onPointerCancel={()=>{gesture.current=null;setGhost(null);suppressClick.current=true;}} onLostPointerCapture={()=>{gesture.current=null;setGhost(null);}} onClick={()=>{if(suppressClick.current){suppressClick.current=false;return;}setPicked(picked===t.id?null:t.id);playSound('select');}}>{t.color&&<i style={{background:t.color}}/>}{t.label}{t.placed&&<span aria-hidden="true">✓</span>}</button>)}</div>
  <div className="drop-slots">{slots.map(s=><button key={s.id} data-drop-slot={s.id} className={`drop-slot ${s.filled?'filled':''} ${picked?'awaiting':''}`} aria-label={`${s.label}${s.filled?': '+s.filled:''}에 놓기`} onClick={()=>{if(picked)place(picked,s.id);else setMessage('먼저 옮길 카드를 골라 줘.');}}><b>{s.label}</b>{s.detail&&<small>{s.detail}</small>}<span>{s.filled||'여기에 놓기 ＋'}</span></button>)}</div>
  <span className="sr-only" role="status">{message}</span>
  {ghost&&<div className="drag-ghost" style={{left:ghost.x,top:ghost.y}} aria-hidden="true">{tokens.find(t=>t.id===ghost.id)?.label}</div>}
 </div>;
}
