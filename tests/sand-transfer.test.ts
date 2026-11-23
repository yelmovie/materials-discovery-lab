import {describe,it,expect} from 'vitest';
import {freshSave,demoSave,reduceSave,canCompleteInvestigation,type Save} from '../src/domain/model';
import {decodeSave} from '../src/services/storage';
function waterReady():Save{
 const s=demoSave(freshSave().settings);s.origin='student';s.lastRoute='S06';s.completedScreens=s.completedScreens.slice(0,5);
 s.evidence=s.evidence.slice(0,2).map(e=>({...e,origin:'student'}));s.observations=s.observations.map(o=>({...o,origin:'student'}));
 s.checkpoints.sandStep=0;s.checkpoints.sand=false;delete s.predictions.sandConclusion;return s;
}
describe('S06 sand is poured before inspecting its grains',()=>{
 it('requires the returned-water comparison and the S06 route',()=>{
  let s=waterReady();s.checkpoints.liquidStep=2;
  expect(reduceSave(s,{type:'sandTransfer',step:1}).checkpoints.sandStep).toBe(0);
  s.checkpoints.liquidStep=3;s.predictions.liquidConclusion='change';
  expect(reduceSave(s,{type:'sandTransfer',step:1}).checkpoints.sandStep).toBe(0);
  s.predictions.liquidConclusion='same';s.lastRoute='world';
  expect(reduceSave(s,{type:'sandTransfer',step:1}).checkpoints.sandStep).toBe(0);
 });
 it('rejects skips, repeats and premature grain credit; keeps the three transfers on reload',()=>{
  let s=waterReady();
  expect(reduceSave(s,{type:'sandTransfer',step:3}).checkpoints.sandStep).toBe(0);
  expect(reduceSave(s,{type:'sand'}).checkpoints.sand).toBe(false);
  for(const step of [1,2,3]){
   s=reduceSave(s,{type:'sandTransfer',step});
   expect(reduceSave(s,{type:'sandTransfer',step}).checkpoints.sandStep).toBe(step);
   s=decodeSave(JSON.stringify(s));expect(s.checkpoints.sandStep).toBe(step);
   if(step<3)expect(reduceSave(s,{type:'sand'}).checkpoints.sand).toBe(false);
  }
  s=reduceSave(s,{type:'prediction',key:'sandConclusion',value:'solid'});
  expect(canCompleteInvestigation(s,'S06')).toBe(false);
  s=reduceSave(s,{type:'sand'});s=reduceSave(s,{type:'prediction',key:'sandConclusion',value:'liquid'});
  expect(canCompleteInvestigation(s,'S06')).toBe(false);
  s=reduceSave(s,{type:'prediction',key:'sandConclusion',value:'solid'});
  expect(canCompleteInvestigation(s,'S06')).toBe(true);
 });
 it('repeats sand without erasing the returned-water result or the other research',()=>{
  let s=waterReady();s.checkpoints.sandStep=3;s.checkpoints.sand=true;s.predictions.sandConclusion='solid';
  const before=structuredClone({observations:s.observations,evidence:s.evidence,design:s.design});
  s=reduceSave(s,{type:'repeatSand'});
  expect(s.checkpoints.sandStep).toBe(0);expect(s.checkpoints.sand).toBe(false);expect(s.predictions.sandConclusion).toBeUndefined();
  expect(s.checkpoints.liquidStep).toBe(3);expect(s.predictions.liquidConclusion).toBe('same');
  expect({observations:s.observations,evidence:s.evidence,design:s.design}).toEqual(before);
 });
 it('preserves an older completed activity without inventing a new pouring record',()=>{
  const s=waterReady();s.completedScreens.push('S06');s.checkpoints.sand=true;s.predictions.sandConclusion='solid';delete s.checkpoints.sandStep;
  const old=decodeSave(JSON.stringify(s));
  expect(old.checkpoints.sandStep).toBeUndefined();expect(canCompleteInvestigation(old,'S06')).toBe(true);
  const repeated=reduceSave(old,{type:'repeatSand'});expect(canCompleteInvestigation(repeated,'S06')).toBe(false);
  old.completedScreens=old.completedScreens.filter(id=>id!=='S06');expect(canCompleteInvestigation(old,'S06')).toBe(false);
 });
 it('rejects malformed sand checkpoints',()=>{
  const s=waterReady();s.checkpoints.sandStep=4;expect(()=>decodeSave(JSON.stringify(s))).toThrow();
 });
});
