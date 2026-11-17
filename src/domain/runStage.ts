import {materials,requiredComparisons,observationId,resultFor,type Experiment,type Save} from './model';

/** S03 as a walk-through course. The course only decides where each required
 * sample stands and which hand motion tests it. What a sample shows and which
 * description is right still come from `resultFor`, and records are written by
 * the unchanged `observe` action, so S04 and S09 read the same observation ids.
 * This is the classroom observation model of the listed samples, not a law for
 * every material, and a pressed sample never launches the researcher. */
export type RunAction='stomp'|'pull'|'light'|'drop';
export interface RunZone {experiment:Experiment;action:RunAction;name:string;actionLabel:string;lookFor:string;checkpointX:number}
export interface RunStation {id:string;experiment:Experiment;sampleId:string;zone:number;x:number;action:RunAction}

const SPACING=2.2;
// Pull samples stand further apart: a stretched sample and the researcher holding it need the room.
const zonePlan:{experiment:Experiment;action:RunAction;name:string;actionLabel:string;lookFor:string;firstX:number;spacing?:number}[]=[
 {experiment:'compression_recovery',action:'stomp',name:'누르기',actionLabel:'뛰어올라 밟기',lookFor:'누른 뒤의 모양',firstX:3},
 {experiment:'elastic_return',action:'pull',name:'당기기',actionLabel:'당기기',lookFor:'당긴 뒤의 모양',firstX:9.4,spacing:2.8},
 {experiment:'light_transmission',action:'light',name:'비추기',actionLabel:'비추기',lookFor:'뒤쪽 표시',firstX:15.2},
 {experiment:'water_absorption',action:'drop',name:'적시기',actionLabel:'물 떨어뜨리기',lookFor:'물방울',firstX:23.6},
];
export const runCourse={startX:0,endX:28,patrols:[7.3,21.6]} as const;
export const runZones:RunZone[]=zonePlan.map(({firstX,spacing,...zone})=>({...zone,checkpointX:firstX-1.6}));
export const runStations:RunStation[]=zonePlan.flatMap((zone,index)=>requiredComparisons[zone.experiment].map((sampleId,i)=>({
 id:observationId(zone.experiment,sampleId),experiment:zone.experiment,sampleId,zone:index,x:Math.round((zone.firstX+i*(zone.spacing??SPACING))*10)/10,action:zone.action,
})));

export function stationAnswer(station:Pick<RunStation,'experiment'|'sampleId'>){return resultFor(station.experiment,station.sampleId);}
/** Same two descriptions as the 2D screen: this sample's result and the other possible result. */
export function stationOptions(station:Pick<RunStation,'experiment'|'sampleId'>){
 const result=stationAnswer(station),other=resultFor(station.experiment,materials.find(m=>resultFor(station.experiment,m.id)!==result)!.id);
 return [result,other].sort();
}
// One listed sample per test that visibly reacts; every other sample is compared with it through resultFor.
const reacting:Record<Experiment,string>={elastic_return:'rubber_soft',compression_recovery:'rubber_soft',light_transmission:'glass_clear',water_absorption:'wood_raw'};
/** True when the sample stretches, squashes, lets the light through, or soaks up the drop. */
export function showsChange(experiment:Experiment,sampleId:string){return resultFor(experiment,sampleId)===resultFor(experiment,reacting[experiment]);}
export function isRecorded(save:Pick<Save,'observations'>,station:Pick<RunStation,'id'>){return save.observations.some(o=>o.id===station.id);}
export function nextStation(save:Pick<Save,'observations'>){return runStations.find(s=>!isRecorded(save,s))??null;}
export function zoneProgress(save:Pick<Save,'observations'>){return runZones.map((zone,i)=>{const list=runStations.filter(s=>s.zone===i);return {zone,total:list.length,done:list.filter(s=>isRecorded(save,s)).length};});}
export function checkpointFor(x:number){let at:number=runCourse.startX;for(const zone of runZones)if(x>=zone.checkpointX)at=zone.checkpointX;return at;}
