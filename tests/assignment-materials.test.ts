import {describe,it,expect} from 'vitest';
import {demoSave,freshSave,reduceSave,observationId} from '../src/domain/model';
import {decodeSave} from '../src/services/storage';
function student(){const s=demoSave(freshSave().settings);s.origin='student';s.lastRoute='S04';s.observations=s.observations.map(o=>({...o,origin:'student'}));s.evidence=s.evidence.map(e=>({...e,origin:'student'}));s.checkpoints.assignments=[];return s;}
describe('chosen S04 materials survive returning to the picture',()=>{
 it.each(['glass_clear','plastic_clear'])('retains an accepted %s window and rubber corner on reload',id=>{
  let s=student();
  s=reduceSave(s,{type:'assignment',part:'window',sampleId:id,property:'transparent',observationId:observationId('light_transmission',id)});
  s=reduceSave(s,{type:'assignment',part:'bumper',sampleId:'rubber_soft',property:'cushioning',observationId:observationId('compression_recovery','rubber_soft')});
  expect(decodeSave(JSON.stringify(s)).checkpoints.assignmentMaterials).toEqual({window:id,bumper:'rubber_soft'});
 });
 it('does not save a material decision without its required property',()=>{
  const s=student(),next=reduceSave(s,{type:'assignment',part:'window',sampleId:'metal_plate',property:'transparent',observationId:observationId('light_transmission','metal_plate')});
  expect(next.checkpoints.assignments).toEqual([]);expect(next.checkpoints.assignmentMaterials).toBeUndefined();
 });
 it('continues older saves and removes forged material fields without removing learning progress',()=>{
  const s=student();s.checkpoints.assignments=['window'];
  expect(decodeSave(JSON.stringify(s)).checkpoints.assignments).toEqual(['window']);
  s.checkpoints.assignmentMaterials={window:'metal_plate',bumper:'rubber_soft'};
  const restored=decodeSave(JSON.stringify(s));
  expect(restored.checkpoints.assignmentMaterials).toEqual({});expect(restored.checkpoints.assignments).toEqual(['window']);
 });
});
