import {useId} from 'react';
import {sampleColors,materials,shortNames,type Design} from '../domain/model';
/** Geometry stays fixed: changing a material changes its appearance and transparency. */
export function DesignModel({design}:{design:Design}){
 const id=useId().replaceAll(':',''),body=sampleColors[design.parts.body.sampleId],window=sampleColors[design.parts.window.sampleId],bumper=sampleColors[design.parts.bumper.sampleId];
 const bodyId=design.parts.body.sampleId,windowId=design.parts.window.sampleId,bumperId=design.parts.bumper.sampleId;
 const seeThrough=materials.find(m=>m.id===windowId)?.transparent;
 const surface=bodyId==='wood_raw'?`url(#${id}-grain)`:bodyId==='metal_plate'?`url(#${id}-brushed)`:bodyId==='rubber_soft'?`url(#${id}-rubber)`:undefined;
 return <svg className="design-model" viewBox="0 0 600 420" role="img" aria-label={`보관함 관찰 모형. 몸체는 ${shortNames[bodyId]}, 관찰창은 ${shortNames[windowId]}, 모서리 보호대는 ${shortNames[bumperId]}. 관찰창은 ${seeThrough?'빛이 통과해 안쪽 식물과 별 표시가 보여요':'불투명해 안쪽 표시가 보이지 않아요'}.`} data-window-transparent={seeThrough}>
  <defs>
   <pattern id={`${id}-grain`} width="44" height="25" patternUnits="userSpaceOnUse"><path d="M-10 5q18 10 37 0t37 0M0 20q22-10 44 0" stroke="#765431" opacity=".36" fill="none" strokeWidth="2"/></pattern>
   <pattern id={`${id}-brushed`} width="8" height="7" patternUnits="userSpaceOnUse"><path d="M0 1h8M0 4h8" stroke="#f2f7ff" opacity=".35" strokeWidth="1"/></pattern>
   <pattern id={`${id}-rubber`} width="11" height="11" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.2" fill="#752e39" opacity=".22"/></pattern>
   <linearGradient id={`${id}-body`} x1="0" y1="0" x2=".6" y2="1"><stop stopColor="#fff" stopOpacity=".28"/><stop offset=".48" stopColor="#fff" stopOpacity="0"/><stop offset="1" stopColor="#254b44" stopOpacity=".19"/></linearGradient>
   <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f7ffff" stopOpacity=".5"/><stop offset=".55" stopColor={window} stopOpacity=".12"/><stop offset="1" stopColor={window} stopOpacity=".55"/></linearGradient>
   <linearGradient id={`${id}-interior`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#d3e3bc"/><stop offset="1" stopColor="#f6efcd"/></linearGradient>
  </defs>
  <ellipse cx="309" cy="370" rx="215" ry="19" fill="#355c42" opacity=".13"/>
  <path d="m110 150 290 20v175l-290-22Z" fill={body} stroke="#466757" strokeWidth="4"/>
  {surface&&<path d="m110 150 290 20v175l-290-22Z" fill={surface}/>}
  <path d="m110 150 290 20v175l-290-22Z" fill={`url(#${id}-body)`}/>
  <path d="m400 170 95-60v175l-95 60Z" fill={body} stroke="#466757" strokeWidth="4"/>
  <path d="m400 170 95-60v175l-95 60Z" fill="#244841" opacity=".21"/>
  <path d="m110 137 95-60 290 20v17l-95 60-290-20Z" fill={body} stroke="#466757" strokeWidth="4"/>
  <path d="m111 137 289 20 94-59" stroke="#fff9df" strokeWidth="5" fill="none" opacity=".65"/>
  <path d="m205 78 283 20-90 56-279-18Z" fill="#fff" opacity=".15"/>
  <path d="M255 104V76q0-22 25-19l63 4q17 2 17 19v28" fill="none" stroke="#79603e" strokeWidth="16" strokeLinecap="round"/>
  <path d="M257 103V77q0-20 23-17l62 4q15 2 15 16v25" fill="none" stroke="#c1a06a" strokeWidth="8" strokeLinecap="round"/>
  <path d="m159 202 189 12v91l-189-13Z" fill={`url(#${id}-interior)`} stroke="#bda26c" strokeWidth="12" strokeLinejoin="round"/>
  <path d="m166 279 175 12" fill="none" stroke="#8eae85" strokeWidth="3"/>
  <g aria-hidden="true"><path d="m196 265 39 3-7 17-25-2Z" fill="#cb8a58"/><path d="M216 267v-28" stroke="#477a4a" strokeWidth="4"/><path d="M216 251q-23-2-20-18 21 2 20 18Zm0-7q20 0 19-15-20-1-19 15Z" fill="#6e9e58"/><path d="m283 235 8 17 18 3-13 13 2 18-17-9-16 7 3-18-12-14 18-1Z" fill="#e8b743" stroke="#c69536" strokeWidth="2"/></g>
  <path d="m159 202 189 12v91l-189-13Z" fill={seeThrough?`url(#${id}-glass)`:window} stroke="#789b94" strokeWidth="2"/>
  {seeThrough&&<><path d="m175 217 62 4-62 54Z" fill="white" opacity=".42"/><path d="m268 225 15 1-63 65-16-1Z" fill="white" opacity=".28"/></>}
  {[[110,150],[400,170],[110,323],[400,345],[495,110],[495,285]].map(([x,y],i)=><g key={i}><rect x={x-15} y={y-17} width="32" height="35" rx={bumperId==='rubber_soft'?10:4} fill={bumper} stroke="#735647" strokeWidth="3"/><path d={`M${x-8} ${y-9}v17m7-22v20`} fill="none" stroke="#fff" strokeWidth="3" opacity=".36"/></g>)}
  <path d="m122 318 267 21M411 335l73-47" stroke="#fff" strokeWidth="2" opacity=".25"/>
 </svg>;
}
