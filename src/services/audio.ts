import type {Settings} from '../domain/model';
export type Sound='select'|'drop'|'success'|'hint'|'experiment'|'pour'|'air'|'retry'|MapSound|CardSound;
// Map villain cues (CC0, see assets/CREDITS.md): swing, three material hits, exit, entrance, bump and the all-clear jingle.
export type MapSound='map-swing'|'map-hit-1'|'map-hit-2'|'map-hit-3'|'map-exit'|'map-appear'|'map-bump'|'map-victory';
// Achievement card cues (CC0, same library): fly in, reveal (the rarest cards use the longer jingle), land in the slot, full set.
export type CardSound='card-whoosh'|'card-reveal'|'card-epic'|'card-slot'|'card-complete';
// Levels bring the library files near the Kenney UI sounds; the entrance stays soft.
const levels:Partial<Record<Sound,number>>={'map-hit-2':.85,'map-exit':.8,'map-appear':.55,'map-bump':.6,'map-victory':.75,'card-epic':.8,'card-complete':.75};
let context:AudioContext|null=null,quiet=false,started=false;
export type Music='main'|'finale';
// Suno tracks (references/suno). The main theme loops; the finale plays once and then rests.
const musicFiles:Record<Music,string>={main:'/assets/audio/bgm/main-theme.mp3',finale:'/assets/audio/bgm/finale.mp3'};
let music:HTMLAudioElement|null=null,track:Music='main',finaleDone=false;
// main-theme.mp3 is cut to 26 bars (103.7 BPM) with the ring-out and pickup folded over the joint
// (docs/SUNO-BGM-PROMPTS.md). Web Audio loops those exact samples; <audio loop> would leave a gap.
const LOOP={start:11616/48000,end:2900786/48000};
let loopBuffer:AudioBuffer|null=null,loopLoad:Promise<void>|null=null,loopSource:AudioBufferSourceNode|null=null,loopGain:GainNode|null=null,loopFailed=false;
const musicVolume=()=>Math.min(1,settings.bgm*1.6)*(quiet?.25:1);
function stopLoop(){if(!loopSource)return;try{loopSource.stop();}catch{}loopSource.disconnect();loopSource=null;}
let settings:Settings={muted:false,bgm:.18,sfx:.4,reducedMotion:false};
const activeCues=new Set<{osc:OscillatorNode;gain:GainNode}>();
const players=new Map<Sound,HTMLAudioElement>();
function stopEffects(keep?:HTMLAudioElement){for(const {osc,gain} of activeCues){osc.onended=null;try{osc.stop();}catch{}osc.disconnect();gain.disconnect();}activeCues.clear();players.forEach(a=>{if(a===keep)return;a.pause();a.currentTime=0;});}
function syncMusic(){
 const off=!started||settings.muted||settings.bgm===0,c=context;
 // Main theme: a sample-exact Web Audio loop. A hidden tab suspends the context, so it resumes in place.
 if(off||track!=='main'||!c||loopFailed)stopLoop();
 else{
  if(!loopGain){loopGain=c.createGain();loopGain.connect(c.destination);}
  // Ducked under character voices and concept clips instead of stopping.
  loopGain.gain.setTargetAtTime(musicVolume(),c.currentTime,.08);
  if(!loopSource&&loopBuffer){const src=c.createBufferSource();src.buffer=loopBuffer;src.loop=true;src.loopStart=LOOP.start;src.loopEnd=Math.min(LOOP.end,loopBuffer.duration);src.connect(loopGain);src.start();loopSource=src;}
  else if(!loopSource&&!loopLoad)loopLoad=fetch(musicFiles.main).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.arrayBuffer();}).then(b=>c.decodeAudioData(b)).then(b=>{loopBuffer=b;}).catch(()=>{loopFailed=true;}).finally(()=>{loopLoad=null;syncMusic();});
 }
 // Finale (and the main theme if Web Audio cannot decode it) use a media element.
 const element=track==='finale'?'finale':loopFailed||!c?'main':null;
 if(off||document.hidden||!element||element==='finale'&&finaleDone){music?.pause();return;}
 if(!music||music.dataset.track!==element){music?.pause();music=new Audio(musicFiles[element]);music.dataset.track=element;music.loop=element==='main';music.preload='auto';music.onended=()=>{if(track==='finale'){finaleDone=true;}};}
 music.volume=musicVolume();
 if(music.paused)void music.play().catch(()=>{});
}
function sync(){syncMusic();if(settings.muted||settings.sfx===0||document.hidden)stopEffects();}
export function setMusic(next:Music){if(next===track)return;track=next;if(next==='finale')finaleDone=false;sync();}
function visibility(){sync();if(document.hidden){stopEffects();if(context?.state==='running')void context.suspend().catch(()=>{});}else if(started&&context?.state==='suspended')void context.resume().catch(()=>{});}
export function updateAudio(value:Settings){settings=value;sync();}
export function setMediaQuiet(value:boolean){quiet=value;if(value)stopEffects();sync();}
export function playSound(name:Sound){if(!started||settings.muted||settings.sfx===0||document.hidden||quiet)return;stopEffects(name.startsWith('map-hit')?players.get('map-swing'):undefined);if((name==='pour'||name==='air')&&context?.state==='running'){const c=context;[0,.075,.15].forEach((delay,i)=>{const osc=c.createOscillator(),gain=c.createGain(),t=c.currentTime+delay;osc.type='sine';osc.frequency.setValueAtTime(name==='pour'?420+i*140:720-i*140,t);osc.frequency.exponentialRampToValueAtTime(name==='pour'?700+i*90:300,t+.14);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(settings.sfx*.09,t+.008);gain.gain.exponentialRampToValueAtTime(.0001,t+.16);osc.connect(gain);gain.connect(c.destination);const node={osc,gain};activeCues.add(node);osc.onended=()=>{activeCues.delete(node);osc.disconnect();gain.disconnect();};osc.start(t);osc.stop(t+.18);});return;}let a=players.get(name);if(!a){a=new Audio(`/assets/audio/${name}.mp3`);a.preload='none';players.set(name,a);}a.volume=Math.min(1,settings.sfx*(levels[name]??1));void a.play().catch(()=>{});}
export function startAudio(){if(!started)document.addEventListener('visibilitychange',visibility);started=true;try{if(!context)context=new AudioContext();if(context.state==='suspended')void context.resume().catch(()=>{});}catch{/* Silent play retains all visual feedback. */}sync();}
export function clickSound(success=false){playSound(success?'success':'select');}
export function stopAudio(){document.removeEventListener('visibilitychange',visibility);stopEffects();players.clear();music?.pause();music=null;stopLoop();loopGain=null;if(context)void context.close().catch(()=>{});context=null;started=false;quiet=false;}
