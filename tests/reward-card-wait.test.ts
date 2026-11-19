// @vitest-environment node
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';

// The shared card module is replaced by a recorder: this file only checks when the card is allowed to open.
const reveals:{index:number;at:number;close:()=>void}[]=[];
vi.mock('../src/reward-cards.js',()=>({createRewardCards:()=>({
 slotsHtml:()=>'',syncSlots(){},
 reveal:(index:number)=>new Promise<void>(close=>{reveals.push({index,at:Date.now(),close});}),
})}));

const g=globalThis as Record<string,unknown>;
const page={map:true,dialog:false};
g.document={hidden:false,addEventListener(){},removeEventListener(){},getElementById:()=>({inert:false}),
 querySelector:(selector:string)=>selector==='.world-page'?(page.map?{}:null):selector==='dialog[open]'?(page.dialog?{}:null):null};
g.window=globalThis;
g.Audio=class{src='';volume=1;currentTime=0;paused=true;play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}removeAttribute(){}load(){}};
g.AudioContext=undefined;

describe('an achievement card waits for the villain\'s parting line',()=>{
 beforeEach(()=>{vi.useFakeTimers();vi.setSystemTime(100000);reveals.length=0;page.map=true;page.dialog=false;});
 afterEach(()=>{reveals.forEach(r=>r.close());vi.useRealTimers();});

 it('no voice (sound off): the card follows the exit animation as before',async()=>{
  const {earnRewardCard,rewardCardDue}=await import('../src/reward-card-set');
  const t0=Date.now();
  earnRewardCard('materials',{materials:3},false);
  vi.advanceTimersByTime(740);expect(reveals).toHaveLength(0);expect(rewardCardDue()).toBe(false);
  vi.advanceTimersByTime(160);
  expect(reveals).toHaveLength(1);expect(reveals[0].index).toBe(0);expect(reveals[0].at-t0).toBeGreaterThanOrEqual(760);
  expect(rewardCardDue(),'an open card holds the villains and the finale').toBe(true);
  reveals[0].close();await vi.advanceTimersByTimeAsync(0);
  expect(rewardCardDue()).toBe(false);
 });

 it('a line that is being read: the card opens 360 ms after it ends, and the finale is held from the moment the bubble has gone',async()=>{
  const audio=await import('../src/services/audio');
  const {earnRewardCard,rewardCardDue}=await import('../src/reward-card-set');
  const t0=Date.now();
  earnRewardCard('properties',{properties:3},false);
  vi.advanceTimersByTime(300);audio.setMediaQuiet('line',true); // the parting line starts 0.3 s after the hit cue
  vi.advanceTimersByTime(2400);
  expect(reveals).toHaveLength(0);expect(rewardCardDue(),'the bubble (2.75 s) is still up: villains keep moving').toBe(false);
  vi.advanceTimersByTime(100);
  expect(rewardCardDue(),'from 2.75 s the finale (2.92 s) cannot slip in ahead of the card').toBe(true);
  vi.advanceTimersByTime(1700);expect(reveals).toHaveLength(0);
  audio.setMediaQuiet('line',false);const ended=Date.now();
  vi.advanceTimersByTime(300);expect(reveals,'not before the line has been over for 360 ms').toHaveLength(0);
  vi.advanceTimersByTime(300);
  expect(reveals).toHaveLength(1);expect(reveals[0].index).toBe(1);expect(reveals[0].at-ended).toBeGreaterThanOrEqual(360);expect(reveals[0].at-t0).toBeLessThan(8000);
  expect(rewardCardDue()).toBe(true);
  reveals[0].close();await vi.advanceTimersByTimeAsync(0);
  expect(rewardCardDue()).toBe(false);
 });

 it('a voice that never ends cannot keep the card for more than 8 s; an open dialog still goes first',async()=>{
  const audio=await import('../src/services/audio');
  const {earnRewardCard,rewardCardDue}=await import('../src/reward-card-set');
  const t0=Date.now();
  earnRewardCard('states',{states:3},false);
  audio.setMediaQuiet('dialogue',true);page.dialog=true;
  vi.advanceTimersByTime(7900);expect(reveals).toHaveLength(0);
  vi.advanceTimersByTime(600);
  expect(reveals,'the dialog is still open').toHaveLength(0);expect(rewardCardDue()).toBe(true);
  page.dialog=false;vi.advanceTimersByTime(400);
  expect(reveals).toHaveLength(1);expect(reveals[0].at-t0).toBeGreaterThanOrEqual(8000);
  audio.setMediaQuiet('dialogue',false);
 });

 it('leaving the map while the card waits: no reveal and nothing left blocking',async()=>{
  const audio=await import('../src/services/audio');
  const {earnRewardCard,rewardCardDue}=await import('../src/reward-card-set');
  earnRewardCard('air',{air:3},false);
  audio.setMediaQuiet('line',true);vi.advanceTimersByTime(3000);
  expect(rewardCardDue()).toBe(true);
  page.map=false;vi.advanceTimersByTime(200);
  expect(reveals).toHaveLength(0);expect(rewardCardDue()).toBe(false);
  audio.setMediaQuiet('line',false);
 });
});
