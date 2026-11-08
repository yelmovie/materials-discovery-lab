import {canAccess, freshSave, materials, experiments, screens, parts, tests, resultFor, observationId, type Save, type Design, type Observation, type TestResult} from '../domain/model';
import {challenges,correctChallenge} from '../domain/challenges';
export const SAVE_KEY='material-workshop-mission.student.v1';
export interface StorageLike {getItem(key:string):string|null;setItem(key:string,value:string):void;removeItem(key:string):void}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const array=(v:unknown):v is unknown[]=>Array.isArray(v);
const num=(v:unknown)=>typeof v==='number'&&Number.isFinite(v);
const unique=(v:unknown[])=>new Set(v).size===v.length;
function assert(v:unknown):asserts v {if(!v)throw new Error('저장 데이터 형식이 맞지 않아.');}
function validateDesign(d:Design,obs:Observation[]){assert(object(d)&&typeof d.attemptId==='string'&&Number.isInteger(d.revision)&&d.revision>0&&array(d.needs)&&unique(d.needs)&&d.needs.every(p=>parts.includes(p))&&object(d.parts));for(const p of parts){const v=d.parts[p];assert(object(v)&&materials.some(m=>m.id===v.sampleId)&&array(v.observationIds)&&unique(v.observationIds)&&v.observationIds.every(id=>obs.some(o=>o.id===id&&o.sampleId===v.sampleId)));}}
function validateTests(ts:TestResult[]){assert(array(ts)&&ts.every(t=>object(t)&&tests.includes(t.testId)&&typeof t.attemptId==='string'&&Number.isInteger(t.designRevision)&&t.designRevision>0&&typeof t.pass==='boolean'&&typeof t.feedback==='string'));}
export function decodeSave(raw:string):Save {
 const parsed=JSON.parse(raw);assert(object(parsed));assert(parsed.schemaVersion===1&&parsed.contentVersion==='mvp-1');
 const s=parsed as unknown as Save;const fresh=freshSave();
 // Older MVP saves retain earned progress. New transfer tasks start unfilled.
 if(s.challengeResults===undefined)s.challengeResults=[];
 // Do not invent a first prediction for records created before this field existed.
 if(s.initialPredictions===undefined)s.initialPredictions={};
 assert(object(s.initialPredictions)&&Object.entries(s.initialPredictions).every(([k,v])=>['S05','S06'].includes(k)&&['same','change'].includes(v))); 
 assert(array(s.challengeResults)&&unique(s.challengeResults.map(r=>r?.id))&&s.challengeResults.every(r=>{if(!object(r)||typeof r.id!=='string'||!array(r.answer)||!r.answer.every(a=>typeof a==='string'))return false;const c=challenges.find(c=>c.id===r.id);return !!c&&correctChallenge(c,r.answer as string[]);}));
 assert(s.origin==='student'&&['home','world',...screens.map(x=>x.id)].includes(s.lastRoute)&&['activity','report','core','ending','certificate'].includes(s.lastPhase));
 assert(array(s.completedScreens)&&unique(s.completedScreens)&&s.completedScreens.every(id=>screens.some(x=>x.id===id)));
 assert(s.completedScreens.every(id=>screens.find(x=>x.id===id)!.prerequisites.every(p=>s.completedScreens.includes(p as never))));
 assert(array(s.observations)&&unique(s.observations.map(o=>o?.id))&&s.observations.every(o=>object(o)&&o.origin==='student'&&experiments.includes(o.experiment)&&materials.some(m=>m.id===o.sampleId)&&o.conditionId==='standard'&&o.id===observationId(o.experiment,o.sampleId)&&o.result===resultFor(o.experiment,o.sampleId)));
 assert(array(s.evidence)&&unique(s.evidence.map(e=>e?.id))&&s.evidence.every(e=>object(e)&&/^E0[1-5]$/.test(e.id)&&e.origin==='student'&&s.completedScreens.includes(`S${String(Number(e.id.slice(1))*2).padStart(2,'0')}` as never)&&array(e.observationIds)&&e.observationIds.every(id=>s.observations.some(o=>o.id===id))));
 const c=s.checkpoints;assert(object(c));
 for(const k of ['inspected','matched'] as const)assert(array(c[k])&&unique(c[k])&&c[k].every(p=>['canopy','frame','handle'].includes(p)));
 assert(array(c.assignments)&&unique(c.assignments)&&c.assignments.every(x=>['window','bumper'].includes(x))&&array(c.solid)&&unique(c.solid)&&c.solid.every(x=>[0,1,2].includes(x))&&[0,1,2,3].includes(c.liquidStep));
 for(const k of ['sand','inflated','airCompared'] as const)assert(typeof c[k]==='boolean');
 for(const k of ['closed','open'] as const){const t=c[k];assert(t===null||(object(t)&&t.cupId==='cup-1'&&t.depth===80&&t.orientation==='inverted'&&t.ventOpen===(k==='open')&&t.waterInside===(k==='open'?90:12)&&t.tissueWet===(k==='open')));}
 assert(object(s.predictions)&&Object.values(s.predictions).every(v=>typeof v==='string'&&v.length<500));
 validateDesign(s.design,s.observations);validateTests(s.testResults);
 assert(s.reportedRevision===null||Number.isInteger(s.reportedRevision)&&s.reportedRevision===s.design.revision);
 assert(typeof s.coreComplete==='boolean'&&typeof s.name==='string'&&s.name.length<=24);
 assert(object(s.settings)&&typeof s.settings.muted==='boolean'&&typeof s.settings.reducedMotion==='boolean'&&num(s.settings.bgm)&&s.settings.bgm>=0&&s.settings.bgm<=1&&num(s.settings.sfx)&&s.settings.sfx>=0&&s.settings.sfx<=1);
 assert(array(s.completionArchive));for(const r of s.completionArchive){assert(object(r)&&typeof r.id==='string'&&typeof r.name==='string'&&typeof r.date==='string'&&array(r.evidence)&&r.evidence.length===5&&r.evidence.every(e=>e.origin==='student'));validateDesign(r.design,s.observations);validateTests(r.tests);}
 // Copy only the known fields. Unknown fields never round-trip into student storage.
 const clean=Object.fromEntries(Object.keys(fresh).map(k=>[k,s[k as keyof Save]])) as unknown as Save;
 if(!canAccess(clean,clean.lastRoute,clean.lastPhase)){clean.lastRoute='world';clean.lastPhase='activity';}
 if(clean.lastPhase==='ending'){clean.lastPhase=clean.coreComplete?'certificate':'report';}
 return clean;
}
export function loadSave(storage:StorageLike):{save:Save;notice:string;blocked:boolean}{
 let raw:string|null=null;
 try{raw=storage.getItem(SAVE_KEY);if(!raw)return {save:freshSave(),notice:'',blocked:false};const header=JSON.parse(raw);if(object(header)&&(Number(header.schemaVersion)>1||header.contentVersion!=='mvp-1'))return {save:freshSave(),notice:'다른 버전의 저장 기록이 있어. 원본을 보존했어. 새로 시작을 확인하기 전에는 이번 진행이 저장되지 않아.',blocked:true};return {save:decodeSave(raw),notice:'',blocked:false};}
 catch{if(raw){try{storage.setItem(`${SAVE_KEY}.recovery`,raw);}catch{/* Keep the original slot if recovery cannot be written. */return {save:freshSave(),notice:'저장 기록을 읽지 못했고 복구본도 저장하지 못했어. 기존 기록을 보존하며 임시로 진행할게.',blocked:true};}}return {save:freshSave(),notice:raw?'손상된 저장 기록을 복구용으로 보관했어. 새 기록으로 시작할게.':'이 브라우저에서는 자동 저장을 사용할 수 없어. 창을 닫으면 이번 진행이 사라질 수 있어.',blocked:!raw};}
}
export function persist(storage:StorageLike,s:Save){if(s.origin!=='student')return false;try{const raw=JSON.stringify(s);decodeSave(raw);storage.setItem(SAVE_KEY,raw);return true;}catch{return false;}}

/** Best-effort synchronous optimistic check. Never replace a newer tab's record. */
export function persistIfUnchanged(storage:StorageLike,s:Save,expected:string|null):'saved'|'conflict'|'failed'{
 try{if(storage.getItem(SAVE_KEY)!==expected)return 'conflict';return persist(storage,s)?'saved':'failed';}catch{return 'failed';}
}
