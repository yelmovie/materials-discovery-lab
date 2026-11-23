import {describe,it,expect} from 'vitest';
import {freshSave,demoSave,reduceSave,linkedCorrectly,designReady,currentResults,resultFor,observationId,type Save} from '../src/domain/model';
import {decodeSave} from '../src/services/storage';
import {challengesFor} from '../src/domain/challenges';

function student():Save {
 const s=demoSave(freshSave().settings);s.origin='student';s.lastRoute='S09';
 s.observations=s.observations.map(o=>({...o,origin:'student'}));
 s.evidence=s.evidence.map(e=>({...e,origin:'student'}));
 return s;
}
const metalWater=observationId('water_absorption','metal_plate');
describe('placed parts follow new evidence',()=>{
 it('fills the already placed body without changing the other parts or placing again',()=>{
  let s=student();s.observations=s.observations.filter(o=>o.id!==metalWater);
  s.design.parts.body.observationIds=s.design.parts.body.observationIds.filter(id=>id!==metalWater);
  const others=structuredClone({window:s.design.parts.window,bumper:s.design.parts.bumper});
  const revision=s.design.revision;
  expect(designReady(s)).toBe(false);
  s=reduceSave(s,{type:'navigate',route:'S03'});
  s=reduceSave(s,{type:'observe',experiment:'water_absorption',sampleId:'metal_plate',answer:resultFor('water_absorption','metal_plate')});
  expect(linkedCorrectly(s,'body')).toBe(true);expect(s.design.revision).toBe(revision+1);
  expect(currentResults(s)).toEqual([]);expect(s.reportedRevision).toBeNull();
  s=reduceSave(s,{type:'navigate',route:'S09'});
  expect(designReady(s)).toBe(true);expect(s.design.parts.body.sampleId).toBe('metal_plate');
  expect({window:s.design.parts.window,bumper:s.design.parts.bumper}).toEqual(others);
  expect(decodeSave(JSON.stringify(s)).design).toEqual(s.design);
 });
 it('repairs missing links in an existing draft on return, then stays idempotent',()=>{
  let s=student();s.lastRoute='S03';s.design.parts.body.observationIds=[];
  const revision=s.design.revision;
  s=reduceSave(s,{type:'navigate',route:'S09'});
  expect(linkedCorrectly(s,'body')).toBe(true);expect(s.design.revision).toBe(revision+1);
  expect(reduceSave(s,{type:'navigate',route:'S09'}).design).toEqual(s.design);
 });
 it('does not invalidate a tested design just for repeating an already linked observation',()=>{
  const s=student();s.lastRoute='S03';
  const repeated=reduceSave(s,{type:'observe',experiment:'water_absorption',sampleId:'metal_plate',answer:resultFor('water_absorption','metal_plate')});
  expect(repeated.design).toEqual(s.design);expect(repeated.testResults).toEqual(s.testResults);
 });
 it('does not attach incorrect answers or observations belonging to a different material',()=>{
  let s=student();s.lastRoute='S03';s.design.parts.body.observationIds=[];
  const revision=s.design.revision;s.observations=s.observations.filter(o=>o.sampleId!=='metal_plate');
  s=reduceSave(s,{type:'observe',experiment:'water_absorption',sampleId:'metal_plate',answer:'wrong'});
  expect(s.design.parts.body.observationIds).toEqual([]);
  s=reduceSave(s,{type:'observe',experiment:'water_absorption',sampleId:'wood_raw',answer:resultFor('water_absorption','wood_raw')});
  expect(s.design.parts.body.observationIds).toEqual([]);expect(s.design.revision).toBe(revision);
 });
 it('leaves unplaced default parts without manufactured evidence',()=>{
  let s=student();s.design.needs=[];s.design.parts.body.observationIds=[];s.lastRoute='S03';
  s=reduceSave(s,{type:'observe',experiment:'water_absorption',sampleId:'metal_plate',answer:resultFor('water_absorption','metal_plate')});
  expect(s.design.needs).toEqual([]);expect(s.design.parts.body.observationIds).toEqual([]);
 });
});
describe('wording compatibility',()=>{
 it.each([
  ['elastic_return','metal_plate','당겨도 늘어나지 않았어'],
  ['elastic_return','metal_plate','눈에 띄게 늘어나지 않았어'],
  ['elastic_return','metal_plate','이 힘에서는 눈에 띄게 늘어나지 않았어'],
  ['light_transmission','wood_raw','빛이 통과하지 않아 뒤쪽 표시가 안 보였어'],
  ['light_transmission','wood_raw','빛이 잘 통과하지 않아 뒤쪽 표시가 안 보였어'],
 ] as const)('keeps %s / %s from an earlier wording version', (experiment,sampleId,old)=>{
  const s=student(),raw=JSON.parse(JSON.stringify(s));
  raw.observations.find((o:{id:string})=>o.id===observationId(experiment,sampleId)).result=old;
  expect(decodeSave(JSON.stringify(raw))).toEqual(s);
 });
 it('preserves saved pencil and metal classification answer IDs',()=>{
  const s=student();s.challengeResults=['S01','S02'].flatMap(screen=>challengesFor(screen as 'S01'|'S02').map(c=>({id:c.id,answer:[...c.answer]})));
  expect(decodeSave(JSON.stringify(s)).challengeResults).toEqual(s.challengeResults);
 });
});
