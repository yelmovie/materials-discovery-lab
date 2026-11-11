"""Check the production service worker, media ranges, autoplay and audio lifecycle."""
import json,os,re,sys,tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
RUNTIME=ROOT/'.tmp/offline-media';RUNTIME.mkdir(parents=True,exist_ok=True)
for key in ('TMPDIR','TEMP','TMP'):os.environ[key]=str(RUNTIME)
tempfile.tempdir=str(RUNTIME)
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:5194'
OUT=Path(os.environ.get('QA_OUTPUT',ROOT/'docs/reviews/experience'));OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(channel='chrome',headless=True,args=['--renderer-process-limit=2'])
 c=b.new_context(viewport={'width':1280,'height':800});page=c.new_page();errors=[]
 page.set_default_timeout(30000)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script("""window.__gains=[];window.__effects=[];const gain=AudioContext.prototype.createGain;AudioContext.prototype.createGain=function(){const v=gain.call(this);window.__gains.push(v);return v;};const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){if(this instanceof HTMLAudioElement&&!window.__effects.includes(this))window.__effects.push(this);return play.call(this);};""")
 page.goto(BASE,wait_until='networkidle',timeout=60000);page.wait_for_function('!!navigator.serviceWorker.controller')
 cache=page.evaluate("async()=>{const keys=await caches.keys();const cache=await caches.open(keys.find(k=>k.startsWith('material-workshop-offline-')));const req=await cache.keys();return {count:req.length,media:req.filter(r=>/\\.(webm|mp4|mp3|m4a)$/.test(r.url)).length}}")
 assert cache['media']==29
 page.locator('.hero-copy h1').click();page.wait_for_function('window.__gains.length>0&&window.__gains[0].gain.value>0')
 page.get_by_role('button',name='소리 끄기',exact=True).click();page.wait_for_function('window.__gains[0].gain.value===0')
 page.get_by_role('button',name='소리 켜기',exact=True).click();page.wait_for_function('window.__gains[0].gain.value>0')
 page.get_by_role('button',name='홈',exact=True).click();page.wait_for_function('window.__effects.length>0')
 page.get_by_role('button',name='설정',exact=True).click();page.get_by_text('교사용 가이드',exact=True).click();page.get_by_text('교사용 도구',exact=True).click();page.get_by_role('button',name='관리자 전체 해금').click();page.get_by_role('button',name='닫기',exact=True).click()
 page.evaluate("location.hash='S01'");page.get_by_role('button',name=re.compile('3 15초 개념')).click()
 page.wait_for_function("document.querySelector('video').currentTime>.2")
 assert page.evaluate('window.__gains[0].gain.value===0&&window.__effects.every(a=>a.paused)')
 page.wait_for_function("document.querySelector('video').ended",timeout=20000)
 assert page.locator('.concept-actions .primary').evaluate('(e)=>e===document.activeElement')
 page.get_by_role('button',name='패널 닫기').click();page.wait_for_function('window.__gains[0].gain.value>0')
 c.set_offline(True)
 ranges=page.evaluate("""async()=>{const results=[];for(const range of ['bytes=0-1023','bytes=1024-2047','bytes=-16','bytes=999999999-']){const r=await fetch('/assets/concepts/S06.mp4',{headers:{Range:range}});results.push({range,status:r.status,bytes:(await r.arrayBuffer()).byteLength,contentRange:r.headers.get('Content-Range')});}return results;}""")
 assert [r['status'] for r in ranges]==[206,206,206,416]
 assert [r['bytes'] for r in ranges[:3]]==[1024,1024,16]
 audio=page.evaluate("async()=>{const r=await fetch('/assets/audio/success.mp3');return {status:r.status,bytes:(await r.arrayBuffer()).byteLength}}")
 assert audio['status']==200 and audio['bytes']>0
 voice=page.evaluate("async()=>{const r=await fetch('/assets/audio/npc-welcome.m4a');return {status:r.status,bytes:(await r.arrayBuffer()).byteLength}}")
 assert voice['status']==200 and voice['bytes']>0
 illustrations=page.evaluate("""async()=>{const results=[];for(const id of ['lab-glass','wood-block','air-pump','air-pouch-flat','air-pouch-inflated']){const r=await fetch('/assets/generated/'+id+'.webp');results.push({id,status:r.status,bytes:(await r.arrayBuffer()).byteLength});}return results;}""")
 assert all(item['status']==200 and item['bytes']>0 for item in illustrations)
 for screen in ['S06','S05','S10']:
  page.evaluate('(screen)=>{location.hash=screen}',screen)
  page.get_by_role('button',name=re.compile('3 15초 개념')).click()
  page.wait_for_function("document.querySelector('video').currentTime>.2")
  page.screenshot(path=str(OUT/('offline-concept-'+screen+'.jpg')),type='jpeg',quality=80)
  page.get_by_role('button',name='패널 닫기').click()
 page.reload(wait_until='networkidle');page.get_by_role('button',name='공방으로 출발!').wait_for()
 report={'cache':cache,'normalAutoplay':True,'endFocus':True,'bgmQuietDuringVideo':True,'muteSwitch':True,'rangeResponses':ranges,'offlineAudio':audio,'offlineVoice':voice,'offlineVideoPlayback':True,'offlineConcepts':['S06','S05','S10'],'offlineNewIllustrations':illustrations,'offlineReload':True,'pageErrors':errors}
 (OUT/'offline-media-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report));assert not errors
 b.close()
