import {setMediaQuiet,voiceMuted} from './audio';

/** One character line at a time (concept captions, hints, map guide, villain bubbles).
 * A new line stops the previous one; music ducks while it plays; mute and the effect volume apply. */
let current:HTMLAudioElement|null=null;
export function stopLine(){
 const audio=current;if(!audio)return;current=null;
 audio.onplaying=audio.onended=audio.onerror=null;audio.pause();audio.removeAttribute('src');audio.load();setMediaQuiet(false);
}
export function playLine(src:string|undefined,onEnd?:()=>void){
 stopLine();
 if(!src||voiceMuted()||document.hidden){onEnd?.();return false;}
 const audio=new Audio(src);current=audio;audio.volume=.8;
 const done=()=>{if(current!==audio)return;current=null;setMediaQuiet(false);onEnd?.();};
 audio.onplaying=()=>{if(current===audio)setMediaQuiet(true);};audio.onended=done;audio.onerror=done;
 void audio.play().catch(done);
 return true;
}
export const linePlaying=()=>!!current&&!current.paused;
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopLine();});
