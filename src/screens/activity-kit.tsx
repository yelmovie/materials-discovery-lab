// 2026-11-21 3-4단계: Activities.tsx에서 옮긴 활동 화면 공용 조각(안내 문장, 패널·선택 단추, 재료 그림). 내용은 그대로다.
import {createContext,useContext,useState,useEffect,lazy,type ReactNode} from 'react';
import {materials} from '../domain/model';
import {Modal} from '../components/Modal';
import {playSound} from '../services/audio';
export const ExperimentCanvas=lazy(()=>import('../game/ExperimentCanvas'));
export const hasBatchim=(w:string)=>(w.charCodeAt(w.length-1)-0xac00)%28>0;
export const needText={body:'모양을 유지하고 물에 쉽게 젖지 않기',window:'빛이 지나가 안쪽이 보이기',bumper:'눌렀다 놓으면 원래 모양으로 돌아오기'};
export function Panel({title,children}:{title:string;children:ReactNode}){return <section className="tool-panel"><h3>{title}</h3>{children}</section>;}
export function Choice({children,selected,onClick,disabled=false,ariaLabel}:{children:ReactNode;selected:boolean;onClick:()=>void;disabled?:boolean;ariaLabel?:string}){return <button className={`choice activity-choice ${selected?'selected':''}`} aria-label={ariaLabel} aria-pressed={selected} onClick={()=>{playSound('select');onClick();}} disabled={disabled}><span className="activity-choice-label">{children}</span>{selected?<span className="activity-choice-check" aria-hidden="true">✓</span>:<span aria-hidden="true"/>}</button>;}
export function Info({label,title=label,children,next=false}:{label:string;title?:string;children:ReactNode;next?:boolean}){const [open,setOpen]=useState(false);return <><button className="stage-info-button" data-next-action={next||undefined} onClick={()=>setOpen(true)}>{label}</button>{open&&<Modal title={title} className="stage-detail-modal" onClose={()=>setOpen(false)}><h2>{title}</h2>{children}<button className="primary full" onClick={()=>setOpen(false)}>탐구로 돌아가기</button></Modal>}</>;}
export type ActivityCue={text:string;focus?:string};
export const GuideContext=createContext<((cue:ActivityCue)=>void)|null>(null);
export function useActivityGuide(text:string,focus?:string){const report=useContext(GuideContext);useEffect(()=>{report?.({text,focus});},[report,text,focus]);}
export function GuideText({text,focus}:ActivityCue){
 const start=focus?text.indexOf(focus):-1;
 if(start<0||!focus)return text;
 return <>{text.slice(0,start)}<strong className="guide-focus">{focus}</strong>{text.slice(start+focus.length)}</>;
}
export function MaterialThumb({id}:{id:string}){return <img className="material-thumb" src={`/assets/generated/materials/${id}.webp`} alt="" aria-hidden="true" draggable={false} onError={e=>{e.currentTarget.style.display='none';}}/>;}
