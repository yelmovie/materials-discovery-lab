import {setMediaQuiet,voiceMuted,onVoiceOff} from './audio';

/** One character line at a time (concept captions, hints, map guide, villain bubbles).
 * A new line stops the previous one; music ducks while it plays (name tag 'line'); mute and the effect volume apply. */
let current:HTMLAudioElement|null=null,currentEnd:(()=>void)|undefined;
export function stopLine(){
 const audio=current;if(!audio)return;current=null;currentEnd=undefined;
 audio.onplaying=audio.onended=audio.onerror=null;audio.pause();audio.removeAttribute('src');audio.load();setMediaQuiet('line',false);
}
export function playLine(src:string|undefined,onEnd?:()=>void){
 stopLine();
 if(!src||voiceMuted()||document.hidden){onEnd?.();return false;}
 const audio=new Audio(src);current=audio;currentEnd=onEnd;audio.volume=.8;
 const done=()=>{if(current!==audio)return;current=null;currentEnd=undefined;setMediaQuiet('line',false);onEnd?.();};
 audio.onplaying=()=>{if(current===audio)setMediaQuiet('line',true);};audio.onended=done;audio.onerror=done;
 void audio.play().catch(done);
 return true;
}
export const linePlaying=()=>!!current&&!current.paused;
/** A line has been asked for and has not ended: also true while its file is still loading. */
export const lineBusy=()=>!!current;
// Sound or effects switched off in the middle of a line: it stops at once, and whoever waits for its end (a held concept clip) goes on.
onVoiceOff(()=>{const end=currentEnd;stopLine();end?.();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopLine();});
