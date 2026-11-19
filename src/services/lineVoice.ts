import {setMediaQuiet,voiceMuted,onVoiceOff,voiceTurn} from './audio';

/** One character line at a time (concept captions, hints, map guide, villain bubbles).
 * A new line stops the previous one and any other voice player (dialogue, story, ending); music ducks while it plays (name tag 'line'); mute and the effect volume apply. */
let current:HTMLAudioElement|null=null,currentEnd:(()=>void)|undefined;
// The two map speakers take turns (playTurnLine). Other lines carry no name.
export type Speaker='villain'|'guide';
let speaker:Speaker|undefined;
const waiting=new Map<Speaker,ReturnType<typeof setTimeout>>();
const TURN_WAIT=2000,TURN_POLL=100;
/** A line of this speaker that still waits for its turn (or for the first input) is given up. */
export function dropTurnLine(who:Speaker){const timer=waiting.get(who);if(timer!==undefined){clearTimeout(timer);waiting.delete(who);}if(early?.who===who)early=null;}
// Before the first tap or key of the page (just opened or reloaded) the browser refuses to play a voice. The last line asked for then waits
// and is read right after that first input, unless the input itself starts another line or stops it (a new screen, a closed bubble).
let early:{play:()=>void;who?:Speaker}|null=null;
const activated=()=>{const activation=(globalThis.navigator as Navigator|undefined)?.userActivation;return !activation||activation.hasBeenActive;};
function firstInput(){document.removeEventListener('pointerdown',firstInput,true);document.removeEventListener('keydown',firstInput,true);setTimeout(()=>{const line=early;early=null;if(line&&!document.hidden)line.play();},0);}
document.addEventListener('pointerdown',firstInput,true);document.addEventListener('keydown',firstInput,true);
function halt(){
 const audio=current;if(!audio)return;current=null;currentEnd=undefined;speaker=undefined;
 audio.onplaying=audio.onended=audio.onerror=null;audio.pause();audio.removeAttribute('src');audio.load();setMediaQuiet('line',false);voiceTurn('line',null);
}
/** Stops the line. With a speaker: only that speaker's line and its waiting line (closing the guide bubble leaves a villain's line alone). */
export function stopLine(who?:Speaker){
 if(who===undefined){waiting.forEach((_,name)=>dropTurnLine(name));early=null;}else dropTurnLine(who);
 if(who===undefined||speaker===who)halt();
}
export function playLine(src:string|undefined,onEnd?:()=>void,who?:Speaker){
 halt();early=null;
 if(!src||voiceMuted()||document.hidden){onEnd?.();return false;}
 // Not tried before the first input (it would be refused): whoever waits for its end goes on now, the line itself comes after the input.
 if(!activated()){early={play:()=>{playLine(src,undefined,who);},who};onEnd?.();return false;}
 const audio=new Audio(src);current=audio;currentEnd=onEnd;speaker=who;audio.volume=.8;voiceTurn('line',yieldLine);
 const done=()=>{if(current!==audio)return;current=null;currentEnd=undefined;speaker=undefined;setMediaQuiet('line',false);voiceTurn('line',null);onEnd?.();};
 audio.onplaying=()=>{if(current===audio)setMediaQuiet('line',true);};audio.onended=done;audio.onerror=done;
 void audio.play().catch(done);
 return true;
}
/** Map voices take turns instead of cutting each other. A villain's short line waits while another character's line is read and is skipped
 * if that takes more than 2 s. The guide's line waits for a villain's line and starts after 2 s at the latest. A speaker's newer line replaces its own. */
export function playTurnLine(src:string|undefined,who:Speaker){
 dropTurnLine(who);
 if(!src)return;
 const asked=Date.now();
 const turn=()=>{
  waiting.delete(who);
  const busy=!!current&&speaker!==who&&(who==='villain'||speaker==='villain');
  if(!busy||who==='guide'&&Date.now()-asked>=TURN_WAIT){playLine(src,undefined,who);return;}
  if(Date.now()-asked<TURN_WAIT)waiting.set(who,setTimeout(turn,TURN_POLL));
 };
 turn();
}
export const linePlaying=()=>!!current&&!current.paused;
/** A line has been asked for and has not ended: also true while its file is still loading or it waits for its turn. */
export const lineBusy=()=>!!current||waiting.size>0;
// Sound or effects switched off in the middle of a line, or another voice player starts: it stops at once, and whoever waits for its end (a held concept clip) goes on.
function yieldLine(){const end=currentEnd;stopLine();end?.();}
onVoiceOff(yieldLine);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopLine();});
