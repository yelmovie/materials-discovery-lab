import {useEffect,useRef,useState} from 'react';
import {Modal} from './Modal';
import {concepts} from '../domain/concepts';
import type {Screen} from '../domain/model';
import {useGame} from '../state/GameContext';
import {setMediaQuiet} from '../services/audio';

export function ConceptVideo({screen,onClose,onContinue,continueLabel}:{screen:Screen;onClose:()=>void;onContinue?:()=>void;continueLabel?:string}){
 const {save}=useGame(),concept=concepts[screen],video=useRef<HTMLVideoElement>(null),next=useRef<HTMLButtonElement>(null);
 const [time,setTime]=useState(0),[playing,setPlaying]=useState(false),[ended,setEnded]=useState(false),[failed,setFailed]=useState(false);
 const reduced=save.settings.reducedMotion||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const cue=Math.min(2,Math.floor(time/3));
 useEffect(()=>{setMediaQuiet(true);const v=video.current;let alive=true;if(v&&!reduced)void v.play().catch(()=>{if(alive)setPlaying(false);});const visibility=()=>{if(document.hidden)v?.pause();};document.addEventListener('visibilitychange',visibility);return()=>{alive=false;document.removeEventListener('visibilitychange',visibility);if(v){v.pause();v.removeAttribute('src');v.querySelectorAll('source').forEach(s=>s.removeAttribute('src'));v.load();}setMediaQuiet(false);};},[]);
 useEffect(()=>{if(playing||ended||failed)return;const t=setTimeout(()=>{if(video.current&&video.current.readyState<3)setFailed(true);},8000);return()=>clearTimeout(t);},[playing,ended,failed]);
 function replay(){const v=video.current;if(!v)return;setEnded(false);setTime(0);v.currentTime=0;void v.play().catch(()=>setPlaying(false));}
 function resume(){void video.current?.play().catch(()=>setPlaying(false));}
 return <Modal title={`개념 영상: ${concept.title}`} className="concept-dialog" onClose={onClose}>
  <header className="concept-header"><span className="eyebrow">모루의 발견 극장 · 활동 {Number(screen.slice(1))}</span><h2>{concept.title}</h2></header>
  <div className="concept-picture"><video ref={video} poster={`/assets/concepts/${screen}.webp`} preload="none" playsInline muted onPlay={()=>setPlaying(true)} onWaiting={()=>setPlaying(false)} onPlaying={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onTimeUpdate={e=>setTime(e.currentTarget.currentTime)} onEnded={()=>{setEnded(true);setTime(9);next.current?.focus();}} onError={()=>setFailed(true)} aria-label={`${concept.title}, 9초 모션 그래픽`}><source src={`/assets/concepts/${screen}.webm`} type="video/webm"/><source src={`/assets/concepts/${screen}.mp4`} type="video/mp4"/></video>
   {!playing&&!ended&&!failed&&<button className="concept-play primary" onClick={resume}>▶ {time>0?'이어서 보기':'9초 개념 영상 보기'}</button>}{playing&&<button className="concept-pause" onClick={()=>video.current?.pause()} aria-label="개념 영상 일시 정지">Ⅱ</button>}
   {failed&&<div className="concept-fallback"><b>그림과 핵심 문장으로 함께 보자.</b><ol>{concept.cues.map(c=><li key={c}>{c}</li>)}</ol><button className="secondary" onClick={()=>{setFailed(false);video.current?.load();replay();}}>영상 다시 불러오기</button></div>}
  </div><div className="concept-caption" aria-live="polite"><img src="/assets/generated/companion.webp" alt=""/><p>{failed||ended?concept.summary:concept.cues[cue]}</p><span>{ended?'발견 완료 ✓':`${cue+1} / 3`}</span></div><div className="concept-timeline" aria-hidden="true"><i style={{width:`${Math.min(100,time/9*100)}%`}}/></div>
  <footer className="concept-actions"><button className="secondary" onClick={replay}>다시 보기 ↺</button><button ref={next} className="primary" onClick={onContinue??onClose}>{onContinue?(ended||failed?continueLabel:`건너뛰고 ${continueLabel}`):'활동으로 돌아가기'} →</button></footer>
 </Modal>;
}
