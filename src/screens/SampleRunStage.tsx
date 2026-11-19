import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {useGame} from '../state/GameContext';
import {shortNames} from '../domain/model';
import {runStations,runZones,stationOptions,stationAnswer,zoneProgress,isRecorded,nextStation,type RunAction} from '../domain/runStage';
import {playSound,playMove} from '../services/audio';
import {playLine,stopLine} from '../services/lineVoice';
import {voiceFor} from '../domain/voiceLines';
import type {RunStage,RunStatus,RunHint} from '../game/run-stage/engine';
import './run-stage.css';
const hasBatchim=(w:string)=>(w.charCodeAt(w.length-1)-0xac00)%28>0;

/** S03 as a 3D walkway. This file is the overlay (pad, buttons, progress,
 * description choices) and the rule link: a right description is sent through
 * the same `observe` action as the classic screen, so the saved ids match. */
const watch:Record<RunAction,string>={
 stomp:'밟고 있을 때 발판이 점선보다 낮아지는지, 내려온 뒤 점선 높이로 돌아오는지 봐요.',
 pull:'당기는 동안 끈 끝이 점선 밖으로 나가는지, 놓은 뒤 점선 안으로 돌아오는지 봐요.',
 light:'손전등을 켰을 때 시료 뒤 별 표시가 밝아지는지 봐요.',
 drop:'물방울이 둥글게 남는지, 짙은 자국으로 번지는지 봐요.',
};
const hintText:Record<RunHint,string>={
 'hold-longer':'조금 더 오래 꾹 누르고 있어요!',
 bump:'앗! 방해꾼이 지나갈 때를 기다리거나 뛰어넘어요.',
 'step-off':'발판에서 내려와 모양을 살펴봐요.',
 respawn:'구역 입구로 돌아왔어요.',
};
const directions=[['up','위로 이동'],['left','왼쪽으로 이동'],['down','아래로 이동'],['right','오른쪽으로 이동']] as const;
interface Props {onGuide:(text:string,focus?:string)=>void;onClassic:(failed?:boolean)=>void}

export default function SampleRunStage({onGuide,onClassic}:Props){
 const {save,dispatch}=useGame();
 const root=useRef<HTMLDivElement>(null),host=useRef<HTMLDivElement>(null),stage=useRef<RunStage|null>(null),labels=useRef(new Map<string,HTMLElement>()),misses=useRef<Record<string,number>>({});
 const [ready,setReady]=useState(false),[run,setRun]=useState<RunStatus>({near:null,canAct:false,onPad:false,busy:false});
 const [prompt,setPrompt]=useState<{id:string;answer:string;feedback:string}|null>(null),[hint,setHint]=useState(''),[moved,setMoved]=useState(false);
 const recorded=useMemo(()=>runStations.filter(s=>isRecorded(save,s)).map(s=>s.id),[save.observations]);
 const progress=zoneProgress(save),allDone=recorded.length===runStations.length,next=nextStation(save);
 const classic=useRef(onClassic);classic.current=onClassic;
 const label=useCallback((id:string)=>(element:HTMLElement|null)=>{if(element)labels.current.set(id,element);else labels.current.delete(id);},[]);

 useEffect(()=>{
  const rootElement=root.current,hostElement=host.current;if(!rootElement||!hostElement)return;
  // A fresh canvas per mount: a released drawing context is never reused.
  const canvas=document.createElement('canvas');canvas.className='run-canvas';canvas.setAttribute('aria-hidden','true');hostElement.append(canvas);
  let cancelled=false,created:RunStage|null=null;
  void import('../game/run-stage/engine').then(async engine=>{
   const made=await engine.createRunStage(rootElement,canvas,labels.current,{
    onTested:id=>{setPrompt({id,answer:'',feedback:''});},
    onStatus:status=>{setRun(status);if(status.near)setMoved(true);},
    onHint:kind=>{setHint(hintText[kind]);if(kind==='bump')playSound('retry');},
    onMove:kind=>{playMove(kind);},
    onLost:()=>classic.current(true),
   });
   if(cancelled){made.dispose();return;}
   created=made;stage.current=made;(rootElement as HTMLDivElement&{__runStage?:RunStage}).__runStage=made;setReady(true);
  }).catch(()=>{if(!cancelled)classic.current(true);});
  return()=>{cancelled=true;created?.dispose();stage.current=null;canvas.remove();};
 },[]);
 useEffect(()=>{if(ready)stage.current?.setRecorded(recorded);},[ready,recorded]);
 useEffect(()=>{stage.current?.setPaused(!!prompt);},[prompt,ready]);
 useEffect(()=>{if(!hint)return;const timer=setTimeout(()=>setHint(''),2600);return()=>clearTimeout(timer);},[hint]);
 useEffect(()=>{if(run.busy)playSound(runStations.find(s=>s.id===run.near)?.action==='drop'?'pour':'experiment');},[run.busy]);

 const nearStation=runStations.find(s=>s.id===run.near),nearZone=nearStation?runZones[nearStation.zone]:null;
 const asked=prompt?runStations.find(s=>s.id===prompt.id)!:null,askedZone=asked?runZones[asked.zone]:null;
 const stuck=!!asked&&(misses.current[asked.id]??0)>=3;
 // 단단이가 막힌 관찰의 볼 곳을 읽어 준다.
 const stuckLine=stuck?watch[asked.action]:'';
 useEffect(()=>{if(!stuckLine)return;playLine(voiceFor(stuckLine));return stopLine;},[stuckLine]);
 function pick(option:string){
  if(!asked||!prompt)return;
  if(option===stationAnswer(asked)){
   dispatch({type:'observe',experiment:asked.experiment,sampleId:asked.sampleId,answer:option});
   playSound('success');setPrompt(null);setHint(`${shortNames[asked.sampleId]} 관찰 기록 완료!`);stage.current?.celebrate();
  }else{
   misses.current[asked.id]=(misses.current[asked.id]??0)+1;playSound('retry');
   setPrompt({...prompt,answer:option,feedback:`「다시 시험하기」로 ${askedZone!.lookFor}${hasBatchim(askedZone!.lookFor)?'을':'를'} 한 번 더 보고 비교해요.`});
  }
 }
 function retest(){if(!prompt)return;stage.current?.resetStation(prompt.id);setPrompt(null);}

 const guide=!ready?['시험 길을 준비하고 있어요…']
  :prompt?[`${askedZone!.lookFor}의 변화를 떠올려 맞는 설명을 눌러요.`,askedZone!.lookFor]
  :run.onPad?['발판에서 내려와 모양이 돌아오는지 봐요.','내려와']
  :nearStation&&nearStation.action==='stomp'&&!isRecorded(save,nearStation)?['「점프」로 발판에 뛰어올라 밟아요.','점프']
  :nearStation&&run.canAct&&!isRecorded(save,nearStation)?[nearStation.action==='pull'?'「당기기」를 꾹 누르고 있어요.':`「${nearZone!.actionLabel}」 버튼으로 시험해요.`,nearZone!.actionLabel]
  :allDone?['네 가지 시험을 모두 비교했어요!']
  :next?[`${runZones[next.zone].name} 구역의 ${shortNames[next.sampleId]} 시료로 걸어가요.`,shortNames[next.sampleId]]:[''];
 useEffect(()=>{onGuide(guide[0],guide[1]);},[guide[0],guide[1]]);

 const actionLabel=nearZone&&nearStation?.action!=='stomp'?nearZone.actionLabel:'시험하기';
 return <div ref={root} className="run-stage" data-run-ready={ready} data-near={run.near??''} data-can-act={run.canAct} data-on-pad={run.onPad} data-busy={run.busy} data-prompt={prompt?.id??''}>
  <div ref={host} className="run-canvas-host"/>
  {!ready&&<div className="run-loading loading" role="status">시험 길을 준비하고 있어요…</div>}
  <div className="run-labels" aria-hidden="true">
   {runZones.map((zone,i)=><span key={zone.experiment} ref={label(`zone-${i}`)} className={`run-sign ${progress[i].done===progress[i].total?'done':''}`}><b>{i+1}</b>{zone.name}</span>)}
   {runStations.map(s=><span key={s.id} ref={label(s.id)} className={`run-label ${recorded.includes(s.id)?'done':''} ${next?.id===s.id?'next':''}`}><img src={`/assets/generated/materials/${s.sampleId}.webp`} alt="" draggable={false}/>{shortNames[s.sampleId]}{recorded.includes(s.id)?' ✓':''}</span>)}
   <span ref={label('guide')} className="run-sign guide">{allDone?'모두 비교했어요!':'단단이'}</span>
  </div>
  <div className="run-top">
   <div className="run-chips" role="status" aria-label="시험 진행">{progress.map(({zone,done,total},i)=><span key={zone.experiment} className={done===total?'done':''}><b>{i+1}</b>{zone.name} {done}/{total}{done===total?' ✓':''}</span>)}</div>
   <button type="button" className="run-classic" onClick={()=>onClassic()}>기존 방식으로 하기</button>
  </div>
  {ready&&!moved&&!prompt&&<p className="run-tip">방향 버튼으로 걷고 <b>점프</b>로 발판에 올라가요<small>키보드: 방향키·WASD 걷기 · Space 점프 · E 시험</small></p>}
  {hint&&!prompt&&<p className="run-hint" role="status">{hint}</p>}
  <div className="run-controls" hidden={!ready||!!prompt}>
   <div className="run-pad" aria-label="연구원 이동">{directions.map(([direction,name])=><button key={direction} type="button" data-run-direction={direction} className={`direction-${direction}`} aria-label={name}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg></button>)}</div>
   <div className="run-buttons">
    <button type="button" className="run-action" disabled={!run.canAct} data-next-action={run.canAct&&!!nearStation&&!isRecorded(save,nearStation)||undefined} aria-label={nearStation?.action==='pull'?`${actionLabel} (꾹 누르기)`:actionLabel}>{actionLabel}{nearStation?.action==='pull'&&run.canAct&&<small>꾹 누르기</small>}</button>
    <button type="button" className="run-jump" aria-label="점프">점프</button>
   </div>
  </div>
  {prompt&&asked&&<section className="run-prompt tool-panel" aria-live="polite">
   <h3><img src={`/assets/generated/materials/${asked.sampleId}.webp`} alt="" draggable={false}/>{shortNames[asked.sampleId]}에서 본 것은?</h3>
   <div className="sample-answer-options" data-next-action="true">{stationOptions(asked).map(option=><button key={option} type="button" className={`choice activity-choice ${prompt.answer===option?'selected':''}`} aria-pressed={prompt.answer===option} onClick={()=>pick(option)}><span className="activity-choice-label">{option}</span><span aria-hidden="true">{prompt.answer===option?'✓':''}</span></button>)}</div>
   {prompt.feedback&&<p className="sample-feedback retry" role="status">{prompt.feedback}</p>}
   {stuck&&<p className="run-stuck"><img src="/assets/characters/dandani.webp" alt="단단이" draggable={false}/><span>{watch[asked.action]}</span></p>}
   <div className="stage-action-pair"><button type="button" className="secondary full" onClick={retest}>다시 시험하기 ↻</button>{stuck&&<button type="button" className="secondary full" onClick={()=>onClassic()}>기존 방식으로 하기</button>}</div>
  </section>}
 </div>;
}
