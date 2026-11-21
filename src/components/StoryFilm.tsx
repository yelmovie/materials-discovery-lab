import {useEffect,useRef,useState} from 'react';
import {useGame} from '../state/GameContext';
import {playLine,stopLine} from '../services/lineVoice';
import films from '../domain/story-films.json';
import './story-film.css';

// 2026-11-21 인트로·아웃트로 이야기 영상(scripts/compose-story-films.py).
// 영상은 전체 화면·검은 바탕·contain, 자막은 그림 안 아래쪽에 입혀 있다(_shared/FULLSCREEN-CAPTION-FILMS-20261118.md).
// 영상은 늘 음소거로 틀고, 자막 시각에 ElevenLabs 목소리 파일을 대사 재생기로 따로 튼다: 목소리 스위치·전체 소리를 다른 대사와 똑같이 따른다.
// 배경 음악은 영상 중에도 평소대로 나고, 목소리가 나오는 동안만 다른 대사처럼 1/4로 줄어든다(_shared/AUDIO-FIX4-BRIEF-20261120.md 2번).
// 본 적이 있는지는 저장 기록(Save)과 따로 둔다. 진행·저장 구조를 바꾸지 않으려고.
export type FilmKind='intro'|'outro';
const SEEN_KEY='material-workshop-mission.films-seen';
function readSeen():Partial<Record<FilmKind,boolean>>{try{return JSON.parse(localStorage.getItem(SEEN_KEY)||'{}')??{};}catch{return {};}}
export const filmSeen=(kind:FilmKind)=>!!readSeen()[kind];
export function markFilmSeen(kind:FilmKind){try{localStorage.setItem(SEEN_KEY,JSON.stringify({...readSeen(),[kind]:true}));}catch{/* 저장이 막혀도 영상은 다시 볼 수 있을 뿐이다 */}}
export function forgetFilms(){try{localStorage.removeItem(SEEN_KEY);}catch{/* 위와 같음 */}}

type Playback='ready'|'loading'|'playing'|'paused'|'ended'|'failed';
const plain=(text:string)=>text.replace(/[[\]]/g,'');

export function StoryFilm({kind,onDone}:{kind:FilmKind;onDone:()=>void}){
 const {save}=useGame(),film=films[kind],video=useRef<HTMLVideoElement>(null),skip=useRef<HTMLButtonElement>(null);
 const reduced=save.settings.reducedMotion||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const [playback,setPlayback]=useState<Playback>('ready'),spoken=useRef(-1),finished=useRef(false);
 const done=()=>{if(finished.current)return;finished.current=true;stopLine();markFilmSeen(kind);onDone();};
 const play=(v:HTMLVideoElement)=>{setPlayback('loading');void v.play().catch(error=>{if(v.isConnected&&error.name!=='AbortError')setPlayback(error.name==='NotAllowedError'?'paused':'failed');});};
 useEffect(()=>{
  skip.current?.focus();const v=video.current;if(v&&!reduced)play(v);
  const visibility=()=>{if(document.hidden)v?.pause();};const key=(e:KeyboardEvent)=>{if(e.key==='Escape')done();};
  document.addEventListener('visibilitychange',visibility);document.addEventListener('keydown',key);
  return()=>{document.removeEventListener('visibilitychange',visibility);document.removeEventListener('keydown',key);stopLine();if(v){v.pause();v.removeAttribute('src');v.load();}};
 },[]);
 useEffect(()=>{if(playback!=='loading')return;const t=setTimeout(()=>{video.current?.pause();setPlayback('failed');},8000);return()=>clearTimeout(t);},[playback]);
 useEffect(()=>{if(playback!=='ended')return;const t=setTimeout(done,900);return()=>clearTimeout(t);},[playback]);
 // 자막이 뜨는 순간 그 대사의 목소리를 한 번 튼다(일시 정지했다가 이어 볼 때 이미 지난 대사는 다시 읽지 않는다).
 function tick(t:number){const i=film.cues.findIndex(c=>t>=c.at&&t<c.at+.8);if(i>spoken.current){spoken.current=i;playLine(film.cues[i].voice);}}
 function toggle(){const v=video.current;if(!v||playback==='loading')return;if(playback==='playing'){v.pause();stopLine();return;}if(playback==='failed')v.load();play(v);}
 const failed=playback==='failed',showStart=!failed&&(playback==='ready'||playback==='paused');
 return <div className={`story-film story-film-${kind}`} role="dialog" aria-modal="true" aria-label={film.title}>
  <video ref={video} className="story-film-video" poster={film.poster} preload="metadata" playsInline muted
   onPlaying={()=>setPlayback('playing')} onWaiting={e=>{if(!e.currentTarget.paused)setPlayback('loading');}}
   onPause={e=>{if(!e.currentTarget.ended)setPlayback(p=>p==='failed'?p:'paused');}} onEnded={()=>setPlayback('ended')} onError={()=>setPlayback('failed')}
   onTimeUpdate={e=>tick(e.currentTarget.currentTime)} onClick={toggle}>
   <source src={film.src} type="video/mp4"/>
  </video>
  <div className="story-film-top">
   {!failed&&playback!=='ready'&&<button className="story-film-pause" onClick={toggle} aria-label={playback==='playing'?'영상 일시 정지':'영상 이어서 보기'}>{playback==='playing'?'일시 정지':playback==='loading'?'불러오는 중':'이어서 보기'}</button>}
   <button ref={skip} className="story-film-skip" onClick={done}>{playback==='ended'?'닫기':'건너뛰기'} →</button>
  </div>
  {showStart&&<button className="story-film-start" onClick={()=>{const v=video.current;if(v)play(v);}}>{playback==='paused'?'이어서 보기':'영상 보기'} ▶</button>}
  {failed&&<div className="story-film-fallback" role="status"><b>영상을 불러오지 못했어요. 이야기를 글로 볼게요.</b><ol>{film.cues.map(c=><li key={c.at}><span>{c.who}</span> {plain(c.text)}</li>)}</ol><button className="primary" onClick={done}>계속하기 →</button></div>}
  <ol className="sr-only" aria-label="영상 대사">{film.cues.map(c=><li key={c.at}>{c.who}: {plain(c.text)}</li>)}</ol>
 </div>;
}
