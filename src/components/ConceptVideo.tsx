import '../concept-focus.css';
import {useCallback,useEffect,useRef,useState} from 'react';
import {Modal} from './Modal';
import {concepts,CONCEPT_SECONDS,CONCEPT_CHAPTER_SECONDS} from '../domain/concepts';
import type {Screen} from '../domain/model';
import {useGame} from '../state/GameContext';
import {setMediaQuiet} from '../services/audio';

const termMap:Record<Screen,string[]>={S01:['물체','물질','재료'],S02:['부품','재료','관찰'],S03:['같은 조건','성질','비교'],S04:['쓰임','성질','근거'],S05:['고체','모양','부피'],S06:['모양','높이','양'],S07:['공기','공간','기체'],S08:['공기','기포','공간'],S09:['성질','관찰 기록','설계'],S10:['같은 조건','시험','설계']};
function Highlight({text,terms}:{text:string;terms:string[]}){const parts:{text:string;key:boolean}[]=[];let rest=text;while(rest){const hit=terms.map(term=>({term,index:rest.indexOf(term)})).filter(x=>x.index>=0).sort((a,b)=>a.index-b.index||b.term.length-a.term.length)[0];if(!hit){parts.push({text:rest,key:false});break;}if(hit.index)parts.push({text:rest.slice(0,hit.index),key:false});parts.push({text:hit.term,key:true});rest=rest.slice(hit.index+hit.term.length);}return <>{parts.map((p,i)=>p.key?<mark className="concept-keyword" key={i}>{p.text}</mark>:p.text)}</>;}
type Playback='ready'|'loading'|'playing'|'paused'|'ended'|'failed';
export function ConceptVideo({screen,onClose,onContinue,continueLabel}:{screen:Screen;onClose:()=>void;onContinue?:()=>void;continueLabel?:string}){
 const {save}=useGame(),concept=concepts[screen],video=useRef<HTMLVideoElement>(null),next=useRef<HTMLButtonElement>(null);
 const [time,setTime]=useState(0),[playback,setPlayback]=useState<Playback>('ready');
 const ended=playback==='ended',failed=playback==='failed',playing=playback==='playing',loading=playback==='loading';
 const reduced=save.settings.reducedMotion||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const cue=Math.min(2,Math.floor(time/CONCEPT_CHAPTER_SECONDS));
 const play=useCallback((v:HTMLVideoElement)=>{setPlayback('loading');void v.play().catch(error=>{if(v.isConnected&&error.name!=='AbortError')setPlayback(error.name==='NotAllowedError'?'paused':'failed');});},[]);
 useEffect(()=>{setMediaQuiet(true);const v=video.current;if(v&&!reduced)play(v);const visibility=()=>{if(document.hidden)v?.pause();};document.addEventListener('visibilitychange',visibility);return()=>{document.removeEventListener('visibilitychange',visibility);if(v){v.pause();v.removeAttribute('src');v.querySelectorAll('source').forEach(s=>s.removeAttribute('src'));v.load();}setMediaQuiet(false);};},[]);
 useEffect(()=>{if(!loading)return;const t=setTimeout(()=>{video.current?.pause();setPlayback('failed');},8000);return()=>clearTimeout(t);},[loading]);
 function togglePlayback(){const v=video.current;if(!v||loading)return;if(playing){v.pause();return;}if(failed)v.load();if(ended||failed){v.currentTime=0;setTime(0);}play(v);}
 const playbackLabel=failed?'다시 불러오기':ended?'다시 보기':playing?'일시 정지':loading?'불러오는 중':time>0?'이어서 보기':'영상 보기';
 return <Modal title={`개념 영상: ${concept.title}`} className="concept-dialog" onClose={onClose}>
  <header className="concept-header"><span className="eyebrow">모루의 발견 극장 · 활동 {Number(screen.slice(1))}</span><h2>{concept.title}</h2></header>
  <div className="concept-picture"><video ref={video} poster={`/assets/concepts/${screen}.webp`} preload="none" playsInline muted onWaiting={e=>{if(!e.currentTarget.paused)setPlayback('loading');}} onPlaying={()=>setPlayback('playing')} onPause={e=>{if(e.currentTarget.paused&&!e.currentTarget.ended)setPlayback(state=>state==='failed'?state:'paused');}} onTimeUpdate={e=>setTime(e.currentTarget.currentTime)} onEnded={()=>{setPlayback('ended');setTime(CONCEPT_SECONDS);next.current?.focus();}} onError={()=>setPlayback('failed')} aria-label={`${concept.title}, ${CONCEPT_SECONDS}초 개념 영상: 모루가 실험을 다시 보여 줘요`}><source src={`/assets/concepts/${screen}.webm`} type="video/webm"/><source src={`/assets/concepts/${screen}.mp4`} type="video/mp4"/></video>
   {failed&&<div className="concept-fallback"><b>영상 대신 핵심 문장으로 살펴봐요.</b><ol>{concept.cues.map(c=><li key={c}>{c}</li>)}</ol></div>}
  </div><div className="concept-caption" aria-live="polite"><img src="/assets/generated/companion.webp" alt=""/><p><Highlight text={failed||ended?concept.summary:concept.cues[cue]} terms={termMap[screen]}/></p><span>{ended?'발견 완료 ✓':`${cue+1} / 3`}</span></div><div className="concept-timeline" aria-hidden="true"><i style={{width:`${Math.min(100,time/CONCEPT_SECONDS*100)}%`}}/></div>
  <div className="concept-focus"><small>기억할 낱말</small>{termMap[screen].map(term=><strong key={term}>{term}</strong>)}</div>
  <nav className="concept-chapters" aria-label="개념 장면 선택">{concept.cues.map((text,i)=><button key={i} disabled={failed} aria-current={cue===i?'step':undefined} aria-label={`${i+1}번째 장면: ${text}`} onClick={()=>{if(video.current)video.current.currentTime=i*CONCEPT_CHAPTER_SECONDS;setTime(i*CONCEPT_CHAPTER_SECONDS);if(ended)setPlayback('paused');}}>{i+1} · {['관찰하기','비교하기','기억하기'][i]}</button>)}</nav>
  <footer className="concept-actions"><button className={`secondary ${playing?'concept-pause':'concept-play'}`} aria-disabled={loading||undefined} onClick={togglePlayback} aria-label={playback==='ready'?`${CONCEPT_SECONDS}초 개념 영상 보기`:playing?'개념 영상 일시 정지':undefined}>{playbackLabel}</button><button ref={next} className="primary" onClick={onContinue??onClose}>{onContinue?(ended||failed?continueLabel:`건너뛰고 ${continueLabel}`):'활동으로 돌아가기'} →</button></footer>
 </Modal>;
}
