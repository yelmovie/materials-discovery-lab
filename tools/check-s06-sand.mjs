
import {createRequire} from 'node:module';import {createServer} from 'vite';import {mkdirSync,writeFileSync} from 'node:fs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const BASE=process.argv[2]||'http://127.0.0.1:5402',KEY='material-workshop-mission.student.v1',OUT='.tmp/s06-sand';mkdirSync(OUT,{recursive:true});
if(!['localhost','127.0.0.1'].includes(new URL(BASE).hostname))throw Error('Local only');
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
const report={status:'running',realTablet:false,browser:'isolated system Chrome',fixture:'S01-S05 progress prepared; all S06 water/sand decisions use visible UI',runs:[],errors:[]};
const browser=await chromium.launch({channel:'chrome',headless:true});let active;
try{
 for(const [width,height]of[[1280,800],[1024,768],[1880,788]]){
  const dir=OUT+'/'+width+'x'+height;mkdirSync(dir,{recursive:true});const run={viewport:width+'x'+height,checks:[],pageErrors:[]};report.runs.push(run);
  const ctx=await browser.newContext({viewport:{width,height},serviceWorkers:'block',hasTouch:width===1024});
  await ctx.addInitScript(({KEY,s})=>{if(!localStorage.getItem(KEY))localStorage.setItem(KEY,JSON.stringify(s));},{KEY,s:fixture(width!==1280)});
  const p=await ctx.newPage();active=p;p.on('pageerror',e=>run.pageErrors.push(e.message));await p.goto(BASE+'/#S06');
  await p.locator('.prediction-inline .choice').filter({hasText:'모양은 달라지고 양은 같을'}).click();
  check(await p.locator('.sand-entry').count()===0,'sand offered before water comparison');
  for(const step of[1,2,3]){await button(p,'끝까지 붓기').click();await p.waitForFunction(({KEY,step})=>JSON.parse(localStorage.getItem(KEY)).checkpoints.liquidStep===step,{KEY,step});}
  await p.locator('.stage-conclusion-options .choice').filter({hasText:'물의 양도 달라져'}).click();
  check(await p.locator('.sand-entry').count()===0,'wrong water comparison unlocks sand');
  await p.locator('.stage-conclusion-options .choice').filter({hasText:'물의 양은 같아'}).click();
  await p.screenshot({path:dir+'/water-return.png'});await p.locator('.sand-entry').click();await p.locator('.sand-pour-simulation').waitFor();
  check(JSON.stringify(await amounts(p))==='[1000,0,0]','sand start conditions unclear');await p.screenshot({path:dir+'/sand-start.png'});
  for(const step of[1,2,3]){
   const pour=button(p,'모래 붓기');
   if(width===1024)await pour.tap();else if(step===2){await pour.focus();await p.keyboard.press('Enter');}else await pour.click();
   await p.locator('[data-sand-moving="true"]').waitFor();check(await p.locator('.sand-stream path').count()===14,'moving grains missing');
   if(width===1280&&step===1){
    await p.waitForTimeout(300);await p.screenshot({path:dir+'/sand-pouring.png'});await button(p,'잠깐 멈추기').click();
    const partial=await amounts(p);check(partial.every(n=>n>=0)&&partial.reduce((a,b)=>a+b,0)===1000&&partial[0]>0&&partial[0]<1000,'pause lost sand or did not pause');
    check((await saved(p)).checkpoints.sandStep===0,'partial pour credited as complete');await pour.click();run.checks.push('moving grain stream; pause/resume conserves all sand');
   }
   await p.waitForFunction(({KEY,step})=>JSON.parse(localStorage.getItem(KEY)).checkpoints.sandStep===step,{KEY,step},{timeout:10000});
   const settled=await amounts(p),expected=step===1?[0,1000,0]:step===2?[0,0,1000]:[1000,0,0];
   check(JSON.stringify(settled)===JSON.stringify(expected),'wrong settled sand '+JSON.stringify(settled));await p.screenshot({path:dir+'/sand-step-'+step+'.png'});
   if(step===1){
    await p.reload();await p.locator('.sand-pour-simulation').waitFor();check(JSON.stringify(await amounts(p))==='[0,1000,0]','reload did not resume last full transfer');
    check((await saved(p)).checkpoints.liquidStep===3,'sand resume erased water');run.checks.push('reload resumes completed first sand pour and preserves water');
   }
  }
  check(await p.locator('.activity-footer>button').isDisabled(),'activity complete before grain observation');
  await button(p,'모래알 확대 관찰하기').click();await p.locator('.sand-simulation').waitFor();
  await button(p,'액체야').click();await p.locator('.sand-feedback').waitFor();check(await p.locator('.activity-footer>button').isDisabled(),'wrong sand conclusion credited');
  await p.getByRole('button',{name:'모래는 흘러도, 알갱이는 모양을 유지하는 고체야.',exact:true}).click();check(await p.locator('.activity-footer>button').isEnabled(),'sand observation did not complete investigation');
  await p.screenshot({path:dir+'/sand-grain-correct.png'});
  const controls=await p.locator('.sand-transfer-stage .tools button').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent,w:r.width,h:r.height,x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));
  check(controls.every(c=>c.w>=44&&c.h>=44&&c.x>=0&&c.y>=0&&c.right<=width&&c.bottom<=height),'control clipped or small '+JSON.stringify(controls));
  check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow');
  await button(p,'모래 다시 붓기').click();const repeated=await saved(p);check(repeated.checkpoints.sandStep===0&&!repeated.checkpoints.sand&&!repeated.predictions.sandConclusion,'retry did not visibly reset sand');check(repeated.checkpoints.liquidStep===3&&repeated.predictions.liquidConclusion==='same','sand retry erased water');
  run.checks.push('three real sand pours; distinct heaps/grains; keyboard Enter and touch taps; grain wrong/retry/correct; all controls >=44px in viewport');check(run.pageErrors.length===0,'page errors '+run.pageErrors.join());await ctx.close();
 }
 const ctx=await browser.newContext({viewport:{width:1024,height:768},serviceWorkers:'block'}),s=fixture(true);s.completedScreens.push('S06');s.checkpoints.liquidStep=3;s.checkpoints.sand=true;delete s.checkpoints.sandStep;s.predictions.S06='same';s.predictions.liquidConclusion='same';s.predictions.sandConclusion='solid';
 await ctx.addInitScript(({KEY,s})=>localStorage.setItem(KEY,JSON.stringify(s)),{KEY,s});const p=await ctx.newPage();active=p;await p.goto(BASE+'/#S06');await p.locator('.sand-simulation').waitFor();check((await p.locator('.sand-transfer-progress').innerText()).includes('이전에'),'legacy pouring history invented');
 await button(p,'모래 붓기도 해보기').click();check((await saved(p)).checkpoints.sandStep===0,'legacy cannot try new pouring');report.legacy='old completion preserved without invented pouring steps; explicit new experiment starts at zero';await ctx.close();
 report.status='passed';
}catch(e){report.status='failed';report.errors.push(e.stack);if(active)await active.screenshot({path:OUT+'/failure.png'}).catch(()=>{});}
finally{writeFileSync(OUT+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();}
if(report.status!=='passed')process.exitCode=1;
