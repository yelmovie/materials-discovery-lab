import {useEffect,useRef} from 'react';
import './npc-portrait.css';

type NpcPortraitProps = {
  name: string;
  src: string;
  emotion: 'encouraging' | 'happy';
  reducedMotion: boolean;
  className?: string;
};

export function NpcPortrait({name,src,emotion,reducedMotion,className=''}:NpcPortraitProps) {
  const frame = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const target = frame.current;
    const image = target?.querySelector('img');
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!target || !image || reducedMotion || preference.matches || document.hidden) return;
    let canceled = false;
    let animation: Animation | undefined;
    const stop = () => { canceled = true; animation?.cancel(); };
    const hidden = () => { if (document.hidden) stop(); };
    const reduce = () => { if (preference.matches) stop(); };
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('pagehide', stop);
    preference.addEventListener('change', reduce);
    const ready = image.complete && image.naturalWidth > 0 ? Promise.resolve() : image.decode();
    ready.then(() => {
      if (canceled || document.hidden || preference.matches) return;
      const frames = emotion === 'happy'
        ? [{transform:'translateY(0) rotate(0)'},{transform:'translateY(-3px) rotate(-2deg)',offset:.45},{transform:'translateY(0) rotate(0)'}]
        : [{opacity:.5,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}];
      animation = target.animate(frames,{duration:emotion === 'happy' ? 380 : 220,easing:'ease-out'});
    }).catch(() => {
      // The speaker name remains readable if the image cannot be decoded.
    });
    return () => {
      stop();
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('pagehide', stop);
      preference.removeEventListener('change', reduce);
    };
  }, [src,emotion,reducedMotion]);

  return <span className={`npc-portrait ${className}`} data-speaker={name} data-emotion={emotion}>
    <span ref={frame} className="npc-portrait-art"><img src={src} alt="" decoding="async" draggable={false}/></span>
    <span className="npc-speaker-name">{name}</span>
  </span>;
}
