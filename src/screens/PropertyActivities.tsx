// 2026-11-21 3-4단계: Activities.tsx에서 옮긴 성질 시험실(S03 시료 비교·S04 부품 재료 정하기) 화면. 내용은 그대로다.
import {useState,useEffect,useRef} from 'react';
import {useGame} from '../state/GameContext';
import {parts,partNames,shortNames,materials,experiments,experimentNames,requiredComparisons,resultFor,observationId,sampleColors,type Experiment} from '../domain/model';
import {GestureButton,type Gesture} from '../components/GestureButton';
import {DragBoard} from '../components/DragBoard';
import {Modal} from '../components/Modal';
import {useExperimentPlayback} from '../components/ExperimentPlayback';
import {playSound} from '../services/audio';
import ObjectViewport from '../game/ObjectViewport';
import {hasBatchim,Panel,Choice,useActivityGuide,MaterialThumb,ExperimentCanvas} from './activity-kit';
export const sampleGestures:Record<Experiment,{gesture:Gesture;icon:string;label:string;hint:string}>={
 elastic_return:{gesture:'swipe',icon:'↔',label:'양쪽으로 당기기',hint:'손잡이를 오른쪽 끝까지 밀어 당겨요'},
 light_transmission:{gesture:'tap',icon:'🔦',label:'손전등 켜기',hint:'눌러서 빛을 비춰요'},
 water_absorption:{gesture:'hold',icon:'💧',label:'스포이트 짜기',hint:'꾹 눌러 물방울을 떨어뜨려요'},
 compression_recovery:{gesture:'hold',icon:'⬇',label:'꾹 눌렀다 놓기',hint:'누름판을 꾹 눌러요'},
};
export function Samples(){
 const {save,dispatch}=useGame();const [experiment,setExperiment]=useState<Experiment>('elastic_return'),[sample,setSample]=useState('rubber_soft'),[phase,setPhase]=useState<'ready'|'running'|'observed'>('ready'),[answer,setAnswer]=useState(''),[feedback,setFeedback]=useState(''),[extra,setExtra]=useState(false);
 const automatic=useRef(false);
 useEffect(()=>{if(phase!=='running'||automatic.current)return;const timer=setTimeout(()=>setPhase('observed'),save.settings.reducedMotion?300:1100);return()=>clearTimeout(timer);},[phase,save.settings.reducedMotion]);
 const result=resultFor(experiment,sample),opposite=resultFor(experiment,materials.find(m=>resultFor(experiment,m.id)!==result)!.id),options=[result,opposite].sort(),recorded=save.observations.some(o=>o.id===observationId(experiment,sample));
 function choose(e:Experiment,m:string,start=false){setExperiment(e);setSample(m);setAnswer('');setFeedback('');setExtra(false);if(start){setPhase('running');playSound(e==='water_absorption'?'pour':'experiment');}else setPhase('ready');}
 function run(){setPhase('running');setAnswer('');setFeedback('');playSound(experiment==='water_absorption'?'pour':'experiment');}
 const samples=materials.filter(m=>requiredComparisons[experiment].includes(m.id));
 const nextSample=requiredComparisons[experiment].find(m=>m!==sample&&!save.observations.some(o=>o.id===observationId(experiment,m)));
 const nextExperiment=experiments.find(e=>e!==experiment&&requiredComparisons[e].some(m=>!save.observations.some(o=>o.id===observationId(e,m))));
 const advanceExperiment=recorded&&!nextSample?nextExperiment:undefined,hasNext=!!nextSample||!!advanceExperiment;
 function continueComparing(){if(advanceExperiment){const next=requiredComparisons[advanceExperiment].find(m=>!save.observations.some(o=>o.id===observationId(advanceExperiment,m)));choose(advanceExperiment,next??requiredComparisons[advanceExperiment][0]);}else choose(experiment,nextSample??requiredComparisons[experiment].find(m=>m!==sample)??sample);}
 // After a correct record the next sample is set up by itself; the student still starts each test.
 useEffect(()=>{if(!(recorded&&phase==='observed'&&feedback&&hasNext))return;const t=setTimeout(continueComparing,save.settings.reducedMotion?700:1600);return()=>clearTimeout(t);},[recorded,phase,feedback,hasNext]);
 function pick(o:string){if(recorded)return;setAnswer(o);if(o===result){dispatch({type:'observe',experiment,sampleId:sample,answer:o});setFeedback('관찰 기록 완료!');playSound('success');}else{setFeedback(`「다시 실험 보기」로 ${lookFor}${hasBatchim(lookFor)?'을':'를'} 한 번 더 보고 비교해요.`);playSound('retry');}}
 const lookFor={elastic_return:'당긴 뒤의 모양',light_transmission:'뒤쪽 표시',water_absorption:'물방울',compression_recovery:'누른 뒤의 모양'}[experiment];
 const allDone=experiments.every(e=>requiredComparisons[e].every(m=>save.observations.some(o=>o.id===observationId(e,m))));
 useActivityGuide(phase==='ready'?`「${sampleGestures[experiment].label}」로 직접 실험해요.`:phase==='running'?`${lookFor}의 변화에 주목해요.`:recorded?(allDone?'네 가지 시험을 모두 비교했어요!':advanceExperiment?'좋아요! 곧 다음 시험으로 넘어가요.':'좋아요! 곧 다른 재료로 같은 시험을 해요.'):feedback?`${lookFor}부터 다시 보고 설명을 골라요.`:`${lookFor}의 변화를 보고 맞는 설명을 눌러요.`,phase==='ready'?sampleGestures[experiment].label:recorded?(advanceExperiment?'다음 시험':'다른 재료'):lookFor);
 useExperimentPlayback({label:'이 시료 실험 재생',enabled:phase!=='running',run:async flow=>{automatic.current=true;run();try{await flow.wait(save.settings.reducedMotion?400:1250);if(!flow.isStopped())setPhase('observed');}finally{automatic.current=false;if(flow.isStopped())setPhase(current=>current==='running'?'ready':current);}}});
 return <div className="activity-grid samples-stage"><div className="workspace"><div className="tab-row experiment-tabs">{experiments.map((e,i)=><button key={e} disabled={phase==='running'} aria-pressed={experiment===e} onClick={()=>choose(e,requiredComparisons[e].find(m=>!save.observations.some(o=>o.id===observationId(e,m)))??requiredComparisons[e][0])}><span>{i+1}</span>{experimentNames[e]} {requiredComparisons[e].every(m=>save.observations.some(o=>o.id===observationId(e,m)))?'✓':''}</button>)}</div><div className="direct-experiment"><ExperimentCanvas kind="samples" sample={sample} experiment={experiment} active={phase!=='ready'} moving={phase==='running'} reduced={save.settings.reducedMotion}/>{phase==='ready'&&<GestureButton className="experiment-run-button" gesture={sampleGestures[experiment].gesture} icon={sampleGestures[experiment].icon} label={sampleGestures[experiment].label} hint={`${shortNames[sample]} · ${sampleGestures[experiment].hint}`} onDone={run}/>}</div></div><div className="tools"><Panel title={phase==='observed'?`${shortNames[sample]}에서 본 것은?`:'시험할 재료 고르기'}>
 {phase!=='observed'?<><div className="sample-grid">{samples.map(m=><Choice key={m.id} disabled={phase==='running'} selected={sample===m.id} ariaLabel={`${shortNames[m.id]} 바로 시험하기`} onClick={()=>choose(experiment,m.id,true)}><MaterialThumb id={m.id}/>{shortNames[m.id]} {save.observations.some(o=>o.id===observationId(experiment,m.id))?'✓':''}</Choice>)}</div><button className="primary full sample-simple-run" disabled={phase!=='ready'} onClick={run}>실험하기</button><button className="stage-info-button" disabled={phase==='running'} onClick={()=>setExtra(true)}>다른 재료도 시험하기 ＋</button></>:<><div className="sample-answer-options" data-next-action={!recorded||undefined}>{options.map(o=><Choice key={o} disabled={recorded} selected={answer===o} onClick={()=>pick(o)}>{o}</Choice>)}</div>{feedback&&<p className={`sample-feedback ${recorded?'success':'retry'}`} role="status">{recorded?'✓ 관찰 기록 완료!':feedback}</p>}<div className="stage-action-pair"><button className="secondary full" onClick={run}>다시 실험 보기 ↻</button>{recorded&&hasNext&&<button className="primary full" aria-label={advanceExperiment?'다른 재료와 비교 · 다른 시험':'다른 재료와 비교'} data-next-action="true" onClick={continueComparing}>{advanceExperiment?'다음 시험':'다른 재료'} →</button>}</div></>}
 <div className="comparison-progress">{requiredComparisons[experiment].map(m=><span className={save.observations.some(o=>o.id===observationId(experiment,m))?'done':''} key={m}>{shortNames[m]} {save.observations.some(o=>o.id===observationId(experiment,m))?'✓':'○'}</span>)}</div></Panel></div>{extra&&<Modal title="다른 재료도 시험하기" className="stage-detail-modal" onClose={()=>setExtra(false)}><h2>다른 재료도 시험하기</h2><div className="sample-grid">{materials.map(m=><Choice key={m.id} selected={sample===m.id} onClick={()=>choose(experiment,m.id,true)}><MaterialThumb id={m.id}/>{shortNames[m.id]}</Choice>)}</div></Modal>}</div>;
}
export function Assignments({onMessage}:{onMessage:(s:string)=>void}){
 type Target='window'|'bumper';
 const {save,dispatch}=useGame(),done=save.checkpoints.assignments;
 // Older saves kept the decision but not its material. A later S09 draft can contain an unsuitable material.
 // Use a valid observed candidate for that older preview, while new saves retain the exact accepted choice.
 function previousMaterial(p:Target){
  const fits=(id:string)=>materials.some(m=>m.id===id&&(p==='window'?m.transparent:m.cushioning))&&save.observations.some(o=>o.sampleId===id&&o.experiment===(p==='window'?'light_transmission':'compression_recovery'));
  return save.checkpoints.assignmentMaterials?.[p]??(fits(save.design.parts[p].sampleId)?save.design.parts[p].sampleId:materials.find(m=>fits(m.id))?.id??(p==='window'?'plastic_clear':'rubber_soft'));
 }
 const initial=Object.fromEntries((['window','bumper'] as const).filter(p=>done.includes(p)).map(p=>[p,previousMaterial(p)]));
 const first:Target=done.includes('window')&&!done.includes('bumper')?'bumper':'window';
 const [part,setPart]=useState<Target>(first),[sample,setSample]=useState(initial[first]??''),[property,setProperty]=useState(''),[placed,setPlaced]=useState<Record<string,string>>(initial),[feedback,setFeedback]=useState(''),[retryMaterial,setRetryMaterial]=useState(false);
 const evidence=save.observations.find(o=>o.sampleId===sample&&o.experiment===(part==='window'?'light_transmission':'compression_recovery'));
 const finished=done.length===2;
 useActivityGuide(finished?'창과 보호대 재료를 모두 정했어요!':!sample||retryMaterial?'재료를 고른 뒤 그림의 붙일 곳을 눌러요.':!evidence?'관찰 기록이 있는 다른 재료로 바꿔 붙여요.':'관찰 기록을 보고 이 부품에 필요한 성질을 눌러요.',!sample||retryMaterial?'재료 고르기':!evidence?'다른 재료':'필요한 성질');
 function choosePart(next:Target){setPart(next);setSample(placed[next]??'');setProperty('');setFeedback('');setRetryMaterial(false);}
 function place(m:string,p:string){const next=p as Target;if(done.includes(next))return;setPart(next);setSample(m);setPlaced(v=>({...v,[next]:m}));setProperty('');setFeedback('');setRetryMaterial(false);}
 const previewDesign={...save.design,parts:{...save.design.parts,window:{...save.design.parts.window,sampleId:placed.window??save.design.parts.window.sampleId},bumper:{...save.design.parts.bumper,sampleId:placed.bumper??save.design.parts.bumper.sampleId}}};
 function decide(value:string){
  if(!sample||!evidence||done.includes(part))return;
  setProperty(value);
  const m=materials.find(m=>m.id===sample)!,needed=part==='window'?'transparent':'cushioning',fits=part==='window'?m.transparent:m.cushioning;
  if(fits&&value===needed){
   dispatch({type:'assignment',part,sampleId:sample,property:value,observationId:evidence.id});
   onMessage(partNames[part]+' 재료와 성질을 확인했어요!');playSound('success');
   const other=part==='window'?'bumper':'window';
   if(!done.includes(other)){setPart(other);setSample(placed[other]??'');setProperty('');}
   setFeedback('');setRetryMaterial(false);
  }else{
   setRetryMaterial(value===needed&&!fits);
   setFeedback(value===needed&&!fits?'관찰 기록에서 이 재료가 그 성질을 보였는지 다시 봐요. 다른 재료로 바꿔 붙여요.':partNames[part]+'의 쓰임을 보고 필요한 성질을 다시 골라요.');
   playSound('retry');
  }
 }
 const props=[['transparent','빛이 통과한다'],['cushioning','눌렸다가 돌아온다'],['rigid','모양을 단단히 유지한다']];
 const targets=(['window','bumper'] as const).map(p=>({id:p,label:partNames[p],filled:placed[p]?shortNames[placed[p]]:undefined,done:done.includes(p)}));
 const instruction=finished?'두 부품 완성! 다음 의뢰로 가요.':!sample||retryMaterial?'재료를 고른 뒤 그림에 붙여요.':!evidence?'다른 재료의 관찰 기록을 비교해요.':'관찰 기록을 보고 필요한 성질을 골라요.';
 return <div className="activity-grid assignment-stage material-placement-stage"><div className="workspace request-workspace">
 <DragBoard variant="cards" label="재료를 고른 뒤 그림의 관찰창이나 모서리 보호대에 붙여요." tokens={materials.map(m=>({id:m.id,label:shortNames[m.id],color:sampleColors[m.id],image:'/assets/generated/materials/'+m.id+'.webp'}))} slots={targets.map(t=>({...t,disabled:t.done}))} onPlace={place} renderTargets={({picked,place:attach})=><>
  <div className="assignment-task" role="status"><b>{finished?'✓ 두 부품 완성':picked?'2 그림에 붙이기':!sample||retryMaterial?'1 재료 고르기':'3 성질 확인하기'}</b><span>{picked?shortNames[picked]+' → 그림의 붙일 곳을 눌러요':instruction}</span></div>
  <div className="assignment-visual"><div className="assignment-model"><ObjectViewport kind="box" design={previewDesign} selected={part} reduced={save.settings.reducedMotion} placement={{targets,picked:picked?shortNames[picked]:null}} onSelect={p=>{if(p!=='window'&&p!=='bumper')return;if(picked)attach(p);else choosePart(p);}}/></div></div>
 </>}/></div><div className="tools"><Panel title={partNames[part]+' 재료 정하기'}>
 <div className="selected-material">{sample&&<MaterialThumb id={sample}/>}<span>붙인 재료</span><b>{sample?shortNames[sample]:'재료를 골라 그림에 붙여요'}</b></div>
 {sample&&(evidence?<div className="evidence-card"><small>내가 남긴 관찰 기록</small><p>{evidence.result}</p></div>:<p className="evidence-card missing">이 재료의 {part==='window'?'빛 비추기':'누르고 놓기'} 기록이 없어요. 기록이 있는 다른 재료를 붙여요.</p>)}
 <div className="property-choices" role="group" aria-label="필요한 성질" data-next-action={!!evidence&&!done.includes(part)&&!retryMaterial||undefined}><small>{partNames[part]}에 꼭 필요한 성질은?</small>{props.map(([value,label])=><Choice key={value} disabled={!evidence||done.includes(part)} selected={property===value||done.includes(part)&&value===(part==='window'?'transparent':'cushioning')} onClick={()=>decide(value)}>{label}</Choice>)}</div>
 {feedback&&<p className="assignment-feedback" role="alert">{feedback}</p>}
 <div className="mini-progress" aria-label="재료 결정 현황">{(['window','bumper'] as const).map(p=><span key={p} className={done.includes(p)?'done':''}>{partNames[p]} {done.includes(p)?'✓':'○'}</span>)}</div>
 </Panel></div></div>;
}
