import spec from '../../docs/screen-spec.json';
import {challenges,challengesFor,correctChallenge} from './challenges';

export const screens = spec.screens;
export const stages = spec.stages;
export const materials = spec.materials;
export type Screen = 'S01'|'S02'|'S03'|'S04'|'S05'|'S06'|'S07'|'S08'|'S09'|'S10';
export type Route = 'home'|'world'|Screen;
export type Phase = 'activity'|'report'|'core'|'ending'|'certificate';
export type Part = 'body'|'window'|'bumper';
export type UmbrellaPart = 'canopy'|'frame'|'handle';
export type Experiment = 'elastic_return'|'light_transmission'|'water_absorption'|'compression_recovery';
export type Test = 'rain'|'light'|'impact';
export type Origin = 'student'|'demo';
export const parts: Part[] = ['body','window','bumper'];
export const tests: Test[] = ['rain','light','impact'];
export const experiments: Experiment[] = ['elastic_return','light_transmission','water_absorption','compression_recovery'];
export const partNames = {body:'몸체',window:'관찰창',bumper:'모서리 보호대',lid:'뚜껑',handle:'손잡이',canopy:'우산 천',frame:'금속 살'};
export const experimentNames = {elastic_return:'당기고 놓기', light_transmission:'빛 비추기', water_absorption:'물방울 떨어뜨리기', compression_recovery:'누르고 놓기'};
export const testNames = {rain:'비 시험',light:'빛 시험',impact:'모서리 충격 시험'};
export const shortNames: Record<string,string> = {wood_raw:'코팅하지 않은 나무',metal_plate:'금속',glass_clear:'투명 유리',plastic_clear:'투명 플라스틱',plastic_opaque:'불투명 플라스틱',rubber_soft:'부드러운 고무'};
export const sampleColors: Record<string,string> = {wood_raw:'#b68551',metal_plate:'#aab7c8',glass_clear:'#c6eaf3',plastic_clear:'#90d2de',plastic_opaque:'#f3c864',rubber_soft:'#e98981'};
export const evidenceNames = ['부품 재료 조사 기록','물질 성질 증거 묶음','고체·액체 비교 기록','공기 관측 기록','설계도와 시험 기록'];
export const requiredComparisons: Record<Experiment,string[]> = {
  elastic_return:['rubber_soft','metal_plate'],
  light_transmission:['glass_clear','plastic_clear','wood_raw'],
  water_absorption:['wood_raw','plastic_opaque'],
  compression_recovery:['rubber_soft','metal_plate'],
};
export const requiredLinks: Record<Part,Experiment[]> = {
  body:['water_absorption','compression_recovery'],window:['light_transmission'],bumper:['elastic_return','compression_recovery'],
};
export interface Observation {id:string; experiment:Experiment; sampleId:string; conditionId:'standard'; result:string; origin:Origin}
export interface Design {attemptId:string; revision:number; needs:Part[]; parts:Record<Part,{sampleId:string;observationIds:string[]}>}
export interface TestResult {testId:Test;attemptId:string;designRevision:number;pass:boolean;feedback:string}
export interface AirTrial {cupId:'cup-1'; depth:80;orientation:'inverted';ventOpen:boolean;waterInside:number;tissueWet:boolean}
export interface Settings {muted:boolean;bgm:number;sfx:number;reducedMotion:boolean}
export interface Evidence {id:string;origin:Origin;observationIds:string[];attemptId?:string;revision?:number}
export interface Archive {id:string;name:string;date:string;design:Design;evidence:Evidence[];tests:TestResult[]}
export interface Save {
 schemaVersion:1;contentVersion:'mvp-1';origin:Origin;lastRoute:Route;lastPhase:Phase;
 completedScreens:Screen[];observations:Observation[];evidence:Evidence[];
 challengeResults:{id:string;answer:string[]}[];
 checkpoints:{inspected:UmbrellaPart[];matched:UmbrellaPart[];assignments:string[];solid:number[];liquidStep:number;sand:boolean;closed:AirTrial|null;open:AirTrial|null;inflated:boolean;airCompared:boolean};
 initialPredictions:Partial<Record<'S05'|'S06',string>>;predictions:Record<string,string>;design:Design;testResults:TestResult[];reportedRevision:number|null;coreComplete:boolean;completionArchive:Archive[];name:string;settings:Settings;
}
export function newDesign():Design {return {attemptId:crypto.randomUUID(),revision:1,needs:[],parts:{body:{sampleId:'metal_plate',observationIds:[]},window:{sampleId:'plastic_clear',observationIds:[]},bumper:{sampleId:'rubber_soft',observationIds:[]}}};}
export function freshSave(origin:Origin='student'):Save {return {schemaVersion:1,contentVersion:'mvp-1',origin,lastRoute:'home',lastPhase:'activity',completedScreens:[],observations:[],evidence:[],challengeResults:[],checkpoints:{inspected:[],matched:[],assignments:[],solid:[],liquidStep:0,sand:false,closed:null,open:null,inflated:false,airCompared:false},initialPredictions:{},predictions:{},design:newDesign(),testResults:[],reportedRevision:null,coreComplete:false,completionArchive:[],name:'',settings:{muted:false,bgm:.18,sfx:.4,reducedMotion:false}};}
export function observationId(experiment:Experiment,sampleId:string){return `${experiment}:${sampleId}:standard`;}
export function resultFor(experiment:Experiment,sampleId:string):string {
 const m=materials.find(x=>x.id===sampleId)!;
 switch(experiment){
 case 'elastic_return':return m.cushioning?'늘어났다가 원래 모습으로 돌아왔어':'눈에 띄게 늘어나지 않았어';
 case 'light_transmission':return m.transparent?'빛이 통과해 뒤쪽 표시가 보였어':'빛이 잘 통과하지 않아 뒤쪽 표시가 안 보였어';
 case 'water_absorption':return m.waterResistant?'물이 쉽게 스며들지 않았어':'물이 스며들어 젖은 자리가 생겼어';
 case 'compression_recovery':return m.cushioning?'눌렸다가 놓으니 원래 모습으로 돌아왔어':'같은 힘으로 눌러도 모양이 거의 그대로였어';
 }
}
export function makeObservation(experiment:Experiment,sampleId:string,origin:Origin):Observation {return {id:observationId(experiment,sampleId),experiment,sampleId,conditionId:'standard',result:resultFor(experiment,sampleId),origin};}
export function linkedCorrectly(s:Save,p:Part):boolean {const choice=s.design.parts[p];return requiredLinks[p].every(e=>choice.observationIds.some(id=>s.observations.some(o=>o.id===id&&o.sampleId===choice.sampleId&&o.experiment===e&&o.origin===s.origin)));}
export function designReady(s:Save){return parts.every(p=>s.design.needs.includes(p)&&linkedCorrectly(s,p));}
export function evaluateTest(s:Save,testId:Test):TestResult {
 const p:Part=testId==='rain'?'body':testId==='light'?'window':'bumper';
 const m=materials.find(x=>x.id===s.design.parts[p].sampleId)!;
 const pass=linkedCorrectly(s,p)&&(testId==='rain'?m.rigid&&m.waterResistant:testId==='light'?m.transparent:m.cushioning);
 const feedback=pass?`${partNames[p]}가 필요한 성질을 보여 줬어!`:testId==='rain'?'몸체가 물에 젖거나 형태를 유지하지 못했어. 물방울·누르기 기록을 다시 보자.':testId==='light'?'안쪽 표시가 보이지 않아. 빛이 통과한 시료를 찾아보자.':'모서리가 충분히 눌렸다 복원되지 않았어. 고무와 단단한 시료를 비교해 보자.';
 return {testId,attemptId:s.design.attemptId,designRevision:s.design.revision,pass,feedback};
}
export function currentResults(s:Save){return s.testResults.filter(t=>t.attemptId===s.design.attemptId&&t.designRevision===s.design.revision);}
export function currentPass(s:Save){return designReady(s)&&tests.every(id=>currentResults(s).some(t=>t.testId===id&&t.pass&&evaluateTest(s,id).pass));}
export function canFinalize(s:Save){return s.evidence.length===5&&currentPass(s)&&s.evidence.some(e=>e.id==='E05'&&e.attemptId===s.design.attemptId&&e.revision===s.design.revision);}
export function recovery(s:Save){return s.coreComplete?100:[0,20,40,60,80,95][s.evidence.length];}
export function comparableAir(a:AirTrial|null,b:AirTrial|null){return !!a&&!!b&&a.cupId===b.cupId&&a.depth===b.depth&&a.orientation===b.orientation&&!a.ventOpen&&b.ventOpen;}
export function airTrial(ventOpen:boolean):AirTrial{return {cupId:'cup-1',depth:80,orientation:'inverted',ventOpen,waterInside:ventOpen?90:12,tissueWet:ventOpen};}
export function transfer(volumes:number[],from:number,to:number,requested:number,capacities=[1400,1600,1200]){
 const next=[...volumes];if(from===to||!Number.isFinite(requested)||!Number.isInteger(from)||!Number.isInteger(to)||from<0||from>2||to<0||to>2)return next;
 const amount=Math.max(0,Math.min(Math.floor(requested),next[from],capacities[to]-next[to]));next[from]-=amount;next[to]+=amount;return next;
}
export function canAccess(s:Save,route:Route,phase:Phase='activity'){
 if(route==='home'||route==='world')return true;
 const target=screens.find(x=>x.id===route);if(!target)return false;
 if(!target.prerequisites.every(id=>s.completedScreens.includes(id as Screen)))return false;
 if(route==='S10'&&phase!=='activity')return (phase==='certificate'&&s.coreComplete)||canFinalize(s)&&(phase==='report'||s.reportedRevision===s.design.revision);
 return true;
}
export function canComplete(s:Save,id:Screen){return canCompleteInvestigation(s,id)&&challengesFor(id).every(c=>s.challengeResults.some(r=>r.id===c.id&&correctChallenge(c,r.answer)));}
export function canCompleteInvestigation(s:Save,id:Screen){const c=s.checkpoints;switch(id){
 case 'S01':return c.inspected.length===3;
 case 'S02':return c.matched.length===3;
 case 'S03':return experiments.every(e=>requiredComparisons[e].every(m=>s.observations.some(o=>o.id===observationId(e,m))));
 case 'S04':return c.assignments.length===2;
 case 'S05':return !!s.predictions.S05&&c.solid.length===3&&s.predictions.solidConclusion==='same';
 case 'S06':return !!s.predictions.S06&&c.liquidStep===3&&c.sand&&s.predictions.liquidConclusion==='same'&&s.predictions.sandConclusion==='solid';
 case 'S07':return !!c.closed;
 case 'S08':return comparableAir(c.closed,c.open)&&c.airCompared&&c.inflated;
 case 'S09':return designReady(s);
 case 'S10':return currentPass(s);
}}

export type Action =
 |{type:'challenge';id:string;answer:string[]}
 |{type:'navigate';route:Route;phase?:Phase}
 |{type:'inspect';part:UmbrellaPart}
 |{type:'match';part:UmbrellaPart;material:string;evidence:UmbrellaPart}
 |{type:'observe';experiment:Experiment;sampleId:string;answer:string}
 |{type:'assignment';part:'window'|'bumper';sampleId:string;property:string;observationId:string}
 |{type:'prediction';key:string;value:string}
 |{type:'solid';container:number}
 |{type:'liquid';step:number}
 |{type:'sand'}|{type:'repeatLiquid'}|{type:'air';open:boolean}|{type:'airCompare'}|{type:'inflate'}
 |{type:'need';part:Part;enabled:boolean}
 |{type:'material';part:Part;sampleId:string}
 |{type:'link';part:Part;id:string;enabled:boolean}
 |{type:'test';testId:Test;revision:number;attemptId:string}
 |{type:'complete';screen:Screen}
 |{type:'report'}|{type:'core'}|{type:'newDesign'}|{type:'name';value:string}
 |{type:'settings';value:Partial<Settings>};
const add=<T,>(a:T[],v:T)=>a.includes(v)?a:[...a,v];
export function reduceSave(original:Save,a:Action,admin=false):Save {
 const s=structuredClone(original);const c=s.checkpoints;
 switch(a.type){
 case 'challenge':{const item=challenges.find(c=>c.id===a.id);if(item&&s.lastRoute===item.screen&&s.lastPhase==='activity'&&canCompleteInvestigation(s,item.screen)&&correctChallenge(item,a.answer)){
   const list=challengesFor(item.screen),index=list.indexOf(item);if(list.slice(0,index).every(c=>s.challengeResults.some(r=>r.id===c.id)))s.challengeResults=s.challengeResults.filter(r=>r.id!==item.id).concat({id:item.id,answer:[...a.answer]});
 }break;}
 case 'navigate':if(admin||canAccess(s,a.route,a.phase)){s.lastRoute=a.route;s.lastPhase=a.phase??'activity';}break;
 case 'inspect':if(s.lastRoute==='S01')c.inspected=add(c.inspected,a.part);break;
 case 'match':if(s.lastRoute==='S02'&&c.inspected.includes(a.evidence)&&a.evidence===a.part&&a.material===({canopy:'천',frame:'금속',handle:'나무'}[a.part]))c.matched=add(c.matched,a.part);break;
 case 'observe':if(s.lastRoute==='S03'&&materials.some(m=>m.id===a.sampleId)&&a.answer===resultFor(a.experiment,a.sampleId)){const o=makeObservation(a.experiment,a.sampleId,s.origin);s.observations=s.observations.filter(x=>x.id!==o.id).concat(o);}break;
 case 'assignment':{const m=materials.find(m=>m.id===a.sampleId);const e=a.part==='window'?'light_transmission':'compression_recovery';if(s.lastRoute==='S04'&&m&&(a.part==='window'?m.transparent&&a.property==='transparent':m.cushioning&&a.property==='cushioning')&&s.observations.some(o=>o.id===a.observationId&&o.sampleId===a.sampleId&&o.experiment===e&&o.origin===s.origin))c.assignments=add(c.assignments,a.part);break;}
 case 'prediction':
  if(!['S05','S06','solidConclusion','liquidConclusion','sandConclusion'].includes(a.key)||!(a.key==='sandConclusion'?['solid','liquid']:['same','change']).includes(a.value))break;
  if((a.key==='S05'||a.key==='S06')&&!s.initialPredictions[a.key]&&!s.predictions[a.key])s.initialPredictions[a.key]=a.value;
  s.predictions[a.key]=a.value;break;
 case 'solid':if(s.lastRoute==='S05'&&s.predictions.S05&&[0,1,2].includes(a.container))c.solid=add(c.solid,a.container);break;
 case 'liquid':if(s.lastRoute==='S06'&&s.predictions.S06&&a.step===c.liquidStep+1&&a.step<=3)c.liquidStep=a.step;break;
 case 'sand':if(s.lastRoute==='S06')c.sand=true;break;
 case 'repeatLiquid':if(s.lastRoute==='S06'){c.liquidStep=0;c.sand=false;delete s.predictions.liquidConclusion;delete s.predictions.sandConclusion;}break;
 case 'air':if((!a.open&&s.lastRoute==='S07')||(a.open&&s.lastRoute==='S08'&&c.closed)){if(a.open)c.open=airTrial(true);else c.closed=airTrial(false);}break;
 case 'airCompare':if(comparableAir(c.closed,c.open))c.airCompared=true;break;
 case 'inflate':if(c.airCompared)c.inflated=true;break;
 case 'need':s.design.needs=a.enabled?add(s.design.needs,a.part):s.design.needs.filter(p=>p!==a.part);s.design.revision++;s.reportedRevision=null;s.coreComplete=false;break;
 case 'material':if(materials.some(m=>m.id===a.sampleId)&&s.design.parts[a.part].sampleId!==a.sampleId){s.design.parts[a.part]={sampleId:a.sampleId,observationIds:[]};s.design.revision++;s.reportedRevision=null;s.coreComplete=false;}break;
 case 'link':{const p=s.design.parts[a.part];const o=s.observations.find(o=>o.id===a.id&&o.sampleId===p.sampleId&&o.origin===s.origin&&requiredLinks[a.part].includes(o.experiment));if(o){p.observationIds=a.enabled?add(p.observationIds,a.id):p.observationIds.filter(id=>id!==a.id);s.design.revision++;s.reportedRevision=null;s.coreComplete=false;}break;}
 case 'test':if(s.lastRoute==='S10'&&s.lastPhase==='activity'&&designReady(s)&&a.revision===s.design.revision&&a.attemptId===s.design.attemptId){s.testResults=s.testResults.filter(t=>!(t.testId===a.testId&&t.attemptId===a.attemptId&&t.designRevision===a.revision)).concat(evaluateTest(s,a.testId));}break;
 case 'complete':if(s.lastRoute===a.screen&&canComplete(s,a.screen)){
   s.completedScreens=add(s.completedScreens,a.screen);const i=screens.findIndex(x=>x.id===a.screen);
   if(i%2===1){const id=`E0${(i+1)/2}`;s.evidence=s.evidence.filter(e=>e.id!==id).concat({id,origin:s.origin,observationIds:s.observations.map(o=>o.id),...(id==='E05'?{attemptId:s.design.attemptId,revision:s.design.revision}:{})}).sort((a,b)=>a.id.localeCompare(b.id));}
 }break;
 case 'report':if(canFinalize(s))s.reportedRevision=s.design.revision;break;
 case 'core':if(canFinalize(s)&&s.reportedRevision===s.design.revision){s.coreComplete=true;if(!s.completionArchive.some(r=>r.id===s.design.attemptId))s.completionArchive.push({id:s.design.attemptId,name:s.name.trim()||'신입 연구원',date:new Date().toISOString(),design:structuredClone(s.design),evidence:structuredClone(s.evidence),tests:structuredClone(currentResults(s))});}break;
 case 'newDesign':s.design={...structuredClone(s.design),attemptId:crypto.randomUUID(),revision:1};s.testResults=[];s.reportedRevision=null;s.coreComplete=false;s.lastRoute='S09';s.lastPhase='activity';break;
 case 'name':s.name=a.value.slice(0,24);if(s.coreComplete){const r=s.completionArchive.find(r=>r.id===s.design.attemptId);if(r)r.name=s.name.trim()||'신입 연구원';}break;
 case 'settings':s.settings={...s.settings,...a.value};break;
 }
 return s;
}
export function demoSave(settings:Settings):Save {
 const s=freshSave('demo');s.settings=settings;s.lastRoute='world';s.completedScreens=screens.map(x=>x.id as Screen);
 s.observations=experiments.flatMap(e=>materials.map(m=>makeObservation(e,m.id,'demo')));
 s.checkpoints={inspected:['canopy','frame','handle'],matched:['canopy','frame','handle'],assignments:['window','bumper'],solid:[0,1,2],liquidStep:3,sand:true,closed:airTrial(false),open:airTrial(true),inflated:true,airCompared:true};
 s.initialPredictions={S05:'same',S06:'same'};
 s.predictions={S05:'same',S06:'same',solidConclusion:'same',liquidConclusion:'same',sandConclusion:'solid'};
 s.design.needs=[...parts];for(const p of parts)s.design.parts[p].observationIds=requiredLinks[p].map(e=>observationId(e,s.design.parts[p].sampleId));
 s.testResults=tests.map(t=>evaluateTest(s,t));s.evidence=evidenceNames.map((_,i)=>({id:`E0${i+1}`,origin:'demo',observationIds:s.observations.map(o=>o.id),...(i===4?{attemptId:s.design.attemptId,revision:s.design.revision}:{})}));s.reportedRevision=s.design.revision;return s;
}
