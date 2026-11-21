import './mission-burst.css';
// 2026-11-21 미션 완료 축하: 꽃가루가 위에서 흩날리고 「미션 완료!」 도장이 튀어나온다. 움직임 줄이기면 도장만 보인다(꽃가루는 안 보임).
const COLORS=['#f3c64a','#6fbf73','#4fa3d8','#f28b6b','#b98ae0','#fff6df'];
export function MissionBurst({label='미션 완료!'}:{label?:string}){
 return <div className="mission-burst" aria-hidden="true">
  {Array.from({length:28},(_,i)=><i key={i} style={{'--x':`${(i*37)%100}%`,'--c':COLORS[i%COLORS.length],'--d':`${(i%7)*0.09}s`,'--r':`${(i*53)%360}deg`,'--s':`${0.7+(i%4)*0.18}`} as React.CSSProperties}/>)}
  <b className="mission-stamp">{label}</b>
 </div>;
}
