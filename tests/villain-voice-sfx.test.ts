// @vitest-environment node
import {describe,expect,it,vi} from 'vitest';

// Stand-ins for the browser: media elements that record play/pause, and a small DOM for the encounter layer.
class FakeAudio{src:string;volume=1;currentTime=0;paused=true;preload='';plays=0;constructor(src:string){this.src=src;}play(){this.paused=false;this.plays++;return Promise.resolve();}pause(){this.paused=true;}}
const g=globalThis as Record<string,unknown>;
g.document={hidden:false,addEventListener(){},removeEventListener(){}};
g.Audio=FakeAudio;
g.AudioContext=class{state='running';currentTime=0;destination={};resume(){return Promise.resolve();}suspend(){return Promise.resolve();}close(){return Promise.resolve();}createGain(){return {gain:{setTargetAtTime(){}},connect(){},disconnect(){}};}decodeAudioData(){return Promise.resolve({duration:60});}};
g.fetch=()=>new Promise(()=>{});

class El{ownerDocument:any;style={setProperty(){}};dataset:Record<string,string>={};hidden=false;textContent='';children:El[]=[];attrs:Record<string,string>={};
 listeners:Record<string,()=>void>={};clientWidth=800;clientHeight=600;isConnected=false;role='';type='';className='';innerHTML='';title='';namespaceURI='';
 classList={add(){},remove(){},contains:()=>false,toggle(){}};constructor(doc:any){this.ownerDocument=doc;}
 append(...n:El[]){this.children.push(...n);}remove(){}after(){}setAttribute(k:string,v:string){this.attrs[k]=v;}getAttribute(k:string){return this.attrs[k]??null;}
 addEventListener(t:string,fn:()=>void){this.listeners[t]=fn;}closest(){return null;}querySelector(){return null;}querySelectorAll(){return [];}contains(){return false;}
 getBoundingClientRect(){return {left:0,top:0,right:0,bottom:0,width:0,height:0};}getClientRects(){return [];}focus(){}}

describe('villain voice lines and map fight cues',()=>{
 it('fight cues play at their level under a voice; other effects still wait for it',async()=>{
  const audio=await import('../src/services/audio');
  audio.updateAudio({muted:false,bgm:0,sfx:.4,voice:true,reducedMotion:false});audio.startAudio();
  audio.playSound('map-swing');
  audio.setMediaQuiet('line',true);
  audio.playSound('map-hit-1');audio.playSound('select');audio.playSound('card-reveal');
  const played=(name:string)=>created.filter(a=>a.src.endsWith(`/${name}.mp3`));
  expect(played('map-swing')[0].paused,'the voice starting does not cut the swing').toBe(false);
  expect(played('map-hit-1')[0].plays).toBe(1);
  expect(played('map-hit-1')[0].volume).toBeGreaterThanOrEqual(.4*.7);
  expect(played('select')).toHaveLength(0);
  expect(played('card-reveal'),'card cues are not fight cues').toHaveLength(0);
  audio.setMediaQuiet('line',false);audio.stopAudio();
 });

 it('a hit or exit line starts 300 ms after its fight cue; a taunt at once',async()=>{
  vi.useFakeTimers();
  try{
   const {mountMapEncounters}=await import('../src/map-encounters.js');
   let clock=1000;
   const view={performance:{now:()=>clock},setTimeout:(fn:()=>void,ms:number)=>setTimeout(fn,ms),clearTimeout:(id:number)=>clearTimeout(id),addEventListener(){},HTMLElement:El,matchMedia:()=>({matches:false})};
   const doc:any={defaultView:view,hidden:false,activeElement:null,createElement:()=>new El(doc),createElementNS:()=>new El(doc),querySelector:()=>null,querySelectorAll:()=>[]};
   doc.head=new El(doc);
   const host=new El(doc),events:[number,string,string][]=[];
   const map=mountMapEncounters({host:host as never,stages:[{id:'0',name:'공방',x:100,y:100,lines:['도발!'],hit:['하나!','둘!'],finish:'퇴장!'}] as never,art:{left:'a.png'} as never,
    tone:(kind:string)=>events.push([clock,'sfx',kind]),say:(text:string)=>events.push([clock,'voice',text])});
   const all=(el:El):El[]=>[el,...el.children.flatMap(all)];
   const attack=all(host).find(el=>el.listeners.click)!;
   const advance=(ms:number)=>{clock+=ms;vi.advanceTimersByTime(ms);};
   const frame=()=>map.update({hero:{x:110,y:100},ally:null,project:(p:{x:number;y:number})=>p,scale:1,now:clock} as never);
   frame();
   expect(events.find(e=>e[1]==='voice')?.[2],'the taunt is read at once').toBe('도발!');
   for(let n=1;n<=3;n++){
    advance(3000);frame();events.length=0;attack.listeners.click();
    advance(90);
    const landed=events.find(e=>e[2]===(n===3?'finish':'hit'));
    expect(landed).toBeTruthy();expect(events.some(e=>e[1]==='voice')).toBe(false);
    advance(299);expect(events.some(e=>e[1]==='voice')).toBe(false);
    advance(1);
    const said=events.find(e=>e[1]==='voice')!;
    expect(said[2]).toBe(n===3?'퇴장!':['하나!','둘!'][n-1]);
    expect(said[0]-landed![0]).toBeGreaterThanOrEqual(300);
   }
   map.destroy();
  }finally{vi.useRealTimers();}
 });
});
const created:FakeAudio[]=[];
g.Audio=class extends FakeAudio{constructor(src:string){super(src);created.push(this);}};
