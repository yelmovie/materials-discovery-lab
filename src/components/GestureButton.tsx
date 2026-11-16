import {useEffect,useRef,useState,type ReactNode} from 'react';
import './gesture-button.css';

export type Gesture='tap'|'hold'|'swipe';
/** One control, three hand motions: tap, press-and-hold, or slide the knob to the end.
 * Enter/Space always completes it, so keyboard and switch users are never blocked. */
export function GestureButton({gesture,icon,label,hint,onDone,disabled=false,className='',holdMs=800}:{gesture:Gesture;icon:ReactNode;label:string;hint?:string;onDone:()=>void;disabled?:boolean;className?:string;holdMs?:number}){
 const [progress,setProgress]=useState(0),[note,setNote]=useState('');
 const start=useRef<{x:number;t:number}|null>(null),frame=useRef(0),track=useRef<HTMLButtonElement>(null),done=useRef(false);
 useEffect(()=>()=>cancelAnimationFrame(frame.current),[]);
 useEffect(()=>{done.current=false;setProgress(0);},[label,gesture]);
 function finish(){if(done.current)return;done.current=true;cancelAnimationFrame(frame.current);setProgress(1);setNote('');onDone();setTimeout(()=>{done.current=false;setProgress(0);},300);}
 function reset(message:string){cancelAnimationFrame(frame.current);start.current=null;setProgress(0);setNote(message);}
 function tickHold(){const s=start.current;if(!s)return;const p=Math.min(1,(performance.now()-s.t)/holdMs);setProgress(p);if(p>=1)finish();else frame.current=requestAnimationFrame(tickHold);}
 return <button ref={track} type="button" className={`gesture-button gesture-${gesture} ${className}`} data-gesture={gesture} disabled={disabled} style={{'--gesture-progress':progress} as React.CSSProperties} aria-label={`${label} (${gesture==='hold'?'꾹 누르기':gesture==='swipe'?'끝까지 밀기':'누르기'})`}
  onPointerDown={e=>{if(disabled||e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);setNote('');start.current={x:e.clientX,t:performance.now()};if(gesture==='hold')frame.current=requestAnimationFrame(tickHold);}}
  onPointerMove={e=>{const s=start.current;if(!s||gesture!=='swipe'||!track.current)return;const room=Math.max(40,track.current.clientWidth-56);const p=Math.max(0,Math.min(1,(e.clientX-s.x)/room));setProgress(p);if(p>=.92)finish();}}
  onPointerUp={()=>{const s=start.current;start.current=null;if(!s||done.current)return;if(gesture==='tap')finish();else if(gesture==='hold')reset('조금 더 오래 꾹 눌러요!');else reset('손잡이를 끝까지 밀어요!');}}
  onPointerCancel={()=>reset('')} onLostPointerCapture={()=>{if(start.current&&!done.current)reset('');}}
  onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();finish();}}}
  onClick={e=>{if(e.detail===0)finish();}}>
  <span className="gesture-fill" aria-hidden="true"/>
  <span className="gesture-knob" aria-hidden="true">{icon}</span>
  <span className="gesture-text"><b>{label}</b><small>{note||hint||(gesture==='hold'?'꾹 누르고 있어요':gesture==='swipe'?'오른쪽 끝까지 밀어요':'눌러요')}</small></span>
 </button>;
}
