import {useState} from 'react';
import {useGame} from '../state/GameContext';
import {guidance} from '../domain/guidance';
import type {Screen} from '../domain/model';
import {playSound} from '../services/audio';

export function Companion({screen}:{screen:Screen}){
 const {save}=useGame();const [open,setOpen]=useState(false),[level,setLevel]=useState(0);const hints=guidance(save,screen);
 return <div className="companion-dock">
  <button className="companion-button" aria-label="다람쥐 모루에게 힌트 묻기" aria-expanded={open} onClick={()=>{setOpen(!open);setLevel(0);playSound('hint');}}><img src="/assets/generated/companion.webp" alt=""/><span><b>모루의 힌트</b><small>막히면 나를 눌러!</small></span></button>
  {open&&<section className="companion-bubble" aria-label="모루의 단계별 힌트"><div><b>함께 생각해 보자 · {level+1}/3</b><button aria-label="힌트 닫기" onClick={()=>setOpen(false)}>×</button></div><p role="status">{hints[level]}</p>{level<2&&<button className="secondary" onClick={()=>{setLevel(level+1);playSound('hint');}}>조금 더 알려 줘 →</button>}</section>}
 </div>;
}
