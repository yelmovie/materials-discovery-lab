// @vitest-environment node
import {beforeEach,describe,expect,it,vi} from 'vitest';

// Stand-ins for the browser: media elements and Web Audio sources that record what was asked of them.
class FakeAudio{src:string;volume=1;currentTime=0;paused=true;ended=false;preload='';loop=false;plays=0;dataset:Record<string,string>={};
 onplaying:null|(()=>void)=null;onended:null|(()=>void)=null;onerror:null|(()=>void)=null;
 constructor(src:string){this.src=src;created.push(this);}
 play(){this.paused=false;this.plays++;return Promise.resolve();}pause(){this.paused=true;}removeAttribute(){}load(){}}
const created:FakeAudio[]=[];
interface Step{file:string;rate:number;gain:number;stopped:boolean}
const steps:Step[]=[];
class FakeContext{state='running';currentTime=0;destination={};
 resume(){return Promise.resolve();}suspend(){return Promise.resolve();}close(){return Promise.resolve();}
 createGain(){return {gain:{value:1,setTargetAtTime(){}},connect(){},disconnect(){}};}
 decodeAudioData(data:{file:string}){return Promise.resolve({duration:.4,file:data.file});}
 createBufferSource(){
  const gains:{gain:{value:number}}[]=[],step:Step={file:'',rate:1,gain:1,stopped:false};
  return {buffer:null as null|{file:string},playbackRate:{value:1},onended:null,loop:false,
   connect(node:{gain:{value:number}}){gains.push(node);},disconnect(){},
   start(){step.file=this.buffer!.file;step.rate=this.playbackRate.value;step.gain=gains[0].gain.value;steps.push(step);},
   stop(){step.stopped=true;}};
 }}
const listeners:Record<string,Set<(event:unknown)=>void>>={};
const g=globalThis as Record<string,unknown>;
const doc={hidden:false,
 addEventListener(type:string,fn:(event:unknown)=>void){(listeners[type]??=new Set()).add(fn);},
 removeEventListener(type:string,fn:(event:unknown)=>void){listeners[type]?.delete(fn);}};
g.document=doc;g.Audio=FakeAudio;g.AudioContext=FakeContext;
// The main theme never finishes loading here; the footstep files do.
g.fetch=(url:string)=>url.includes('/bgm/')?new Promise(()=>{}):Promise.resolve({ok:true,arrayBuffer:()=>Promise.resolve({file:url})});
const emit=(type:string,detail?:unknown)=>listeners[type]?.forEach(fn=>fn({detail}));
const sound=(name:string)=>created.filter(a=>a.src.endsWith(`/${name}.mp3`)).at(-1)!;
const settings={muted:false,bgm:0,sfx:.4,voice:true,reducedMotion:false};
const settle=()=>new Promise(resolve=>setTimeout(resolve,0));

describe('effect lanes, footsteps and voice turns',()=>{
 beforeEach(()=>{created.length=0;steps.length=0;doc.hidden=false;});

 it('a UI sound replaces only the last UI sound; fight and reward cues play on, four at most',async()=>{
  const audio=await import('../src/services/audio');
  audio.updateAudio(settings);audio.startAudio();
  audio.playSound('map-swing');audio.playSound('map-hit-3');audio.playSound('card-whoosh');
  expect(sound('map-swing').paused,'a hit does not cut the swing').toBe(false);
  audio.playSound('select');
  expect(sound('map-hit-3').paused,'a click does not cut the hit').toBe(false);
  expect(sound('card-whoosh').paused,'nor the card').toBe(false);
  audio.playSound('success');
  expect(sound('select').paused,'UI sounds are one at a time').toBe(true);
  expect(sound('success').paused).toBe(false);expect(sound('map-hit-3').paused).toBe(false);
  audio.playSound('card-reveal');
  expect(sound('success').paused,'a reward cue leaves the UI sound alone').toBe(false);
  expect(['map-swing','map-hit-3','card-whoosh','card-reveal'].every(name=>!sound(name).paused)).toBe(true);
  audio.playSound('card-slot');
  expect(sound('map-swing').paused,'the oldest of five makes room').toBe(true);
  expect(['map-hit-3','card-whoosh','card-reveal','card-slot'].every(name=>!sound(name).paused)).toBe(true);
  // The same cue again starts over instead of being skipped.
  sound('card-slot').currentTime=.2;audio.playSound('card-slot');
  expect(sound('card-slot').currentTime).toBe(0);expect(sound('card-slot').plays).toBe(2);
  audio.stopAudio();
 });

 it('footsteps take two files in turn at a low level, never stop a cue, and follow mute, voices and the map finale',async()=>{
  const audio=await import('../src/services/audio');
  audio.updateAudio(settings);
  expect(audio.playMove('step'),'nothing before the first touch').toBe(false);
  audio.startAudio();
  expect(audio.playMove('step'),'the files are still loading').toBe(false);
  await settle();
  audio.playSound('map-hit-1');audio.playSound('select');
  for(let i=0;i<4;i++)expect(audio.playMove('step')).toBe(true);
  expect(steps.map(s=>s.file.replace(/.*\//,''))).toEqual(['step-1.mp3','step-2.mp3','step-1.mp3','step-2.mp3']);
  for(const step of steps){expect(step.rate).toBeGreaterThanOrEqual(.94);expect(step.rate).toBeLessThanOrEqual(1.06);expect(step.gain).toBeCloseTo(.4*.4);}
  expect(sound('map-hit-1').paused,'a step does not cut a fight cue').toBe(false);
  expect(sound('select').paused,'nor a UI sound').toBe(false);
  audio.playSound('success');
  expect(steps.every(s=>!s.stopped),'a UI sound does not cut a step').toBe(true);
  expect(audio.playMove('jump')).toBe(true);
  expect(steps.at(-1)!.file).toMatch(/jump\.mp3$/);expect(steps.at(-1)!.rate).toBe(1);expect(steps.at(-1)!.gain).toBeCloseTo(.4*.5);
  audio.setMediaQuiet('line',true);
  expect(audio.playMove('step')).toBe(true);expect(steps.at(-1)!.gain,'half under a voice').toBeCloseTo(.4*.4*.5);
  audio.setMediaQuiet('line',false);
  const before=steps.length;
  emit('map-finale',{open:true});
  expect(audio.playMove('step'),'silent behind the finale dialog').toBe(false);
  emit('map-finale',{open:false});
  doc.hidden=true;expect(audio.playMove('step')).toBe(false);doc.hidden=false;
  audio.updateAudio({...settings,sfx:0});expect(audio.playMove('step')).toBe(false);
  audio.updateAudio({...settings,muted:true});expect(audio.playMove('step')).toBe(false);
  expect(steps).toHaveLength(before);
  expect(steps.at(-1)!.stopped,'switching sound off stops a step that is sounding').toBe(true);
  audio.updateAudio(settings);audio.stopAudio();
 });

 it('the restored-workshop cue is a latch and a bell 0.12 s later, both reward cues',async()=>{
  const audio=await import('../src/services/audio');
  audio.updateAudio(settings);audio.startAudio();
  vi.useFakeTimers();
  try{
   audio.playOpen();
   expect(sound('open-door').paused).toBe(false);expect(sound('open-shine')).toBeUndefined();
   vi.advanceTimersByTime(119);expect(sound('open-shine')).toBeUndefined();
   vi.advanceTimersByTime(1);expect(sound('open-shine').paused).toBe(false);
   audio.playSound('select');
   expect(sound('open-door').paused).toBe(false);expect(sound('open-shine').paused).toBe(false);
  }finally{vi.useRealTimers();}
  audio.stopAudio();
 });

 it('one voice at a time: the player that starts stops the others',async()=>{
  const audio=await import('../src/services/audio');
  const {playLine,lineBusy}=await import('../src/services/lineVoice');
  audio.updateAudio(settings);audio.startAudio();
  let ended=0,dialogueStopped=0;
  playLine('/assets/audio/npc-elevenlabs/villain-core-4.mp3',()=>ended++);
  const line=created.at(-1)!;line.onplaying?.();
  expect(audio.mediaQuiet()).toBe(true);
  // A dialogue voice starts while the line is being read.
  audio.voiceTurn('dialogue',()=>dialogueStopped++);
  expect(line.paused).toBe(true);expect(lineBusy()).toBe(false);expect(ended,'whoever waited for the line goes on').toBe(1);
  expect(audio.mediaQuiet(),'the line let go of the music').toBe(false);expect(dialogueStopped).toBe(0);
  // Then a line starts while the dialogue voice is still speaking.
  playLine('/assets/audio/npc-elevenlabs/villain-core-4.mp3');
  expect(dialogueStopped).toBe(1);expect(created.at(-1)!.paused).toBe(false);
  // A voice that is over no longer gets stopped.
  audio.voiceTurn('dialogue',null);
  playLine('/assets/audio/npc-elevenlabs/villain-core-4.mp3');
  expect(dialogueStopped).toBe(1);
  audio.stopAudio();
 });

 it('the activity-complete chime rings out under the clip and voice that follow it; any other UI sound still gives way',async()=>{
  const audio=await import('../src/services/audio');
  audio.updateAudio(settings);audio.startAudio();
  audio.clickSound(true,true);
  expect(audio.soundPlaying('success')).toBe(true);
  audio.setMediaQuiet('clip',true);audio.setMediaQuiet('line',true);
  expect(sound('success').paused,'kept under the concept clip and its first caption').toBe(false);
  audio.setMediaQuiet('clip',false);audio.setMediaQuiet('line',false);
  audio.playSound('select');
  expect(sound('success').paused,'the next UI sound replaces it as usual').toBe(true);expect(audio.soundPlaying('success')).toBe(false);
  audio.clickSound(true);audio.setMediaQuiet('line',true);
  expect(sound('success').paused,'not kept unless asked').toBe(true);
  audio.setMediaQuiet('line',false);
  // A kept chime is forgotten once replaced: the same sound played plainly later is cut again.
  audio.clickSound(true,true);audio.playSound('drop');audio.clickSound(true);audio.setMediaQuiet('clip',true);
  expect(sound('success').paused).toBe(true);
  audio.setMediaQuiet('clip',false);audio.stopAudio();
 });

 it('map voices take turns: a villain line waits for the guide (2 s, then skipped), the guide waits for a villain (2 s at most)',async()=>{
  const audio=await import('../src/services/audio');
  const {playTurnLine,stopLine,lineBusy}=await import('../src/services/lineVoice');
  audio.updateAudio(settings);audio.startAudio();
  const voice=(name:string)=>created.filter(a=>a.src===name);
  vi.useFakeTimers();
  try{
   // The guide is being read; the villain's line comes after it.
   playTurnLine('guide-a','guide');const guideA=voice('guide-a')[0];guideA.onplaying?.();
   playTurnLine('villain-a','villain');
   expect(guideA.paused,'the guide is not cut').toBe(false);expect(voice('villain-a')).toHaveLength(0);expect(lineBusy()).toBe(true);
   vi.advanceTimersByTime(1000);expect(voice('villain-a')).toHaveLength(0);
   guideA.onended?.();vi.advanceTimersByTime(100);
   expect(voice('villain-a')).toHaveLength(1);expect(voice('villain-a')[0].paused).toBe(false);
   // A villain line is being read; the guide's line comes after it, and closing the bubble does not stop the villain.
   const villainA=voice('villain-a')[0];
   playTurnLine('guide-b','guide');
   expect(villainA.paused).toBe(false);expect(voice('guide-b')).toHaveLength(0);
   stopLine('guide');vi.advanceTimersByTime(3000);
   expect(villainA.paused,'closing the guide leaves the villain line').toBe(false);expect(voice('guide-b'),'the waiting guide line was given up').toHaveLength(0);
   playTurnLine('guide-c','guide');vi.advanceTimersByTime(700);villainA.onended?.();vi.advanceTimersByTime(100);
   expect(voice('guide-c')).toHaveLength(1);
   // The guide goes on for more than 2 s: the villain's line is skipped.
   playTurnLine('villain-b','villain');vi.advanceTimersByTime(2300);
   expect(voice('villain-b')).toHaveLength(0);expect(voice('guide-c')[0].paused).toBe(false);
   voice('guide-c')[0].onended?.();expect(lineBusy()).toBe(false);
   // A long villain line: the guide starts after 2 s anyway.
   playTurnLine('villain-c','villain');expect(voice('villain-c')).toHaveLength(1);
   playTurnLine('guide-d','guide');vi.advanceTimersByTime(1900);expect(voice('guide-d')).toHaveLength(0);
   vi.advanceTimersByTime(200);expect(voice('guide-d')).toHaveLength(1);expect(voice('villain-c')[0].paused).toBe(true);
   // A villain's next line replaces its own at once (hit line over a taunt).
   stopLine();playTurnLine('villain-d','villain');playTurnLine('villain-e','villain');
   expect(voice('villain-d')[0].paused).toBe(true);expect(voice('villain-e')[0].paused).toBe(false);
   stopLine();
  }finally{vi.useRealTimers();}
  audio.stopAudio();
 });
});
