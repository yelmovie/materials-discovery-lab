import {useEffect,useRef,useState} from 'react';
import {makerOrders,evaluateOrder,type MakerOrder} from '../domain/maker';
import {canCompleteInvestigation,type Screen} from '../domain/model';
import {useGame} from '../state/GameContext';
import {playSound} from '../services/audio';
import {Modal} from './Modal';
import './maker-mission.css';

type Guide=(text:string,focus?:string)=>void;
export function MakerMission({screen,onGuide}:{screen:string;onGuide?:Guide}){
 const order=makerOrders.find(o=>o.screen===screen);
 return order?<Bench key={screen} order={order} onGuide={onGuide}/>:null;
}

function Bench({order,onGuide}:{order:MakerOrder;onGuide?:Guide}){
 const {save,dispatch}=useGame(),old=save.deliveries?.[order.screen];
 // Parts placed before a reload come back from the record (B14); a delivered order shows what was delivered.
 const [parts,setParts]=useState<Record<string,string>>(old?.parts??save.makerDrafts?.[order.screen]??{});
 const [selected,setSelected]=useState<{slot:string;id:string}|null>(null);
 const [lookingAt,setLookingAt]=useState<string|null>(null);
 const [phase,setPhase]=useState<'build'|'running'|'result'>(old?'result':'build');
 const [attempts,setAttempts]=useState(old?.attempts??0),[delivered,setDelivered]=useState(!!old);
 const [detail,setDetail]=useState<'conditions'|'result'|null>(null);
 const results=evaluateOrder(order,parts),failed=results.filter(r=>!r.pass),pass=failed.length===0;
 const missing=order.slots.filter(s=>!parts[s.id]).length,ready=missing===0,running=phase==='running';
 const canDeliver=canCompleteInvestigation(save,order.screen as Screen),pending=useRef(false);
 const chosenSlot=order.slots.find(s=>s.id===selected?.slot)?.label;
 const nextChoice=order.slots.find(s=>s.id===(lookingAt??(phase==='result'&&!pass?failed[0]?.id:undefined)))??order.slots.find(s=>!parts[s.id]);
 // One instruction for the whole bench; it is shown in the activity footer's single guide row.
 const guide:{text:string;focus?:string}=running?{text:order.watch}:chosenSlot?{text:`그림 아래 ${chosenSlot} 자리를 눌러 끼워 봐.`,focus:`${chosenSlot} 자리`}:phase==='result'&&pass&&!lookingAt?(delivered?{text:'주민에게 전달했어! 이제 새 의뢰에서 써 봐.',focus:'새 의뢰'}:!canDeliver?{text:`${order.success} 탐구 기록을 먼저 완성해 줘.`}:{text:`${order.success} 「주민에게 전달하기」를 눌러.`,focus:'주민에게 전달하기'}):phase==='result'&&!pass&&!lookingAt&&nextChoice?{text:`결과를 읽고 ${nextChoice.label} 재료를 바꿔 봐.`,focus:nextChoice.label}:nextChoice?{text:`${nextChoice.label}에 쓸 재료를 먼저 골라 봐.`,focus:nextChoice.label}:{text:`부품을 다 끼웠어. 「${order.trial}」을 눌러 봐.`,focus:order.trial};
 useEffect(()=>{onGuide?.(guide.text,guide.focus);},[guide.text,guide.focus,onGuide]);
 useEffect(()=>{
  if(!running)return;
  const timer=setTimeout(()=>{setPhase('result');pending.current=false;playSound(pass?'success':'retry');},save.settings.reducedMotion?450:1600);
  return()=>{clearTimeout(timer);pending.current=false;};
 },[running,pass,save.settings.reducedMotion]);
 function place(slot:string,id:string){
  if(running||!order.slots.find(s=>s.id===slot)?.choices.some(c=>c.id===id))return;
  setSelected(null);
  setLookingAt(null);
  if(parts[slot]===id)return;
  const next={...parts,[slot]:id};setParts(next);setPhase('build');setDelivered(false);playSound('drop');
  dispatch({type:'makerDraft',screen:order.screen,parts:next});
 }
 function run(){if(!ready||selected||running||pending.current)return;pending.current=true;setLookingAt(null);setAttempts(n=>n+1);setPhase('running');playSound('experiment');}
 function deliver(){
  if(delivered||!canDeliver||selected||phase!=='result'||!pass)return;
  dispatch({type:'deliver',screen:order.screen,parts,attempts});setDelivered(true);playSound('success');
 }
 const resultDetails=<div className="maker-result-list">{results.map(r=><p key={r.id} className={r.pass?'pass':'fix'}><b>{order.slots.find(s=>s.id===r.id)!.label}</b><span>{r.feedback}</span></p>)}</div>;
 return <section className="maker-mission" aria-label="주문 제작 작업대">
  <header className="maker-order">
   <img src={order.npc==='moru'?'/assets/generated/companion.webp':`/assets/characters/${order.npc}.webp`} alt=""/>
   <h2>{order.title}{delivered&&<span className="maker-delivered-mark"> · 납품 ✓</span>}</h2>
   <button className="maker-condition-button" onClick={()=>setDetail('conditions')}>시험 조건</button>
  </header>
  <div className="maker-layout">
   <div className={`maker-scene ${running?'is-testing':''} ${phase==='result'?(pass?'trial-pass':'trial-fail'):''}`}>
    <Apparatus order={order} parts={parts} active={phase!=='build'}/>
    {phase!=='build'&&<div className="maker-trial" aria-hidden="true">{running?'⋮':pass?'✓':'↻'}</div>}
    <div className="maker-sockets">{order.slots.map(s=>{
     const part=s.choices.find(c=>c.id===parts[s.id]),result=results.find(r=>r.id===s.id)!;
     return <button key={s.id} className={`maker-socket ${part?'fitted':''} ${phase==='result'&&!result.pass?'needs-fix':''}`} disabled={running} data-next-action={selected?.slot===s.id||undefined} aria-label={`${s.label} 자리${part?': '+part.label:''}`} onClick={()=>{if(selected?.slot===s.id)place(s.id,selected.id);else{setSelected(null);setLookingAt(s.id);}}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const [slot,id]=e.dataTransfer.getData('text/plain').split(':');if(slot===s.id)place(slot,id);}}><b>{s.label}</b><i style={part?chipStyle(s.id,part.id,part.color):{background:'transparent'}} aria-hidden="true">{phase==='result'&&!result.pass?'!':part?'✓':'＋'}</i>{!part&&<span>재료 놓기</span>}</button>;
    })}</div>
   </div>
   <div className="maker-controls">
    <div className="maker-fields">{order.slots.map(s=><fieldset key={s.id}><legend className="sr-only">{s.label}</legend><div className="maker-choice-row" data-choose={!running&&!selected&&nextChoice?.id===s.id||undefined}><span className="maker-choice-label" aria-hidden="true">{s.label}</span>{s.choices.map(c=><button key={c.id} data-fitted={parts[s.id]===c.id||undefined} draggable={!running} disabled={running} aria-pressed={selected?.slot===s.id&&selected.id===c.id} onDragStart={e=>e.dataTransfer.setData('text/plain',`${s.id}:${c.id}`)} onClick={()=>{setLookingAt(s.id);setSelected(current=>current?.slot===s.id&&current.id===c.id?null:{slot:s.id,id:c.id});}}>{order.screen==='S02'&&choiceArt[`${s.id}:${c.id}`]?<img className="maker-choice-art" src={choiceArt[`${s.id}:${c.id}`]} alt="" aria-hidden="true" draggable={false}/>:<i style={chipStyle(s.id,c.id,c.color)} aria-hidden="true"/>}<span>{c.label}</span>{parts[s.id]===c.id&&<b className="maker-fitted-mark" aria-label="끼움">✓</b>}</button>)}</div></fieldset>)}{phase==='result'&&!pass&&<div className="maker-fix-list" aria-live="polite">{resultDetails}<div className="maker-failure-compact"><p>고칠 부품 {failed.length}개</p><button onClick={()=>setDetail('result')}>원인 보기</button></div></div>}</div>
    <div className="maker-actions">{phase==='result'&&pass?<button className="primary maker-deliver" disabled={delivered||!canDeliver||!!selected} data-next-action={!delivered&&canDeliver&&!selected&&!lookingAt||undefined} onClick={deliver}>{delivered?'주민에게 납품했어 ✓':!canDeliver?'먼저 탐구 기록을 완성해 줘':'주민에게 전달하기 →'}</button>:<button className="primary" disabled={!ready||running||!!selected} data-next-action={ready&&phase==='build'&&!selected&&!lookingAt||undefined} onClick={run}>{running?'시험 중…':order.trial}</button>}<button className="secondary" disabled={running||(!selected&&missing===order.slots.length)} onClick={()=>{setParts({});setPhase('build');setDelivered(false);setSelected(null);setLookingAt(null);}}>부품 비우기</button></div>
   </div>
  </div>
  {detail&&<Modal title={detail==='conditions'?'의뢰와 시험 조건':'시험 결과'} className="maker-detail-dialog" onClose={()=>setDetail(null)}><h2>{detail==='conditions'?'의뢰와 시험 조건':'시험 결과'}</h2>{detail==='conditions'?<><p>{order.request}</p><p>{order.watch}</p><p>{order.note}</p></>:resultDetails}<button className="primary full" onClick={()=>setDetail(null)}>작업대로 돌아가기</button></Modal>}
 </section>;
}

// Painted swatches for choices that are real materials. Neutral A/B choices (cups, tubes) stay plain so the picture does not give the answer away.
const choiceArt:Record<string,string>={'roof:cloth':'/assets/generated/cards/maker-cloth.webp','roof:plastic':'/assets/generated/cards/maker-plastic.webp','support:rubber':'/assets/generated/cards/maker-rubber.webp','support:metal':'/assets/generated/cards/maker-metal.webp','tray:solid':'/assets/generated/materials/wood_raw.webp'};
const chipStyle=(slot:string,id:string,color:string)=>{const src=choiceArt[`${slot}:${id}`];return src?{background:`${color} url(${src}) center/cover`}:{background:color};};

function Apparatus({order,parts,active}:{order:MakerOrder;parts:Record<string,string>;active:boolean}){
 const art=(slot:string)=>choiceArt[`${slot}:${parts[slot]}`];
 const color=(slot:string)=>order.slots.find(s=>s.id===slot)?.choices.find(c=>c.id===parts[slot])?.color??'#eff7ed';
 const star='M250 125 L259 147 L283 149 L265 165 L270 189 L250 177 L230 189 L235 165 L217 149 L241 147Z';
 if(order.screen==='S02'){
  // 2026-11-21: 실제 재료 그림(scripts/prepare-picture-cards.mjs)으로 지붕과 받침을 그린다. 플라스틱 판은 비쳐 보이게, 막대는 막대 그림으로(고무는 시험 때 휜다).
  // 지붕 아래에는 젖으면 안 되는 연구 수첩을 둔다(전에는 별 장식이라 무엇을 지키는지 알 수 없었다).
  const bends=active&&parts.support==='rubber',leaks=active&&parts.roof==='cloth',bent='M151 222 Q168 171 140 114 M351 222 Q370 169 339 137';
  const rod=parts.support?`/assets/generated/cards/maker-${parts.support}-v.webp`:null,roof='M105 103 L250 49 L395 103 L387 119 H113Z';
  return <svg className="maker-apparatus" viewBox="0 0 500 260" role="img" aria-label="지붕 아래 젖으면 안 되는 연구 수첩과 지붕을 받치는 막대">
   <ellipse cx="250" cy="230" rx="187" ry="16" fill="#557d5a" opacity=".16"/>
   <defs>{art('roof')&&<pattern id="maker-tex-roof" patternUnits="userSpaceOnUse" width="500" height="260"><image href={art('roof')} x="95" y="40" width="310" height="90" preserveAspectRatio="xMidYMid slice"/></pattern>}<clipPath id="maker-roof-clip"><path d={roof}/></clipPath></defs>
   <image href="/assets/generated/maker/plank.webp" x="80" y="204" width="340" height="52" preserveAspectRatio="none"/>
   <image href="/assets/generated/cards/notebook.webp" x="219" y="138" width="62" height="86" preserveAspectRatio="xMidYMax meet" opacity={leaks?.75:1}/>
   <text x="250" y="133" textAnchor="middle" fontSize="13" fontWeight="700" fill="#3a4a33" stroke="#fffaf0" strokeWidth="4" paintOrder="stroke">연구 수첩 · 젖으면 안 돼요</text>
   {bends||!rod?<><path d={bends?bent:'M151 222 V113 M351 222 V113'} fill="none" stroke="#54706b" strokeWidth="18" strokeLinecap="round"/><path d={bends?bent:'M151 222 V113 M351 222 V113'} fill="none" stroke={color('support')} strokeWidth="12" strokeLinecap="round"/></>
    :<>{[151,351].map(x=><image key={x} href={rod} x={x-11} y="110" width="22" height="114" preserveAspectRatio="none"/>)}</>}
   <g transform={bends?'rotate(7 250 113)':undefined}>
    {parts.roof==='plastic'?<><path d={roof} fill="#dff3f8" fillOpacity=".5"/><path d={roof} fill="url(#maker-tex-roof)" opacity=".75"/><path d="M140 96 L250 58 M175 104 L262 72" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".8" clipPath="url(#maker-roof-clip)"/></>
     :<path d={roof} fill={art('roof')?'url(#maker-tex-roof)':color('roof')}/>}
    <path d={roof} fill="none" stroke="#54706b" strokeWidth="5" strokeLinejoin="round"/>
   </g>
   {active&&<><path className="maker-flow-line" d="M155 5 V80 M219 0 V58 M284 0 V60 M349 5 V83" stroke="#458cb5" strokeWidth="5" strokeLinecap="round" strokeDasharray="11 15"/>{leaks?<><path className="maker-flow-line" d="M215 121 V219 M285 121 V219" stroke="#4faed8" strokeWidth="6" strokeDasharray="8 17"/><ellipse cx="250" cy="224" rx="54" ry="6" fill="#65badb" opacity=".7"/></>:<path className="maker-flow-line" d="M112 122 V195 M389 122 V195" stroke="#4faed8" strokeWidth="5" strokeDasharray="8 17"/>}</>}
  </svg>;
 }
 if(order.screen==='S06'){
  const leaks=active&&parts.cup==='hole',plate=parts.tray!=='liquid';
  return <svg className="maker-apparatus" viewBox="0 0 500 260" role="img" aria-label="받침 위에 놓인 투명한 물컵과 물이 새는 자리">
   <ellipse cx="250" cy="230" rx="172" ry="16" fill="#557d5a" opacity=".16"/>
   {plate?<image href="/assets/generated/maker/tray.webp" x="110" y="176" width="280" height="66" preserveAspectRatio="none" opacity={parts.tray?1:.42}/>:<path d="M120 226 Q159 213 216 220 Q269 217 326 221 Q355 214 383 226 Q320 246 250 236 Q175 246 120 226Z" fill="#71c6e5" stroke="#4597bf" strokeWidth="3"/>}
   {parts.cup&&<path d={leaks?'M205 151 Q250 145 295 151 V177 Q250 192 205 177Z':'M205 101 Q250 95 295 101 V177 Q250 192 205 177Z'} fill="#66bedf"/>}
   <image href="/assets/generated/lab-glass.webp" x="194" y="30" width="112" height="160" opacity={parts.cup?1:.42}/>
   {parts.cup==='hole'&&<ellipse cx="250" cy="186" rx="5" ry="2" fill="#477478"/>}
   {leaks&&<><path className="maker-flow-line" d="M250 189 V224" stroke="#50add6" strokeWidth="6" strokeDasharray="7 6"/><ellipse cx="250" cy="227" rx="30" ry="5" fill="#52badb"/></>}
  </svg>;
 }
 if(order.screen==='S08'){
  const fan=parts.aim==='fan',blocked=parts.tube==='blocked',spin=active&&!blocked&&parts.tube==='open'&&fan;
  const tube=fan?'M77 193 H170 V100 H320':'M77 193 H170 V50 H250';
  const flow=blocked?'M87 193 H170 V127':fan?'M87 193 H170 V100 H321':'M87 193 H170 V50 H250';
  return <svg className="maker-apparatus" viewBox="0 0 500 260" role="img" aria-label="펌프에서 연결관을 거쳐 바람개비로 이어지는 장치">
   <ellipse cx="251" cy="228" rx="186" ry="15" fill="#557d5a" opacity=".16"/>
   <path d={tube} fill="none" stroke="#537475" strokeWidth="27" strokeLinejoin="round"/>
   <path d={tube} fill="none" stroke={color('tube')} strokeWidth="19" strokeLinejoin="round"/>
   <image href="/assets/generated/air-pump.webp" x="22" y="42" width="70" height="180"/>
   {blocked&&<path d="M160 122 H181" stroke="#7a493c" strokeWidth="9"/>}
   {active&&<path className="maker-flow-line" d={flow} fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" strokeDasharray="5 13"/>}
   <path d="M370 115 V226" stroke="#597e79" strokeWidth="9"/>
   <g className={spin?'maker-spin':''} style={{transformOrigin:'370px 100px'}}>
    <image href="/assets/generated/maker/pinwheel.webp" x="296" y="26" width="148" height="148"/>
   </g>
   {spin&&<path d="M417 49 Q437 63 441 81 M416 151 Q434 142 440 128" fill="none" stroke="#678c83" strokeWidth="4" strokeLinecap="round"/>}
  </svg>;
 }
 const clear=active&&parts.window==='clear',wet=active&&order.screen==='S10'&&parts.body==='wood';
 return <svg className="maker-apparatus" viewBox="0 0 500 260" role="img" aria-label="별이 들어 있는 시험 상자와 모서리를 누르는 장치">
  <ellipse cx="248" cy="225" rx="164" ry="13" fill="#557d5a" opacity=".16"/>
  <rect x="139" y="74" width="221" height="141" rx="12" fill={color('body')} stroke="#5a7d73" strokeWidth="7"/>
  <rect x="175" y="109" width="148" height="83" rx="8" fill={clear?'#cae8e2':color('window')} stroke="#5a7d73" strokeWidth="5"/>
  {clear&&<path d={star} fill="#f0ca63" stroke="#a08849" strokeWidth="2" transform="translate(0 -4)"/>}
  {active&&<path d="M39 150 L170 138 V163Z" fill="#ffe58f" opacity=".82"/>}
  <rect x="127" y="177" width="27" height="40" rx={parts.edge==='rubber'?10:2} fill={color('edge')} stroke="#496c64" strokeWidth="3"/>
  <rect className={parts.edge==='rubber'?'maker-press-cap':undefined} x="347" y="177" width="27" height="40" rx={parts.edge==='rubber'?10:2} fill={color('edge')} stroke="#496c64" strokeWidth="3"/>
  {active&&parts.edge==='rubber'&&<path d="M363 184 V210" fill="none" stroke="#714c46" strokeWidth="2" strokeDasharray="3 4"/>}
  {active&&<g className={`maker-press-tool ${parts.edge==='rubber'?'yields':'firm'}`}><path d="M382 197 H457" stroke="#80725f" strokeWidth="12"/><rect x="376" y="174" width="12" height="45" rx="3" fill="#9c896d"/></g>}
  {active&&order.screen==='S10'&&<path className="maker-flow-line" d="M155 2 V68 M219 3 V66 M290 1 V64 M347 5 V69" stroke="#4faed8" strokeWidth="5" strokeDasharray="8 14"/>}
  {wet&&<path d="M155 89 Q174 105 202 91 Q220 82 238 94 Q272 105 298 88 L299 78 H155Z" fill="#75613d" opacity=".52"/>}
 </svg>;
}
