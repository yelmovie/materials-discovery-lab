import {useEffect,useRef} from 'react';
import './reward-cards.css';
import './reward-card-set.css';
import {createRewardCards,type RewardCards} from './reward-cards.js';
import {worldDestinations} from './domain/worldMap';
import {playSound,mediaQuiet,soundPlaying} from './services/audio';
import {lineBusy} from './services/lineVoice';

// One achievement card per map villain, in map order. The core's last villain is the bonus sixth card.
const titles=['물체와 재료 감정사','재료 성질 시험왕','고체 액체 구별왕','숨은 공기 추적 탐정','맞춤 재료 발명왕','물질 공방 전설 영웅'];
const cards=worldDestinations.map((place,i)=>({id:place.id,title:titles[i],stage:place.name,art:`/assets/reward-cards/card-${i+1}-${place.id}.webp`,thumb:`/assets/reward-cards/thumb-${i+1}-${place.id}.webp`,...(i===5?{bonus:true,rarity:4}:{})}));
const appRoot=()=>document.getElementById('root');

// Built on first use, so importing this module never touches the document.
let instance:RewardCards|undefined;
function rewardCards(){
 return instance??=createRewardCards({
  setName:'물질 공방 성취 카드',cards,
  theme:{accent:'#f4cf72',accent2:'#267b6b',glow:'#ffe391',ink:'#244841'},
  particles:['gear','bubble','spark','star'],
  colors:['#f4cf72','#ffe391','#267b6b','#165e51','#7fe0cf','#ffffff'],
  // The material core crystal of components/Icon.tsx.
  emblem:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 1 7 7 2 9-9 6-9-6 2-9Z" fill="currentColor" fill-opacity=".3"/><path d="m12 1 3 10-3 12-3-12Zm-7 7 4 3h6l4-3M3 17l6-6m6 0 6 6"/></svg>',
  // The app's effect player: follows mute, effect volume, a hidden tab and playing voices or clips.
  sound:name=>{if(name==='complete')celebratedAt=Date.now();playSound(`card-${name}`);},
  // An inert root pauses the map: WorldCanvas and the villains both treat it like an open dialog.
  inertRoot:appRoot,
 });
}

type Hits=Record<string,number>;
// Cards on their way to a slot stay empty in the header until they land.
const flying=new Set<number>();
/** A card is owned once its villain has been driven off (three hits) or, since 2026-11-21, once its workshop is completed.
 * App passes the hits with completed workshops already counted as 3 (rewardHits). Nothing extra is saved. */
export const ownedRewardCards=(hits:Hits)=>cards.map(card=>hits[card.id]===3);
const shown=(hits:Hits)=>ownedRewardCards(hits).map((owned,i)=>owned&&!flying.has(i));
// Cards whose turn has come (the villain's exit has played and its parting line is over) and that are not in their slot yet. Module state: re-renders do not reset it.
const due=new Set<number>();
// Cards that still wait for the villain's parting line, with the time its speech bubble has gone.
const held=new Map<number,number>();
// When the full-set celebration last began. Its jingle is the all-villains cheer, so the map's own victory jingle stays silent after it.
let celebratedAt=0;
export const rewardSetCelebrated=(now=Date.now())=>celebratedAt>0&&now-celebratedAt<60000;
/** True from a card's turn until it is put away, while a card still waits for a voice once the villain's bubble has gone, and while the full-set jingle is still sounding.
 * WorldCanvas adds it to the villains' blocked(), so the all-villains finale (2.92 s after the last hit) cannot slip in ahead of a card that waits for a voice or a dialog,
 * and its dialog and song open only after the jingle has ended, also when the celebration is closed early. */
export const rewardCardDue=(now=Date.now())=>due.size>0||[...held.values()].some(at=>now>=at)||soundPlaying('card-complete');
// The villain leaves in about 0.7 s, but its parting line is still being read then and effects stay silent under a voice
// (services/audio.ts playSound). So the card waits until no voice has sounded for CLEAR ms (a line that is still loading counts); PATIENCE caps that wait.
const EXIT=760,EXIT_CALM=520,POLL=120,CLEAR=360,PATIENCE=8000,BUBBLE=2750;

/** The slot strip before the sound button. The shared module draws and fills it; React only hosts it. */
export function RewardCardSlots({hits}:{hits:Hits}){
 const host=useRef<HTMLSpanElement>(null);
 useEffect(()=>{if(host.current)host.current.innerHTML=rewardCards().slotsHtml(shown(hits));},[hits]);
 return <span ref={host} className="reward-card-slots"/>;
}

/** Hits with every completed workshop counted as driven off: the card is owned either way. */
export const rewardHits=(hits:Hits,completed:string[])=>({...hits,...Object.fromEntries(completed.map(id=>[id,3]))});
/** Call when a villain's third hit is saved, or (anywhere=true) when a workshop is completed. The card waits for voices and open dialogs;
 * `hits` is the record after that event. On the map it flies out of the villain; elsewhere it opens in the middle of the screen. */
export function earnRewardCard(id:string,hits:Hits,reduced:boolean,anywhere=false){
 const index=cards.findIndex(card=>card.id===id);
 if(index<0||flying.has(index))return;
 flying.add(index);
 const earned=Date.now(),ready=earned+(reduced?EXIT_CALM:EXIT);
 let clearSince=0,origin:{x:number;y:number}|undefined;
 held.set(index,earned+BUBBLE);
 const open=()=>{
  // The map was left first: the card simply sits in its slot.
  if(!anywhere&&!document.querySelector('.world-page')){flying.delete(index);due.delete(index);held.delete(index);rewardCards().syncSlots(shown(hits));return;}
  // The villain is gone before a long line ends: the card still flies out of the place where it was last seen.
  const foe=document.querySelector<HTMLElement>(`.map-encounter-foe[data-encounter="${id}"]`),box=foe&&!foe.hidden?foe.getBoundingClientRect():undefined;
  if(box)origin={x:box.left,y:box.top-(parseFloat(foe!.style.getPropertyValue('--encounter-size'))||0)/2};
  const now=Date.now();
  clearSince=mediaQuiet()||lineBusy()?0:clearSince||now;
  if(now<ready||(!clearSince||now-clearSince<CLEAR)&&now-earned<PATIENCE){window.setTimeout(open,POLL);return;}
  // It is the card's turn from here, also while it waits for a dialog.
  due.add(index);held.delete(index);
  // A dialog opened in the meantime goes first.
  if(appRoot()?.inert||document.querySelector('dialog[open]')||document.querySelector('.story-film')){window.setTimeout(open,300);return;}
  void rewardCards().reveal(index,origin,ownedRewardCards(hits)).finally(()=>{flying.delete(index);due.delete(index);});
 };
 window.setTimeout(open,ready-CLEAR-earned);
}
