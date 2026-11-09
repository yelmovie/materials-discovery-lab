import {useState,useRef,useEffect} from 'react';
import {useGame} from '../state/GameContext';
import {stages} from '../domain/model';
import {playSound} from '../services/audio';
import './workshop-restoration.css';
export function WorkshopRestoration(){
 const launch=useRef<HTMLButtonElement>(null);
 const {save,dispatch}=useGame();const [closed,setClosed]=useState(true),[lift,setLift]=useState(0);
 useEffect(()=>{if(closed)launch.current?.focus({preventScroll:true});},[closed]);
 const index=stages.findIndex((_,i)=>save.evidence.some(e=>e.id===`E0${i+1}`)&&(save.restoration?.[i]??0)<3);
 const [celebrate,setCelebrate]=useState<number|null>(null);
 const stage=celebrate??index;if(stage===null||stage<0)return null;
 const step=save.restoration?.[stage]??0,done=step===3;
 const parts=[['선반 받침','간판 톱니'],['비교판','시험 손잡이'],['배관 고리','물 펌프'],['공기 관','환기 날개'],['제작 받침','코어 고리']][stage];
 function advance(){dispatch({type:'restoreWorkshop',stage:stage!,step:step+1});playSound(step===2?'success':'drop');if(step===2)setCelebrate(stage);}
 if(closed)return <button ref={launch} className="workshop-return" onClick={()=>setClosed(false)}>공방 복구 작업대 열기</button>;
 return <section className={`workshop-restoration ${done?'unveiled':''}`} aria-label="공방 복구 작업대" onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape')setClosed(true);}}><header><strong>{stages[stage].name} · 전시 준비</strong><button aria-label="작업대 접기" onClick={()=>setClosed(true)}>−</button></header>
 <div className="workshop-display"><div className="workshop-machine" aria-hidden="true"><span className={step>0?'snapped':''}>⚙</span><b>✦</b><span className={step>1?'snapped':''}>⚙</span></div><div className="workshop-cloth" style={{transform:`translateY(-${done?110:lift}%)`}} aria-hidden="true">물질 공방</div><div className="workshop-sockets">{parts.map((part,i)=><button key={part} disabled={step!==i} className={step>i?'fitted':''} onClick={advance}>{step>i?'✓ 찰칵!':`${part} 끼우기`}</button>)}</div></div>
 <p role="status">{done?`${stages[stage].worldEffect}!`:step<2?'빈 홈에 부품을 하나씩 끼워 줘.':'이제 천을 위로 걷어 전시대를 밝혀 줘!'}</p>
 {step===2&&<><label className="workshop-lift">천 걷기 <input aria-label="전시대 천 걷기" type="range" min="0" max="100" step="10" value={lift} onChange={e=>{const v=+e.target.value;setLift(v);if(v===100)advance();}}/></label><button onClick={()=>{setLift(100);advance();}}>천 끝을 잡아 걷기 ↑</button></>}
 {done&&<button onClick={()=>{setCelebrate(null);setLift(0);}}>전시 완성! 지도 계속 보기</button>}
 </section>;
}
