import {it,expect} from 'vitest';
import {freshSave,reduceSave,canComplete,canCompleteInvestigation,requiredComparisons,experiments,materials,observationId,resultFor,linkedCorrectly,type Action,type Save,type Screen} from '../src/domain/model';
import {challengesFor} from '../src/domain/challenges';
import {decodeSave} from '../src/services/storage';
import {runStations,runZones,runCourse,stationOptions,stationAnswer,showsChange,zoneProgress,nextStation,checkpointFor} from '../src/domain/runStage';

function studentAtS03(){
 let s:Save=freshSave();const send=(a:Action)=>{s=reduceSave(s,a);};
 const finish=(screen:Screen)=>{for(const c of challengesFor(screen))send({type:'challenge',id:c.id,answer:c.answer});expect(canComplete(s,screen)).toBe(true);send({type:'complete',screen});};
 send({type:'navigate',route:'S01'});for(const part of ['canopy','frame','handle'] as const)send({type:'inspect',part});finish('S01');
 send({type:'navigate',route:'S02'});for(const [part,material] of [['canopy','천'],['frame','금속'],['handle','나무']] as const)send({type:'match',part,material,evidence:part});finish('S02');
 send({type:'navigate',route:'S03'});expect(s.lastRoute).toBe('S03');
 return {get save(){return s;},send,finish};
}

it('puts exactly the required samples on the course, with the saved observation id format',()=>{
 const expected=experiments.flatMap(e=>requiredComparisons[e].map(m=>observationId(e,m))).sort();
 expect(runStations.map(s=>s.id).sort()).toEqual(expected);
 expect(runStations).toHaveLength(9);
 for(const s of runStations){
  expect(s.id).toBe(`${s.experiment}:${s.sampleId}:standard`);
  expect(requiredComparisons[s.experiment]).toContain(s.sampleId);
  expect(runZones[s.zone].experiment).toBe(s.experiment);
 }
 expect(runZones.map(z=>z.experiment).sort()).toEqual([...experiments].sort());
});

it('lays the stations out left to right inside the course, one zone after another',()=>{
 const xs=runStations.map(s=>s.x);
 expect([...xs].sort((a,b)=>a-b)).toEqual(xs);
 for(let i=1;i<runStations.length;i++){
  expect(runStations[i].zone).toBeGreaterThanOrEqual(runStations[i-1].zone);
  expect(runStations[i].x-runStations[i-1].x).toBeGreaterThanOrEqual(2);
 }
 expect(xs[0]).toBeGreaterThan(runCourse.startX+1);
 expect(xs.at(-1)!).toBeLessThan(runCourse.endX-1);
 for(const x of runCourse.patrols)expect(runStations.every(s=>Math.abs(s.x-x)>1.4)).toBe(true);
});

it('lets the existing result function decide what each sample shows and which answer is right',()=>{
 for(const s of runStations){
  const m=materials.find(x=>x.id===s.sampleId)!;
  const flag=s.experiment==='light_transmission'?m.transparent:s.experiment==='water_absorption'?!m.waterResistant:m.cushioning;
  expect(showsChange(s.experiment,s.sampleId)).toBe(flag);
  const options=stationOptions(s);
  expect(options).toHaveLength(2);
  expect(new Set(options).size).toBe(2);
  expect(options).toContain(resultFor(s.experiment,s.sampleId));
  expect(stationAnswer(s)).toBe(resultFor(s.experiment,s.sampleId));
 }
 // Every zone shows both outcomes, so the comparison is visible on the course.
 for(const [i] of runZones.entries()){
  const seen=new Set(runStations.filter(s=>s.zone===i).map(s=>showsChange(s.experiment,s.sampleId)));
  expect(seen.size).toBe(2);
 }
});

it('records course answers through the student reducer and finishes S03 with unchanged ids',()=>{
 const game=studentAtS03();
 expect(nextStation(game.save)?.id).toBe(runStations[0].id);
 for(const s of runStations){
  const wrong=stationOptions(s).find(o=>o!==stationAnswer(s))!;
  game.send({type:'observe',experiment:s.experiment,sampleId:s.sampleId,answer:wrong});
  expect(game.save.observations.some(o=>o.id===s.id)).toBe(false);
  game.send({type:'observe',experiment:s.experiment,sampleId:s.sampleId,answer:stationAnswer(s)});
  expect(game.save.observations.find(o=>o.id===s.id)).toMatchObject({experiment:s.experiment,sampleId:s.sampleId,conditionId:'standard',origin:'student'});
 }
 expect(zoneProgress(game.save).map(z=>z.done)).toEqual(zoneProgress(game.save).map(z=>z.total));
 expect(nextStation(game.save)).toBeNull();
 expect(canCompleteInvestigation(game.save,'S03')).toBe(true);
 game.finish('S03');
 expect(game.save.completedScreens).toContain('S03');
 expect(decodeSave(JSON.stringify(game.save))?.observations).toEqual(game.save.observations);
});

it('keeps S04 and S09 working from the records the course leaves',()=>{
 const game=studentAtS03();
 for(const s of runStations)game.send({type:'observe',experiment:s.experiment,sampleId:s.sampleId,answer:stationAnswer(s)});
 game.finish('S03');
 const id=(experiment:string,sample:string)=>runStations.find(s=>s.experiment===experiment&&s.sampleId===sample)!.id;
 game.send({type:'navigate',route:'S04'});
 game.send({type:'assignment',part:'window',sampleId:'glass_clear',property:'transparent',observationId:id('light_transmission','glass_clear')});
 game.send({type:'assignment',part:'bumper',sampleId:'rubber_soft',property:'cushioning',observationId:id('compression_recovery','rubber_soft')});
 expect(game.save.checkpoints.assignments).toEqual(['window','bumper']);
 expect(canCompleteInvestigation(game.save,'S04')).toBe(true);
 // S09 reads the same ids through requiredLinks.
 let s=game.save;
 for(const a of [
  {type:'need',part:'window',enabled:true},{type:'material',part:'window',sampleId:'glass_clear'},{type:'link',part:'window',id:id('light_transmission','glass_clear'),enabled:true},
  {type:'need',part:'bumper',enabled:true},{type:'link',part:'bumper',id:id('elastic_return','rubber_soft'),enabled:true},{type:'link',part:'bumper',id:id('compression_recovery','rubber_soft'),enabled:true},
 ] as Action[])s=reduceSave(s,a);
 expect(linkedCorrectly(s,'window')).toBe(true);
 expect(linkedCorrectly(s,'bumper')).toBe(true);
});

it('returns to the entrance of the zone the researcher last passed',()=>{
 expect(checkpointFor(runCourse.startX)).toBe(runCourse.startX);
 for(const [i,z] of runZones.entries()){
  const first=runStations.find(s=>s.zone===i)!;
  expect(z.checkpointX).toBeLessThan(first.x);
  expect(checkpointFor(first.x)).toBe(z.checkpointX);
 }
 expect(checkpointFor(runCourse.endX)).toBe(runZones.at(-1)!.checkpointX);
});
