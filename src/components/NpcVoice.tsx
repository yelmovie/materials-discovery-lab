import {useEffect,useRef,useState} from 'react';
import {setMediaQuiet} from '../services/audio';
export function NpcVoice({muted}:{muted:boolean}){
 const request=useRef(0),alive=useRef(true),player=useRef<HTMLAudioElement|null>(null),[playing,setPlaying]=useState(false),[message,setMessage]=useState('');
 function stop(){request.current++;const a=player.current;if(a){a.onended=null;a.onerror=null;a.pause();a.currentTime=0;}setPlaying(false);setMediaQuiet(false);}
 useEffect(()=>{alive.current=true;const hidden=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',stop);return()=>{alive.current=false;document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',stop);stop();player.current=null;};},[]);
 useEffect(()=>{if(muted)stop();},[muted]);
 async function toggle(){if(muted)return;if(playing){stop();return;}stop();setMessage('');const ticket=++request.current;const a=new Audio('/assets/audio/npc-elevenlabs/tori-welcome.mp3');player.current=a;a.preload='none';a.volume=.75;a.onended=stop;a.onerror=()=>{stop();setMessage('음성을 불러오지 못했어요. 위의 글로 안내를 읽어 주세요.');};setMediaQuiet(true);setPlaying(true);try{await a.play();if(!alive.current||ticket!==request.current){a.pause();return;}}catch{if(!alive.current||ticket!==request.current)return;stop();setMessage('재생을 시작하지 못했어요. 다시 눌러 주세요.');}}
 return <div className="npc-voice"><button className="secondary" disabled={muted} aria-pressed={playing} onClick={()=>void toggle()}>{playing?'안내 음성 멈추기':'안내 음성 듣기'}</button><small> AI 생성 음성 · 위의 안내 글과 같은 내용</small>{muted&&<p>소리를 켜면 안내 음성을 들을 수 있어요.</p>}<p role="status">{message}</p></div>;
}
