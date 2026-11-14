import {useCallback,useEffect,useRef,useState} from 'react';
import {setMediaQuiet} from '../services/audio';

export function NpcVoice({voice,muted,autoPlay=false}:{voice:string;muted:boolean;autoPlay?:boolean}){
 const request=useRef(0),player=useRef<HTMLAudioElement|null>(null),[playing,setPlaying]=useState(false),[message,setMessage]=useState('');
 const stop=useCallback(()=>{
  request.current++;
  const audio=player.current;
  if(audio){player.current=null;audio.onplaying=audio.onended=audio.onerror=null;audio.pause();audio.removeAttribute('src');audio.load();}
  setPlaying(false);setMediaQuiet(false);
 },[]);
 const play=useCallback(async()=>{
  stop();setMessage('');
  const ticket=request.current;
  const audio=new Audio(voice);
  player.current=audio;audio.preload='none';audio.volume=.75;
  audio.onplaying=()=>{if(ticket===request.current){setPlaying(true);setMediaQuiet(true);}};
  audio.onended=stop;
  audio.onerror=()=>{if(ticket===request.current){stop();setMessage('음성을 불러오지 못했어요. 위의 글로 안내를 읽어 주세요.');}};
  try{await audio.play();}
  catch{if(ticket===request.current){stop();setMessage('듣기 버튼을 눌러 목소리를 들어요.');}}
 },[stop,voice]);
 useEffect(()=>{
  const hidden=()=>{if(document.hidden)stop();};
  document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',stop);
  const frame=autoPlay&&!muted&&!document.hidden?requestAnimationFrame(()=>void play()):null;
  return()=>{if(frame!==null)cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',stop);stop();};
 },[autoPlay,muted,play,stop]);
 function toggle(){if(muted)return;if(player.current)stop();else void play();}
 return <div className="npc-voice"><button className="secondary" disabled={muted} aria-pressed={playing} onClick={toggle}>{playing?'안내 음성 멈추기':'안내 음성 듣기'}</button><small> AI 생성 음성 · 위의 안내 글과 같은 내용</small>{muted&&<p>소리를 켜면 안내 음성을 들을 수 있어요.</p>}<p role="status">{message}</p></div>;
}
