import type {Settings} from '../domain/model';
export type Sound='select'|'drop'|'success'|'hint'|'experiment'|'pour'|'air'|'retry';
let context:AudioContext|null=null,bgm:GainNode|null=null,timer:ReturnType<typeof setInterval>|null=null,note=0,quiet=false,started=false;
let settings:Settings={muted:false,bgm:.18,sfx:.4,reducedMotion:false};
const players=new Map<Sound,HTMLAudioElement>();
function stopEffects(){players.forEach(a=>{a.pause();a.currentTime=0;});}
function sync(){if(bgm)bgm.gain.value=settings.muted||quiet||document.hidden?0:settings.bgm*.7;if(settings.muted||settings.sfx===0||document.hidden)stopEffects();}
function visibility(){sync();if(document.hidden){stopEffects();if(context?.state==='running')void context.suspend().catch(()=>{});}else if(started&&context?.state==='suspended')void context.resume().catch(()=>{});}
export function updateAudio(value:Settings){settings=value;sync();}
export function setMediaQuiet(value:boolean){quiet=value;if(value)stopEffects();sync();}
export function playSound(name:Sound){if(!started||settings.muted||settings.sfx===0||document.hidden||quiet)return;stopEffects();let a=players.get(name);if(!a){a=new Audio(`/assets/audio/${name}.mp3`);a.preload='none';players.set(name,a);}a.volume=Math.min(1,settings.sfx);void a.play().catch(()=>{});}
export function startAudio(){started=true;try{if(!context){context=new AudioContext();bgm=context.createGain();bgm.connect(context.destination);sync();document.addEventListener('visibilitychange',visibility);timer=setInterval(()=>{if(context?.state!=='running'||document.hidden||quiet||settings.muted||!bgm||settings.bgm===0)return;const o=context.createOscillator(),g=context.createGain(),t=context.currentTime;o.type='sine';o.frequency.value=[261.63,329.63,392,523.25,392,329.63,293.66,392][note++%8];g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.055,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+1.3);o.connect(g);g.connect(bgm);o.start(t);o.stop(t+1.4);o.onended=()=>{o.disconnect();g.disconnect();};},850);}if(context.state==='suspended')void context.resume().catch(()=>{});}catch{/* Silent play retains all visual feedback. */}}
export function clickSound(success=false){playSound(success?'success':'select');}
export function stopAudio(){document.removeEventListener('visibilitychange',visibility);if(timer)clearInterval(timer);timer=null;stopEffects();players.clear();if(context)void context.close().catch(()=>{});context=null;bgm=null;started=false;quiet=false;}
