// S03 3D 시험 길 완주 검사: 화면 버튼(1280×800)과 키보드(1024×768)로 시료 9개를 모두 시험하고
// 저장 기록(id·결과), 오답 처리, 새로고침, 기존 화면 전환, 움직임 줄이기, S04 근거 연결을 확인한다.
// 실행: PLAYWRIGHT_MODULE_PATH=<playwright 모듈 경로> node tools/check-run-stage.mjs http://127.0.0.1:5391 [출력 폴더]
// 학생 기록은 S01·S02를 실제 reducer로 마친 값에서 시작한다. S03의 관찰은 화면 조작으로만 남긴다.
import {createRequire} from 'node:module';
import {mkdirSync,mkdtempSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createServer} from 'vite';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const BASE=(process.argv[2]||'http://127.0.0.1:5391').replace(/\/$/,'');
const OUT=process.argv[3]||'.tmp/run-stage/check';
const KEY='material-workshop-mission.student.v1',VIEW='material-workshop-mission.s03-view';
mkdirSync(OUT,{recursive:true});
const profile=mkdtempSync(join(process.env.TMPDIR||'.tmp','run-stage-'));

const vite=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'error'});
const [model,tasks,course]=await Promise.all(['model','challenges','runStage'].map(name=>vite.ssrLoadModule(`/src/domain/${name}.ts`)));
function seed(){
 let s=model.freshSave();const send=a=>{s=model.reduceSave(s,a);};
 const finish=screen=>{for(const c of tasks.challengesFor(screen))send({type:'challenge',id:c.id,answer:c.answer});send({type:'complete',screen});};
 send({type:'navigate',route:'S01'});for(const part of ['canopy','frame','handle'])send({type:'inspect',part});finish('S01');
 send({type:'navigate',route:'S02'});for(const [part,material] of [['canopy','천'],['frame','금속'],['handle','나무']])send({type:'match',part,material,evidence:part});finish('S02');
 send({type:'navigate',route:'S03'});return s;
}
const stations=course.runStations.map(s=>({...s,answer:course.stationAnswer(s),wrong:course.stationOptions(s).find(o=>o!==course.stationAnswer(s))}));
const report={base:BASE,runs:[],errors:[]};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const check=(condition,message)=>{if(!condition)throw new Error(message);};

async function open(context,hash='S03'){
 const page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(`pageerror: ${e.message}`));
 page.on('console',m=>{if(m.type()==='error')report.errors.push(`console: ${m.text()}`);});
 page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
 await page.goto(`${BASE}/#${hash}`,{waitUntil:'domcontentloaded'});
 return page;
}
const state=page=>page.evaluate(()=>{const r=document.querySelector('.run-stage');return r?{ready:r.dataset.runReady==='true',near:r.dataset.near,canAct:r.dataset.canAct==='true',onPad:r.dataset.onPad==='true',busy:r.dataset.busy==='true',prompt:r.dataset.prompt,d:r.__runStage?.debug()}:null;});
const saved=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
async function center(page,selector){const box=await page.locator(selector).boundingBox();check(box,`${selector} is not on screen`);return {x:box.x+box.width/2,y:box.y+box.height/2,box};}

function controls(page,mode){
 let held=null;
 return {
  async hold(direction){
   if(held===direction)return;await this.release();held=direction;
   if(mode==='keys')await page.keyboard.down(direction==='right'?'ArrowRight':'KeyA');
   else{const p=await center(page,`.run-pad [data-run-direction=${direction}]`);await page.mouse.move(p.x,p.y);await page.mouse.down();}
  },
  async release(){if(!held)return;if(mode==='keys')await page.keyboard.up(held==='right'?'ArrowRight':'KeyA');else await page.mouse.up();held=null;},
  async jump(){
   if(mode==='keys'){await page.keyboard.press('Space');return;}
   // The pad is held by the mouse, so the jump button gets its own touch-style pointer event.
   await page.locator('.run-jump').dispatchEvent('pointerdown',{button:0,pointerId:7,pointerType:'touch',bubbles:true});
  },
  async act(holdMs){
   await this.release();
   if(mode==='keys'){await page.keyboard.down('KeyE');await sleep(holdMs);await page.keyboard.up('KeyE');return;}
   const p=await center(page,'.run-action');await page.mouse.move(p.x,p.y);await page.mouse.down();await sleep(holdMs);await page.mouse.up();
  },
 };
}
async function walkTo(page,pad,x,tolerance=.25){
 const until=Date.now()+25000;let lastX=null,stuckSince=Date.now();
 for(;;){
  const s=await state(page);check(s?.d,'the course disappeared while walking');
  const gap=x-s.d.x;
  if(Math.abs(gap)<=tolerance){await pad.release();return;}
  check(Date.now()<until,`could not walk to x=${x} (stuck at ${s.d.x.toFixed(2)})`);
  await pad.hold(gap>0?'right':'left');
  // A sample pad in the way is jumped over, the way a student would.
  if(lastX===null||Math.abs(s.d.x-lastX)>.02){lastX=s.d.x;stuckSince=Date.now();}
  else if(Date.now()-stuckSince>350){await pad.jump();stuckSince=Date.now()+500;}
  await sleep(40);
 }
}
async function waitFor(page,test,message,ms=8000){const until=Date.now()+ms;for(;;){const s=await state(page);if(s&&test(s))return s;check(Date.now()<until,`${message} (${JSON.stringify(s)})`);await sleep(50);}}

async function testStation(page,pad,station){
 if(station.action==='stomp'){
  const from=(await state(page)).d.x<station.x?'right':'left',side=from==='right'?-1:1;
  for(let attempt=0;;attempt++){
   check(attempt<5,`could not get onto ${station.id}`);
   // Stand just beside the sample (the gap between two samples is narrow), then jump toward it.
   await walkTo(page,pad,station.x+side*(1.2+attempt*.04),.22);
   await pad.hold(from);await sleep(120);await pad.jump();
   const landed=await waitFor(page,s=>s.d.onFloor&&(s.onPad||s.d.y<.05)&&Math.abs(s.d.x-station.x)<1.2,'no landing',3000).catch(()=>null);
   await pad.release();
   if(landed?.onPad&&landed.near===station.id)break;
  }
  await sleep(700);
  const on=await state(page);check(on.onPad&&!on.prompt,`${station.id}: no prompt may open while still standing on the sample`);
  await pad.hold(from);
 }else{
  await walkTo(page,pad,station.x);
  await waitFor(page,s=>s.canAct&&s.near===station.id,`${station.id} is not in reach`);
  if(station.action==='pull'){
   // Letting go early must not count as a test.
   await pad.act(200);await sleep(900);
   const early=await state(page);check(!early.prompt,`${station.id}: a short pull opened the prompt`);
   await waitFor(page,s=>s.canAct&&s.near===station.id,`${station.id} did not come back after a short pull`);
  }
  await pad.act(station.action==='pull'?1250:120);
 }
 await waitFor(page,s=>s.prompt===station.id,`${station.id}: prompt did not open`);
 await pad.release();
}

async function playCourse(context,label,mode){
 const page=await open(context,'home');
 await page.evaluate(([key,value,view])=>{localStorage.setItem(key,value);sessionStorage.removeItem(view);},[KEY,JSON.stringify(seed()),VIEW]);
 await page.goto(`${BASE}/#S03`);await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForSelector('.run-stage[data-run-ready=true]',{timeout:30000});
 const run={label,mode,viewport:page.viewportSize(),stations:[]};
 const pad=controls(page,mode);
 await sleep(600);await page.screenshot({path:join(OUT,`${label}-start.png`)});
 const started=Date.now();
 for(const [index,station] of stations.entries()){
  await testStation(page,pad,station);
  await page.screenshot({path:join(OUT,`${label}-${index+1}-${station.action}-${station.sampleId}.png`)});
  const before=(await saved(page)).observations.length;
  if(index%4===0){
   // A wrong description leaves no record, shows where to look, and lets the student test again.
   await page.locator('.run-prompt .choice',{hasText:station.wrong}).click();
   await page.waitForSelector('.run-prompt .sample-feedback.retry');
   check((await saved(page)).observations.length===before,`${station.id}: a wrong description was recorded`);
   await page.getByRole('button',{name:/다시 시험하기/}).click();
   await waitFor(page,s=>!s.prompt,'prompt stayed open after retry');
   await testStation(page,pad,station);
  }
  await page.locator('.run-prompt .choice',{hasText:station.answer}).click();
  await waitFor(page,s=>!s.prompt,'prompt stayed open after the right description');
  const now=await saved(page),record=now.observations.find(o=>o.id===station.id);
  check(now.observations.length===before+1&&record,`${station.id}: record missing`);
  check(record.result===station.answer&&record.conditionId==='standard'&&record.origin==='student'&&record.id===`${station.experiment}:${station.sampleId}:standard`,`${station.id}: record shape changed`);
  run.stations.push(station.id);
  // Labels of samples behind the camera are hidden, so count them instead of waiting for visibility.
  await page.waitForFunction(n=>document.querySelectorAll('.run-label.done').length===n,run.stations.length);
 }
 run.seconds=Math.round((Date.now()-started)/100)/10;
 const end=await state(page);run.fps=end.d.fps;run.triangles=end.d.triangles;
 const final=await saved(page);
 check(final.observations.length===stations.length,'unexpected number of records');
 check(model.canCompleteInvestigation(final,'S03'),'S03 investigation is not complete in the saved record');
 await page.getByRole('button',{name:/새 의뢰 풀기/}).waitFor({state:'visible'});
 check(await page.getByRole('button',{name:/새 의뢰 풀기/}).isEnabled(),'the next step button is not enabled');
 await page.screenshot({path:join(OUT,`${label}-done.png`)});
 run.resources=await page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>/engine|three|run-stage|SampleRun|walk\/researcher|map-villain|dandani|stage-2/.test(e.name)).map(e=>({name:e.name.split('/').slice(-2).join('/'),bytes:e.transferSize||e.encodedBodySize})));
 run.extraBytes=run.resources.reduce((sum,r)=>sum+r.bytes,0);

 // Refresh: the finished investigation opens on the classic screen (extra samples live there).
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForSelector('.experiment-tabs');
 check(!(await page.locator('.run-stage').count()),'a finished investigation should open on the classic screen');
 check((await saved(page)).observations.length===stations.length,'records were lost on refresh');
 await page.locator('.run-view-switch').click();
 await page.waitForSelector('.run-stage[data-run-ready=true]');
 check(await page.locator('.run-label.done').count()===stations.length,'the course does not show the saved records');
 await page.getByRole('button',{name:'기존 방식으로 하기'}).click();
 await page.waitForSelector('.experiment-tabs');
 check(!(await page.locator('.run-stage').count()),'the classic screen did not replace the course');
 run.classicSwitch=true;

 // S04 reads the records the course left: finish the two S03 tasks through the reducer, then use the real screen.
 let next=await saved(page);const send=a=>{next=model.reduceSave(next,a);};
 for(const c of tasks.challengesFor('S03'))send({type:'challenge',id:c.id,answer:c.answer});
 send({type:'complete',screen:'S03'});send({type:'navigate',route:'S04'});
 check(next.completedScreens.includes('S03')&&next.lastRoute==='S04','S03 could not be completed from the course records');
 await page.evaluate(([key,value])=>localStorage.setItem(key,value),[KEY,JSON.stringify(next)]);
 await page.goto(`${BASE}/#S04`);await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForSelector('.assignment-stage');
 await page.locator('.assignment-stage').getByRole('button',{name:new RegExp(model.shortNames.glass_clear)}).first().click();
 await page.locator('.assignment-stage').getByRole('button',{name:new RegExp(model.partNames.window)}).first().click();
 const evidence=await page.locator('.assignment-stage .evidence-card:not(.missing) p').first().textContent({timeout:5000});
 check(evidence===model.resultFor('light_transmission','glass_clear'),`S04 did not show the course record (${evidence})`);
 await page.screenshot({path:join(OUT,`${label}-s04-evidence.png`)});
 run.s04Evidence=evidence;
 report.runs.push(run);
 await page.close();
}

async function reducedMotion(browser){
 const context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce',serviceWorkers:'block'});
 const page=await open(context,'home');
 await page.evaluate(([key,value,view])=>{localStorage.setItem(key,value);sessionStorage.removeItem(view);},[KEY,JSON.stringify(seed()),VIEW]);
 await page.goto(`${BASE}/#S03`);await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForSelector('.experiment-tabs');
 check(!(await page.locator('.run-stage').count()),'reduced motion should open the classic screen');
 check(await page.locator('.run-view-switch').count()===1,'the classic screen should still offer the course');
 report.reducedMotionOpensClassic=true;
 // The classic screen still finishes the same nine comparisons, and one extra sample outside the course.
 const pick=async(experiment,sampleId)=>{
  await page.locator('.experiment-tabs button',{hasText:model.experimentNames[experiment]}).click();
  const card=page.locator('.sample-grid').first().getByRole('button',{name:`${model.shortNames[sampleId]} 바로 시험하기`});
  if(await card.count())await card.click();
  else{await page.getByRole('button',{name:/다른 재료도 시험하기/}).click();await page.locator('dialog[open] .choice',{hasText:model.shortNames[sampleId]}).click();}
  await page.locator('.sample-answer-options .choice:not([disabled])',{hasText:model.resultFor(experiment,sampleId)}).click({timeout:8000});
  await page.waitForFunction(([key,id])=>JSON.parse(localStorage.getItem(key)).observations.some(o=>o.id===id),[KEY,model.observationId(experiment,sampleId)]);
 };
 for(const station of stations)await pick(station.experiment,station.sampleId);
 await pick('water_absorption','metal_plate');
 const classic=await saved(page);
 check(classic.observations.length===stations.length+1&&model.canCompleteInvestigation(classic,'S03'),'the classic screen did not finish the investigation');
 await page.screenshot({path:join(OUT,'classic-done.png')});
 report.classicFlow={records:classic.observations.length};
 await context.close();
}

async function teacherDemo(browser){
 // Teacher demo: the classic screen (with autoplay) opens first; the walkway can be chosen and shows every sample as recorded.
 const context=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
 const page=await open(context,'home');
 await page.getByRole('button',{name:'설정',exact:true}).click();
 await page.getByText('교사용 가이드',{exact:true}).click();
 await page.getByText('교사용 도구',{exact:true}).click();
 await page.getByRole('button',{name:'관리자 전체 해금',exact:true}).click();
 await page.getByRole('button',{name:'닫기',exact:true}).click();
 await page.evaluate(()=>{location.hash='S03';});
 await page.waitForSelector('.experiment-tabs');
 check(!(await page.locator('.run-stage').count()),'the teacher demo should open the classic screen');
 check(await page.locator('[data-playback-control]').count()===1,'autoplay is missing on the classic demo screen');
 await page.locator('.run-view-switch').click();
 await page.waitForSelector('.run-stage[data-run-ready=true]');
 check(await page.locator('.run-label.done').count()===stations.length,'the demo walkway should show all samples as recorded');
 check(!(await page.locator('[data-playback-control]').count()),'autoplay should not be offered on the walkway');
 await sleep(500);await page.screenshot({path:join(OUT,'teacher-demo-3d.png')});
 check(await page.evaluate(key=>localStorage.getItem(key),KEY)===null||!JSON.parse(await page.evaluate(key=>localStorage.getItem(key),KEY)).observations.length,'the demo wrote into the student record');
 report.teacherDemo=true;
 await context.close();
}

let browser;
try{
 browser=await chromium.launch({channel:process.env.QA_CHANNEL||'chrome',headless:true,args:[`--disk-cache-dir=${join(profile,'cache')}`]});
 for(const [label,mode,width,height] of process.env.RUN_STAGE_QUICK?[]:[['buttons-1280x800','buttons',1280,800],['keys-1024x768','keys',1024,768]]){
  const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block',hasTouch:false});
  await playCourse(context,label,mode);
  await context.close();
 }
 await reducedMotion(browser);
 await teacherDemo(browser);
 report.ok=report.errors.length===0;
}catch(error){report.ok=false;report.failure=String(error?.stack||error);}
finally{await browser?.close();await vite.close();}
writeFileSync(join(OUT,'report.json'),JSON.stringify(report,null,1));
console.log(JSON.stringify({ok:report.ok,failure:report.failure,errors:report.errors.slice(0,8),runs:report.runs.map(r=>({label:r.label,stations:r.stations.length,seconds:r.seconds,fps:r.fps,triangles:r.triangles,extraBytes:r.extraBytes})),reducedMotionOpensClassic:report.reducedMotionOpensClassic,classicFlow:report.classicFlow,teacherDemo:report.teacherDemo},null,1));
process.exit(report.ok?0:1);
