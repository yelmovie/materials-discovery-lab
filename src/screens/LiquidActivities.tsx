
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {useGame} from '../state/GameContext';
import {transfer} from '../domain/model';
import {useExperimentPlayback} from '../components/ExperimentPlayback';
import {playSound} from '../services/audio';
import {Choice,Panel,ExperimentCanvas,useActivityGuide} from './activity-kit';
import {SandPourLab,sandPoured,sandPourDuration} from './SandPourLab';
import './liquid-activities.css';
const sequence=[[0,1],[1,2],[2,0]] as const;
const vesselNames=['처음 컵','넓은 용기','길쭉한 용기'];
const pourActions=['넓은 용기에 붓기','길쭉한 용기에 붓기','처음 컵에 붓기'];
const settled=(step:number)=>step===1?[0,1000,0]:step===2?[0,0,1000]:[1000,0,0];

export function Liquid({prediction,onNext}:{prediction:ReactNode;onNext?:()=>void}){
 const {save}=useGame(),c=save.checkpoints;
 const available=c.liquidStep===3&&save.predictions.liquidConclusion==='same';
 const [view,setView]=useState<'water'|'sand'>(()=>available&&((c.sandStep??0)>0||c.sand)?'sand':'water');
 const [startPour,setStartPour]=useState(false);
 return view==='sand'&&available?<SandTransfer startPour={startPour} onNext={onNext} onWater={()=>setView('water')}/>:<Water prediction={prediction} onSand={()=>{setStartPour(true);setView('sand');}}/>;
}
function Water({prediction,onSand}:{prediction:ReactNode;onSand:()=>void}){
 const {save,dispatch}=useGame(),step=save.checkpoints.liquidStep;
 const [volumes,setVolumes]=useState(()=>settled(step)),[pouring,setPouring]=useState(false),[held,setHeld]=useState(false);
 const correct=save.predictions.liquidConclusion==='same',wrong=save.predictions.liquidConclusion==='change';
 const sandStep=save.checkpoints.sandStep??0;
 const sandEntry=save.checkpoints.sand||sandStep===3?'모래알 관찰로 돌아가기':sandStep>0?'모래 붓기 이어서 보기':'모래 붓기 시작';
 useActivityGuide(!save.predictions.S06?'먼저 예상을 골라요.':step<3?'물줄기와 받는 용기를 봐요.':wrong?'처음 컵에 돌아온 물을 점선과 다시 비교해요.':!correct?'처음 컵의 점선과 물높이를 보고 골라요.':'이제 모래가 어떻게 쌓이는지 봐요.',!save.predictions.S06?'예상':step<3?'끝까지 붓기':!correct?'점선':sandEntry);
 useEffect(()=>{setVolumes(settled(step));setPouring(false);},[step]);
 useEffect(()=>{if(step<3&&volumes[sequence[step][1]]===1000){setPouring(false);dispatch({type:'liquid',step:step+1});}},[volumes,step]);
 useEffect(()=>{
  if(!pouring||step>=3)return;
  const timer=setInterval(()=>{const [from,to]=sequence[step];setVolumes(v=>transfer(v,from,to,34));},50);
  const stop=()=>setPouring(false);window.addEventListener('blur',stop);document.addEventListener('visibilitychange',stop);
  return()=>{clearInterval(timer);window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',stop);};
 },[pouring,step]);
 useExperimentPlayback({label:'세 용기 순서대로 물 붓기',enabled:!!save.predictions.S06&&step<3,run:async flow=>{
  setPouring(false);setHeld(false);let current=[...volumes];
  for(let stage=step;stage<3;stage++){const [from,to]=sequence[stage];while(current[from]>0){if(flow.isStopped())return;current=transfer(current,from,to,100);setVolumes([...current]);await flow.wait(save.settings.reducedMotion?45:90);}await flow.wait(180);}
 }});
 return <div className="activity-grid liquid-stage"><div className="workspace"><ExperimentCanvas kind="liquid" volumes={volumes} reduced={save.settings.reducedMotion}/>
 {save.predictions.S06&&<div className="water-balance" aria-live="off">
  {(step<3||correct)&&vesselNames.map((name,i)=><span key={name}>{name} <b>{volumes[i]/10}%</b></span>)}
  <strong>{correct?'총량 100%':'흘리거나 더하지 않아요'}</strong>
 </div>}
 </div><div className="tools">{prediction}{!save.predictions.S06?null:step<3||held?<Panel title={step<3?`${step+1}/3 ${pourActions[step]}`:'옮기기 완료! 손을 떼고 비교해'}>
 <div className="stage-action-pair"><button className="secondary full" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);setHeld(true);setPouring(true);playSound('pour');}} onPointerUp={()=>{setPouring(false);setHeld(false);}} onPointerCancel={()=>{setPouring(false);setHeld(false);}} onLostPointerCapture={()=>{setPouring(false);setHeld(false);}} onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();setHeld(true);setPouring(true);}}} onKeyUp={()=>{setPouring(false);setHeld(false);}} onBlur={()=>{setPouring(false);setHeld(false);}}>누르는 동안 붓기</button>
 <button className="primary full" data-next-action={!pouring||undefined} disabled={pouring} onClick={()=>{setPouring(true);playSound('pour');}}>끝까지 붓기</button></div></Panel>:<Panel title="처음 컵에 돌아온 물의 양은?">
 <div className="stage-conclusion-options" data-next-action={!correct||undefined}><Choice ariaLabel="용기에 따라 모양은 바뀌지만, 돌아온 물의 양은 같아." selected={correct} onClick={()=>dispatch({type:'prediction',key:'liquidConclusion',value:'same'})}>물의 양은 같아</Choice><Choice selected={wrong} onClick={()=>dispatch({type:'prediction',key:'liquidConclusion',value:'change'})}>물의 양도 달라져</Choice></div>
 {correct&&<button className="primary full sand-entry" data-next-action="true" onClick={onSand}>{sandEntry} <span aria-hidden="true">→</span></button>}
 <button className="secondary full" onClick={()=>{setHeld(false);dispatch({type:'repeatLiquid'});}}>물 다시 옮겨 보기</button>
 </Panel>}</div></div>;
}
function SandTransfer({startPour,onNext,onWater}:{startPour:boolean;onNext?:()=>void;onWater:()=>void}){
 const {save,dispatch}=useGame(),c=save.checkpoints,step=c.sandStep??0;
 const legacy=c.sandStep===undefined&&save.completedScreens.includes('S06')&&c.sand;
 const zoom=c.sand&&(step===3||legacy);
 const reduced=save.settings.reducedMotion||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const [elapsed,setElapsed]=useState(0),[running,setRunning]=useState(startPour&&!zoom&&step<3),[automatic,setAutomatic]=useState(false);
 const clock=useRef(0),busy=running||automatic,duration=sandPourDuration(reduced),settleTime=reduced?380:700;
 const [from,to]=sequence[Math.min(step,2)];
 const volumes=step===3?settled(step):transfer(settled(step),from,to,sandPoured(elapsed,reduced));
 const correct=save.predictions.sandConclusion==='solid',wrong=save.predictions.sandConclusion==='liquid';
 const nextButton=useRef<HTMLButtonElement>(null),answers=useRef<HTMLDivElement>(null);
 const canContinue=!!onNext&&correct&&zoom;
 const pourLabel=step>0||elapsed>0?'계속 붓기':'모래 붓기 시작';

 useEffect(()=>{
  if(!running||step>=3)return;
  let frame=0;
  const start=performance.now()-clock.current;
  const tick=(now:number)=>{
   clock.current=Math.min(duration,now-start);
   if(clock.current>=duration){
    clock.current=-settleTime;
    setElapsed(0);
    if(step===2)setRunning(false);
    dispatch({type:'sandTransfer',step:step+1});
    return;
   }
   setElapsed(Math.max(0,clock.current));
   frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  const stop=()=>{
   cancelAnimationFrame(frame);
   setRunning(false);
  };
  const background=()=>{if(document.hidden)stop();};
  window.addEventListener('blur',stop);
  document.addEventListener('visibilitychange',background);
  return()=>{
   cancelAnimationFrame(frame);
   window.removeEventListener('blur',stop);
   document.removeEventListener('visibilitychange',background);
  };
 },[running,step,duration,settleTime,dispatch]);

 useEffect(()=>{
  if(step!==3||zoom)return;
  const timer=window.setTimeout(()=>dispatch({type:'sand'}),settleTime);
  return()=>window.clearTimeout(timer);
 },[step,zoom,settleTime,dispatch]);

 useEffect(()=>{
  if(canContinue)nextButton.current?.focus({preventScroll:true});
  else if(zoom)answers.current?.focus({preventScroll:true});
 },[zoom,canContinue]);

 useExperimentPlayback({label:'모래 옮겨 붓기',enabled:!zoom&&!busy&&step<3,run:async flow=>{
  setAutomatic(true);
  try{
   for(let stage=step;stage<3;stage++){
    while(clock.current<duration){
     const tick=Math.min(24,duration-clock.current);
     await flow.wait(tick);
     if(flow.isStopped())return;
     clock.current+=tick;
     setElapsed(Math.max(0,clock.current));
    }
    clock.current=-settleTime;
    setElapsed(0);
    dispatch({type:'sandTransfer',step:stage+1});
   }
  }finally{setAutomatic(false);}
 }});

 const guide=zoom?(correct?'':'확대한 모래알의 모양을 봐요.')
  :step===3?'처음 컵에 모래가 돌아왔어요.':busy?'모래가 어떻게 쌓이는지 봐요.':'';
 useActivityGuide(guide);

 function restart(){
  clock.current=0;
  setElapsed(0);
  setRunning(true);
  dispatch({type:'repeatSand'});
 }
 return <div className="activity-grid liquid-stage sand-transfer-stage"><div className="workspace">
  {zoom?<ExperimentCanvas kind="sand"/>:<SandPourLab volumes={volumes} step={step} from={from} to={to} elapsed={elapsed} moving={busy} reduced={reduced}/>}
  <div className="sand-transfer-progress" aria-label="모래를 붓는 순서">
   {legacy?<span>이전에 남긴 모래알 관찰 기록</span>:pourActions.map((action,i)=><span key={action} aria-current={step===i?'step':undefined} className={step>i?'done':''}>{action}{step>i?' ✓':''}</span>)}
  </div>
 </div><div className="tools"><Panel title={zoom?'모래알 하나는 고체일까요, 액체일까요?':'모래 옮기기'}>
  {!zoom&&step<3?<>
   {automatic?<p role="status">모래를 붓고 있어요.</p>:<button className={`${running?'secondary':'primary'} full sand-pour-button`} data-next-action={!running||undefined} onClick={()=>setRunning(!running)}>{running?'잠깐 멈추기':pourLabel}</button>}
  </>:!zoom?<p role="status">모래알을 확대하고 있어요.</p>:<>
   <div className="stage-conclusion-options" ref={answers} tabIndex={-1} role="group" aria-label="모래알의 상태 고르기" data-next-action={!correct||undefined}>
    <Choice selected={correct} onClick={()=>dispatch({type:'prediction',key:'sandConclusion',value:'solid'})}>고체야</Choice>
    <Choice selected={wrong} onClick={()=>dispatch({type:'prediction',key:'sandConclusion',value:'liquid'})}>액체야</Choice>
   </div>
   {wrong&&<p className="sand-feedback" role="alert">알갱이 하나의 모양을 봐요. 옮기기 전과 같을까요?</p>}
   {correct&&<p className="sand-result" role="status">맞아요! 모래알은 하나하나 모양을 유지해요.</p>}
   {canContinue&&<button ref={nextButton} className="primary full sand-next" data-next-action="true" onClick={onNext}>다음 <span aria-hidden="true">→</span></button>}
   <details className="sand-replay">
    <summary>다시 보기</summary>
    <div className="sand-secondary">
     <button className="secondary full" onClick={restart}>모래 다시 붓기</button>
     <button className="secondary full" onClick={onWater}>물 비교 다시 보기</button>
    </div>
   </details>
  </>}
 </Panel></div></div>;
}
