import {useEffect,useLayoutEffect,useMemo,useRef,useState,type CSSProperties} from 'react';
import './parts-board.css';
import {useGame} from '../state/GameContext';
import {challengesFor,correctChallenge,type ChallengeOption} from '../domain/challenges';
import type {Screen} from '../domain/model';
import {DragBoard} from './DragBoard';
import {MissionBurst} from './MissionBurst';
import './challenge-panel.css';
import {playSound} from '../services/audio';

function shuffled(options:ChallengeOption[],seed:string){
 let n=[...seed].reduce((sum,c)=>(sum*31+c.charCodeAt(0))>>>0,23);const items=[...options];
 for(let i=items.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[items[i],items[j]]=[items[j],items[i]];}return items;
}
// 2026-11-21 S01-c: 글자 카드 대신 연필 그림 조각을 끌어 놓는다(scripts/prepare-pencil-parts.mjs).
// 조각은 연필 순서(심·몸통·띠·지우개)로 붙어 있다가 갈라진다. 폭은 원본 조각 폭(372·1022·233·293) 비율로 줄 전체의 89.5%, 틈은 3.5%씩.
// join은 붙은 모습으로 당기는 거리(자기 폭 기준). 심은 몸통 뒤(z 0)로 들어가 뾰족한 끝만 몸통 끝 구멍으로 나온다.
const PENCIL_PARTS = [
 {id:'lead',src:'/assets/generated/pencil/pencil4-lead.webp',basis:'17.34%',join:'131.1%',z:0},
 {id:'body',src:'/assets/generated/pencil/pencil4-body.webp',basis:'47.64%',join:'7.35%'},
 {id:'band',src:'/assets/generated/pencil/pencil4-band.webp',basis:'10.86%',join:'0%'},
 {id:'eraser',src:'/assets/generated/pencil/pencil4-eraser.webp',basis:'13.66%',join:'-25.6%'},
];
const PART_ART:Record<string,Record<string,(typeof PENCIL_PARTS)[number]>>={
 'S01-c':Object.fromEntries(PENCIL_PARTS.map(part=>[part.id,part])),
};

function PencilHero(){
 return <div className="challenge-hero challenge-pencil" role="img" aria-label="지우개 달린 나무 연필">
  <div className="challenge-pencil-parts">
   {PENCIL_PARTS.map(part=><img key={part.id} src={part.src} alt="" draggable={false}
    style={{width:part.basis,transform:`translateX(${part.join})`,zIndex:part.z??1}}/>)}
  </div>
 </div>;
}
// 2026-11-21 그림 카드: 이름만 있던 분류 카드에 그림을 얹는다(scripts/prepare-picture-cards.mjs). 순서는 섞인 그대로, 정답·채점은 그대로.
const CARD_ART:Record<string,Record<string,string>>={
 'S02-a':{umbrella:'/assets/generated/umbrella.webp',wood:'/assets/generated/cards/material-wood.webp',cup:'/assets/generated/cards/cup.webp',metal:'/assets/generated/cards/material-metal.webp'},
 'S05-c':{stone:'/assets/generated/cards/stone.webp',milk:'/assets/generated/cards/milk.webp',block:'/assets/generated/cards/material-wood.webp',juice:'/assets/generated/cards/juice.webp'},
};
// 고르기 문제의 보기에도 그림을 함께(글 + 그림). 보기 글은 그대로.
const CHOICE_ART:Record<string,Record<string,string>>={
 'S02-c':{clip:'/assets/generated/cards/clip.webp',nail:'/assets/generated/cards/nail.webp',chopsticks:'/assets/generated/cards/chopsticks.webp',gloves:'/assets/generated/cards/gloves.webp'},
};
// 문제 옆 큰 그림(고르기 문제). 없으면 공방 의뢰 그림을 크게 쓴다. 분류 문제는 카드 자체가 그림이라 옆 그림을 두지 않는다.
const HERO_ART:Record<string,string>={'S04-c':'/assets/generated/cards/boots.webp'};
export interface ChallengeControls {label:string;enabled:boolean;action:()=>void;cue?:string;awaitingWrapUp:boolean}
export function ChallengePanel({screen,onControlsChange}:{screen:Screen;onControlsChange?:(controls:ChallengeControls)=>void}){
 const {save,dispatch}=useGame();const list=challengesFor(screen),done=list.filter(c=>save.challengeResults.some(r=>r.id===c.id));
 const [celebrate,setCelebrate]=useState<string|null>(null),[answer,setAnswer]=useState<string[]>([]),[feedback,setFeedback]=useState(''),[wrong,setWrong]=useState(false);
 const current=list.find(c=>c.id===celebrate)??list.find(c=>!done.includes(c));
 const art=current?PART_ART[current.id]:undefined,cards=current?CARD_ART[current.id]:undefined;
 const picture=(id:string)=>art?.[id]?.src??cards?.[id];
 const options=useMemo(()=>!current?[]:art?Object.keys(art).map(id=>current.options.find(o=>o.id===id)!).filter(Boolean):shuffled(current.options,save.design.attemptId+current.id),[current?.id,save.design.attemptId]);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 useEffect(()=>{setAnswer([]);setFeedback('');setWrong(false);},[current?.id]);
 const complete=(c:typeof current,a:string[])=>!!c&&(c.mode==='choice'?a.length===1:c.mode==='multi'?a.length===c.answer.length:a.length===c.options.length);
 // Keep these explanations visible until the learner presses Next.
 const manualAdvance=screen==='S01'||screen==='S02'||screen==='S06';
 function check(a:string[]){if(!current||celebrate)return;if(correctChallenge(current,a)){dispatch({type:'challenge',id:current.id,answer:a});setCelebrate(current.id);setWrong(false);setFeedback(current.success);playSound('success');const last=done.length+1>=list.length;if(!last&&!manualAdvance){if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(advance,save.settings.reducedMotion?900:2200);}}else{setWrong(true);setFeedback(current.hint);playSound('retry');if(current.mode==='sequence')setAnswer([]);}}
 function select(id:string){if(!current||celebrate)return;const next=current.mode==='choice'?[id]:answer.includes(id)?answer.filter(x=>x!==id):[...answer,id];setAnswer(next);setFeedback('');setWrong(false);if(complete(current,next))check(next);}
 function place(id:string,group:string){if(!current||celebrate)return;const next=answer.filter(x=>!x.startsWith(id+':')).concat(id+':'+group);setAnswer(next);setFeedback('');setWrong(false);if(complete(current,next))check(next);}
 function advance(){if(timer.current)clearTimeout(timer.current);timer.current=null;setCelebrate(null);setAnswer([]);setFeedback('');setWrong(false);}
 // How to answer is said once, in the activity footer's guide row.
 const instruction=!current?'':current.mode==='choice'?'알맞은 설명 하나를 골라요.':current.mode==='multi'?`맞는 설명 ${current.answer.length}개를 골라요.`:current.mode==='sequence'?'먼저 할 일부터 차례로 눌러요. 다시 누르면 뺄 수 있어요.':'카드를 끌어 놓거나, 카드와 칸을 차례로 눌러요.';
 const awaitingWrapUp=!!celebrate&&done.length===list.length;
 useLayoutEffect(()=>{onControlsChange?.({label:celebrate?(awaitingWrapUp?'적용 의뢰 마무리':'다음 의뢰로'):'답 고르기',enabled:!!celebrate,action:celebrate?advance:()=>{},cue:instruction,awaitingWrapUp});},[current?.id,celebrate,awaitingWrapUp,onControlsChange,instruction]);
 if(!current)return <section className="transfer-workspace transfer-complete"><MissionBurst/><h2>두 의뢰를 해결했어요!</h2></section>;
 const questArt=`/assets/generated/quests/quest-${Math.ceil(Number(screen.slice(1))/2)}.webp`;
 const pencilHero=current.id==='S01-a';
 const hero=current.mode==='classify'||pencilHero?undefined:HERO_ART[current.id]??questArt;
 const hasHero=pencilHero||!!hero;
 return <section className={`transfer-workspace${hasHero?' has-hero':''}`} aria-labelledby="challenge-title">
  {pencilHero&&<PencilHero/>}
  {hero&&<img className="challenge-hero" src={hero} alt="" aria-hidden="true" onError={e=>{e.currentTarget.style.display='none';}}/>}
  <div className="challenge-body">
  {celebrate&&done.length===list.length&&<MissionBurst label="의뢰 완료!"/>}
  <div className="challenge-heading">{!hasHero&&!art&&<img className="challenge-art" src={questArt} alt="" aria-hidden="true" onError={e=>{e.currentTarget.style.display='none';}}/>}<div><h2 id="challenge-title">{current.title}</h2></div></div>
  <p className="challenge-prompt">{current.prompt}</p>
  {current.mode==='classify'?<div className="challenge-classify" data-next-action={!celebrate||undefined}>{celebrate?<div className="classification-result" style={art||cards?{gridTemplateColumns:`repeat(${current.groups?.length??3},minmax(0,1fr))`}:undefined}>{current.groups?.map(g=><article key={g.id}><b>{g.label}</b>{(art||cards)&&<span className="drop-slot-art" aria-hidden="true">{options.filter(o=>answer.includes(o.id+':'+g.id)).map(o=><img key={o.id} src={picture(o.id)} alt=""/>)}</span>}<p>{options.filter(o=>answer.includes(o.id+':'+g.id)).map(o=>o.label).join(' · ')}</p></article>)}</div>:<DragBoard label="카드를 알맞은 분류 칸으로 끌어 놓아. 눌러서 옮겨도 돼." variant={art?'parts':cards?'cards':undefined} tokens={options.map(o=>({id:o.id,label:o.label,placed:answer.some(a=>a.startsWith(o.id+':')),...(art?.[o.id]&&{image:art[o.id].src,style:{'--part-basis':art[o.id].basis,'--part-join':art[o.id].join,'--part-z':art[o.id].z??1} as CSSProperties}),...(cards?.[o.id]&&{image:cards[o.id]})}))} slots={current.groups?.map(g=>{const ids=options.filter(o=>answer.includes(o.id+':'+g.id));return {id:g.id,label:g.label,filled:ids.map(o=>o.label).join('\n'),images:art||cards?ids.map(o=>picture(o.id)).filter((x):x is string=>!!x):undefined};})??[]} onPlace={place}/>}</div>:<div className={`challenge-options mode-${current.mode}`} role="group" aria-label="보기" data-next-action={!celebrate||undefined}>{options.map(o=>{const index=answer.indexOf(o.id);return <button key={o.id} className={`choice ${index>=0?'selected':''} ${index>=0&&wrong?'is-wrong':''}`} aria-pressed={index>=0} disabled={!!celebrate} onClick={()=>select(o.id)}>{current.mode==='sequence'&&<span className="sequence-number">{index>=0?index+1:'·'}</span>}{CHOICE_ART[current.id]?.[o.id]&&<img className="choice-art" src={CHOICE_ART[current.id][o.id]} alt="" aria-hidden="true" draggable={false}/>}<span>{o.label}</span>{current.mode!=='sequence'&&index>=0&&<span aria-hidden="true">{wrong?'✗':'✓'}</span>}</button>;})}</div>}
  {current.mode==='sequence'&&<div className="sr-only" aria-live="polite">{answer.length}개를 순서대로 골랐어요.</div>}
  {feedback&&<div className={`challenge-feedback ${celebrate?'success':wrong?'retry':''}`} role="status">{celebrate?'정답! ':wrong?'다시 생각해 봐: ':''}{feedback}</div>}
  </div>
 </section>;
}
