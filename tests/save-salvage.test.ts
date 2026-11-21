// 2026-11-21 3-2b: 손상된 기록은 손상된 줄만 건너뛰고(F14), 제작 중 놓은 부품은 새로고침 뒤에도 남긴다(B14).
import {describe,it,expect} from 'vitest';
import {freshSave,demoSave,reduceSave,LEGACY_RESULTS,type Save} from '../src/domain/model';
import {decodeSave,loadSave,persist,salvageSave,RECOVERY_KEY,SAVE_KEY,type StorageLike} from '../src/services/storage';
import {challenges,challengesFor} from '../src/domain/challenges';

class Memory implements StorageLike {data=new Map<string,string>();getItem(k:string){return this.data.get(k)??null;}setItem(k:string,v:string){this.data.set(k,v);}removeItem(k:string){this.data.delete(k);}}
/** A finished student run, built the same way as tests/domain.test.ts. */
function ready():Save{const s=demoSave(freshSave().settings);s.origin='student';s.observations=s.observations.map(o=>({...o,origin:'student'}));s.evidence=s.evidence.map(e=>({...e,origin:'student'}));s.lastRoute='S10';s.challengeResults=challenges.map(c=>({id:c.id,answer:[...c.answer]}));return decodeSave(JSON.stringify(s));}
/** S01 finished through the real reducer, standing in S02 with the umbrella matched. */
function midRun():Save{
 let s=reduceSave(freshSave(),{type:'navigate',route:'S01'});
 for(const part of ['canopy','frame','handle'] as const)s=reduceSave(s,{type:'inspect',part});
 for(const c of challengesFor('S01'))s=reduceSave(s,{type:'challenge',id:c.id,answer:c.answer});
 s=reduceSave(s,{type:'complete',screen:'S01'});s=reduceSave(s,{type:'navigate',route:'S02'});
 for(const [part,material] of [['canopy','천'],['frame','금속'],['handle','나무']] as const)s=reduceSave(s,{type:'match',part,material,evidence:part});
 return s;
}
const load=(raw:string)=>{const store=new Memory();store.setItem(SAVE_KEY,raw);return {store,result:loadSave(store)};};
const subset=(a:unknown[],b:unknown[])=>a.every(x=>b.some(y=>JSON.stringify(y)===JSON.stringify(x)));

describe('current and older saves still restore unchanged',()=>{
 it('round trips the current format, including a maker draft',()=>{const s=reduceSave(midRun(),{type:'makerDraft',screen:'S02',parts:{roof:'plastic'}});expect(decodeSave(JSON.stringify(s))).toEqual(s);const {result}=load(JSON.stringify(s));expect(result.save).toEqual(s);expect(result.notice).toBe('');});
 it('restores a record saved before maker drafts existed',()=>{const s=midRun();const old={...s} as Partial<Save>;delete old.makerDrafts;const {result}=load(JSON.stringify(old));expect(result.notice).toBe('');expect(result.save.makerDrafts).toEqual({});expect(result.save.completedScreens).toEqual(s.completedScreens);expect(result.save.checkpoints).toEqual(s.checkpoints);});
 it('restores a finished run without any notice',()=>{const s=ready();const {result}=load(JSON.stringify(s));expect(result.notice).toBe('');expect(result.save).toEqual(s);});
});

describe('observation wording update (2026-11-21)',()=>{
 it('reads a record with the old observation sentences as the same progress',()=>{
  const s=ready(),raw=JSON.parse(JSON.stringify(s));const rev=Object.fromEntries(Object.entries(LEGACY_RESULTS).map(([a,b])=>[b,a]));
  let changed=0;for(const o of raw.observations)if(rev[o.result]){o.result=rev[o.result];changed++;}
  expect(changed).toBeGreaterThan(0);
  const {result}=load(JSON.stringify(raw));expect(result.notice).toBe('');expect(result.save).toEqual(s);
 });
});

describe('damaged records keep everything that is still valid (F14)',()=>{
 it('drops only a damaged observation and keeps the finished screens',()=>{
  const s=ready(),raw=JSON.parse(JSON.stringify(s));raw.observations.push({id:'broken',origin:'student'});
  const {store,result}=load(JSON.stringify(raw));
  expect(result.blocked).toBe(false);expect(result.notice).toContain('건너뛰');
  expect(store.getItem(RECOVERY_KEY)).toBe(JSON.stringify(raw));
  expect(result.save.completedScreens).toEqual(s.completedScreens);expect(result.save.observations).toEqual(s.observations);
  expect(persist(store,result.save)).toBe(true);
 });
 it('resets only damaged settings',()=>{const s=midRun(),raw=JSON.parse(JSON.stringify(s));raw.settings.bgm='loud';const {result}=load(JSON.stringify(raw));expect(result.save.settings).toEqual(freshSave().settings);expect(result.save.completedScreens).toEqual(['S01']);expect(result.save.checkpoints.matched).toEqual(s.checkpoints.matched);});
 it('drops an unknown screen id and a wrong stored answer, nothing else',()=>{
  const s=ready(),raw=JSON.parse(JSON.stringify(s));raw.completedScreens.push('S99');raw.challengeResults[0].answer=['wrong'];
  const {result}=load(JSON.stringify(raw));
  expect(result.save.completedScreens).toEqual(s.completedScreens);
  expect(result.save.challengeResults).toEqual(s.challengeResults.slice(1));
 });
 it('never invents progress: a screen whose prerequisite is missing is dropped with the screens after it',()=>{
  const s=ready(),raw=JSON.parse(JSON.stringify(s));raw.completedScreens=raw.completedScreens.filter((id:string)=>id!=='S02');
  const saved=salvageSave(JSON.stringify(raw))!;
  expect(saved.completedScreens).toEqual(['S01']);
  for(const k of ['completedScreens','observations','evidence','challengeResults','testResults'] as const)expect(subset(saved[k] as unknown[],s[k] as unknown[])).toBe(true);
  expect(saved.coreComplete).toBe(false);
 });
 it('opens a usable screen from every damaged record (no blank screen)',()=>{
  const s=ready();for(const mutate of [(r:any)=>{r.checkpoints.liquidStep=900;},(r:any)=>{r.design.parts.body.observationIds=['absent'];},(r:any)=>{r.lastRoute='nowhere';},(r:any)=>{r.evidence[0].id='E09';},(r:any)=>{r.name=42;}]){
   const raw=JSON.parse(JSON.stringify(s));mutate(raw);const {result}=load(JSON.stringify(raw));
   expect(result.blocked).toBe(false);expect(()=>decodeSave(JSON.stringify(result.save))).not.toThrow();expect(['home','world','S01','S02','S03','S04','S05','S06','S07','S08','S09','S10']).toContain(result.save.lastRoute);
  }
 });
 it('still starts fresh, with the original kept, when nothing can be read',()=>{const {store,result}=load('{bad');expect(result.notice).toContain('손상');expect(result.save).toMatchObject({completedScreens:[],observations:[]});expect(store.getItem(RECOVERY_KEY)).toBe('{bad');});
 it('does not salvage records from another schema or a demo',()=>{expect(salvageSave(JSON.stringify({...freshSave(),schemaVersion:2}))).toBeNull();expect(salvageSave(JSON.stringify(demoSave(freshSave().settings)))).toBeNull();});
});

describe('maker parts stay after a reload (B14)',()=>{
 it('keeps placed parts in the record and clears them after delivery',()=>{
  let s=midRun();s=reduceSave(s,{type:'makerDraft',screen:'S02',parts:{roof:'plastic'}});
  expect(s.makerDrafts).toEqual({S02:{roof:'plastic'}});
  const reloaded=decodeSave(JSON.stringify(s));expect(reloaded.makerDrafts.S02).toEqual({roof:'plastic'});
  s=reduceSave(s,{type:'makerDraft',screen:'S02',parts:{roof:'plastic',support:'metal'}});
  s=reduceSave(s,{type:'deliver',screen:'S02',parts:{roof:'plastic',support:'metal'},attempts:1});
  expect(s.deliveries.S02).toBeTruthy();expect(s.makerDrafts.S02).toBeUndefined();
 });
 it('ignores drafts for unknown screens, slots or parts',()=>{
  let s=midRun();for(const parts of [{roof:'gold'},{chimney:'plastic'}] as Record<string,string>[])s=reduceSave(s,{type:'makerDraft',screen:'S02',parts});
  s=reduceSave(s,{type:'makerDraft',screen:'S01',parts:{roof:'plastic'}});expect(s.makerDrafts).toEqual({});
  const raw=JSON.parse(JSON.stringify(midRun()));raw.makerDrafts={S02:{roof:'plastic',chimney:'x'},S99:{a:'b'}};
  expect(decodeSave(JSON.stringify(raw)).makerDrafts).toEqual({S02:{roof:'plastic'}});
 });
});
