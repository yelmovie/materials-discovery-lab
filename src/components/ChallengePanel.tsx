import {useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {useGame} from '../state/GameContext';
import {challengesFor,correctChallenge,type ChallengeOption} from '../domain/challenges';
import type {Screen} from '../domain/model';
import {DragBoard} from './DragBoard';
import {playSound} from '../services/audio';

function shuffled(options:ChallengeOption[],seed:string){
 let n=[...seed].reduce((sum,c)=>(sum*31+c.charCodeAt(0))>>>0,23);const items=[...options];
 for(let i=items.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[items[i],items[j]]=[items[j],items[i]];}return items;
}
export interface ChallengeControls {label:string;enabled:boolean;action:()=>void}
export function ChallengePanel({screen,onControlsChange}:{screen:Screen;onControlsChange?:(controls:ChallengeControls)=>void}){
 const {save,dispatch}=useGame();const list=challengesFor(screen),done=list.filter(c=>save.challengeResults.some(r=>r.id===c.id));
 const [celebrate,setCelebrate]=useState<string|null>(null),[answer,setAnswer]=useState<string[]>([]),[feedback,setFeedback]=useState(''),[wrong,setWrong]=useState(false);
 const current=list.find(c=>c.id===celebrate)??list.find(c=>!done.includes(c));
 const options=useMemo(()=>current?shuffled(current.options,save.design.attemptId+current.id):[],[current?.id,save.design.attemptId]);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 useEffect(()=>{setAnswer([]);setFeedback('');setWrong(false);},[current?.id]);
 const complete=(c:typeof current,a:string[])=>!!c&&(c.mode==='choice'?a.length===1:c.mode==='multi'?a.length===c.answer.length:a.length===c.options.length);
 // Answers are checked as soon as they are complete; a correct answer moves on by itself.
 function check(a:string[]){if(!current||celebrate)return;if(correctChallenge(current,a)){dispatch({type:'challenge',id:current.id,answer:a});setCelebrate(current.id);setWrong(false);setFeedback(current.success);playSound('success');const last=done.length+1>=list.length;if(!last){if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(advance,save.settings.reducedMotion?900:2200);}}else{setWrong(true);setFeedback(current.hint);playSound('retry');if(current.mode==='sequence')setAnswer([]);}}
 function select(id:string){if(!current||celebrate)return;const next=current.mode==='choice'?[id]:answer.includes(id)?answer.filter(x=>x!==id):[...answer,id];setAnswer(next);setFeedback('');setWrong(false);if(complete(current,next))check(next);}
 function place(id:string,group:string){if(!current||celebrate)return;const next=answer.filter(x=>!x.startsWith(id+':')).concat(id+':'+group);setAnswer(next);setFeedback('');setWrong(false);if(complete(current,next))check(next);}
 function advance(){if(timer.current)clearTimeout(timer.current);timer.current=null;setCelebrate(null);setAnswer([]);setFeedback('');setWrong(false);}
 useLayoutEffect(()=>{onControlsChange?.({label:celebrate?(done.length===list.length?'적용 의뢰 마무리':'다음 의뢰로'):'답 고르기',enabled:!!celebrate,action:celebrate?advance:()=>{}});},[current?.id,celebrate,done.length,onControlsChange]);
 if(!current)return <section className="transfer-workspace transfer-complete"><span className="eyebrow">DISCOVERY COMPLETE</span><h2>새로운 상황에도 적용했어요!</h2><p>직접 관찰한 내용으로 두 가지 의뢰를 해결했어요.<br/>아래 버튼으로 다음 활동을 이어 가요.</p><div className="progress-chips"><span className="done">직접 탐구 ✓</span><span className="done">적용 의뢰 1 ✓</span><span className="done">적용 의뢰 2 ✓</span></div></section>;
 return <section className="transfer-workspace" aria-labelledby="challenge-title">
  <div className="challenge-heading"><img className="challenge-art" src={`/assets/generated/quests/quest-${Math.ceil(Number(screen.slice(1))/2)}.webp`} alt="" aria-hidden="true" onError={e=>{e.currentTarget.style.display='none';}}/><div><span className="eyebrow">관찰한 것을 새 상황에 써 보자</span><h2 id="challenge-title">{current.title}</h2></div><span className="challenge-count">적용 의뢰 {list.indexOf(current)+1} / {list.length}</span></div>
  <p className="challenge-prompt">{current.prompt}</p><p className="challenge-instruction">{current.mode==='choice'?'알맞은 설명 하나를 골라요.':current.mode==='multi'?`맞는 설명 ${current.answer.length}개를 골라요.`:current.mode==='sequence'?'먼저 할 일부터 차례로 눌러요. 다시 누르면 뺄 수 있어요.':'카드를 같은 성질끼리 모아 봐.'}</p>
  {current.mode==='classify'?<div className="challenge-classify">{celebrate?<div className="classification-result">{current.groups?.map(g=><article key={g.id}><b>{g.label}</b><p>{options.filter(o=>answer.includes(o.id+':'+g.id)).map(o=>o.label).join(' · ')}</p></article>)}</div>:<DragBoard label="카드를 알맞은 분류 칸으로 끌어 놓아. 눌러서 옮겨도 돼." tokens={options.map(o=>({id:o.id,label:o.label,placed:answer.some(a=>a.startsWith(o.id+':'))}))} slots={current.groups?.map(g=>({id:g.id,label:g.label,filled:options.filter(o=>answer.includes(o.id+':'+g.id)).map(o=>o.label).join('\n')}))??[]} onPlace={place}/>}</div>:<div className={`challenge-options mode-${current.mode}`}>{options.map(o=>{const index=answer.indexOf(o.id);return <button key={o.id} className={`choice ${index>=0?'selected':''} ${index>=0&&wrong?'is-wrong':''}`} aria-pressed={index>=0} disabled={!!celebrate} onClick={()=>select(o.id)}>{current.mode==='sequence'&&<span className="sequence-number">{index>=0?index+1:'·'}</span>}<span>{o.label}</span>{current.mode!=='sequence'&&index>=0&&<span aria-hidden="true">{wrong?'✗':'✓'}</span>}</button>;})}</div>}
  {current.mode==='sequence'&&<div className="sr-only" aria-live="polite">{answer.length}개를 순서대로 골랐어요.</div>}
  {feedback&&<div className={`challenge-feedback ${celebrate?'success':wrong?'retry':''}`} role="status">{celebrate?'정답! ':wrong?'다시 생각해 봐: ':''}{feedback}{celebrate&&done.length<list.length&&<button className="challenge-skip" onClick={advance}>바로 다음 의뢰 →</button>}</div>}

 </section>;
}
