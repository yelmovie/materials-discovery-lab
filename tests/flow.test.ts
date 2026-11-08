import {it,expect} from 'vitest';
import {freshSave,reduceSave,canComplete,canFinalize,requiredComparisons,experiments,resultFor,observationId,parts,requiredLinks,tests,recovery,makeObservation,type Action,type Save,type Screen} from '../src/domain/model';
import {challengesFor} from '../src/domain/challenges';
import {decodeSave} from '../src/services/storage';
it('completes all ten activities and report/core/certificate through the actual student reducer',()=>{
 let s:Save=freshSave();const send=(a:Action)=>{s=reduceSave(s,a);};const enter=(route:Screen)=>{send({type:'navigate',route});expect(s.lastRoute).toBe(route);};const finish=(screen:Screen)=>{for(const c of challengesFor(screen))send({type:'challenge',id:c.id,answer:c.answer});expect(canComplete(s,screen)).toBe(true);send({type:'complete',screen});expect(s.completedScreens).toContain(screen);s=decodeSave(JSON.stringify(s));};
 enter('S01');for(const part of ['canopy','frame','handle'] as const)send({type:'inspect',part});finish('S01');
 enter('S02');for(const [part,material] of [['canopy','천'],['frame','금속'],['handle','나무']] as const)send({type:'match',part,material,evidence:part});finish('S02');expect(recovery(s)).toBe(20);
 enter('S03');for(const experiment of experiments)for(const sampleId of requiredComparisons[experiment])send({type:'observe',experiment,sampleId,answer:resultFor(experiment,sampleId)});finish('S03');
 enter('S04');send({type:'assignment',part:'window',sampleId:'glass_clear',property:'transparent',observationId:observationId('light_transmission','glass_clear')});send({type:'assignment',part:'bumper',sampleId:'rubber_soft',property:'cushioning',observationId:observationId('compression_recovery','rubber_soft')});finish('S04');expect(recovery(s)).toBe(40);
 enter('S05');send({type:'prediction',key:'S05',value:'change'});for(const container of [0,1,2])send({type:'solid',container});send({type:'prediction',key:'solidConclusion',value:'same'});finish('S05');
 enter('S06');send({type:'prediction',key:'S06',value:'change'});for(const step of [1,2,3])send({type:'liquid',step});send({type:'sand'});send({type:'prediction',key:'liquidConclusion',value:'same'});send({type:'prediction',key:'sandConclusion',value:'solid'});finish('S06');expect(recovery(s)).toBe(60);
 enter('S07');send({type:'air',open:false});finish('S07');enter('S08');send({type:'air',open:true});send({type:'airCompare'});send({type:'inflate'});finish('S08');expect(recovery(s)).toBe(80);
 enter('S09');for(const part of parts)send({type:'need',part,enabled:true});send({type:'material',part:'body',sampleId:'metal_plate'});
 // Return to the earlier experiment to collect missing body evidence, retaining the draft.
 enter('S03');send({type:'observe',experiment:'water_absorption',sampleId:'metal_plate',answer:resultFor('water_absorption','metal_plate')});enter('S09');
 for(const part of parts)for(const experiment of requiredLinks[part])send({type:'link',part,id:makeObservation(experiment,s.design.parts[part].sampleId,'student').id,enabled:true});finish('S09');
 enter('S10');for(const testId of tests)send({type:'test',testId,revision:s.design.revision,attemptId:s.design.attemptId});finish('S10');expect(recovery(s)).toBe(95);expect(canFinalize(s)).toBe(true);
 send({type:'navigate',route:'world'});send({type:'navigate',route:'S10',phase:'report'});expect(s.lastPhase).toBe('report');send({type:'report'});send({type:'navigate',route:'S10',phase:'core'});send({type:'core'});send({type:'navigate',route:'S10',phase:'ending'});expect(recovery(s)).toBe(100);expect(s.completionArchive).toHaveLength(1);send({type:'navigate',route:'S10',phase:'certificate'});send({type:'name',value:'탐구 연구원'});expect(s.completionArchive[0].name).toBe('탐구 연구원');expect(decodeSave(JSON.stringify(s))).toEqual(s);
});
