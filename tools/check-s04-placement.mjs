// Local-only S04 interaction and six-material rendering checks; fixtures prepare S03 evidence.
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createServer} from 'vite';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const BASE=(process.argv[2]||'http://127.0.0.1:5401').replace(/\/$/,'');
if(!['localhost','127.0.0.1'].includes(new URL(BASE).hostname))throw Error('Local build only');
const OUT='.tmp/s04-placement';mkdirSync(OUT,{recursive:true});
const KEY='material-workshop-mission.student.v1';
const vite=await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,entries:[]},appType:'custom',logLevel:'error'});
const [m,t]=await Promise.all(['model','challenges'].map(n=>vite.ssrLoadModule('/src/domain/'+n+'.ts')));await vite.close();
function fixture(){
 const s=m.demoSave(m.freshSave().settings);s.origin='student';s.settings={...s.settings,muted:true,reducedMotion:true};
 s.observations=s.observations.map(o=>({...o,origin:'student'}));s.evidence=s.evidence.slice(0,1).map(e=>({...e,origin:'student'}));
 s.completedScreens=['S01','S02','S03'];s.lastRoute='S04';s.lastPhase='activity';s.resumeActivity='S04';
 s.checkpoints.assignments=[];s.design.needs=[];s.testResults=[];s.reportedRevision=null;
 s.challengeResults=s.completedScreens.flatMap(id=>t.challengesFor(id).map(c=>({id:c.id,answer:[...c.answer]})));
 return s;
}
const report={status:'running',base:BASE,realTablet:false,browser:'isolated headless system Chrome',fixture:'S01-S03 progress and extra S03 observations prepared; S04 actions use visible UI',runs:[],errors:[]};
const check=(v,msg)=>{if(!v)throw Error(msg);};
const browser=await chromium.launch({channel:'chrome',headless:true});
let active;
async function saved(p){return p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);}
const token=(p,id)=>p.locator('.assignment-stage .drag-tokens').getByRole('button',{name:m.shortNames[id],exact:true});
const target=(p,id)=>p.locator('.assignment-model [data-drop-slot="'+id+'"]');
async function attach(p,id,part){await token(p,id).click();await target(p,part).click();await p.waitForTimeout(150);}
async function keyTo(p,loc,key='Enter'){
 for(let i=0;i<80;i++){
  if(await loc.evaluate(el=>el===document.activeElement)){await p.keyboard.press(key);return;}
  await p.keyboard.press('Tab');
 }
 throw Error('Keyboard focus did not reach '+await loc.getAttribute('class'));
}
try {
 for(const [width,height] of [[1280,800],[1024,768],[1880,788]]){
  const view=width+'x'+height,dir=OUT+'/'+view;mkdirSync(dir,{recursive:true});
  const run={viewport:view,checks:[],materials:[],pageErrors:[]};report.runs.push(run);
  const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'});
  await context.addInitScript(({key,s})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(s));},{key:KEY,s:fixture()});
  const p=await context.newPage();active=p;p.on('pageerror',e=>run.pageErrors.push(e.message));
  await p.goto(BASE+'/#S04');await p.waitForSelector('.assignment-model .has-3d',{timeout:30000});
  await p.screenshot({path:dir+'/01-start.png'});
  check(await p.locator('.assignment-stage .drop-slots').count()===0,'separate lower drop slots remain');
  check(await p.locator('.property-choices').count()===0,'property choices shown before placement');
  const modelLabel=await p.locator('.assignment-model .design-model').getAttribute('aria-label');
  check(modelLabel.includes('관찰창 재료 미정')&&modelLabel.includes('모서리 보호대 재료 미정'),'unassigned parts reveal the default materials');
  check(await p.locator('.assignment-model [data-drop-slot]').count()===2,'picture has ambiguous extra markers');
  for(const id of ['window','bumper']){
   const box=await target(p,id).boundingBox();check(box&&box.width>=44&&box.height>=44,'picture target too small');
   check(box.x>=0&&box.y>=0&&box.x+box.width<=width&&box.y+box.height<=height,'target outside viewport');
  }
  check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow');
  run.checks.push('two labelled picture targets, no lower slots, both >=44px and inside viewport');
  // Drag to the window, then use the equivalent two taps for all six materials.
  const from=await token(p,'wood_raw').boundingBox(),to=await target(p,'window').boundingBox();
  await p.mouse.move(from.x+from.width/2,from.y+from.height/2);await p.mouse.down();
  await p.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:10});await p.mouse.up();await p.waitForTimeout(300);
  check((await p.locator('.selected-material').innerText()).includes(m.shortNames.wood_raw),'drag did not place material on picture');
  run.checks.push('pointer drag attaches directly to picture');
  // Turn the existing model to the front for edge inspection, leaving the same project asset in use.
  const canvas=p.locator('.assignment-model .object-model-3d canvas'),cb=await canvas.boundingBox();
  await p.mouse.move(cb.x+cb.width*.5,cb.y+cb.height*.1);await p.mouse.down();
  await p.mouse.move(cb.x+cb.width*.5+50,cb.y+cb.height*.1,{steps:8});await p.mouse.up();await p.waitForTimeout(250);
  for(const material of m.materials){
   await attach(p,material.id,'window');
   const selected=await p.locator('.selected-material').innerText();check(selected.includes(m.shortNames[material.id]),'wrong attached material');
   await p.screenshot({path:dir+'/window-'+material.id+'.png'});
   // Supplementary view of the actual rendered edges, temporarily hiding only the UI target outlines.
   const clear=await p.addStyleTag({content:'.assignment-model .object-hotspots{visibility:hidden!important}'});
   await canvas.screenshot({path:dir+'/edge-'+material.id+'.png'});await clear.evaluate(el=>el.remove());
   run.materials.push({id:material.id,selected,transparent:!!material.transparent});
  }
  await attach(p,'wood_raw','window');
  await p.locator('.property-choices .choice').filter({hasText:'빛이 통과한다'}).click();
  check((await saved(p)).checkpoints.assignments.length===0,'opaque wood was accepted as transparent');
  await p.locator('.assignment-feedback').waitFor();
  check((await p.locator('.activity-footer .next-step').innerText()).includes('재료를 고르고'),'wrong material did not guide retry');
  await p.screenshot({path:dir+'/02-wrong-material.png'});
  await attach(p,'glass_clear','window');
  await p.locator('.property-choices .choice').filter({hasText:'모양을 단단히 유지한다'}).click();
  check((await saved(p)).checkpoints.assignments.length===0,'wrong required property accepted');
  await p.locator('.property-choices .choice').filter({hasText:'빛이 통과한다'}).click();
  check((await saved(p)).checkpoints.assignmentMaterials.window==='glass_clear','accepted window material not saved');
  check(await target(p,'window').isDisabled(),'completed window remains editable');
  check(await target(p,'bumper').getAttribute('aria-pressed')==='true','next part not selected');
  check(await p.locator('.property-choices').count()===0,'property choices shown before a material is attached');
  await attach(p,'metal_plate','bumper');
  await p.locator('.property-choices .choice').filter({hasText:'눌렸다가 돌아온다'}).click();
  check((await saved(p)).checkpoints.assignments.length===1,'metal accepted as cushioning');
  // A material picked later cannot overwrite the completed window.
  await token(p,'wood_raw').click();await target(p,'window').click({force:true});
  check((await saved(p)).checkpoints.assignmentMaterials.window==='glass_clear','completed part overwritten');
  await token(p,'rubber_soft').click();await target(p,'bumper').click();
  await p.locator('.property-choices .choice').filter({hasText:'눌렸다가 돌아온다'}).click();
  check((await saved(p)).checkpoints.assignments.length===2,'both decisions not saved');
  check(await p.locator('.activity-footer>button').isEnabled(),'next request unavailable after completion');
  await p.screenshot({path:dir+'/03-complete.png'});
  await p.reload();await p.waitForSelector('.assignment-model .has-3d');
  check((await saved(p)).checkpoints.assignmentMaterials.window==='glass_clear','reload lost glass choice');
  check(await target(p,'window').isDisabled()&&await target(p,'bumper').isDisabled(),'reload lost completed targets');
  await p.screenshot({path:dir+'/04-resumed.png'});
  run.checks.push('all six window materials render; opaque/wrong-property retries keep design; valid glass and rubber decisions; completed part protected; chosen materials survive reload');
  check(run.pageErrors.length===0,'page errors: '+run.pageErrors.join());
  await context.close();
 }
 // A separate keyboard-only choice/place/property path.
 const context=await browser.newContext({viewport:{width:1024,height:768},serviceWorkers:'block'});
 await context.addInitScript(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key:KEY,s:fixture()});
 const p=await context.newPage();active=p;await p.goto(BASE+'/#S04');await p.waitForSelector('.assignment-model .has-3d');
 for(const [id,part,property] of [['plastic_clear','window','빛이 통과한다'],['rubber_soft','bumper','눌렸다가 돌아온다']]){
  await keyTo(p,token(p,id),'Enter');await keyTo(p,target(p,part),'Space');
  await keyTo(p,p.locator('.property-choices .choice').filter({hasText:property}),'Enter');
 }
 check((await saved(p)).checkpoints.assignments.length===2,'keyboard path did not complete');
 report.keyboard='1024x768: Tab, Enter/Space select material, attach on picture and decide both properties';
 await context.close();
 report.status='passed';
} catch(e){report.status='failed';report.errors.push(e.stack);if(active)await active.screenshot({path:OUT+'/failure.png'}).catch(()=>{});}
finally {writeFileSync(OUT+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();}
if(report.status!=='passed')process.exitCode=1;
