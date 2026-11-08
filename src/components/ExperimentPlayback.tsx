import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import './experiment-playback.css';

export interface PlaybackFlow {
 wait:(ms:number)=>Promise<void>;
 isStopped:()=>boolean;
}
interface PlaybackOptions {
 label?:string;
 enabled:boolean;
 run:(flow:PlaybackFlow)=>Promise<void>|void;
}
interface Registration {
 owner:symbol;
 current:()=>PlaybackOptions;
}
interface PlaybackSession {
 owner:symbol;
 stopped:boolean;
 pending:Set<()=>void>;
}
interface PlaybackState {
 available:boolean;
 label:string;
 playing:boolean;
 message:string;
 speed:number;
}
interface PlaybackController {
 register:(registration:Registration)=>void;
 update:(owner:symbol)=>void;
 unregister:(owner:symbol)=>void;
 toggle:()=>void;
 setSpeed:(speed:number)=>void;
}
const speeds=[0.5,1,1.5,2];
// Remember the preference between stages without changing the student's save.
let preferredSpeed=1;
const ControllerContext=createContext<PlaybackController|null>(null);
const StateContext=createContext<PlaybackState>({available:false,label:'',playing:false,message:'',speed:1});
const initialState:PlaybackState={available:false,label:'',playing:false,message:'',speed:1};
const abortError=()=>new DOMException('Experiment playback stopped','AbortError');
const isAbortError=(error:unknown)=>typeof error==='object'&&error!==null&&'name' in error&&error.name==='AbortError';

/** Owns only visual playback; experiments keep their existing learning state. */
export function ExperimentPlaybackProvider({children}:{children:ReactNode}){
 const [state,setState]=useState<PlaybackState>(()=>({...initialState,speed:preferredSpeed}));
 const mounted=useRef(true),registration=useRef<Registration|null>(null),session=useRef<PlaybackSession|null>(null);
 const speed=useRef(preferredSpeed);
 const setSpeed=useCallback((value:number)=>{
  if(!speeds.includes(value))return;
  preferredSpeed=value;
  speed.current=value;
  setState(previous=>({...previous,speed:value}));
 },[]);
 const publish=useCallback((patch:Partial<PlaybackState>)=>{
  if(!mounted.current)return;
  setState(previous=>{
   const next={...previous,...patch};
   return previous.available===next.available&&previous.label===next.label&&previous.playing===next.playing&&previous.message===next.message&&previous.speed===next.speed?previous:next;
  });
 },[]);
 const clearSession=useCallback((active:PlaybackSession)=>{
  active.stopped=true;
  for(const cancel of [...active.pending])cancel();
  active.pending.clear();
  if(session.current===active)session.current=null;
 },[]);
 const stop=useCallback(()=>{
  const active=session.current;
  if(!active)return;
  clearSession(active);
  publish({playing:false,message:''});
 },[clearSession,publish]);
 const update=useCallback((owner:symbol)=>{
  const entry=registration.current;
  if(!entry||entry.owner!==owner)return;
  const options=entry.current();
  publish({available:options.enabled,label:options.label??''});
 },[publish]);
 const register=useCallback((entry:Registration)=>{
  if(registration.current?.owner!==entry.owner)stop();
  registration.current=entry;
  update(entry.owner);
 },[stop,update]);
 const unregister=useCallback((owner:symbol)=>{
  if(registration.current?.owner!==owner)return;
  registration.current=null;
  if(session.current?.owner===owner)stop();
  publish({available:false,label:'',message:''});
 },[stop,publish]);
 const start=useCallback(()=>{
  const entry=registration.current;
  if(!entry||!entry.current().enabled||session.current)return;
  const active:PlaybackSession={owner:entry.owner,stopped:false,pending:new Set()};
  session.current=active;
  publish({playing:true,message:''});
  const isStopped=()=>active.stopped||session.current!==active||!mounted.current;
  const flow:PlaybackFlow={
   isStopped,
   wait:(duration)=>new Promise<void>((resolve,reject)=>{
    if(isStopped()){reject(abortError());return;}
    let remaining=Number.isFinite(duration)?Math.max(0,duration):0;
    let previousTime=performance.now(),previousSpeed=speed.current;
    let timer:ReturnType<typeof setTimeout>;
    const cancel=()=>{clearTimeout(timer);active.pending.delete(cancel);reject(abortError());};
    const tick=()=>{
     if(isStopped()){cancel();return;}
     const now=performance.now();
     remaining-=(now-previousTime)*previousSpeed;
     previousTime=now;
     previousSpeed=speed.current;
     if(remaining<=0){active.pending.delete(cancel);resolve();}
     else timer=setTimeout(tick,Math.min(40,remaining/previousSpeed));
    };
    active.pending.add(cancel);
    timer=setTimeout(tick,Math.min(40,remaining/speed.current));
   }),
  };
  Promise.resolve().then(()=>{
   if(isStopped())throw abortError();
   // Read the latest callback even if a render occurred after the button press.
   return entry.current().run(flow);
  }).then(()=>{
   if(isStopped())return;
   clearSession(active);
   publish({playing:false,message:''});
  }).catch((error:unknown)=>{
   // A previous run must never reset a newer run's button state.
   if(isStopped())return;
   clearSession(active);
   publish({playing:false,message:isAbortError(error)?'':'자동재생을 마치지 못했어요. 다시 눌러 주세요.'});
  });
 },[clearSession,publish]);
 const toggle=useCallback(()=>{if(session.current)stop();else start();},[start,stop]);
 const controller=useMemo<PlaybackController>(()=>({register,update,unregister,toggle,setSpeed}),[register,update,unregister,toggle,setSpeed]);
 useEffect(()=>{
  mounted.current=true;
  if(registration.current)update(registration.current.owner);
  const manualInput=(event:Event)=>{
   const target=event.target;
   if(target instanceof Element&&target.closest('[data-playback-control]'))return;
   if(event instanceof KeyboardEvent&&['Shift','Control','Alt','Meta','CapsLock'].includes(event.key))return;
   stop();
  };
  document.addEventListener('pointerdown',manualInput,true);
  document.addEventListener('keydown',manualInput,true);
  const background=()=>{if(document.hidden)stop();};
  document.addEventListener('visibilitychange',background);
  window.addEventListener('hashchange',stop);
  window.addEventListener('popstate',stop);
  return()=>{
   mounted.current=false;
   document.removeEventListener('pointerdown',manualInput,true);
   document.removeEventListener('keydown',manualInput,true);
   document.removeEventListener('visibilitychange',background);
   window.removeEventListener('hashchange',stop);
   window.removeEventListener('popstate',stop);
   stop();
  };
 },[stop,update]);
 return <ControllerContext.Provider value={controller}><StateContext.Provider value={state}><div className="experiment-playback-provider" style={{'--experiment-rate':state.playing?state.speed:1} as CSSProperties}>{children}</div></StateContext.Provider></ControllerContext.Provider>;
}

/** Register once per mounted experiment; changing labels/enabled never aborts a run. */
export function useExperimentPlayback(options:PlaybackOptions){
 const controller=useContext(ControllerContext),latest=useRef(options),owner=useRef<symbol|null>(null);
 latest.current=options;
 if(!owner.current)owner.current=Symbol('experiment-playback');
 const current=useCallback(()=>latest.current,[]);
 useEffect(()=>{
  if(!controller)return;
  const id=owner.current!;
  controller.register({owner:id,current});
  return()=>controller.unregister(id);
 },[controller,current]);
 useEffect(()=>{
  if(controller)controller.update(owner.current!);
 },[controller,options.enabled,options.label]);
}

export function PlaybackButton(){
 const controller=useContext(ControllerContext),state=useContext(StateContext);
 if(!state.label&&!state.playing&&!state.message)return null;
 return <div className="experiment-playback-control" data-playback-control="true">
  <button type="button" className={`experiment-playback-button ${state.playing?'is-playing':''}`} disabled={!controller||(!state.available&&!state.playing)} aria-pressed={state.playing} aria-label={state.playing?'멈추기':'자동재생'} aria-description={state.label?`${state.label} 실험 과정을 자동으로 보여줘요.`:'실험 과정을 자동으로 보여줘요.'} title="실험 과정을 보여줘요. 직접 조작하면 자동재생이 멈춰요." onClick={()=>controller?.toggle()}>
   <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">{state.playing?<><path d="M8 5v14M16 5v14" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></>:<path d="m8 4 12 8-12 8Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>}</svg>
   <span>{state.playing?'멈추기':'자동재생'}</span>
   {state.playing&&<span className="experiment-playback-progress" aria-hidden="true"/>}
  </button>
  <select className="experiment-playback-speed" aria-label="자동재생 속도" value={state.speed} onChange={event=>controller?.setSpeed(Number(event.target.value))}>
   {speeds.map(value=><option key={value} value={value}>{value}배</option>)}
  </select>
  <span className={state.message?'experiment-playback-error':'experiment-playback-announcement'} role="status" aria-live="polite">{state.message||(state.playing?'실험 자동재생 중이에요.':'')}</span>
 </div>;
}
