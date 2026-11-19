import type {Settings} from '../domain/model';
export type Sound='select'|'drop'|'success'|'hint'|'experiment'|'pour'|'air'|'retry'|MapSound|CardSound|OpenSound;
// Map villain cues (CC0, see assets/CREDITS.md): swing, three material hits, exit, entrance, bump and the all-clear jingle.
export type MapSound='map-swing'|'map-hit-1'|'map-hit-2'|'map-hit-3'|'map-exit'|'map-appear'|'map-bump'|'map-victory';
// Achievement card cues (CC0, same library): fly in, reveal (the rarest cards use the longer jingle), land in the slot, full set.
export type CardSound='card-whoosh'|'card-reveal'|'card-epic'|'card-slot'|'card-complete';
// A workshop comes back on the map (CC0, same library): a soft latch, then a small bell.
export type OpenSound='open-door'|'open-shine';
// Levels bring the library files near the Kenney UI sounds; the entrance stays soft.
const levels:Partial<Record<Sound,number>>={'map-hit-2':.85,'map-exit':.8,'map-appear':.55,'map-bump':.6,'map-victory':.75,'card-epic':.8,'card-complete':.75,'open-door':.9,'open-shine':.8};
let context:AudioContext|null=null,started=false;
// Why the music is ducked: one name tag per voice player or clip ('line', 'dialogue', 'story', 'ending', 'clip').
// It comes back only when every tag is gone, so a voice that ends never lifts the music under another one that is still speaking.
const quietTags=new Set<string>();
const quiet=()=>quietTags.size>0;
export type Music='main'|'finale';
// Suno tracks (references/suno). The main theme loops; the finale plays once and then rests.
const musicFiles:Record<Music,string>={main:'/assets/audio/bgm/main-theme.mp3',finale:'/assets/audio/bgm/finale.mp3'};
let music:HTMLAudioElement|null=null,track:Music='main',finaleDone=false;
// The map finale dialog (map-finale.js) borrows the finale song while it is open; `track` keeps the screen's own choice.
let mapFinale=false;
const nowPlaying=():Music=>mapFinale?'finale':track;
// main-theme.mp3 is cut to 26 bars (103.7 BPM) with the ring-out and pickup folded over the joint
// (docs/SUNO-BGM-PROMPTS.md). Web Audio loops those exact samples; <audio loop> would leave a gap.
const LOOP={start:11616/48000,end:2900786/48000};
let loopBuffer:AudioBuffer|null=null,loopLoad:Promise<void>|null=null,loopSource:AudioBufferSourceNode|null=null,loopGain:GainNode|null=null,loopFailed=false;
const musicVolume=()=>Math.min(1,settings.bgm*1.6)*(quiet()?.25:1);
function stopLoop(){if(!loopSource)return;try{loopSource.stop();}catch{}loopSource.disconnect();loopSource=null;}
let settings:Settings={muted:false,bgm:.18,sfx:.4,reducedMotion:false};
const activeCues=new Set<{osc:OscillatorNode;gain:GainNode}>();
const players=new Map<Sound,HTMLAudioElement>();
// Map villain fight cues keep playing under a character voice; a voice never mutes or drops them. Card cues are not map cues.
const fightCue=(name:Sound)=>name.startsWith('map-');
// Three effect lanes. Fight and reward cues (map-, card-, open-) sound together, four at most; a UI sound or a footstep never stops them.
// UI sounds (click, right, wrong, drop, hint, tools) are one at a time and only replace each other. Footsteps and the jump are a lane of their own (playMove).
const rewardCue=(name:Sound)=>/^(map|card|open)-/.test(name);
const REWARD_VOICES=4;
const startedAt=new Map<Sound,number>();
/** 'ui': a new UI sound replaces the last one. 'voice': a voice starts, only fight cues go on. 'all': mute, a hidden tab, the map finale. */
function stopEffects(scope:'all'|'ui'|'voice'='all'){
 for(const {osc,gain} of activeCues){osc.onended=null;try{osc.stop();}catch{}osc.disconnect();gain.disconnect();}activeCues.clear();
 players.forEach((a,name)=>{if(scope==='ui'&&rewardCue(name)||scope==='voice'&&fightCue(name))return;a.pause();a.currentTime=0;});
 if(scope==='all')stopMoves();
}
// Footsteps (map, sample walkway) and the walkway jump. They go through Web Audio, so their level is exact also where a media element's volume is fixed.
export type Move='step'|'jump';
const moveFiles:Record<Move,string[]>={step:['/assets/audio/step-1.mp3','/assets/audio/step-2.mp3'],jump:['/assets/audio/jump.mp3']};
// Times the effect volume: a step is a little under the music (0.16 at the default 0.4), halved under a voice.
const moveLevels:Record<Move,number>={step:.4,jump:.5};
const moveBuffers=new Map<string,AudioBuffer>(),moveSources=new Set<AudioBufferSourceNode>();
let moveLoad:Promise<unknown>|null=null,moveTurn=0;
function stopMoves(){moveSources.forEach(src=>{src.onended=null;try{src.stop();}catch{}src.disconnect();});moveSources.clear();}
function syncMusic(){
 const off=!started||settings.muted||settings.bgm===0,c=context,song=nowPlaying();
 // Main theme: a sample-exact Web Audio loop. A hidden tab suspends the context, so it resumes in place.
 if(off||song!=='main'||!c||loopFailed)stopLoop();
 else{
  if(!loopGain){loopGain=c.createGain();loopGain.connect(c.destination);}
  // Ducked under character voices and concept clips instead of stopping.
  loopGain.gain.setTargetAtTime(musicVolume(),c.currentTime,.08);
  if(!loopSource&&loopBuffer){const src=c.createBufferSource();src.buffer=loopBuffer;src.loop=true;src.loopStart=LOOP.start;src.loopEnd=Math.min(LOOP.end,loopBuffer.duration);src.connect(loopGain);src.start();loopSource=src;}
  else if(!loopSource&&!loopLoad)loopLoad=fetch(musicFiles.main).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.arrayBuffer();}).then(b=>c.decodeAudioData(b)).then(b=>{loopBuffer=b;}).catch(()=>{loopFailed=true;}).finally(()=>{loopLoad=null;syncMusic();});
 }
 // Finale (and the main theme if Web Audio cannot decode it) use a media element.
 const element=song==='finale'?'finale':loopFailed||!c?'main':null;
 if(off||document.hidden||!element||element==='finale'&&finaleDone){music?.pause();return;}
 if(!music||music.dataset.track!==element){music?.pause();music=new Audio(musicFiles[element]);music.dataset.track=element;music.loop=element==='main';music.preload='auto';music.onended=()=>{if(nowPlaying()==='finale'){finaleDone=true;}};}
 music.volume=musicVolume();
 if(music.paused)void music.play().catch(()=>{});
}
function sync(){syncMusic();if(settings.muted||settings.sfx===0||document.hidden)stopEffects();}
/** One footstep or jump. Steps take the two files in turn at a slightly different speed each time. It never stops another sound;
 * false when nothing was played (sound or effects off, hidden tab, map finale, files still loading). */
export function playMove(kind:Move){
 const c=context;
 if(!started||settings.muted||settings.sfx===0||document.hidden||mapFinale||!c||c.state!=='running')return false;
 moveLoad??=Promise.all(Object.values(moveFiles).flat().map(file=>fetch(file).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.arrayBuffer();}).then(b=>c.decodeAudioData(b)).then(b=>{moveBuffers.set(file,b);}).catch(()=>{})));
 const files=moveFiles[kind],buffer=moveBuffers.get(files[kind==='step'?moveTurn%files.length:0]);if(!buffer)return false;
 if(kind==='step')moveTurn++;
 const src=c.createBufferSource(),gain=c.createGain();
 src.buffer=buffer;src.playbackRate.value=kind==='step'?.94+Math.random()*.12:1;gain.gain.value=settings.sfx*moveLevels[kind]*(quiet()?.5:1);
 src.connect(gain);gain.connect(c.destination);moveSources.add(src);src.onended=()=>{moveSources.delete(src);src.disconnect();gain.disconnect();};src.start();
 return true;
}
// The finale always starts from its first bar, also when it was left half-way.
function restartFinale(){finaleDone=false;if(music?.dataset.track==='finale'){music.pause();music.currentTime=0;}}
export function setMusic(next:Music){if(next===track)return;track=next;if(next==='finale'&&!mapFinale)restartFinale();sync();}
function visibility(){sync();if(document.hidden){stopEffects();if(context?.state==='running')void context.suspend().catch(()=>{});}else if(started&&context?.state==='suspended')void context.resume().catch(()=>{});}
const voiceOff=new Set<()=>void>();
/** Voice players that are not tied to a component (services/lineVoice.ts) register here: turning sound or effects off stops their line at once. */
export function onVoiceOff(stop:()=>void){voiceOff.add(stop);}
export function updateAudio(value:Settings){settings=value;if(voiceMuted())voiceOff.forEach(stop=>stop());sync();}
// One character voice at a time across the players (line, dialogue, story, ending): the one that starts stops the others.
const voices=new Map<string,()=>void>();
/** A voice player calls this with its stop function when it starts a voice, and with null when that voice is over. */
export function voiceTurn(tag:string,stop:(()=>void)|null){if(!stop){voices.delete(tag);return;}voices.forEach((other,name)=>{if(name!==tag)other();});voices.set(tag,stop);}
/** Duck the music under a voice or clip. Each player holds its own tag and must let go of it when it ends, stops or fails. */
export function setMediaQuiet(tag:string,value:boolean){if(value===quietTags.has(tag))return;if(value){quietTags.add(tag);stopEffects('voice');}else quietTags.delete(tag);sync();}
/** True while any voice or clip holds the music down (effects other than fight cues stay silent then). */
export const mediaQuiet=quiet;
// map-finale.js announces its dialog: the finale song starts over while it is open (the film stays muted) and the main theme returns when it closes.
// Effects stop first, so the last card sound or the all-clear jingle does not run into the song.
function mapFinaleChange(event:Event){
 const open=!!(event as CustomEvent<{open?:boolean}>).detail?.open;if(open===mapFinale)return;
 mapFinale=open;
 if(open){stopEffects();restartFinale();}
 sync();
}
export function playSound(name:Sound){if(!started||settings.muted||settings.sfx===0||document.hidden||quiet()&&!fightCue(name))return;
 if(rewardCue(name)){
  // The oldest cue makes room when four others are still sounding.
  const live=[...players].filter(([other,a])=>other!==name&&rewardCue(other)&&!a.paused&&!a.ended).sort((x,y)=>(startedAt.get(x[0])??0)-(startedAt.get(y[0])??0));
  while(live.length>=REWARD_VOICES){const a=live.shift()![1];a.pause();a.currentTime=0;}
 }else stopEffects('ui');
 if((name==='pour'||name==='air')&&context?.state==='running'){const c=context;[0,.075,.15].forEach((delay,i)=>{const osc=c.createOscillator(),gain=c.createGain(),t=c.currentTime+delay;osc.type='sine';osc.frequency.setValueAtTime(name==='pour'?420+i*140:720-i*140,t);osc.frequency.exponentialRampToValueAtTime(name==='pour'?700+i*90:300,t+.14);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(settings.sfx*.09,t+.008);gain.gain.exponentialRampToValueAtTime(.0001,t+.16);osc.connect(gain);gain.connect(c.destination);const node={osc,gain};activeCues.add(node);osc.onended=()=>{activeCues.delete(node);osc.disconnect();gain.disconnect();};osc.start(t);osc.stop(t+.18);});return;}let a=players.get(name);if(!a){a=new Audio(`/assets/audio/${name}.mp3`);a.preload='none';players.set(name,a);}else a.currentTime=0;
 startedAt.set(name,performance.now());a.volume=Math.min(1,settings.sfx*(levels[name]??1));void a.play().catch(()=>{});}
export function startAudio(){if(!started){document.addEventListener('visibilitychange',visibility);document.addEventListener('map-finale',mapFinaleChange);}started=true;try{if(!context)context=new AudioContext();if(context.state==='suspended')void context.resume().catch(()=>{});}catch{/* Silent play retains all visual feedback. */}sync();}
export function clickSound(success=false){playSound(success?'success':'select');}
/** A workshop is seen restored on the map: the latch, then the bell 0.12 s later. */
export function playOpen(){playSound('open-door');setTimeout(()=>playSound('open-shine'),120);}
export function stopAudio(){document.removeEventListener('visibilitychange',visibility);document.removeEventListener('map-finale',mapFinaleChange);stopEffects();players.clear();startedAt.clear();voices.clear();moveLoad=null;music?.pause();music=null;stopLoop();loopGain=null;if(context)void context.close().catch(()=>{});context=null;started=false;quietTags.clear();mapFinale=false;}
// Character lines (services/lineVoice.ts) follow the same mute and effect switches.
export const voiceMuted=()=>settings.muted||settings.sfx===0;
