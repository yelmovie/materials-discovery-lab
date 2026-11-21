"""Real Chromium layout and interaction checks. Requires Python Playwright + Chrome.
Run against the Vite dev server: python tools/check-experience.py [base URL]
Updated 2026-11-19 for the current app: per-screen learning-rail numbers (maker screens add a step),
requests graded the moment a choice is tapped, 15-second concept films (autoplay, or the play button under reduced motion), the home 「시작 이야기 보기」 story,
and map stages opened with 「의뢰 이야기 보기」. Temporary files stay in .tmp/check-experience.
"""
import json,os,re,sys,tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
TMP=ROOT/'.tmp'/'check-experience';TMP.mkdir(parents=True,exist_ok=True)
for k in ('TMPDIR','TMP','TEMP'):os.environ[k]=str(TMP)
tempfile.tempdir=str(TMP)
BASE=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:5189').rstrip('/')
OUT=ROOT/'docs/reviews/upgrade-nine-20261107'
OUT.mkdir(parents=True,exist_ok=True)
PROFILES=[(1280,800),(1920,1080),(1024,768),(915,412),(830,580)]
STUDENT_KEY='material-workshop-mission.student.v1'
results=[];errors=[]
SCAN="""() => {
 const dialog=document.querySelector('dialog[open]'),root=dialog||document.querySelector('main');
 const rect=e=>e.getBoundingClientRect(),visible=e=>{const closed=e.closest('details:not([open])');if(closed&&!closed.querySelector('summary')?.contains(e))return false;if(e.closest('[hidden],[aria-hidden="true"]'))return false;return !!(e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none');};
 const controls=[...root.querySelectorAll('button,select,summary,input')].filter(visible).filter(e=>!e.matches('input[type=range]')||e.offsetWidth>0);
 const issues=[];
 for(const e of controls){const hit=e.matches('input[type=checkbox]')?e.closest('label')||e:e;const r=rect(hit);let clipped=false;for(let a=hit.parentElement;a&&a!==root;a=a.parentElement){const s=getComputedStyle(a),ar=rect(a);if(/auto|scroll|hidden/.test(s.overflowY)&& (r.bottom>ar.bottom+2||r.top<ar.top-2))clipped=true;if(/auto|scroll|hidden/.test(s.overflowX)&& (r.right>ar.right+2||r.left<ar.left-2))clipped=true;}
  if(clipped)continue;
  const label=(e.getAttribute('aria-label')||e.textContent||e.type).trim().slice(0,60);
  if(r.width<44||r.height<44)issues.push({kind:'target',label,w:Math.round(r.width),h:Math.round(r.height)});
  if(r.left< -2||r.right>innerWidth+2||r.top< -2||r.bottom>innerHeight+2)issues.push({kind:'viewport',label});
  const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(top&&!hit.contains(top)&&!top.contains(hit))issues.push({kind:'covered',label,by:top.className?.baseVal??top.className});
 }
 const d=dialog?rect(dialog):null;
 return {issues,documentOverflow:document.documentElement.scrollHeight>innerHeight+2||document.documentElement.scrollWidth>innerWidth+2,toolScroll:[...root.querySelectorAll('.tools')].map(e=>Math.max(0,e.scrollHeight-e.clientHeight)),modalCenterOffset:d?Math.round(Math.abs(d.y+d.height/2-innerHeight/2)):null};
}"""

def shot(page,name):
 page.screenshot(path=str(OUT/(name+'.jpg')),type='jpeg',quality=78)
 data=page.evaluate(SCAN);results.append({'name':name,**data});return data

def route(page,name):
 page.evaluate('(s)=>{location.hash=s}',name);page.wait_for_timeout(300)
 page.locator('main .loading').wait_for(state='hidden')

def close_dialog(page):
 page.locator('dialog[open]').get_by_role('button',name='패널 닫기',exact=True).click()
 page.locator('dialog[open]').wait_for(state='hidden')

def rail(page,word):
 """Learning-rail step by name; maker screens shift the numbers, so match the words only."""
 return page.locator('.learning-rail button',has=page.get_by_text(word)).or_(page.locator(f'.learning-rail button[aria-label*="{word}"]')).first

def demo(page,reset=False):
 """Teacher demo (all stages open, never touches the student save). reset=True turns it off and on to start a clean demo save."""
 page.get_by_role('button',name='설정',exact=True).click()
 page.get_by_text('교사용 가이드',exact=True).click();page.get_by_text('교사용 도구',exact=True).click()
 unlock=page.get_by_role('button',name='관리자 전체 해금',exact=True)
 if reset or unlock.get_attribute('aria-pressed')!='true':unlock.click()
 if reset:unlock.click()
 page.get_by_role('button',name='닫기',exact=True).click()

def solve(page,item,drag=False):
 page.wait_for_function('t=>document.querySelector("#challenge-title")?.innerText===t',arg=item['title'],timeout=10000)
 labels={o['id']:o['label'] for o in item['options']}
 if item['mode']=='classify':
  for answer in item['answer']:
   tid,gid=answer.split(':')
   source=page.locator('.challenge-classify .drag-token',has_text=labels[tid]).first
   target=page.locator(f'.challenge-classify [data-drop-slot="{gid}"]').first
   if drag:
    a=source.bounding_box();b=target.bounding_box();page.mouse.move(a['x']+a['width']/2,a['y']+a['height']/2);page.mouse.down();page.mouse.move(b['x']+b['width']/2,b['y']+b['height']/2,steps=8);page.mouse.up()
   else:source.click();target.click()
 else:
  for answer in item['answer']:
   page.locator('.challenge-options .choice',has_text=labels[answer]).first.click()
 page.wait_for_selector('.challenge-feedback.success',timeout=5000)

def concept_done(page):
 """Footer 「개념 보고…」 → film plays by itself → leave once the action button unlocks."""
 page.locator('.activity-footer .primary').click()
 page.locator('dialog[open] video').wait_for()
 try:page.wait_for_function("document.querySelector('dialog[open] video')?.currentTime>0.3",timeout=3000)
 except Exception:page.locator('.concept-actions .concept-play').click();page.wait_for_function("document.querySelector('dialog[open] video')?.currentTime>0.3",timeout=15000)  # reduced motion: no autoplay
 assert page.locator('dialog[open] video').evaluate('(v)=>Math.abs(v.duration-15)<0.2'),'concept film should be 15s'
 page.wait_for_function('()=>{const b=document.querySelector(".concept-actions .primary");return b&&!b.disabled}',timeout=30000)
 page.locator('.concept-actions .primary').click()

with sync_playwright() as p:
 browser=p.chromium.launch(channel='chrome',headless=True,args=['--renderer-process-limit=2','--autoplay-policy=no-user-gesture-required','--mute-audio'])
 page=browser.new_page(viewport={'width':1280,'height':800},reduced_motion='reduce')
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE,wait_until='networkidle')
 page.get_by_role('button',name='설정',exact=True).click()
 page.get_by_role('switch',name='움직임 줄이기').check();page.get_by_role('button',name='닫기',exact=True).click()
 demo(page)
 challenges=page.evaluate("async()=> (await import('/src/domain/challenges.ts')).challenges")
 for width,height in PROFILES:
  if results:demo(page,reset=True)
  page.set_viewport_size({'width':width,'height':height})
  for i in range(1,11):
   screen=f'S{i:02}';route(page,screen);shot(page,f'{width}-{screen}-lab')
   if page.locator('.learning-rail button[aria-label*="주문 제작"]').count():
    rail(page,'주문 제작').click();page.wait_for_timeout(300);shot(page,f'{width}-{screen}-maker')
   rail(page,'새 의뢰').click();shot(page,f'{width}-{screen}-challenge-a')
   solve(page,next(c for c in challenges if c['screen']==screen));shot(page,f'{width}-{screen}-challenge-solved')
   rail(page,'개념 보기').click()
   page.locator('dialog[open] video').wait_for()
   shot(page,f'{width}-{screen}-concept')
   assert page.locator('dialog[open]').evaluate('(e)=>Math.abs(e.getBoundingClientRect().y+e.getBoundingClientRect().height/2-innerHeight/2)<3')
   close_dialog(page)
  page.get_by_role('button',name='설정',exact=True).click();shot(page,f'{width}-settings');page.get_by_role('button',name='닫기',exact=True).click()
  for phase in ['report','core','ending','certificate']:
   route(page,'S10/'+phase);page.wait_for_timeout(400);shot(page,f'{width}-{phase}')
  route(page,'world');page.wait_for_timeout(1500);shot(page,f'{width}-world')
  route(page,'home');shot(page,f'{width}-home')
  page.get_by_role('button',name='설정',exact=True).click();page.get_by_role('button',name='공방을 깨우는 이유 다시 보기').click()
  for story in range(3):
   page.locator('dialog[open]').wait_for();page.wait_for_timeout(250);shot(page,f'{width}-story-{story+1}')
   if story<2:page.get_by_role('button',name=re.compile('이야기 더 듣기')).click()
  close_dialog(page)
  page.get_by_role('button',name='설정',exact=True).click();page.get_by_role('button',name='나의 연구 수첩 펼치기').click();shot(page,f'{width}-notebook');close_dialog(page)
  page.get_by_role('button',name='설정',exact=True).click();page.get_by_role('button',name='연구 기록 초기화',exact=True).click();shot(page,f'{width}-reset');page.get_by_role('button',name='취소',exact=True).click();page.get_by_role('button',name='닫기',exact=True).click()
  route(page,'world');page.wait_for_timeout(1500)
  for i in range(5):
   page.locator('.map-label').nth(i).dispatch_event('click');page.wait_for_timeout(400)
   page.get_by_role('button',name='의뢰 이야기 보기').click()
   page.locator('dialog[open].modal-mission').wait_for();page.wait_for_timeout(250);shot(page,f'{width}-mission-{i+1}');close_dialog(page)
 demo(page,reset=True)
 # Solve all 20 transfer tasks through actual controls (classify by real pointer drag), then the 15-second concept film.
 page.set_viewport_size({'width':1280,'height':800})
 for i in range(1,11):
  screen=f'S{i:02}';route(page,screen);rail(page,'새 의뢰').click()
  for item in [c for c in challenges if c['screen']==screen]:
   solve(page,item,drag=item['mode']=='classify')
   if page.locator('.activity-footer .primary',has_text='다음 의뢰').count():page.locator('.activity-footer .primary').click()
  page.wait_for_function('()=>{const b=document.querySelector(".activity-footer .primary");return b&&!b.disabled&&b.innerText.includes("개념 보고")}',timeout=8000)
  concept_done(page)
  if page.locator('dialog[open]').count():
   shot(page,f'reward-{screen}');reward=page.get_by_role('button',name=re.compile('불이 켜진 공방'))
   if reward.count():reward.click()
   else:close_dialog(page)
 # Small, real-pointer manipulation checks.
 route(page,'S05');page.wait_for_timeout(500);block=page.locator('.wood-block');vessel=page.locator('.lab-vessel').first
 before=block.get_attribute('style')
 a=block.bounding_box();b=vessel.bounding_box();page.mouse.move(a['x']+a['width']/2,a['y']+a['height']/2);page.mouse.down();page.mouse.move(b['x']+b['width']/2,b['y']+b['height']*.7,steps=10);page.mouse.up();page.wait_for_timeout(400)
 assert block.get_attribute('style')!=before,'S05 wood block should move with the pointer'
 route(page,'S09');page.wait_for_timeout(500);before=page.locator('.design-model').inner_html();page.get_by_role('button',name='코팅하지 않은 나무',exact=True).click();page.get_by_role('button',name=re.compile('몸체:.*에 놓기')).click();page.wait_for_timeout(300);assert page.locator('.design-model').inner_html()!=before
 # No teacher completion may leak into the student save.
 assert page.evaluate(f"(JSON.parse(localStorage.getItem('{STUDENT_KEY}')||'{{}}').completedScreens||[]).length")==0
 browser.close()

report={'profiles':PROFILES,'screens':len(results),'pageErrors':errors,'checks':results}
(OUT/'layout-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'screens':len(results),'pageErrors':errors,'layoutIssues':sum(len(r['issues']) for r in results),'overflows':[r['name'] for r in results if r['documentOverflow']]},ensure_ascii=True))
assert not errors
assert not any(r['issues'] or r['documentOverflow'] for r in results)
