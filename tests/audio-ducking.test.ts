// @vitest-environment node
import {beforeEach,describe,expect,it} from 'vitest';

// Stand-ins for the browser: media elements that record what was asked of them and a document that keeps its listeners.
class FakeAudio{src:string;volume=1;currentTime=0;paused=true;preload='';loop=false;plays=0;dataset:Record<string,string>={};
 onplaying:null|(()=>void)=null;onended:null|(()=>void)=null;onerror:null|(()=>void)=null;
 constructor(src:string){this.src=src;created.push(this);}
 play(){this.paused=false;this.plays++;return Promise.resolve();}pause(){this.paused=true;}removeAttribute(){}load(){}}
const created:FakeAudio[]=[];
const listeners:Record<string,Set<(event:unknown)=>void>>={};
const g=globalThis as Record<string,unknown>;
const doc={hidden:false,
 addEventListener(type:string,fn:(event:unknown)=>void){(listeners[type]??=new Set()).add(fn);},
 removeEventListener(type:string,fn:(event:unknown)=>void){listeners[type]?.delete(fn);}};
g.document=doc;g.Audio=FakeAudio;
// No Web Audio here: the main theme falls back to a media element, so both songs can be read the same way.
g.AudioContext=undefined;
const emit=(type:string,detail?:unknown)=>listeners[type]?.forEach(fn=>fn({detail}));
const song=(name:string)=>created.filter(a=>a.src.endsWith(`/bgm/${name}.mp3`)).at(-1);
const settings={muted:false,bgm:.18,sfx:.4,reducedMotion:false};
const full=Math.min(1,settings.bgm*1.6);

describe('music ducking by name tag',()=>{
 beforeEach(()=>{created.length=0;doc.hidden=false;});

 it('the music returns only when every voice has let go',async()=>{
  const audio=await import('../src/services/audio');
  audio.updateAudio(settings);audio.startAudio();
  const main=song('main-theme')!;
  expect(main.paused).toBe(false);expect(main.volume).toBeCloseTo(full);
  audio.setMediaQuiet('line',true);audio.setMediaQuiet('dialogue',true);
  expect(main.volume).toBeCloseTo(full*.25);expect(main.paused,'ducked, not stopped').toBe(false);
  audio.setMediaQuiet('line',false);
  expect(main.volume,'another voice is still speaking').toBeCloseTo(full*.25);expect(audio.mediaQuiet()).toBe(true);
  audio.setMediaQuiet('line',false);
  expect(main.volume,'letting go twice changes nothing').toBeCloseTo(full*.25);
  audio.setMediaQuiet('dialogue',false);
  expect(main.volume).toBeCloseTo(full);expect(audio.mediaQuiet()).toBe(false);
  audio.setMediaQuiet('clip',true);audio.stopAudio();
  expect(audio.mediaQuiet(),'stopping the audio drops every tag').toBe(false);
 });

 it('the map finale dialog plays the finale song from the start and gives the main theme back',async()=>{
  const audio=await import('../src/services/audio');
  audio.updateAudio(settings);audio.startAudio();
  const main=song('main-theme')!;
  audio.playSound('card-slot');
  const slot=created.find(a=>a.src.endsWith('/card-slot.mp3'))!;
  emit('map-finale',{open:true});
  const finale=song('finale')!;
  expect(main.paused).toBe(true);expect(finale.paused).toBe(false);expect(finale.volume).toBeCloseTo(full);
  expect(slot.paused,'effects make way for the song').toBe(true);
  finale.currentTime=30;
  emit('map-finale',{open:false});
  expect(finale.paused).toBe(true);expect(song('main-theme')!.paused).toBe(false);
  emit('map-finale',{open:true});
  expect(song('finale')!.paused).toBe(false);expect(song('finale')!.currentTime,'a second showing starts over').toBe(0);
  emit('map-finale',{open:false});
  // The ending screen asks for the same song: it is not left half-way either.
  song('finale')!.currentTime=12;
  audio.setMusic('finale');
  expect(song('finale')!.paused).toBe(false);expect(song('finale')!.currentTime).toBe(0);
  audio.setMusic('main');audio.stopAudio();
 });

 it('switching sound or effects off stops a line that is being read, and its waiter goes on',async()=>{
  const audio=await import('../src/services/audio');
  const {playLine,lineBusy}=await import('../src/services/lineVoice');
  audio.updateAudio(settings);audio.startAudio();
  let ended=0;
  expect(playLine('/assets/audio/npc-elevenlabs/villain-core-4.mp3',()=>ended++)).toBe(true);
  const line=created.find(a=>a.src.endsWith('villain-core-4.mp3'))!;
  expect(lineBusy(),'busy while the file is still loading').toBe(true);expect(audio.mediaQuiet()).toBe(false);
  line.onplaying?.();
  expect(audio.mediaQuiet()).toBe(true);
  audio.updateAudio({...settings,sfx:0});
  expect(line.paused).toBe(true);expect(lineBusy()).toBe(false);expect(audio.mediaQuiet()).toBe(false);expect(ended).toBe(1);
  expect(playLine('/assets/audio/npc-elevenlabs/villain-core-4.mp3'),'no line while effects are off').toBe(false);
  audio.updateAudio(settings);audio.stopAudio();
 });
});
