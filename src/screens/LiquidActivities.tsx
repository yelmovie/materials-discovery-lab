
import {useEffect,useId,useRef,useState,type ReactNode} from 'react';
import {useGame} from '../state/GameContext';
import {transfer} from '../domain/model';
import {useExperimentPlayback} from '../components/ExperimentPlayback';
import {playSound} from '../services/audio';
import {Choice,Panel,ExperimentCanvas,useActivityGuide} from './activity-kit';
import './liquid-activities.css';
const sequence=[[0,1],[1,2],[2,0]] as const;
const vesselNames=['처음 컵','넓은 용기','길쭉한 용기'];
const settled=(step:number)=>step===1?[0,1000,0]:step===2?[0,0,1000]:[1000,0,0];

export function Liquid({prediction}:{prediction:ReactNode}){
 const {save}=useGame(),c=save.checkpoints;
 const available=c.liquidStep===3&&save.predictions.liquidConclusion==='same';
 const [view,setView]=useState<'water'|'sand'>(()=>available&&((c.sandStep??0)>0||c.sand)?'sand':'water');
 return view==='sand'&&available?<SandTransfer onWater={()=>setView('water')}/>:<Water prediction={prediction} onSand={()=>setView('sand')}/>;
}
function Water({prediction,onSand}:{prediction:ReactNode;onSand:()=>void}){
 const {save,dispatch}=useGame(),step=save.checkpoints.liquidStep;
 const [volumes,setVolumes]=useState(()=>settled(step)),[pouring,setPouring]=useState(false),[held,setHeld]=useState(false);
 const correct=save.predictions.liquidConclusion==='same',wrong=save.predictions.liquidConclusion==='change';
 useActivityGuide(!save.predictions.S06?'먼저 예상을 골라요.':step<3?'「끝까지 붓기」를 누르거나 「누르는 동안 붓기」를 꾹 눌러 물을 옮겨요.':wrong?'처음 컵에 돌아온 물을 점선과 다시 비교해요.':!correct?'처음 컵의 점선과 물높이를 보고 골라요.':'물 비교 완료! 이제 모래도 옮겨 부어 봐요.',!save.predictions.S06?'예상':step<3?'끝까지 붓기':!correct?'점선':'모래 옮겨 붓기');
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
 <div className="water-balance" aria-live="off">{vesselNames.map((n,i)=><span key={n}>{n} <b>{volumes[i]/10}%</b></span>)}<strong>총량 100% · 흘리거나 더하지 않아요</strong></div>
 </div><div className="tools">{prediction}{!save.predictions.S06?null:step<3||held?<Panel title={step<3?`${step+1}/3 ${['넓은 용기로','길쭉한 용기로','처음 컵으로'][step]} 따르기`:'옮기기 완료! 손을 떼고 비교해'}>
 <div className="stage-action-pair"><button className="secondary full" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);setHeld(true);setPouring(true);playSound('pour');}} onPointerUp={()=>{setPouring(false);setHeld(false);}} onPointerCancel={()=>{setPouring(false);setHeld(false);}} onLostPointerCapture={()=>{setPouring(false);setHeld(false);}} onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();setHeld(true);setPouring(true);}}} onKeyUp={()=>{setPouring(false);setHeld(false);}} onBlur={()=>{setPouring(false);setHeld(false);}}>누르는 동안 붓기</button>
 <button className="primary full" data-next-action={!pouring||undefined} disabled={pouring} onClick={()=>{setPouring(true);playSound('pour');}}>끝까지 붓기</button></div></Panel>:<Panel title="처음 컵에 돌아온 물의 양은?">
 <div className="stage-conclusion-options" data-next-action={!correct||undefined}><Choice ariaLabel="용기에 따라 모양은 바뀌지만, 돌아온 물의 양은 같아." selected={correct} onClick={()=>dispatch({type:'prediction',key:'liquidConclusion',value:'same'})}>물의 양은 같아</Choice><Choice selected={wrong} onClick={()=>dispatch({type:'prediction',key:'liquidConclusion',value:'change'})}>물의 양도 달라져</Choice></div>
 {correct&&<button className="primary full sand-entry" data-next-action="true" onClick={onSand}>모래 옮겨 붓기 →</button>}
 <button className="secondary full" onClick={()=>{setHeld(false);dispatch({type:'repeatLiquid'});}}>물 다시 옮겨 보기</button>
 </Panel>}</div></div>;
}
function SandTransfer({onWater}:{onWater:()=>void}){
 const {save,dispatch}=useGame(),c=save.checkpoints,step=c.sandStep??0;
 const legacy=c.sandStep===undefined&&save.completedScreens.includes('S06')&&c.sand;
 const [volumes,setVolumes]=useState(()=>settled(step)),[running,setRunning]=useState(false),[automatic,setAutomatic]=useState(false),[zoom,setZoom]=useState(c.sand&&(step===3||legacy));
 const auto=useRef(false),busy=running||automatic;
 const correct=save.predictions.sandConclusion==='solid',wrong=save.predictions.sandConclusion==='liquid';
 useEffect(()=>{setVolumes(settled(step));setRunning(false);},[step]);
 useEffect(()=>{if(!auto.current&&step<3&&volumes[sequence[step][1]]===1000)dispatch({type:'sandTransfer',step:step+1});},[volumes,step]);
 useEffect(()=>{
  if(!running||step>=3)return;
  const timer=setInterval(()=>{const [from,to]=sequence[step];setVolumes(v=>transfer(v,from,to,save.settings.reducedMotion?200:40));},60);
  const stop=()=>setRunning(false);window.addEventListener('blur',stop);document.addEventListener('visibilitychange',stop);
  return()=>{clearInterval(timer);window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',stop);};
 },[running,step,save.settings.reducedMotion]);
 useActivityGuide(zoom?(wrong?'더미 말고 모래알 하나의 모양을 다시 봐요.':correct?'모래알은 각각 고체예요. 다음 의뢰로 가요.':'확대한 모래알 하나하나의 모양을 보고 골라요.'):step<3?'「모래 붓기」를 눌러요. 용기가 바뀔 때 더미와 알갱이를 비교해요.':'세 번 옮겼어요! 모래알 하나를 확대해 봐요.',zoom?'모래알 하나':step<3?'모래 붓기':'모래알 확대 관찰하기');
 useExperimentPlayback({label:'모래 옮겨 붓기',enabled:!zoom&&!busy&&step<3,run:async flow=>{
  auto.current=true;setAutomatic(true);let current=[...volumes];const [from,to]=sequence[step];
  try{while(current[from]>0){current=transfer(current,from,to,100);setVolumes([...current]);await flow.wait(save.settings.reducedMotion?35:110);}if(!flow.isStopped())dispatch({type:'sandTransfer',step:step+1});}
  finally{auto.current=false;setAutomatic(false);setVolumes(settled(step+(!flow.isStopped()&&current[from]===0?1:0)));}
 }});
 function restart(){setRunning(false);setZoom(false);setVolumes([1000,0,0]);dispatch({type:'repeatSand'});}
 return <div className="activity-grid liquid-stage sand-transfer-stage"><div className="workspace">
 {zoom?<ExperimentCanvas kind="sand"/>:<SandPourLab volumes={volumes} step={step} moving={busy}/>}
 <div className="sand-transfer-progress" aria-label="모래 이동 기록">{legacy?<span>이전에 남긴 모래알 관찰 기록</span>:['넓은 용기로','길쭉한 용기로','처음 컵으로'].map((n,i)=><span key={n} className={step>i?'done':''}>{i+1} {n} {step>i?'✓':'○'}</span>)}</div>
 </div><div className="tools"><Panel title={zoom?'모래알 하나하나는?':step<3?`${step+1}/3 모래를 ${['넓은 용기로','길쭉한 용기로','처음 컵으로'][step]}`:'모래도 처음 컵으로 돌아왔어요'}>
 {!zoom&&step<3?<><p className="sand-cue">{busy?'모래알이 옮겨 가고 있어요. 쌓이는 모양을 봐요.':'물과 어떻게 다른지 모래알을 살펴보며 옮겨요.'}</p><button className="primary full sand-pour-button" data-next-action={!busy||undefined} disabled={busy} onClick={()=>setRunning(true)}>모래 붓기</button>{running&&<button className="secondary full" onClick={()=>setRunning(false)}>잠깐 멈추기</button>}</>:!zoom?<><p>쌓인 모양은 용기에 따라 달라졌어요. 알갱이 하나의 모양도 달라졌을까요?</p><button className="primary full" data-next-action="true" onClick={()=>{setZoom(true);dispatch({type:'sand'});}}>모래알 확대 관찰하기</button></>:<>
 <div className="stage-conclusion-options" data-next-action={!correct||undefined}><Choice ariaLabel="모래는 흘러도, 알갱이는 모양을 유지하는 고체야." selected={correct} onClick={()=>dispatch({type:'prediction',key:'sandConclusion',value:'solid'})}>고체야</Choice><Choice selected={wrong} onClick={()=>dispatch({type:'prediction',key:'sandConclusion',value:'liquid'})}>액체야</Choice></div>
 {wrong&&<p className="sand-feedback" role="alert">부을 수 있다고 모두 액체는 아니에요. 더미가 아니라 알갱이 하나의 모양을 다시 봐요.</p>}
 </>}
 <div className="sand-secondary"><button className="secondary full" disabled={busy} onClick={restart}>{legacy?'모래 붓기도 해보기':'모래 다시 붓기'}</button><button className="secondary full" disabled={busy} onClick={onWater}>물 비교 다시 보기</button></div>
 </Panel></div></div>;
}
function SandPourLab({volumes,step,moving}:{volumes:number[];step:number;moving:boolean}){
 const uid=useId().replace(/:/g,''),widths=[77,110,66],heights=[133,94,157],capacities=[1400,1600,1200];
 const [from,to]=sequence[Math.min(step,2)],progress=(1000-volumes[from])/1000;
 return <figure className="experiment-canvas experiment-stage liquid-simulation sand-pour-simulation" data-sand-step={step} data-sand-moving={moving}>
 <figcaption className="experiment-stage-heading"><span className="experiment-eyebrow">모래를 옮겨 비교하기</span><strong>더미 모양과 알갱이 하나를 따로 살펴봐요.</strong></figcaption>
 <div className="liquid-vessels sand-vessels" role="img" aria-label={vesselNames.map((n,i)=>n+(volumes[i]>0?'에 모래가 있어요':'은 비었어요')).join('. ')}>
 {vesselNames.map((name,i)=>{
  const w=widths[i],h=heights[i],left=80-w/2,top=180-h,amount=volumes[i],height=amount/capacities[i]*h*.85,half=Math.min(w/2-4,Math.sqrt(amount/1000)*(w/2-4)),level=180-height,peak=Math.max(top+8,level-Math.min(10,height*.35));
  const heap=`M${80-half} 180L${80-half} ${level+Math.min(6,height*.3)}Q${80-half*.45} ${level-2} 80 ${peak}Q${80+half*.45} ${level-2} ${80+half} ${level+Math.min(6,height*.3)}L${80+half} 180Z`;
  return <div key={name} className="liquid-vessel sand-vessel" data-sand-vessel={i} data-sand-amount={amount}><svg viewBox="0 0 160 204" aria-hidden="true"><defs><pattern id={`${uid}-grains-${i}`} width="8" height="7" patternUnits="userSpaceOnUse"><rect width="8" height="7" fill="#d4ac68"/><path d="m1 2 2-1 1 2-2 1Zm4 3 1-2 2 1-1 2Z" fill="#946434"/><path d="m3 6 1-2 2 1-1 1Z" fill="#f3d99b"/></pattern></defs>
  <ellipse cx="80" cy="188" rx={w/2+12} ry="7" fill="#597c70" opacity=".12"/>
  <path d={`M${left} ${top}v${h-4}q0 4 4 4h${w-8}q4 0 4-4V${top}`} fill="#f0fbf970" stroke="#668f8b" strokeWidth="3"/>
  {amount>0&&<path className="sand-heap" d={heap} fill={`url(#${uid}-grains-${i})`} stroke="#ae7c3e" strokeWidth="1"/>}
  <image href="/assets/generated/lab-glass.webp" x={left-4} y={top-6} width={w+8} height={h+15} preserveAspectRatio="none"/>
  </svg><span className="liquid-vessel-name">{name}</span></div>;
 })}
 {moving&&<svg className="sand-stream" viewBox="0 0 600 240" preserveAspectRatio="none" aria-hidden="true">{Array.from({length:14},(_,i)=>{
  const t=(progress*.8+i/14)%1,x=(100+from*200)*(1-t)+(100+to*200)*t,y=95*(1-t)+135*t-160*t*(1-t);
  return <path key={i} d="m-2 0 2-2 3 2-2 3Z" fill={i%2?'#a5743c':'#d6ae6b'} transform={`translate(${x} ${y}) rotate(${i*29})`}/>;
 })}</svg>}
 </div><p className="experiment-outline-key">흘리지 않고 옮겨요. 모래가 움직일 때 알갱이의 모양을 봐요.</p>
 </figure>;
}
