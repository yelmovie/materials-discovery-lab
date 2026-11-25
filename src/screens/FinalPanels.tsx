import {lazy,Suspense,useState,useEffect,useRef} from 'react';
import Certificate from './Certificate';
import {useGame} from '../state/GameContext';
import {Icon} from '../components/Icon';
import {clickSound,setMediaQuiet,voiceTurn} from '../services/audio';
import {evidenceNames,parts,partNames,shortNames,canFinalize,voiceOff,type Phase} from '../domain/model';
import {MaterialThumb} from './activity-kit';
const ObjectViewport=lazy(()=>import('../game/ObjectViewport'));
export default function FinalPanels({navigate}:{navigate:(phase:Phase)=>void}){
 const {save,demo,dispatch}=useGame();const phase=save.lastPhase;const [lever,setLever]=useState(0),[hold,setHold]=useState(false),[time,setTime]=useState(0);const activated=useRef(false);
 const valid=canFinalize(save);
 useEffect(()=>{if(!hold)return;const started=performance.now();const t=setInterval(()=>{if(performance.now()-started>=230)setLever(v=>Math.min(100,v+5));},70);const stop=()=>setHold(false);window.addEventListener('blur',stop);return()=>{clearInterval(t);window.removeEventListener('blur',stop);};},[hold]);
 useEffect(()=>{if(lever===100&&valid&&!activated.current){activated.current=true;dispatch({type:'core'});clickSound(true);navigate('ending');}},[lever,valid]);
 useEffect(()=>{if(phase!=='ending')return;setTime(0);const started=Date.now();const t=setInterval(()=>setTime(Date.now()-started),100);return()=>clearInterval(t);},[phase]);
 useEffect(()=>{if(phase==='ending'&&time>=8000)navigate('certificate');},[time,phase]);
 // 엔딩 문구가 바뀔 때마다 공방장 토리가 그 문구를 읽는다(ElevenLabs Aria, docs/VOICE-FILL-20261118.json).
 const endingLine=phase==='ending'?(time<2500?0:time<5000?1:2):-1,quietVoice=voiceOff(save.settings);
 // 탭을 숨기면 다른 목소리처럼 그 자리에서 멈춘다(문구는 화면에 남아 있다).
 useEffect(()=>{
  if(endingLine<0||quietVoice||document.hidden)return;
  const audio=new Audio(`/assets/audio/npc-elevenlabs/tori-ending-${endingLine}.mp3`),release=()=>setMediaQuiet('ending',false);
  const stop=()=>{audio.onplaying=audio.onended=audio.onerror=null;audio.pause();audio.removeAttribute('src');audio.load();release();voiceTurn('ending',null);};
  const hidden=()=>{if(document.hidden)stop();};
  audio.volume=.8;audio.onplaying=()=>setMediaQuiet('ending',true);audio.onended=audio.onerror=release;
  voiceTurn('ending',stop);
  void audio.play().catch(release);
  document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',stop);
  return()=>{document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',stop);stop();};
 },[endingLine,quietVoice]);
 if(!valid&&phase!=='certificate'&&!demo)return <div className="final-card"><h2>보관함을 먼저 시험해 줘</h2><p>재료를 바꿨다면 같은 조건으로 세 번 다시 확인해 봐.</p><button className="primary" onClick={()=>navigate('activity')}>시험으로 돌아가기</button></div>;
 if(phase==='report')return <div className="final-card report">
  <div className="evidence-report">{save.evidence.map(e=>{
   const workshop=Number(e.id.slice(1));
   return <article key={e.id}>
    <img className="report-art" src={`/assets/generated/workshops/ws-${workshop}.webp`} alt=""/>
    <h3>{evidenceNames[workshop-1]}</h3>
    <p>{e.id==='E01'?'천 · 금속 · 나무로 이루어진 우산':e.id==='E02'?`모형 실험 관찰 기록 ${save.observations.length}개`:e.id==='E03'?'나무토막 모양 · 옮긴 물의 양 · 모래알 관찰':e.id==='E04'?'같은 깊이에서 배출구를 닫고 열어 비교':`설계 ${save.design.revision}판 · 세 시험 통과`}</p>
   </article>;
  })}</div>
  <button className="primary" onClick={()=>{dispatch({type:'report'});navigate('core');}}>연구 보고서 전달하기 →</button>
 </div>;
 if(phase==='core'){
  const lit=parts.filter((_,i)=>lever>=(i+1)*33);
  return <div className="final-card core-panel">
   <div className="core-layout">
    <div className={`core-device painted-core ${lever>0?'charging':''}`} style={{'--charge':lever/100} as React.CSSProperties}>
     <img className="core-art" src="/assets/generated/material-core.webp" alt="공방 코어" draggable={false}/>
     {parts.map((p,i)=><i key={p} className={`core-socket socket-${i} ${lit.includes(p)?'lit':''}`} aria-hidden="true"/>)}
     <span className="sr-only" role="status">{Math.round(lever)}%</span>
    </div>
    <div className="stack">
     <ol className="core-links" aria-label="연결할 부품">{parts.map(p=><li key={p} className={lit.includes(p)?'lit':''}>
      <MaterialThumb id={save.design.parts[p].sampleId}/>
      <b>{partNames[p]} · {shortNames[save.design.parts[p].sampleId]}</b>
      <span className="sr-only">{lit.includes(p)?'연결됨':'연결 대기'}</span>
     </li>)}</ol>
     <button className="primary core-step" data-next-action="true" aria-describedby="core-gesture"
      onPointerDown={e=>{if(e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);setHold(true);}}
      onPointerUp={()=>setHold(false)} onPointerCancel={()=>setHold(false)} onLostPointerCapture={()=>setHold(false)}
      onKeyDown={e=>{if(e.repeat&&(e.key==='Enter'||e.key===' '))e.preventDefault();}}
      onClick={()=>setLever(v=>Math.min(100,(Math.floor(v/34)+1)*34))}>코어 연결하기 <Icon name="next"/></button>
     <p id="core-gesture">세 번 누르거나 길게 눌러요.</p>
    </div>
   </div>
  </div>;
 }
 if(phase==='ending')return <div className="ending-panel"><h1>{time<2500?'코어에 빛이 돌아왔어!':time<5000?'다섯 공방이 다시 움직여!':'관찰 기록이 발명에 쓰였어!'}</h1><div className="restored-buildings">{['재료 선반','시험 장치','물 배관','공기 펌프','제작 설비'].map((name,i)=><div className={time>i*650?'lit':''} key={name}><img className="workshop-art" src={`/assets/generated/workshops/ws-${i+1}.webp`} alt="" draggable={false}/>{name}</div>)}</div><Suspense fallback={null}><ObjectViewport kind="box" selected="" onSelect={()=>{}} design={save.design}/></Suspense><button className="secondary" onClick={()=>navigate('certificate')}>연출 건너뛰기 →</button></div>;
 return <Certificate/>;
}
