import {useEffect,useRef,useState,type ReactNode} from 'react';
import {setMediaQuiet} from '../services/audio';
import './npc-dialogue.css';

type Props = {
  npc:string;
  name:string;
  lines:string[];
  kind:'mission'|'reward';
  muted:boolean;
  reducedMotion:boolean;
  children:ReactNode;
  detail?:ReactNode;
};

export function NpcDialogue({npc,name,lines,kind,muted,reducedMotion,children,detail}:Props) {
  const [index,setIndex]=useState(0);
  const [visible,setVisible]=useState('');
  const [playing,setPlaying]=useState(false);
  const [message,setMessage]=useState('');
  const character=useRef<HTMLDivElement>(null);
  const player=useRef<HTMLAudioElement|null>(null);
  const finish=useRef(()=>{});
  const text=lines[index];
  const emotion=kind==='reward'||index===2?'happy':index===1?'think':'neutral';
  const source=`/assets/audio/npc-elevenlabs/${npc}-${kind}${kind==='mission'?'-'+index:''}.mp3`;

  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    let frame=0,animation:Animation|undefined;
    const complete=()=>{cancelAnimationFrame(frame);setVisible(text);};
    finish.current=complete;
    const stop=()=>{complete();animation?.cancel();};
    const hidden=()=>{if(document.hidden)stop();};
    const reduce=()=>{if(media.matches)stop();};
    setVisible('');
    if(reducedMotion||media.matches||document.hidden)complete();
    else {
      const characters=Array.from(text),start=performance.now();
      const tick=(now:number)=>{
        const count=Math.floor((now-start)/24)+1;
        setVisible(characters.slice(0,count).join(''));
        if(count<characters.length)frame=requestAnimationFrame(tick);
      };
      frame=requestAnimationFrame(tick);
      animation=character.current?.animate([{opacity:.65,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,easing:'ease-out'});
    }
    document.addEventListener('visibilitychange',hidden);
    media.addEventListener('change',reduce);
    return()=>{cancelAnimationFrame(frame);animation?.cancel();document.removeEventListener('visibilitychange',hidden);media.removeEventListener('change',reduce);};
  },[text,reducedMotion]);

  useEffect(()=>{
    let alive=true;
    const audio=new Audio(source);
    player.current=audio;
    audio.preload='metadata';
    audio.volume=.8;
    const update=()=>{
      const active=!audio.paused&&!audio.ended&&!document.hidden;
      if(alive)setPlaying(active);
      setMediaQuiet(active);
    };
    const stop=()=>{audio.pause();update();};
    const hidden=()=>{if(document.hidden)stop();};
    audio.onplaying=update;
    audio.onpause=audio.onended=()=>{if(alive)setPlaying(false);setMediaQuiet(false);};
    audio.onwaiting=()=>{if(alive)setPlaying(false);};
    audio.onerror=()=>{stop();if(alive)setMessage('목소리를 불러오지 못했어요. 글로도 읽을 수 있어요.');};
    setMessage('');setPlaying(false);
    // Defer playback until React has completed its mount/cleanup cycle.
    const frame=requestAnimationFrame(()=>{if(!muted&&!document.hidden)void audio.play().catch(()=>{if(alive)setMessage('듣기 버튼을 눌러 목소리를 들어요.');});});
    document.addEventListener('visibilitychange',hidden);
    window.addEventListener('pagehide',stop);
    return()=>{
      alive=false;cancelAnimationFrame(frame);
      audio.onplaying=audio.onpause=audio.onended=audio.onwaiting=audio.onerror=null;
      audio.pause();audio.removeAttribute('src');audio.load();setMediaQuiet(false);
      if(player.current===audio)player.current=null;
      document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',stop);
    };
  },[source,muted]);

  function advance(){if(visible!==text){finish.current();return;}if(index<lines.length-1)setIndex(index+1);}
  function listen(){const audio=player.current;if(!audio||muted)return;if(!audio.paused){audio.pause();return;}audio.currentTime=0;setMessage('');void audio.play().catch(()=>setMessage('듣기 버튼을 다시 눌러 주세요.'));}

  return <div className={`workshop-conversation ${playing?'is-speaking':''}`} data-emotion={emotion}>
    <div ref={character} className="workshop-character"><img src={`/assets/npc-expressions/${npc}-${emotion}.webp`} alt={`${name}의 ${emotion==='happy'?'기쁜':emotion==='think'?'생각하는':'반가운'} 표정`} onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src=npc==='moru'?'/assets/generated/companion.webp':`/assets/characters/${npc}.webp`;}} draggable={false}/></div>
    <section className="workshop-paper" aria-label={`${name}과의 대화`}>
      <div className="workshop-speaker"><strong>{name}</strong><span>{kind==='mission'?'공방 의뢰':'공방 복구'}</span></div>
      {detail&&<div className="workshop-detail">{detail}</div>}
      <button className="workshop-line" onClick={advance} aria-label={visible!==text?'대사 모두 보기':index<lines.length-1?'다음 대사':'대사 다시 읽기'}>
        <span className="workshop-layout" aria-hidden="true">{text}</span>
        <span className="workshop-visual" aria-hidden="true">{visible}</span>
      </button>
      <span className="workshop-readable" role="status">{text}</span>
      <div className="workshop-footer"><button className="secondary" onClick={listen} disabled={muted} aria-pressed={playing}>{playing?'목소리 멈추기':'목소리 듣기'}</button><span className="workshop-page">{kind==='mission'?`${index+1} / ${lines.length}`:'발견 완료'}</span><div className="workshop-actions">{index<lines.length-1?<button className="primary" onClick={advance}>{visible!==text?'대사 모두 보기':'이야기 계속'} ▾</button>:children}</div></div>
      {message&&<p className="workshop-message" role="status">{message}</p>}
    </section>
  </div>;
}
