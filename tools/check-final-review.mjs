// Local production-build QA. All learner progress in fullFlow is earned through visible UI.
// Usage: PLAYWRIGHT_MODULE_PATH=<module> node tools/check-final-review.mjs <local URL> [1280x800,1024x768]
// No deployment, external writes, real-device claims, precise dragging or press-and-hold.
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createServer} from 'vite';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const BASE=(process.argv[2]||'http://127.0.0.1:5399').replace(/\/$/,'');
if(!['127.0.0.1','localhost'].includes(new URL(BASE).hostname))throw Error('Local build only');
const views=(process.argv[3]||'1280x800,1024x768').split(',');
const OUT=resolve('.tmp/final-review');mkdirSync(OUT,{recursive:true});
const KEY='material-workshop-mission.student.v1',VIEW='material-workshop-mission.s03-view';
const vite=await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,entries:[]},appType:'custom',logLevel:'error'});
const [m,t,maker]=await Promise.all(['model','challenges','maker'].map(n=>vite.ssrLoadModule('/src/domain/'+n+'.ts')));
await vite.close();
const report={base:BASE,browser:'isolated headless system Chrome',realTablet:false,runs:[],regressions:[],errors:[]};
let page,where='startup',browser;
const check=(v,msg)=>{if(!v)throw Error(where+': '+msg);};
const saved=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
async function tap(loc){await loc.first().click({timeout:15000});}
const role=(p,name)=>p.getByRole('button',{name,exact:typeof name==='string'});
const footer=p=>p.locator('.activity-footer>button');
async function waitFooter(p,text){await p.waitForFunction(t=>{const b=document.querySelector('.activity-footer>button');return b&&!b.disabled&&b.innerText.includes(t);},text,{timeout:20000});}
async function route(p,id){await p.waitForFunction(r=>location.hash==='#'+r,id,{timeout:25000});}
async function screenshot(p,dir,name){await p.screenshot({path:join(dir,name+'.png')});}
async function collectLayout(p,label,run){
 const bounds=await p.evaluate(()=>({width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,controls:[...document.querySelectorAll('.activity-footer>button,.sample-simple-run,.test-simple-run,.core-step,.air-retry')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent.trim(),x:r.x,y:r.y,width:r.width,height:r.height,inViewport:r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1};})}));
 run.layouts.push({label,...bounds});check(bounds.documentWidth<=bounds.width+1,'horizontal page overflow');
 for(const c of bounds.controls)check(c.inViewport,'control outside viewport: '+c.text);
}
async function card(p){
 for(let i=0;i<60;i++){
  const take=p.locator('.rc-layer:not(.is-leaving) .rc-take.is-ready');
  if(await take.count()){
   // The reward button deliberately bobs forever. Use a real pointer click at its visible centre.
   await take.waitFor({state:'visible'});if((await take.textContent()).includes('멋져요'))await p.waitForTimeout(800);const box=await take.boundingBox();check(box,'reward button has no box');
   const x=box.x+box.width/2,y=box.y+box.height/2;
   check(await p.evaluate(({x,y})=>!!document.elementFromPoint(x,y)?.closest('.rc-take'),{x,y}),'reward button centre is obstructed');
   await p.mouse.click(x,y);await p.waitForTimeout(1200);continue;
  }
  if(i>8&&!(await p.locator('.rc-layer').count()))return;
  await p.waitForTimeout(250);
 }
 throw Error('reward card did not finish');
}
async function next(p,id){
 if(new URL(p.url()).hash==='#world'){await card(p);await tap(p.locator('.map-next-action'));}
 await route(p,id);
}
async function finish(p,id,dir,run){
 const order=maker.makerOrders.find(o=>o.screen===id);
 if(order){
  await waitFooter(p,'주문 제작');await tap(footer(p));
  for(const slot of order.slots){
   const choice=slot.choices.find(c=>slot.accept.includes(c.id));
   const row=p.locator('.maker-choice-row').filter({hasText:slot.label});
   await tap(row.getByRole('button',{name:choice.label,exact:true}));
   await tap(p.locator('.maker-socket').filter({hasText:slot.label}));
  }
  await tap(role(p,order.trial));await tap(p.locator('.maker-deliver'));
  await screenshot(p,dir,id+'-maker');
 }
 await waitFooter(p,'새 의뢰');await tap(footer(p));
 const list=t.challengesFor(id);
 for(let i=0;i<list.length;i++){
  const c=list[i];await p.waitForFunction(title=>document.querySelector('#challenge-title')?.textContent===title,c.title);
  const label=id=>c.options.find(o=>o.id===id).label;
  if(id==='S01'&&i===0){
   await tap(p.locator('.challenge-options .choice').filter({hasText:label('color')}));
   await p.locator('.challenge-feedback.retry').waitFor();check(!(await saved(p)).challengeResults.some(r=>r.id===c.id),'wrong challenge was credited');
  }
  if(c.mode==='classify'){
   for(const a of c.answer){const [token,slot]=a.split(':');await tap(p.locator('.challenge-classify .drag-token').filter({hasText:label(token)}));await tap(p.locator('.challenge-classify [data-drop-slot="'+slot+'"]'));}
  }else for(const a of c.answer)await tap(p.locator('.challenge-options .choice').filter({hasText:label(a)}));
  await p.locator('.challenge-feedback.success').waitFor();
  if((id==='S01'||id==='S02')&&i===0){
   await p.waitForTimeout(3000);check(await p.locator('#challenge-title').textContent()===c.title,'correct answer advanced automatically');
   await screenshot(p,dir,id+'-feedback-wait');await tap(footer(p));
  }
 }
 await waitFooter(p,'개념 보고');await tap(footer(p));
 const leave=p.locator('.concept-actions .primary');await leave.waitFor();
 await p.waitForFunction(()=>{const b=document.querySelector('.concept-actions .primary');return b&&!b.disabled;},null,{timeout:30000});
 await tap(leave);
 if(Number(id.slice(1))%2===0)await tap(role(p,/불이 켜진 공방/));
 run.steps.push(id+' complete with requests, concept, reward'+(order?', maker':''));
}
async function place(p,material,slot){
 await tap(p.locator('.drag-token').filter({hasText:new RegExp('^'+material)}));
 await tap(p.locator('.drag-board [data-drop-slot="'+slot+'"]'));
}
async function fullFlow(view){
 const [width,height]=view.split('x').map(Number),dir=join(OUT,view);mkdirSync(dir,{recursive:true});
 const run={viewport:view,steps:[],layouts:[],snapshots:{},pageErrors:[],status:'running'};report.runs.push(run);
 const ctx=await browser.newContext({viewport:{width,height},serviceWorkers:'block',acceptDownloads:true});
 await ctx.addInitScript(k=>sessionStorage.setItem(k,'2d'),VIEW);
 const p=await ctx.newPage();page=p;p.setDefaultTimeout(15000);p.on('pageerror',e=>run.pageErrors.push(e.message));
 const snapshot=async id=>{run.snapshots[id]=await saved(p);await screenshot(p,dir,id);await collectLayout(p,id,run);};
 where=view+' home';console.log(where);
 await p.goto(BASE+'/#home');await tap(role(p,'시작하기'));
 await p.locator('.story-film-intro').waitFor();await screenshot(p,dir,'intro');await tap(p.locator('.story-film-skip'));await route(p,'S01');
 for(const name of ['우산 천','금속 살','손잡이'])await tap(role(p,name+' 살펴보기'));
 await snapshot('S01');await finish(p,'S01',dir,run);await next(p,'S02');
 where=view+' S02';console.log(where);
 for(const [mat,slot] of [['천','canopy'],['금속','frame'],['나무','handle']])await place(p,mat,slot);
 await snapshot('S02');await finish(p,'S02',dir,run);await next(p,'S03');
 where=view+' S03';console.log(where);
 for(const experiment of m.experiments){
  await tap(role(p,new RegExp(m.experimentNames[experiment])));
  for(const sample of m.requiredComparisons[experiment]){
   if((await saved(p)).observations.some(o=>o.id===m.observationId(experiment,sample)))continue;
   const button=p.locator('.sample-simple-run');
   if(await button.isEnabled())await tap(button);
   else throw Error('sample button unexpectedly unavailable');
   await p.locator('.sample-answer-options').waitFor();
   const currentSample=(await p.locator('.experiment-eyebrow').textContent()).trim();
   const current=m.materials.find(x=>m.shortNames[x.id]===currentSample)?.id;
   check(current,'unknown displayed sample '+currentSample);
   if((await saved(p)).observations.length===0){
    const wrong=m.resultFor(experiment,m.materials.find(x=>m.resultFor(experiment,x.id)!==m.resultFor(experiment,current)).id);
    await tap(p.locator('.sample-answer-options .choice').filter({hasText:wrong}));
    await p.locator('.sample-feedback.retry').waitFor();check((await saved(p)).observations.length===0,'wrong observation credited');
   }
   await tap(p.locator('.sample-answer-options .choice').filter({hasText:m.resultFor(experiment,current)}));
   await p.waitForTimeout(2000);
  }
 }
 check(m.canCompleteInvestigation(await saved(p),'S03'),'required observations missing');
 await snapshot('S03');await finish(p,'S03',dir,run);await next(p,'S04');
 where=view+' S04';console.log(where);
 for(const [mat,slot,property] of [['투명 플라스틱','window','빛이 통과한다'],['부드러운 고무','bumper','눌렸다가 돌아온다']]){
  await place(p,mat,slot);await tap(p.locator('.property-choices .choice').filter({hasText:property}));
 }
 await snapshot('S04');await finish(p,'S04',dir,run);await next(p,'S05');
 where=view+' S05';console.log(where);
 await tap(p.locator('.prediction-inline .choice').filter({hasText:'용기에 맞춰 달라질 것 같아'}));
 for(const name of ['처음 컵','넓은 용기','길쭉한 용기'])await tap(role(p,name+'에 나무토막 옮기기'));
 await tap(role(p,'용기 모양대로 나무토막이 변했어.'));check(!m.canCompleteInvestigation(await saved(p),'S05'),'wrong solid conclusion accepted');
 await tap(role(p,'나무토막의 모양과 크기는 그대로야.'));
 await snapshot('S05');await finish(p,'S05',dir,run);await next(p,'S06');
 where=view+' S06';console.log(where);
 await tap(p.locator('.prediction-inline .choice').filter({hasText:'모양은 달라지고 양은 같을'}));
 for(let i=0;i<3;i++){await tap(role(p,'끝까지 붓기'));await p.waitForFunction(a=>JSON.parse(localStorage.getItem(a.key)).checkpoints.liquidStep>a.i,{key:KEY,i},{timeout:15000});}
 check(await p.locator('.water-balance').textContent().then(s=>s.includes('흘리거나 더하지')),'no no-spill condition');
 await tap(p.locator('.stage-conclusion-options .choice').filter({hasText:'물의 양도 달라져'}));
 check(!m.canCompleteInvestigation(await saved(p),'S06'),'wrong liquid conclusion accepted');
 await tap(p.locator('.stage-conclusion-options .choice').filter({hasText:'물의 양은 같아'}));
 await tap(role(p,/모래알 확대 관찰하기/));await tap(role(p,/모래는 흘러도/));
 await snapshot('S06');await finish(p,'S06',dir,run);await next(p,'S07');
 where=view+' S07';console.log(where);
 await tap(role(p,'마른 휴지 먼저 확인'));await tap(role(p,'컵을 물속에 넣기'));await p.locator('.evidence-card').waitFor();
 await tap(role(p,'같은 조건으로 다시 실험하기'));
 check(!(await p.locator('.air-cup').getAttribute('class')).includes('submerged'),'S07 cup did not reset');
 await tap(role(p,'마른 휴지 먼저 확인'));await tap(role(p,'컵을 물속에 넣기'));await p.locator('.evidence-card').waitFor();
 await snapshot('S07');await finish(p,'S07',dir,run);await next(p,'S08');
 where=view+' S08';console.log(where);
 await tap(role(p,'같은 깊이에서 배출구 열기'));await p.locator('.stage-conclusion-options').waitFor();
 await tap(role(p,'컵을 더 깊게 넣었어요'));check(!(await saved(p)).checkpoints.airCompared,'wrong depth explanation credited');
 await tap(role(p,'공기가 빠져나간 자리에 물이 들어왔어요'));
 await tap(role(p,'같은 조건으로 다시 실험하기'));
 check(!(await p.locator('.air-cup').getAttribute('class')).includes('vented'),'vent did not reset');
 check((await p.locator('.air-cup').getAttribute('class')).includes('submerged'),'same depth not preserved');
 await screenshot(p,dir,'S08-retry-closed');await tap(role(p,'같은 깊이에서 배출구 열기'));
 await tap(role(p,'공기가 빠져나간 자리에 물이 들어왔어요'));
 for(let i=0;i<3;i++)await tap(role(p,/펌프를 세 번/));
 await snapshot('S08');await finish(p,'S08',dir,run);await next(p,'S09');
 where=view+' S09 evidence return';console.log(where);
 for(const [mat,slot] of [['금속','body'],['투명 플라스틱','window'],['부드러운 고무','bumper']])await place(p,mat,slot);
 const before=await saved(p);check(!m.linkedCorrectly(before,'body'),'missing metal water record was unexpectedly present');
 await tap(role(p,'몸체 살펴보기'));await tap(role(p,/시험실에서 근거 더 모으기/));await route(p,'S03');
 await tap(role(p,/물방울 떨어뜨리기/));await tap(role(p,/다른 재료도 시험하기/));await tap(p.locator('.modal .choice').filter({hasText:'금속'}));
 await p.locator('.sample-answer-options').waitFor();await tap(p.locator('.sample-answer-options .choice').filter({hasText:m.resultFor('water_absorption','metal_plate')}));
 await tap(role(p,/설계로 돌아가기/));await route(p,'S09');
 const after=await saved(p);check(m.designReady(after),'evidence did not refresh without replacing part');
 for(const part of m.parts)check(before.design.parts[part].sampleId===after.design.parts[part].sampleId,'material changed on return');
 check(JSON.stringify(before.design.parts.window)===JSON.stringify(after.design.parts.window)&&JSON.stringify(before.design.parts.bumper)===JSON.stringify(after.design.parts.bumper),'unrelated design changed');
 await snapshot('S09');await finish(p,'S09',dir,run);await next(p,'S10');
 where=view+' S10';console.log(where);
 for(const test of m.tests){await tap(role(p,m.testNames[test]));await tap(p.locator('.test-simple-run'));await p.waitForFunction(a=>JSON.parse(localStorage.getItem(a.key)).testResults.some(t=>t.testId===a.test&&t.designRevision===JSON.parse(localStorage.getItem(a.key)).design.revision),{key:KEY,test});}
 await snapshot('S10');await finish(p,'S10',dir,run);await card(p);await tap(p.locator('.map-next-action'));
 where=view+' core';console.log(where);
 await tap(role(p,'연구 보고서 전달하기 →'));await p.locator('.core-step').waitFor();await collectLayout(p,'core',run);await screenshot(p,dir,'core');
 for(let i=0;i<3;i++)await tap(p.locator('.core-step'));
 await p.waitForFunction(()=>location.hash.includes('/ending')||location.hash.includes('/certificate'));
 if(new URL(p.url()).hash.includes('ending')){await screenshot(p,dir,'ending');await tap(role(p,'연출 건너뛰기 →'));}
 await p.locator('.story-film-outro').waitFor();await screenshot(p,dir,'outro');await tap(p.locator('.story-film-skip'));await card(p);await p.locator('#certificate').waitFor();
 await screenshot(p,dir,'certificate');await collectLayout(p,'certificate',run);
 writeFileSync(join(OUT,'pending-'+view+'.json'),JSON.stringify({final:await saved(p),snapshots:run.snapshots}));
 const [download]=await Promise.all([p.waitForEvent('download',{timeout:30000}),tap(role(p,'PNG 저장'))]);await download.saveAs(join(dir,'certificate-export.png'));
 const png=readFileSync(join(dir,'certificate-export.png'));check(png.readUInt32BE(16)===2400&&png.readUInt32BE(20)===1697,'PNG dimensions');
 await p.evaluate(()=>{window.__qaPrinted=false;window.print=()=>{window.__qaPrinted=true;};});await tap(role(p,'인증서 인쇄 / PDF 저장'));check(await p.evaluate(()=>window.__qaPrinted),'print control did not call print');
 const pdf=await p.pdf({path:join(dir,'certificate.pdf'),preferCSSPageSize:true,printBackground:true});
 check((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length===1,'certificate not one PDF page');
 const final=await saved(p);check(final.completedScreens.length===10&&final.challengeResults.length===20&&final.evidence.length===5&&final.coreComplete&&final.completionArchive.length===1,'final student progress incomplete');
 check(Object.keys(final.deliveries).length===3,'three maker deliveries missing');
 await p.reload();await p.locator('#certificate').waitFor();check(!(await p.locator('.story-film-outro').count()),'outro repeated after reload');
 check(run.pageErrors.length===0,'page errors: '+run.pageErrors.join(','));
 run.final={completed:final.completedScreens.length,challenges:final.challengeResults.length,evidence:final.evidence.length,observations:final.observations.length,deliveries:Object.keys(final.deliveries).length,archives:final.completionArchive.length,png:'2400x1697',pdfPages:1};run.status='PASS';
 writeFileSync(join(dir,'report.json'),JSON.stringify(run,null,2));await ctx.close();return {final,snapshots:run.snapshots};
}
async function seeded(save,hash,options={}){
 const ctx=await browser.newContext({viewport:{width:1024,height:768},serviceWorkers:'block',...options});
 await ctx.addInitScript(a=>{if(!localStorage.getItem(a.key))localStorage.setItem(a.key,JSON.stringify(a.save));sessionStorage.setItem(a.view,'2d');},{key:KEY,save,view:VIEW});
 const p=await ctx.newPage();page=p;p.on('pageerror',e=>report.errors.push(e.message));await p.goto(BASE+'/#'+hash);return {ctx,p};
}
async function regressions(data){
 where='ready experiment controls and 3D fallback';console.log(where);
 let ready=await seeded(data.snapshots.S03,'S03');const layout={layouts:[]};
 for(const experiment of m.experiments){await tap(role(ready.p,new RegExp(m.experimentNames[experiment])));await collectLayout(ready.p,'S03 '+experiment,layout);}
 await screenshot(ready.p,OUT,'ready-experiment-1024');
 await tap(role(ready.p,'3D 시험 길로 하기'));await ready.p.waitForFunction(()=>document.querySelector('.run-stage')?.dataset.runReady==='true',null,{timeout:30000});
 await tap(role(ready.p,'기존 방식으로 하기'));await ready.p.locator('.sample-simple-run').waitFor();
 report.regressions.push({readyControls:layout.layouts,threeDFallback:'visible mode buttons returned to 2D'});await ready.ctx.close();
 where='failed window preserves design';console.log(where);
 const s=m.reduceSave(data.final,{type:'newDesign'});s.lastRoute='S09';
 let {ctx,p}=await seeded(s,'S09');await place(p,m.shortNames.wood_raw,'window');const before=await saved(p);
 await p.goto(BASE+'/#S10');await tap(role(p,'빛 시험'));await tap(p.locator('.test-simple-run'));
 await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).testResults.some(t=>t.testId==='light'&&!t.pass),KEY);
 await tap(role(p,'재료·근거 수정하기'));await route(p,'S09');
 check(await p.locator('.tools h3').textContent().then(t=>t.includes('관찰창')),'failed window not selected');
 check((await p.locator('.tools .sample-feedback.retry').textContent()).includes('안쪽 표시'),'failure does not identify relevant issue');
 const after=await saved(p);check(JSON.stringify(before.design.parts)===JSON.stringify(after.design.parts),'failure erased design');
 await screenshot(p,OUT,'failed-window');await place(p,'투명 유리','window');
 check(m.designReady(await saved(p)),'alternate glass window not accepted');
 const repaired=await saved(p);check(JSON.stringify(before.design.parts.body)===JSON.stringify(repaired.design.parts.body)&&JSON.stringify(before.design.parts.bumper)===JSON.stringify(repaired.design.parts.bumper),'repair changed other parts');
 report.regressions.push('failed window selected; only window repaired; clear glass accepted');await ctx.close();
 where='keyboard core';console.log(where);
 const core=structuredClone(data.final);core.coreComplete=false;core.completionArchive=[];core.lastPhase='core';
 ({ctx,p}=await seeded(core,'S10/core'));await p.locator('.core-step').waitFor();await p.locator('.core-step').focus();
 await p.keyboard.press('Enter');check((await p.locator('.core-device>span').textContent())==='34%','Enter not one step');
 await p.keyboard.press('Space');check((await p.locator('.core-device>span').textContent())==='68%','Space not one step');
 await p.keyboard.press('Enter');await p.waitForFunction(()=>location.hash.includes('ending'));check((await saved(p)).coreComplete,'keyboard core incomplete');
 report.regressions.push('core restored with Enter, Space, Enter');await ctx.close();
 where='slow connection and resume';console.log(where);
 const mid=data.snapshots.S06;({ctx,p}=await seeded(mid,'home'));const cdp=await ctx.newCDPSession(p);
 await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:450,downloadThroughput:180*1024,uploadThroughput:80*1024,connectionType:'cellular3g'});
 await p.reload();await tap(role(p,'이어 하기'));await route(p,'S06');await p.locator('.liquid-stage').waitFor();
 const resumed=await saved(p);check(resumed.checkpoints.liquidStep===3&&resumed.checkpoints.sand&&resumed.predictions.sandConclusion==='solid','stable liquid/sand progress lost');
 check(JSON.stringify(resumed.observations)===JSON.stringify(mid.observations),'resume changed observations');
 await screenshot(p,OUT,'slow-resume');report.regressions.push('450ms latency / 180KiB/s cold reload, home Continue restored S06 stable return and sand record');await ctx.close();
 where='offline cache and saved observation';console.log(where);
 ({ctx,p}=await seeded(data.final,'S03',{serviceWorkers:'allow'}));
 await p.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:60000});
 const cacheInfo=await p.evaluate(async()=>{const names=(await caches.keys()).filter(n=>n.startsWith('material-workshop-offline-'));const c=await caches.open(names[0]);return {name:names[0],files:(await c.keys()).length,status:document.querySelector('.offline-status')?.textContent};});
 const offlineFiles=JSON.parse(readFileSync('dist/sw.js','utf8').match(/^const FILES=(\[.*\]);$/m)[1]);
 check(cacheInfo.files===offlineFiles.length,'offline cache incomplete: '+cacheInfo.files+' / '+offlineFiles.length);check(cacheInfo.status?.includes('준비'),'offline readiness not announced');
 await screenshot(p,OUT,'offline-ready');await ctx.setOffline(true);
 const models=await p.evaluate(async()=>Promise.all(['umbrella','box'].map(async model=>{const r=await fetch('/assets/models/'+model+'.glb?v=qa');const bytes=new Uint8Array(await r.arrayBuffer());return {model,status:r.status,bytes:bytes.length,magic:String.fromCharCode(...bytes.slice(0,4))};})));
 check(models.every(model=>model.status===200&&model.bytes>12&&model.magic==='glTF'),'offline versioned GLB failed');
 const unknownQueryBlocked=await p.evaluate(async()=>{try{await fetch('/assets/models/box.glb?unreviewed=1');return false;}catch{return true;}});check(unknownQueryBlocked,'unreviewed model query was cached');
 await p.goto(BASE+'/#S03');await p.locator('.experiment-tabs').waitFor();
 await tap(role(p,/누르고 놓기/));await tap(role(p,/다른 재료도 시험하기/));await tap(p.locator('.modal .choice').filter({hasText:'나무'}));
 await p.locator('.sample-answer-options').waitFor();await tap(p.locator('.sample-answer-options .choice').filter({hasText:m.resultFor('compression_recovery','wood_raw')}));
 const obs=m.observationId('compression_recovery','wood_raw');check((await saved(p)).observations.some(o=>o.id===obs),'offline observation not stored');
 await p.reload();await p.locator('.experiment-tabs').waitFor();check((await saved(p)).observations.some(o=>o.id===obs),'offline reload lost record');
 const range=await p.evaluate(async()=>{const r=await fetch('/assets/concepts/S03.mp4',{headers:{Range:'bytes=0-99'}});return {status:r.status,bytes:(await r.arrayBuffer()).byteLength};});check(range.status===206&&range.bytes===100,'offline media Range failed');
 await screenshot(p,OUT,'offline-reload');report.regressions.push({offline:cacheInfo,models,unknownQueryBlocked,range,recordPersisted:true});await ctx.close();
}
try{
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 let data;if(process.argv[4]==='regressions')data=JSON.parse(readFileSync(join(OUT,'student-'+views[0]+'.json'),'utf8'));else for(const view of views){data=await fullFlow(view);writeFileSync(join(OUT,'student-'+view+'.json'),JSON.stringify(data));}
 await regressions(data);report.status=report.errors.length?'FAIL':'PASS';
}catch(e){report.status='FAIL';for(const r of report.runs)if(r.status==='running')r.status='FAIL';report.errors.push(String(e.stack||e));if(page&&!page.isClosed())await page.screenshot({path:join(OUT,'failure.png')}).catch(()=>{});}
finally{if(browser)await browser.close();writeFileSync(join(OUT,'report.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify({status:report.status,runs:report.runs.map(r=>({viewport:r.viewport,status:r.status,final:r.final,pageErrors:r.pageErrors})),regressions:report.regressions,errors:report.errors},null,2));
process.exitCode=report.status==='PASS'?0:1;
