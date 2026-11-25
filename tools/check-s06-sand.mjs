
import {createRequire} from 'node:module';import {createServer} from 'vite';import {mkdirSync,writeFileSync} from 'node:fs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const BASE=process.argv[2]||'http://127.0.0.1:5402',KEY='material-workshop-mission.student.v1',OUT=process.env.QA_OUTPUT||'.tmp/s06-sand';mkdirSync(OUT,{recursive:true});
if(!['localhost','127.0.0.1','materials-discovery-lab.yelsam.workers.dev'].includes(new URL(BASE).hostname))throw Error('Unknown S06 test origin');
const vite=await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,entries:[]},appType:'custom',logLevel:'error'});
const m=await vite.ssrLoadModule('/src/domain/model.ts'),t=await vite.ssrLoadModule('/src/domain/challenges.ts');await vite.close();
function fixture(reduced){
 const s=m.demoSave(m.freshSave().settings);s.origin='student';s.settings={...s.settings,muted:true,reducedMotion:reduced};
 s.observations=s.observations.map(o=>({...o,origin:'student'}));s.evidence=s.evidence.slice(0,2).map(e=>({...e,origin:'student'}));s.completedScreens=['S01','S02','S03','S04','S05'];s.lastRoute='S06';s.lastPhase='activity';s.resumeActivity='S06';
 s.checkpoints.liquidStep=0;s.checkpoints.sandStep=0;s.checkpoints.sand=false;delete s.predictions.S06;delete s.initialPredictions.S06;delete s.predictions.liquidConclusion;delete s.predictions.sandConclusion;s.design.needs=[];s.testResults=[];s.reportedRevision=null;
 s.challengeResults=s.completedScreens.flatMap(id=>t.challengesFor(id).map(c=>({id:c.id,answer:[...c.answer]})));return s;
}
const check=(v,msg)=>{if(!v)throw Error(msg);},button=(p,name)=>p.getByRole('button',{name,exact:true});
const saved=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
const amounts=p=>p.locator('[data-sand-amount]').evaluateAll(els=>els.map(e=>Number(e.dataset.sandAmount)));
const sceneBox=p=>p.locator('.sand-scene').boundingBox();
const destinations=['넓은 용기에 붓기','길쭉한 용기에 붓기','처음 컵에 붓기'];
const report={status:'running',realTablet:false,browser:'isolated system Chrome',fixture:'S01-S05 progress prepared; all S06 water/sand decisions use visible UI',runs:[],errors:[]};
const browser=await chromium.launch({channel:'chrome',headless:true});let active;
try{
 for(const [width,height]of[[1280,800],[1024,768],[1880,788]]){
  const dir=OUT+'/'+width+'x'+height;mkdirSync(dir,{recursive:true});const run={viewport:width+'x'+height,checks:[],pageErrors:[]};report.runs.push(run);
  const ctx=await browser.newContext({viewport:{width,height},serviceWorkers:'block',hasTouch:width===1024});
  await ctx.addInitScript(({KEY,s})=>{if(!localStorage.getItem(KEY))localStorage.setItem(KEY,JSON.stringify(s));},{KEY,s:fixture(width===1024)});
  const p=await ctx.newPage();active=p;p.on('pageerror',e=>run.pageErrors.push(e.message));await p.goto(BASE+'/#S06');
  await p.locator('.prediction-inline .choice').filter({hasText:'모양은 달라지고 양은 같을'}).click();
  check(await p.locator('.sand-entry').count()===0,'sand offered before water comparison');
  for(const step of[1,2,3]){await button(p,'끝까지 붓기').click();await p.waitForFunction(({KEY,step})=>JSON.parse(localStorage.getItem(KEY)).checkpoints.liquidStep===step,{KEY,step});}
  const balance=await p.locator('.water-balance').innerText();
  check(balance.includes('흘리거나 더하지 않아요')&&!balance.includes('%'),'decision displays water quantities before an answer');
  await p.locator('.stage-conclusion-options .choice').filter({hasText:'물의 양도 달라져'}).click();
  check(await p.locator('.sand-entry').count()===0,'wrong water comparison unlocks sand');
  await p.locator('.stage-conclusion-options .choice').filter({hasText:'물의 양은 같아'}).click();
  await p.screenshot({path:dir+'/water-return.png'});
  const texture=p.waitForResponse(r=>r.url().endsWith('/sand-quartz.webp')&&r.ok());
  const start=button(p,'모래 붓기 시작');
  if(width===1024)await start.tap();else await start.click();
  await p.locator('[data-sand-moving="true"]').waitFor();await texture;
  const footer=p.locator('.activity-footer>button'),next=button(p,'다음');
  check(await footer.count()===0,'a disabled footer button competes with the task');
  for(const step of[1,2,3]){
   const destination=p.locator('.sand-transfer-progress [aria-current="step"]').filter({hasText:destinations[step-1]});
   await destination.waitFor();
   if(width!==1024){
    const receivingVessel=[1,2,0][step-1];
    await p.waitForFunction(i=>Number(document.querySelector(`[data-sand-vessel="${i}"]`)?.dataset.sandAmount)>=380,receivingVessel);
    if(width===1280)await p.screenshot({path:dir+'/sand-pouring-'+step+'.png'});
   }
   if(width===1880&&step===1){
    await button(p,'잠깐 멈추기').click();
    const partial=await amounts(p);
    check(partial.every(n=>n>=0)&&partial.reduce((a,b)=>a+b,0)===1000&&partial[0]>0&&partial[0]<1000,'pause lost sand or did not pause');
    check((await saved(p)).checkpoints.sandStep===0,'partial pour credited as complete');
    await p.waitForTimeout(300);check(JSON.stringify(await amounts(p))===JSON.stringify(partial),'sand continued moving when paused');
    await button(p,'계속 붓기').press('Enter');run.checks.push('pause/resume by keyboard conserves all sand');
   }
   await p.waitForFunction(({KEY,step})=>JSON.parse(localStorage.getItem(KEY)).checkpoints.sandStep===step,{KEY,step},{timeout:10000});
   const settled=await amounts(p),expected=step===1?[0,1000,0]:step===2?[0,0,1000]:[1000,0,0];
   check(JSON.stringify(settled)===JSON.stringify(expected),'wrong settled sand '+JSON.stringify(settled));
   if(width===1880&&step===1){
    const before=await sceneBox(p);
    await p.reload();await p.locator('.sand-pour-simulation').waitFor();
    check(JSON.stringify(await amounts(p))==='[0,1000,0]','reload did not resume last full transfer');
    const after=await sceneBox(p);
    check(Math.abs(after.height-before.height)<=2&&Math.abs(after.y-before.y)<=2,'reload changed the canvas layout');
    check((await saved(p)).checkpoints.liquidStep===3,'sand resume erased water');
    await button(p,'계속 붓기').press('Enter');run.checks.push('reload resumes completed first sand pour and preserves water');
   }
  }
  await p.locator('.sand-simulation').waitFor();
  check(await next.count()===0,'next step exposed before answering');
  const choices=p.getByRole('group',{name:'모래알의 상태 고르기'});
  check(await choices.evaluate(e=>e===document.activeElement),'question not focused after automatic magnification');
  await button(p,'액체야').click();await p.locator('.sand-feedback').waitFor();check(await next.count()===0,'wrong sand conclusion credited');
  await button(p,'고체야').click();await next.waitFor();
  check(await next.isEnabled()&&await next.evaluate(e=>e===document.activeElement),'next step did not unlock and receive focus');
  await p.screenshot({path:dir+'/sand-grain-correct.png'});
  const controls=await p.locator('.sand-transfer-stage .tools :is(button,summary)').evaluateAll(els=>els.filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent,w:r.width,h:r.height,x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));
  check(controls.every(c=>c.w>=44&&c.h>=44&&c.x>=0&&c.y>=0&&c.right<=width&&c.bottom<=height),'control clipped or small '+JSON.stringify(controls));
  check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow');
  if(width===1880){
   await p.getByText('다시 보기',{exact:true}).click();
   await button(p,'모래 다시 붓기').click();await p.locator('[data-sand-moving="true"]').waitFor();
   const repeated=await saved(p);check(repeated.checkpoints.sandStep===0&&!repeated.checkpoints.sand&&!repeated.predictions.sandConclusion,'retry did not visibly reset sand');
   check(repeated.checkpoints.liquidStep===3&&repeated.predictions.liquidConclusion==='same','sand retry erased water');
  }else{
   await next.click();
   if(width===1280){
    for(const [choice,slot] of [['나무판','받침'],['컵 B','용기']]){
     await button(p,choice).click();
     await p.locator('.maker-socket').filter({hasText:slot}).click();
    }
    await button(p,'물 옮기기 시험').click();await p.locator('.maker-deliver').click();
   }else check((await footer.innerText()).includes('건너뛰기'),'maker cannot be skipped');
   await footer.click();await p.getByText('물높이의 함정',{exact:true}).waitFor();
   await button(p,'높아졌으니 양이 늘었다고 해요').click();
   check(await footer.isDisabled(),'wrong request answer unlocked continuation');
   await button(p,'처음 컵에 다시 부어 기준선과 비교해요').click();check(await footer.isEnabled(),'first request cannot advance');
   await footer.click();await p.getByText('모래는 고체일까',{exact:true}).waitFor();
   await button(p,'알갱이 하나하나는 모양이 그대로예요').click();check(await footer.isDisabled(),'partial answer unlocked continuation');
   await button(p,'더미 모양이 바뀌는 건 알갱이 자리가 바뀌어서예요').click();check((await footer.innerText()).includes('적용 의뢰 마무리'),'missing request wrap-up');
   await footer.click();await p.getByText('두 의뢰를 해결했어요!',{exact:true}).waitFor();
   await footer.click();const concept=p.locator('.concept-actions .primary');await concept.waitFor();await concept.click({timeout:15000});
   await p.getByRole('button',{name:/불이 켜진 공방/}).click();
   await p.waitForURL('**/#world');
   const completed=await saved(p);
   check(completed.completedScreens.includes('S06')&&completed.evidence.some(e=>e.id==='E03'),'stage completion or reward unrecorded');
   await p.locator('.map-next-action').click({timeout:20000});await p.waitForURL('**/#S07');
   run.checks.push('next action focused; maker '+(width===1280?'delivered':'skipped')+'; both requests, completion, concept, reward, map to S07');
  }
  run.checks.push('one start advances through destination labels and opens the grain question automatically; next visible only after correct answer; controls >=44px in viewport');check(run.pageErrors.length===0,'page errors '+run.pageErrors.join());await ctx.close();
 }
 const ctx=await browser.newContext({viewport:{width:1024,height:768},serviceWorkers:'block'}),s=fixture(true);s.completedScreens.push('S06');s.checkpoints.liquidStep=3;s.checkpoints.sand=true;delete s.checkpoints.sandStep;s.predictions.S06='same';s.predictions.liquidConclusion='same';s.predictions.sandConclusion='solid';
 await ctx.addInitScript(({KEY,s})=>localStorage.setItem(KEY,JSON.stringify(s)),{KEY,s});const p=await ctx.newPage();active=p;await p.goto(BASE+'/#S06');await p.locator('.sand-simulation').waitFor();check((await p.locator('.sand-transfer-progress').innerText()).includes('이전에'),'legacy pouring history invented');
 await p.getByText('다시 보기',{exact:true}).click();await button(p,'모래 다시 붓기').click();check((await saved(p)).checkpoints.sandStep===0,'legacy cannot try new pouring');report.legacy='old completion preserved without invented pouring steps; explicit new experiment starts at zero';await ctx.close();
 report.status='passed';
}catch(e){report.status='failed';report.errors.push(e.stack);if(active)await active.screenshot({path:OUT+'/failure.png'}).catch(()=>{});}
finally{writeFileSync(OUT+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();}
if(report.status!=='passed')process.exitCode=1;
