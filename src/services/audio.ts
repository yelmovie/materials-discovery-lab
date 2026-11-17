import type {Settings} from '../domain/model';
export type Sound='select'|'drop'|'success'|'hint'|'experiment'|'pour'|'air'|'retry'|MapSound;
// Map villain cues (CC0, see assets/CREDITS.md): swing, three material hits, exit, entrance, bump and the all-clear jingle.
export type MapSound='map-swing'|'map-hit-1'|'map-hit-2'|'map-hit-3'|'map-exit'|'map-appear'|'map-bump'|'map-victory';
// Levels bring the library files near the Kenney UI sounds; the entrance stays soft.
const levels:Partial<Record<Sound,number>>={'map-hit-2':.85,'map-exit':.8,'map-appear':.55,'map-bump':.6,'map-victory':.75};
let context:AudioContext|null=null,quiet=false,started=false;
export type Music='main'|'finale';
// Suno tracks (references/suno). The main theme loops; the finale plays once and then rests.
const musicFiles:Record<Music,string>={main:'/assets/audio/bgm/main-theme.mp3',finale:'/assets/audio/bgm/finale.mp3'};
let music:HTMLAudioElement|null=null,track:Music='main',finaleDone=false;
let settings:Settings={muted:false,bgm:.18,sfx:.4,reducedMotion:false};
const activeCues=new Set<{osc:OscillatorNode;gain:GainNode}>();
const players=new Map<Sound,HTMLAudioElement>();
function stopEffects(keep?:HTMLAudioElement){for(const {osc,gain} of activeCues){osc.onended=null;try{osc.stop();}catch{}osc.disconnect();gain.disconnect();}activeCues.clear();players.forEach(a=>{if(a===keep)return;a.pause();a.currentTime=0;});}
function syncMusic(){
 const silent=!started||settings.muted||settings.bgm===0||document.hidden||track==='finale'&&finaleDone;
 if(silent){music?.pause();return;}
 if(!music||music.dataset.track!==track){music?.pause();music=new Audio(musicFiles[track]);music.dataset.track=track;music.loop=track==='main';music.preload='auto';music.onended=()=>{if(track==='finale'){finaleDone=true;}};}
 // Ducked under character voices and concept clips instead of stopping.
 music.volume=Math.min(1,settings.bgm*1.6)*(quiet?.25:1);
 if(music.paused)void music.play().catch(()=>{});
}
function sync(){syncMusic();if(settings.muted||settings.sfx===0||document.hidden)stopEffects();}
export function setMusic(next:Music){if(next===track)return;track=next;if(next==='finale')finaleDone=false;sync();}
function visibility(){sync();if(document.hidden){stopEffects();if(context?.state==='running')void context.suspend().catch(()=>{});}else if(started&&context?.state==='suspended')void context.resume().catch(()=>{});}
export function updateAudio(value:Settings){settings=value;sync();}
export function setMediaQuiet(value:boolean){quiet=value;if(value)stopEffects();sync();}
export function playSound(name:Sound){if(!started||settings.muted||settings.sfx===0||document.hidden||quiet)return;stopEffects(name.startsWith('map-hit')?players.get('map-swing'):undefined);if((name==='pour'||name==='air')&&context?.state==='running'){const c=context;[0,.075,.15].forEach((delay,i)=>{const osc=c.createOscillator(),gain=c.createGain(),t=c.currentTime+delay;osc.type='sine';osc.frequency.setValueAtTime(name==='pour'?420+i*140:720-i*140,t);osc.frequency.exponentialRampToValueAtTime(name==='pour'?700+i*90:300,t+.14);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(settings.sfx*.09,t+.008);gain.gain.exponentialRampToValueAtTime(.0001,t+.16);osc.connect(gain);gain.connect(c.destination);const node={osc,gain};activeCues.add(node);osc.onended=()=>{activeCues.delete(node);osc.disconnect();gain.disconnect();};osc.start(t);osc.stop(t+.18);});return;}let a=players.get(name);if(!a){a=new Audio(`/assets/audio/${name}.mp3`);a.preload='none';players.set(name,a);}a.volume=Math.min(1,settings.sfx*(levels[name]??1));void a.play().catch(()=>{});}
export function startAudio(){if(!started)document.addEventListener('visibilitychange',visibility);started=true;sync();try{if(!context)context=new AudioContext();if(context.state==='suspended')void context.resume().catch(()=>{});}catch{/* Silent play retains all visual feedback. */}}
export function clickSound(success=false){playSound(success?'success':'select');}
export function stopAudio(){document.removeEventListener('visibilitychange',visibility);stopEffects();players.clear();music?.pause();music=null;if(context)void context.close().catch(()=>{});context=null;started=false;quiet=false;}
