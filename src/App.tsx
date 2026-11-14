import {bindDirectionPad} from './map-controls.js';
import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import {WorkshopRestoration} from './components/WorkshopRestoration';
import {useGame} from './state/GameContext';
import {screens,stages,evidenceNames,recovery,activityToResume,canAccess,canFinalize,canComplete,shortNames,type Route,type Phase,type Screen} from './domain/model';
import {MapEntryBoundary} from './components/MapEntryBoundary';
import {NpcVoice} from './components/NpcVoice';
import {NpcDialogue} from './components/NpcDialogue';
import {Icon} from './components/Icon';
import {Modal} from './components/Modal';
import {ConceptVideo} from './components/ConceptVideo';
import {SettingsDialog} from './components/SettingsDialog';
import {worldDestinations,type MapDirection,type MapPoint} from './domain/worldMap';
import {startAudio,updateAudio,clickSound,stopAudio} from './services/audio';
import {registerOffline} from './services/offline';
let worldModule:Promise<typeof import('./game/WorldCanvas')>|undefined;
function loadWorld(){
 return worldModule??=import('./game/WorldCanvas').catch(error=>{worldModule=undefined;throw error;});
}
const WorldCanvas=lazy(loadWorld);
const FinalPanels=lazy(()=>import('./screens/FinalPanels'));
const portrait=(npc:string)=>npc==='moru'?'/assets/generated/companion.webp':`/assets/characters/${npc}.webp`;
const npcNames=['모루','단단이','방울이','바람이','토리'];
const missions=[
 ['비를 막는 작은 지붕을 부탁해!','먼저 우산의 천, 살, 손잡이를 살펴봐요. 알아낸 성질을 작은 지붕 만들기에 써요.','부품 조사 기록을 얻으면 재료 선반과 간판에 불이 들어와요.'],
 ['안을 볼 수 있는 전시 상자를 만들어 줘!','재료에 빛을 비추고 눌러 봐요. 그 결과를 보고 상자의 창과 모서리를 골라요.','재료를 비교한 기록이 모이면 시험 장치가 다시 움직여요.'],
 ['흘리지 않는 운반대를 만들어 줘!','나무토막과 물을 다른 용기에 옮겨 봐요. 그 차이를 물 운반대 만들기에 써요.','고체와 액체를 비교하면 물이 지나가는 관을 다시 쓸 수 있어요.'],
 ['공기로 바람개비를 돌려 줘!','컵 안에서 공기가 차지하는 자리를 찾아봐요. 펌프에서 나온 공기로 날개도 돌려 봐요.','공기 관찰 기록을 모으면 펌프와 환기팬이 움직여요.'],
 ['관찰 기록으로 발명해요!','보관함의 몸체, 창, 모서리에 쓸 재료를 골라요. 물과 빛을 써 보고 모서리를 눌러 확인해요.','설계도와 시험 기록을 모으면 제작소와 중앙 코어를 다시 쓸 수 있어요.'],
];

// Teacher demo walks every activity, then the final report steps, in this order.
const demoSteps:{route:Route;phase:Phase}[]=[...screens.map(s=>({route:s.id as Route,phase:'activity' as Phase})),...(['report','core','ending','certificate'] as Phase[]).map(phase=>({route:'S10' as Route,phase}))];
type ModalKind='settings'|'evidence'|'mission'|'reward'|'reset'|'story'|'concept'|null;
export default function App(){
 const {save,student,demo,notice,dispatch}=useGame();
 const [modal,setModal]=useState<ModalKind>(null),[selectedStage,setSelectedStage]=useState(0),[target,setTarget]=useState<number|null>(null),[arrived,setArrived]=useState<number|null>(null),[toast,setToast]=useState(''),[returnToDesign,setReturnToDesign]=useState(false),[direction,setDirection]=useState<MapDirection|null>(null),[guide,setGuide]=useState(false),[conceptAdvance,setConceptAdvance]=useState(false),[storyStep,setStoryStep]=useState(0),[hand,setHand]=useState(false),[overview,setOverview]=useState(false),[reveal,setReveal]=useState<number|null>(null);
 const guideAnchor=useRef<HTMLDivElement>(null),guidedDoor=useRef<number|null>(null);
 const labels=useRef<HTMLElement>(null),pendingReveal=useRef<number|null>(null);
 const [clearCore,setClearCore]=useState(false);
 const coreCompletedBefore=useRef(save.coreComplete),pendingCoreDialogue=useRef(false);
 const [homeDressed,setHomeDressed]=useState(false),[mapReady,setMapReady]=useState(false),[mapSlow,setMapSlow]=useState(false),[mapFailed,setMapFailed]=useState(false);
 const focusActivity=useRef(false);
 const history=useRef<{route:Route;phase:Phase}[]>([]),previousDemo=useRef(demo);
 const route=save.lastRoute,phase=save.lastPhase,screen=screens.find(s=>s.id===route),stage=screen?stages[screen.stage-1]:null;
 useEffect(()=>{
  if(route!=='home'){setHomeDressed(false);return;}
  const timer=window.setTimeout(()=>setHomeDressed(true),650);
  return()=>clearTimeout(timer);
 },[route]);
 useEffect(()=>{
  if(route!=='world'){setMapReady(false);setMapSlow(false);setMapFailed(false);return;}
  if(mapReady||mapFailed)return;
  const timer=window.setTimeout(()=>setMapSlow(true),3000);
  return()=>clearTimeout(timer);
 },[route,mapReady,mapFailed]);
 useEffect(()=>{
  if(route!=='home'||modal!=='story')return;
  const warm=()=>{
   const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string}}).connection;
   if(!document.hidden&&navigator.onLine&&!connection?.saveData&&!/^(slow-)?2g$/.test(connection?.effectiveType||''))
    void loadWorld().catch(()=>{/* The map's boundary handles errors on entry. */});
  };
  if(typeof requestIdleCallback==='function'){const id=requestIdleCallback(warm,{timeout:700});return()=>cancelIdleCallback(id);}
  const timer=window.setTimeout(warm,300);
  return()=>clearTimeout(timer);
 },[route,modal]);
 useEffect(()=>{
  if(!screen||!focusActivity.current)return;
  focusActivity.current=false;
  document.querySelector<HTMLElement>('.activity-heading h1')?.focus({preventScroll:true});
 },[screen]);
 useEffect(()=>{if(route!=='world')return;const pad=document.querySelector<HTMLElement>('.map-direction-pad');if(!pad)return;const controls=bindDirectionPad(pad,'[data-map-direction]',b=>b.dataset.mapDirection as MapDirection,{blocked:()=>!!modal||reveal!==null||document.hidden,press:d=>{cancelMapWalk();setOverview(false);setHand(false);setDirection(d);},release:()=>setDirection(null)});return controls.destroy;},[route,modal,reveal]);
 const reducedMotion=save.settings.reducedMotion||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const isActivity=!!screen&&phase==='activity',nextStage=Math.min(save.evidence.length,5),progress=recovery(save);
 const [Activity,setActivity]=useState<typeof import('./screens/Activities').Activity|null>(null);
 const [activityFailed,setActivityFailed]=useState(false);
 useEffect(()=>{
  if(!isActivity||Activity)return;
  let active=true;
  void import('./screens/Activities').then(module=>{if(active)setActivity(()=>module.Activity);},()=>{if(active)setActivityFailed(true);});
  return()=>{active=false;};
 },[isActivity,Activity]);
 useEffect(()=>{
  if(!import.meta.env.PROD||!isActivity||demo)return;
  const timer=window.setTimeout(registerOffline,3000);
  return()=>clearTimeout(timer);
 },[isActivity,demo]);
 const resumeActivity=activityToResume(save,save.resumeActivity);
 const hasProgress=!!resumeActivity||student.completedScreens.length>0||student.checkpoints.inspected.length>0||student.observations.length>0;
 function navigate(next:Route,nextPhase:Phase='activity'){history.current.push({route,phase});dispatch({type:'navigate',route:next,phase:nextPhase});setModal(null);clickSound();}
 function back(){if(modal){setModal(null);return;}const previous=history.current.pop();if(previous&&(demo||canAccess(save,previous.route,previous.phase)))dispatch({type:'navigate',...previous});else if(route==='world')dispatch({type:'navigate',route:'home'});else if(screen)dispatch({type:'navigate',route:'world'});}
 useEffect(()=>updateAudio(save.settings),[save.settings]);
 useEffect(()=>{document.addEventListener('pointerdown',startAudio,{once:true});document.addEventListener('keydown',startAudio,{once:true});return()=>{document.removeEventListener('pointerdown',startAudio);document.removeEventListener('keydown',startAudio);stopAudio();};},[]);
 useEffect(()=>{document.documentElement.dataset.reduced=String(save.settings.reducedMotion);},[save.settings.reducedMotion]);
 useEffect(()=>{
  if(demo||!save.coreComplete)pendingCoreDialogue.current=false;
  else if(!coreCompletedBefore.current)pendingCoreDialogue.current=true;
  coreCompletedBefore.current=save.coreComplete;
 },[save.coreComplete,demo]);
 useEffect(()=>{if(previousDemo.current!==demo){history.current=[];cancelMapWalk();pendingReveal.current=null;setReveal(null);previousDemo.current=demo;}},[demo]);
 useEffect(()=>{window.scrollTo(0,0);cancelMapWalk();setDirection(null);setGuide(false);setHand(false);setOverview(false);if(route!=='world'){setReveal(null);setClearCore(false);}else if(pendingReveal.current!==null){setReveal(pendingReveal.current);pendingReveal.current=null;}else if(pendingCoreDialogue.current){setClearCore(true);pendingCoreDialogue.current=false;}},[route,phase]);
 useEffect(()=>{if(modal){setDirection(null);if(guidedDoor.current!==null)cancelMapWalk();}},[modal]);
 useEffect(()=>{const hash=()=>{const [r,p]=location.hash.slice(1).split('/');if(['home','world',...screens.map(s=>s.id)].includes(r))dispatch({type:'navigate',route:r as Route,phase:(['report','core','ending','certificate'].includes(p)?p:'activity') as Phase});};hash();window.addEventListener('hashchange',hash);return()=>window.removeEventListener('hashchange',hash);},[]);
 useEffect(()=>{if(!demo)window.history.replaceState(null,'',`#${route}${route==='S10'&&phase!=='activity'?'/'+phase:''}`);},[route,phase,demo]);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),5000);return()=>clearTimeout(t);},[toast]);
 function finish(){if(!screen||!canComplete(save,screen.id as Screen))return;if(screen.next==='world'&&stage&&!save.evidence.some(e=>e.id===`E0${stage.id}`))pendingReveal.current=stage.id-1;dispatch({type:'complete',screen:screen.id as Screen});clickSound(true);setConceptAdvance(true);setModal('concept');}
 function continueAfterConcept(){if(!screen)return;setConceptAdvance(false);if(screen.next==='world')setModal('reward');else navigate(screen.next as Route);}
 function isOpen(i:number){return demo||(i===5?canFinalize(save)||save.coreComplete:canAccess(save,stages[i].screens[0] as Screen));}
 function cancelMapWalk(){guidedDoor.current=null;setTarget(null);setArrived(null);}
 function pickDestination(i:number,guided=false){
  guidedDoor.current=null;
  if(!isOpen(i)){cancelMapWalk();setToast(i===5?'다섯 공방의 연구 기록과 보관함 시험을 먼저 마쳐 주세요.':`${stages[i-1].name}의 연구 기록을 먼저 모아 주세요.`);return;}
  if(arrived===i&&guided){enter(i);return;}
  guidedDoor.current=guided?i:null;setSelectedStage(i);if(arrived!==i)setArrived(null);setDirection(null);setOverview(false);setHand(false);setTarget(i);setGuide(false);
 }
 function onArrive(i:number){if((target!==null&&target!==i)||!isOpen(i))return;setSelectedStage(i);setArrived(i);if(guidedDoor.current===i){guidedDoor.current=null;enter(i);}}
 function enter(i:number){if(!isOpen(i))return;if(i===5)navigate('S10',save.coreComplete?'certificate':'report');else{setSelectedStage(i);setModal('mission');}}
 function enterStage(fromStart=false,index=selectedStage){if(!isOpen(index))return;if(index===5){navigate('S10',save.coreComplete?'certificate':'report');return;}const entry=stages[index];const first=entry.screens[0] as Screen,second=entry.screens[1] as Screen;focusActivity.current=true;navigate(!fromStart&&save.completedScreens.includes(first)?second:first);}
 function enterWithoutMap(){
  if(nextStage===5){
   const finalPhase=save.coreComplete?'certificate':'report';
   if(demo||canAccess(save,'S10',finalPhase)){focusActivity.current=true;navigate('S10',finalPhase);return;}
  }
  for(let i=Math.min(nextStage,4);i>=0;i--){
   const [first,second]=stages[i].screens as [Screen,Screen];
   const destination=save.completedScreens.includes(first)&&canAccess(save,second)?second:first;
   if(demo||canAccess(save,destination)){focusActivity.current=true;navigate(destination);return;}
  }
 }
 function mapRecovery(failed:boolean){
  return <section className="map-entry-recovery">
   <p role="status">{failed?'지도를 불러오지 못했어요. 탐구부터 시작할 수 있어요.':mapSlow?'지도가 늦게 열리고 있어요. 탐구부터 시작할 수 있어요.':'숲속 공방으로 가는 길을 준비해요…'}</p>
   {(failed||mapSlow)&&<div className="map-entry-actions"><button className="primary" onClick={enterWithoutMap}>탐구부터 시작하기</button><button className="secondary" onClick={()=>location.reload()}>지도 다시 불러오기</button></div>}
  </section>;
 }
 const demoIndex=demoSteps.findIndex(s=>s.route===route&&s.phase===phase);
 function demoGo(index:number){const step=demoSteps[Math.max(0,Math.min(demoSteps.length-1,index))];navigate(step.route,step.phase);}
 function demoNextStage(){const current=stage?.id??0;if(current>=5){if(demoIndex<demoSteps.length-1)demoGo(demoIndex+1);return;}navigate(stages[current].screens[0] as Route);}
 useEffect(()=>{if(!demo||!screen)return;const key=(e:KeyboardEvent)=>{if(modal||document.activeElement?.matches('input,select,textarea,[contenteditable=true]'))return;if(e.key==='ArrowLeft'&&demoIndex>0){e.preventDefault();demoGo(demoIndex-1);}else if(e.key==='ArrowRight'&&demoIndex<demoSteps.length-1){e.preventDefault();demoGo(demoIndex+1);}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);});
 // Labels follow the camera; the lower-right action stays available when its destination is out of view.
 function placeLabels(x:number,y:number,zoom:number,friend:MapPoint){const el=labels.current;if(!el)return;el.style.setProperty('--cam-x',`${x*zoom}px`);el.style.setProperty('--cam-y',`${y*zoom}px`);el.style.setProperty('--zoom',String(zoom));
  const w=el.clientWidth,h=el.clientHeight,short=h<560,top=overview?30:short?64:104,bottom=overview?30:short?78:124,origin=el.getBoundingClientRect(),controls=[...(el.closest('.route-world')?.querySelectorAll('.map-goal,.map-direction-pad,.map-tools,.map-next-action,.topbar button')??[])].map(c=>c.getBoundingClientRect());
  const blocked=(left:number,top:number,right:number,bottom:number)=>controls.some(c=>c.width>0&&left+origin.left<c.right&&right+origin.left>c.left&&top+origin.top<c.bottom&&bottom+origin.top>c.top);
  const cue=guideAnchor.current;
  if(cue){const cx=(friend.x-x)*zoom,cy=(friend.y-y)*zoom,visible=!overview&&cx>=22&&cx<=w-22&&cy>=56&&cy<=h&&!blocked(cx-22,cy-44,cx+22,cy);
   cue.toggleAttribute('data-positioned',visible);
   if(visible){cue.style.left=`${cx}px`;cue.style.top=`${cy}px`;cue.style.setProperty('--map-hint-left',`${Math.max(12,Math.min(cx-160,w-12-Math.min(320,w-24)))-cx+22}px`);cue.toggleAttribute('data-hint-below',cy<230);controls.push(cue.getBoundingClientRect());}
  }
  el.querySelectorAll<HTMLElement>('.map-label').forEach((label,i)=>{const d=worldDestinations[i],sx=d.labelX*zoom-x*zoom,sy=d.labelY*zoom-y*zoom,half=label.offsetWidth/2+8,tall=label.offsetHeight/2+8,away=sx<half||sx>w-half||sy<top||sy>h-bottom||blocked(sx-half,sy-tall,sx+half,sy+tall);
   label.classList.toggle('offscreen',away);
  });}
 function story(){setStoryStep(0);setModal('story');}
 const nextActionStage=arrived!==null&&isOpen(arrived)?arrived:nextStage;
 const nextPlace=worldDestinations[nextActionStage].name,nextSuffix=[0,8].includes((nextPlace.charCodeAt(nextPlace.length-1)-0xac00)%28)?'로':'으로';
 const modalTitle=modal==='mission'?missions[selectedStage]?.[0]:modal==='reward'?'공방 복구 완료':modal==='reset'?'연구 기록 초기화':modal==='story'?'공방을 깨우는 이야기':'나의 연구 수첩';
 const npcDialoguePilot=modal==='mission'||modal==='reward';
 const activityHeading=screen?<div className="activity-heading"><div><span className="stage-badge">{stage?.name}</span><span className="activity-number">활동 {screen.id.slice(1)} / 10</span><h1 tabIndex={-1}>{phase==='activity'?screen.title:{report:'연구 보고',core:'코어 재가동',ending:'공방 복구',certificate:'연구원 인증서'}[phase]}</h1></div>{returnToDesign&&route==='S03'&&<button className="secondary" onClick={()=>{setReturnToDesign(false);navigate('S09');}}>설계로 돌아가기 →</button>}</div>:null;
 const demoToolbar=demo&&screen?<div className="demo-toolbar"><nav className="demo-step-pad" aria-label="교사용 활동 넘기기"><button aria-label="이전 활동" disabled={demoIndex<=0} onClick={()=>demoGo(demoIndex-1)}><Icon name="back"/></button><span><b>{demoIndex+1}</b> / {demoSteps.length}<small>← → 키로 넘겨요</small></span><button aria-label="다음 활동" disabled={demoIndex>=demoSteps.length-1} onClick={()=>demoGo(demoIndex+1)}><Icon name="back"/></button></nav>
 <button className="primary demo-next-stage" aria-label={(stage?.id??0)<5?`다음 스테이지 · ${stages[stage?.id??0].name}`:'다음 단계로'} disabled={demoIndex>=demoSteps.length-1} onClick={demoNextStage}>{(stage?.id??0)<5?'다음 공방':'다음 단계'} <Icon name="next"/></button></div>:null;
 return <div className={`app route-${route} ${demo?'demo-mode':''}`}>
 <header className="topbar" aria-label="공통 메뉴"><div className="global-controls"><button className="icon-button" aria-label="홈" onClick={()=>navigate('home')}><Icon name="home"/></button><button className="icon-button" aria-label="이전" disabled={route==='home'&&!modal} onClick={back}><Icon name="back"/></button></div><div className="global-controls"><button className="icon-button" aria-label={save.settings.muted?'소리 켜기':'소리 끄기'} aria-pressed={!save.settings.muted} onClick={()=>dispatch({type:'settings',value:{muted:!save.settings.muted}})}><Icon name={save.settings.muted?'muted':'sound'}/></button><button className="icon-button" aria-label="설정" aria-expanded={modal==='settings'} onClick={()=>setModal('settings')}><Icon name="settings"/></button></div></header>
 {demo&&<div className="demo-ribbon">교사용 시연 · 학생 기록과 따로 진행해요</div>}
 {notice&&<div className="storage-notice" role="alert">{notice}</div>}
 <main className={screen?`activity-shell ${isActivity?'live-activity':'final-activity'}`:''} style={stage?{'--stage-bg':`url(/assets/backgrounds/stage-${stage.id}.webp)`} as React.CSSProperties:undefined}>
 {route==='home'&&<div className={`home-page${homeDressed?' home-dressed':''}`}><div className="home-hero"><div className="hero-copy"><span className="eyebrow light">토리·모루와 함께하는 물질 탐구 모험</span><img className="game-logo" src="/assets/logo.webp" width={900} height={230} fetchPriority="high" alt="물질 공방 대작전"/><h1>작은 발견이 모이면,<br/>공방이 다시 깨어나요!</h1><p>재료를 살펴보고 어떻게 달라지는지 시험해요.<br/>모은 단서로 보관함을 만들어 공방을 다시 열어요.</p><div className="hero-actions"><button className="primary gold" onClick={()=>{if(resumeActivity){focusActivity.current=true;navigate(resumeActivity);}else enterWithoutMap();}}>{hasProgress?'이어서 실험하기':'실험 바로 시작'} <span>→</span></button><button className="ghost" onClick={()=>navigate('world')}>공방 지도 보기</button><button className="ghost" onClick={story}>시작 이야기 보기</button>{hasProgress&&<button className="ghost" onClick={()=>setModal('reset')}>새로 시작</button>}</div><p className="save-note">살펴보기 → 시험하기 → 새 의뢰에 써 보기 · 기록은 자동 저장돼요</p></div></div></div>}
 {route==='world'&&<div className={`world-page ${overview?'overview':''}`} data-map-ready={mapReady}><div className="map-frame"><WorkshopRestoration/><div className="map-surface"><MapEntryBoundary fallback={mapRecovery(true)}><Suspense fallback={mapRecovery(false)}>{mapFailed?mapRecovery(true):<><WorldCanvas key={save.origin} clearStage={clearCore?'core':reveal!==null?worldDestinations[reveal]?.id:null} encounterIds={save.origin==='student'?[...save.evidence.map(e=>['materials','properties','states','air','invention'][Number(e.id.slice(1))-1]),...(save.coreComplete?['core']:[])]:[]} mapHits={save.mapHits} onMapHit={(id,hits)=>dispatch({type:'mapHit',id,hits})} onReady={()=>{setMapReady(true);setMapSlow(false);}} onFailure={()=>{setMapFailed(true);setMapReady(false);}} onCamera={placeLabels} onPan={()=>{cancelMapWalk();setGuide(false);setOverview(false);setHand(true);}} onFollow={()=>{setOverview(false);setHand(false);}} target={target} nextStage={save.coreComplete?6:nextStage} recovered={save.evidence.length} coreComplete={save.coreComplete} reduced={reducedMotion} direction={direction} overview={overview} hand={hand} reveal={reveal} onRevealEnd={()=>setReveal(null)} paused={!!modal} onSelect={pickDestination} onArrive={onArrive} onLeave={()=>setArrived(null)} onMoveStart={cancelMapWalk}/>{!mapReady&&mapRecovery(false)}</>}</Suspense></MapEntryBoundary>
 <nav ref={labels} className="map-destination-labels" aria-label="공방 목적지">{worldDestinations.map((d,i)=><button key={d.id} className={`map-label ${!isOpen(i)?'locked':i<save.evidence.length?'restored':i===nextStage?'current':''} ${selectedStage===i&&target!==null?'selected':''}`} style={{'--x':`${d.labelX}px`,'--y':`${d.labelY}px`} as React.CSSProperties} aria-pressed={target===i} aria-label={`${d.name}${!isOpen(i)?' · 앞선 연구 기록 필요':i<save.evidence.length?' · 복구 완료':''}`} onClick={()=>pickDestination(i)}><Icon name={isOpen(i)?'unlock':'lock'}/><span className="label-text"><b>{d.name}</b></span></button>)}</nav>
 </div><div className={`map-goal ${reveal!==null?'reveal':''}`} role="status"><b>{reveal!==null?`${stages[reveal].worldEffect}!`:save.coreComplete?'공방 마을 복구 완료':'공방 탐험 지도'}</b></div>
 <div className="map-direction-pad" aria-label="연구원 이동">{(['up','left','down','right'] as MapDirection[]).map(d=><button key={d} data-map-direction={d} className={`direction-${d} ${direction===d?'held':''}`} aria-label={{up:'위로 이동',left:'왼쪽으로 이동',down:'아래로 이동',right:'오른쪽으로 이동'}[d]} onKeyDown={e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();cancelMapWalk();setOverview(false);setHand(false);setDirection(d);}}} onKeyUp={()=>setDirection(null)} onBlur={()=>setDirection(null)}><Icon name="back"/></button>)}</div>
 <div ref={guideAnchor} className="map-guide"><button aria-label="모루의 길 안내" aria-expanded={guide} aria-controls="map-moru-hint" onClick={()=>{cancelMapWalk();setGuide(!guide);}}><span aria-hidden="true">…</span></button><div id="map-moru-hint" className="map-guide-bubble" role="status" hidden={!guide}>{save.coreComplete?'모든 공방이 깨어났어요! 다른 재료로 다시 발명해 볼까요?':`다음은 ${worldDestinations[nextStage].name}이에요. 오른쪽 아래의 활동 시작 버튼을 누르면 바로 실험해요. 건물을 눌러 길을 따라 걸어 볼 수도 있어요.`}</div></div>
 <div className="map-next-stack">
 <div className="map-tools"><button aria-label={hand&&!overview?'연구원 따라 보기':'손으로 둘러보기'} aria-pressed={hand&&!overview} onClick={()=>{cancelMapWalk();setGuide(false);setOverview(false);setHand(overview||!hand);}}><Icon name='hand'/></button><button aria-label={overview?'이전 지도 보기로 돌아가기':'지도 한눈에 보기'} aria-pressed={overview} onClick={()=>{cancelMapWalk();setGuide(false);setOverview(!overview);}}><Icon name='map'/></button></div>
 <button className={`primary map-next-action ${!save.coreComplete&&reveal===null&&target===null&&arrived===null&&!reducedMotion?'map-next-cue':''}`} disabled={reveal!==null||target!==null&&arrived!==target} aria-busy={reveal!==null||target!==null&&arrived!==target} onClick={()=>arrived!==null&&isOpen(arrived)?enterStage(false,arrived):enterWithoutMap()}>{target!==null&&arrived!==target?<>길을 따라 이동하고 있어요… <Icon name="next"/></>:arrived!==null&&isOpen(arrived)?<>{worldDestinations[arrived].name} 활동 시작 <Icon name="next"/></>:<>{nextPlace}{nextSuffix} · 활동 시작 <Icon name="next"/></>}</button>{arrived!==null&&arrived<5&&isOpen(arrived)&&<button className="secondary map-briefing-action" onClick={()=>enter(arrived)}>의뢰 이야기 보기</button>}</div>
 </div></div>}
 {screen&&<>{isActivity?<>{activityHeading}{demoToolbar}</>:<div className="final-toprail">{activityHeading}{demoToolbar}</div>}
 <div className="stage-body">{isActivity?(Activity?<Activity key={`${demo}-${route}`} screen={screen.id as Screen} onFinish={finish} onConcept={()=>{setConceptAdvance(false);setModal('concept');}} onMessage={setToast} onNavigate={s=>{if(route==='S09'&&s==='S03')setReturnToDesign(true);navigate(s);}}/>:<div className="loading" role="status">{activityFailed?<><p>실험 도구를 열지 못했어요.</p><button className="secondary" onClick={()=>location.reload()}>다시 열기</button></>:<>실험 도구를 준비하고 있어요…</>}</div>):<Suspense fallback={<div className="loading">연구 기록을 펼쳐요…</div>}><FinalPanels key={`${demo}-${phase}`} navigate={p=>navigate('S10',p)}/></Suspense>}</div>
</>}
 </main>
 {toast&&<div className="toast" role="status">{toast}<button aria-label="알림 닫기" onClick={()=>setToast('')}>×</button></div>}
 {modal==='settings'&&<SettingsDialog onClose={()=>setModal(null)} onStory={story} onEvidence={()=>setModal('evidence')} onReset={()=>setModal('reset')} onFinal={p=>navigate('S10',p)}/>}
 {modal==='concept'&&screen&&<ConceptVideo screen={screen.id as Screen} onClose={()=>{setConceptAdvance(false);setModal(null);}} onContinue={conceptAdvance?continueAfterConcept:undefined} continueLabel={screen.next==='world'?'복구 보상 받기':'다음 활동으로'}/>}
 {modal&&modal!=='settings'&&modal!=='concept'&&<Modal key={modal} title={modalTitle} className={`modal-${modal}${npcDialoguePilot?' workshop-stage':''}`} onClose={()=>setModal(null)}>
 {modal==='story'&&<><span className="eyebrow">공방장 토리의 초대 · {storyStep+1}/3</span><h2>{['멈춰 버린 숲속 공방','발견을 모으면, 마을이 깨어나요','마지막 발명가는 바로 나!'][storyStep]}</h2><div className="mission-dialogue"><img src={portrait(storyStep===0?'tori':storyStep===1?'moru':'banguli')} alt="공방 친구"/><p>{['물질 코어가 멈추면서 재료 정보가 뒤섞였어요. 친구들과 공방을 다시 움직여 주세요.','한 번에 한 가지를 바꿔 실험해요. 무엇이 달라졌는지 기록해 친구의 새 부탁을 해결해요.','마지막에는 나만의 보관함을 만들어요. 관찰 기록으로 재료를 고르고, 시험 결과를 보고 고쳐요.'][storyStep]}</p></div>{storyStep===0&&<NpcVoice muted={save.settings.muted||save.settings.sfx===0}/>}<button className="primary full" onClick={()=>storyStep<2?setStoryStep(storyStep+1):navigate('world')}>{storyStep<2?'이야기 계속 듣기 →':'모루와 공방으로 출발! →'}</button></>}
 {modal==='mission'&&<NpcDialogue key={stages[selectedStage].npc} npc={stages[selectedStage].npc} name={npcNames[selectedStage]} lines={missions[selectedStage]} kind="mission" muted={save.settings.muted||save.settings.sfx===0} reducedMotion={save.settings.reducedMotion}><button className="primary" onClick={()=>enterStage()}>{save.completedScreens.includes(stages[selectedStage].screens[0] as Screen)?'두 번째 활동 이어 하기':'첫 번째 활동 시작하기'} →</button>{(demo||save.completedScreens.includes(stages[selectedStage].screens[0] as Screen))&&<button className="secondary" onClick={()=>enterStage(true)}>첫 번째 활동 다시 관찰하기</button>}</NpcDialogue>}
 {modal==='reward'&&stage&&<NpcDialogue npc={stage.npc} name={npcNames[stage.id-1]} lines={[stage.worldEffect+'!']} kind="reward" muted={save.settings.muted||save.settings.sfx===0} reducedMotion={save.settings.reducedMotion} detail={<><strong>{stage.name} 복구 완료!</strong><span>{evidenceNames[stage.id-1]} · 복구 {progress}%</span></>}><button className="primary" onClick={()=>navigate('world')}>불이 켜진 공방 보러 가기 →</button></NpcDialogue>}
 {modal==='evidence'&&<><span className="eyebrow">발견이 모이는 곳</span><h2>나의 연구 수첩</h2><div className="notebook-stages">{evidenceNames.map((name,i)=><div className={save.evidence.some(e=>e.id===`E0${i+1}`)?'earned':''} key={name}><b>0{i+1}</b><span>{name}</span><small>{save.evidence.some(e=>e.id===`E0${i+1}`)?'획득 ✓':'아직 조사 중'}</small></div>)}</div><h3>처음 예상과 지금 생각</h3><div className="observation-list">{(['S05','S06'] as const).map(id=>save.predictions[id]&&<article key={id}><b>{id==='S05'?'고체의 모양':'물의 모양과 양'}</b><span>처음: {save.initialPredictions[id]?(id==='S05'?(save.initialPredictions[id]==='same'?'모양·크기 그대로':'용기 따라 바뀜'):(save.initialPredictions[id]==='same'?'모양만 바뀌고 양은 같음':'모양·양 모두 바뀜')):'이전 기록이라 확인 불가'}<br/>지금: {id==='S05'?(save.predictions[id]==='same'?'모양·크기 그대로':'용기 따라 바뀜'):(save.predictions[id]==='same'?'모양만 바뀌고 양은 같음':'모양·양 모두 바뀜')}</span></article>)}{!save.predictions.S05&&!save.predictions.S06&&<p>상태 실험실에서 예상하면 생각의 변화가 여기에 남아요.</p>}</div><h3>직접 남긴 관찰 · {save.observations.length}개</h3><div className="observation-list">{save.observations.map(o=><article key={o.id}><b>{shortNames[o.sampleId]}</b><span>{o.result}</span></article>)}{!save.observations.length&&<p>성질 시험실에서 직접 실험하면 관찰 카드가 모여요.</p>}</div>{save.completionArchive.length>0&&<p>완료한 연구 기록 {save.completionArchive.length}회 보관 중</p>}</>}
 {modal==='reset'&&<><span className="eyebrow">새로운 발견</span><h2>연구 기록을 초기화할까요?</h2><p>이 브라우저의 별명·미션 진행·연구 기록·발명 설계·인증서 기록이 지워져요. 소리 설정은 남아요.</p><div className="modal-actions"><button data-initial-focus="true" className="secondary" onClick={()=>setModal('settings')}>취소</button><button className="danger-action" onClick={()=>{dispatch({type:'reset'});history.current=[];setModal(null);}}>연구 기록 지우기</button></div></>}
 </Modal>}
 </div>;
}



