// 초기 로딩 실측 + 개념영상 10편 재생 확인 (headless Chromium, 학생 저장값 없음).
// 실행: PLAYWRIGHT_MODULE_PATH=<playwright 모듈 경로> node tools/check-concept-load.mjs http://127.0.0.1:5118 [출력.json]
// 브라우저 프로필·캐시는 TMPDIR 아래에만 만든다.
import {createRequire} from 'node:module';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const BASE=(process.argv[2]||'http://127.0.0.1:5118').replace(/\/$/,'');
const OUT=process.argv[3];
const tmp=mkdtempSync(join(process.env.TMPDIR||'.','concept-load-'));
const screens=Array.from({length:10},(_,i)=>`S${String(i+1).padStart(2,'0')}`);
const report={base:BASE,load:[],concepts:[],reduced:null,errors:[]};

async function measureLoad(label,throttle){
 const ctx=await chromium.launchPersistentContext(join(tmp,'load-'+label),{channel:process.env.QA_CHANNEL||'chrome',headless:true,viewport:{width:1280,height:800},args:['--disable-background-networking']});
 const page=ctx.pages()[0]||await ctx.newPage();
 const cdp=await ctx.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 if(throttle)await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:throttle.latency,downloadThroughput:throttle.down,uploadThroughput:throttle.up});
 let bytes=0;const hosts=new Set();cdp.on('Network.loadingFinished',e=>{bytes+=e.encodedDataLength;});cdp.on('Network.requestWillBeSent',e=>{try{hosts.add(new URL(e.request.url).host);}catch{}});
 const t0=Date.now();await page.goto(BASE+'/',{waitUntil:'domcontentloaded'});
 const start=page.getByRole('button',{name:/시작|출발|이어/}).first();await start.waitFor({state:'visible',timeout:60000});const interactive=Date.now()-t0;
 await page.waitForLoadState('networkidle').catch(()=>{});
 const fcp=await page.evaluate(()=>performance.getEntriesByName('first-contentful-paint')[0]?.startTime??null);
 const loading=await page.evaluate(()=>!!document.querySelector('.loading,.boot,[aria-busy=true]'));
 report.load.push({label,throttle:throttle||null,firstContentfulPaintMs:fcp&&Math.round(fcp),startButtonVisibleMs:interactive,transferredBytes:bytes,hosts:[...hosts],loadingIndicatorStillVisible:loading});
 await ctx.close();
}

async function concepts(){
 const ctx=await chromium.launchPersistentContext(join(tmp,'concept'),{channel:process.env.QA_CHANNEL||'chrome',headless:true,viewport:{width:1280,height:800},args:['--autoplay-policy=no-user-gesture-required']});
 const page=ctx.pages()[0]||await ctx.newPage();page.on('pageerror',e=>report.errors.push(String(e)));
 await page.goto(BASE+'/',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'설정',exact:true}).click();await page.getByText('교사용 가이드',{exact:true}).click();await page.getByText('교사용 도구',{exact:true}).click();
 await page.getByRole('button',{name:'관리자 전체 해금',exact:true}).click();await page.getByRole('button',{name:'닫기',exact:true}).click();
 for(const s of screens){
  await page.evaluate(x=>{location.hash=x;},s);await page.locator('.activity-grid').waitFor();
  await page.getByRole('button',{name:/^3 .*개념 보기$/}).click();
  const v=page.locator('dialog[open] video');await v.waitFor();
  await page.waitForFunction(()=>{const e=document.querySelector('dialog[open] video');return e&&e.readyState>=3&&e.currentTime>0.3;},null,{timeout:20000}).catch(()=>{});
  const info=await v.evaluate(e=>({src:e.currentSrc.split('/').pop(),poster:e.poster.split('/').pop(),duration:e.duration,readyState:e.readyState,currentTime:e.currentTime,width:e.videoWidth,height:e.videoHeight,paused:e.paused}));
  const posterOk=await page.evaluate(async p=>{const r=await fetch(p);return r.ok&&(r.headers.get('content-type')||'').includes('image');},'/assets/concepts/'+s+'.webp');
  // 장면 버튼으로 마지막 장면 이동 → 자막이 3/3 으로 바뀌는가
  const chapters=page.locator('.concept-chapters button');await chapters.nth(2).click();await page.waitForTimeout(250);
  const third=await page.locator('.concept-caption span').textContent();
  const seekTime=await v.evaluate(e=>e.currentTime);
  await page.keyboard.press('Escape');await page.locator('dialog[open].concept-dialog').waitFor({state:'detached'}).catch(()=>{});
  const closed=await page.locator('dialog[open].concept-dialog').count()===0;
  report.concepts.push({screen:s,...info,posterOk,thirdChapterLabel:third,thirdChapterSeek:Math.round(seekTime*100)/100,escCloses:closed});
 }
 await ctx.close();
}

async function reducedCheck(){
 const ctx=await chromium.launchPersistentContext(join(tmp,'reduced'),{channel:process.env.QA_CHANNEL||'chrome',headless:true,viewport:{width:1024,height:768},reducedMotion:'reduce'});
 const page=ctx.pages()[0]||await ctx.newPage();
 await page.goto(BASE+'/',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'설정',exact:true}).click();await page.getByText('교사용 가이드',{exact:true}).click();await page.getByText('교사용 도구',{exact:true}).click();
 await page.getByRole('button',{name:'관리자 전체 해금',exact:true}).click();await page.getByRole('button',{name:'닫기',exact:true}).click();
 await page.evaluate(()=>{location.hash='S07';});await page.locator('.activity-grid').waitFor();
 await page.getByRole('button',{name:/^3 .*개념 보기$/}).click();await page.waitForTimeout(1500);
 report.reduced=await page.locator('dialog[open] video').evaluate(e=>({paused:e.paused,currentTime:e.currentTime,poster:e.poster.split('/').pop()}));
 report.reduced.playButton=await page.locator('dialog[open] .concept-play').count();
 await ctx.close();
}

// 학생 저장(시연 아님): S01 안에서 새로고침하면 같은 활동으로 돌아오는가(B14), 잠긴 S07 주소로 직접 들어가면 막히는가(F15)
async function resumeCheck(){
 const ctx=await chromium.launchPersistentContext(join(tmp,'resume'),{channel:process.env.QA_CHANNEL||'chrome',headless:true,viewport:{width:1280,height:800}});
 const page=ctx.pages()[0]||await ctx.newPage();
 await page.goto(BASE+'/#S01',{waitUntil:'networkidle'});await page.locator('.activity-grid').waitFor({timeout:15000}).catch(()=>{});
 const before=await page.evaluate(()=>({hash:location.hash,activity:!!document.querySelector('.activity-grid')}));
 await page.reload({waitUntil:'networkidle'});await page.waitForTimeout(800);
 const after=await page.evaluate(()=>({hash:location.hash,activity:!!document.querySelector('.activity-grid'),heading:document.querySelector('.activity-heading h1')?.textContent||null,save:JSON.parse(localStorage.getItem('material-workshop-mission.student.v1')||'null')?.lastRoute??null}));
 await page.evaluate(()=>{location.hash='S07';});await page.waitForTimeout(800);
 const locked=await page.evaluate(()=>({hash:location.hash,activityHeading:document.querySelector('.activity-heading h1')?.textContent||null}));
 report.resume={before,after,lockedS07:locked};
 await ctx.close();
}

await resumeCheck();
await measureLoad('local-unthrottled');
await measureLoad('school-wifi-10mbps',{latency:40,down:10*1024*1024/8,up:5*1024*1024/8});
await concepts();
await reducedCheck();
const text=JSON.stringify(report,null,1);if(OUT)writeFileSync(OUT,text+'\n');console.log(text);
const bad=report.concepts.filter(c=>!(c.readyState>=3&&c.duration>0&&c.posterOk&&c.escCloses));
if(report.errors.length||bad.length){console.error('FAIL',bad.map(b=>b.screen),report.errors);process.exit(1);}
