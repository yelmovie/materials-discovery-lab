"""Real Chromium layout and interaction checks. Requires Python Playwright + Chrome.
Run against the Vite dev server: python tools/check-experience.py [base URL]
"""
import json,os,re,sys
from pathlib import Path
from playwright.sync_api import sync_playwright

os.environ.setdefault('TEMP','D:/DevTemp');os.environ.setdefault('TMP','D:/DevTemp')
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:5189'
OUT=Path(__file__).resolve().parents[1]/'docs/reviews/upgrade-nine-20261107'
OUT.mkdir(parents=True,exist_ok=True)
PROFILES=[(1280,800),(1920,1080),(1024,768),(915,412),(830,580)]
results=[];errors=[]
SCAN="""() => {
 const dialog=document.querySelector('dialog[open]'),root=dialog||document.querySelector('main');
 const rect=e=>e.getBoundingClientRect(),visible=e=>{const closed=e.closest('details:not([open])');if(closed&&!closed.querySelector('summary')?.contains(e))return false;return !!(e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden');};
 const controls=[...root.querySelectorAll('button,select,summary,input')].filter(visible);
 const issues=[];
 for(const e of controls){const hit=e.matches('input[type=checkbox]')?e.closest('label')||e:e;const r=rect(hit);let clipped=false;for(let a=hit.parentElement;a&&a!==root;a=a.parentElement){const s=getComputedStyle(a),ar=rect(a);if(/auto|scroll|hidden/.test(s.overflowY)&& (r.bottom>ar.bottom+2||r.top<ar.top-2))clipped=true;}
  if(clipped)continue;
  const label=(e.getAttribute('aria-label')||e.textContent||e.type).trim().slice(0,60);
  if(r.width<47||r.height<47)issues.push({kind:'target',label,w:Math.round(r.width),h:Math.round(r.height)});
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
 page.evaluate('(s)=>{location.hash=s}',name);page.wait_for_timeout(260)
 page.locator('main .loading').wait_for(state='hidden')

def solve(page,item,drag=False):
 if item['mode']=='classify':
  for answer in item['answer']:
   tid,gid=answer.split(':');token=next(o for o in item['options'] if o['id']==tid);group=next(g for g in item['groups'] if g['id']==gid)
   source=page.locator('.drag-token').filter(has=page.get_by_text(token['label'],exact=True))
   if not source.count():source=page.get_by_role('button',name=token['label'],exact=True)
   target=page.locator('.drop-slot').filter(has=page.get_by_text(group['label'],exact=True))
   if drag:
    a=source.bounding_box();b=target.bounding_box();page.mouse.move(a['x']+a['width']/2,a['y']+a['height']/2);page.mouse.down();page.mouse.move(b['x']+b['width']/2,b['y']+b['height']/2,steps=8);page.mouse.up()
   else:source.click();target.click()
 else:
  for answer in item['answer']:
   label=next(o['label'] for o in item['options'] if o['id']==answer)
   page.locator('.challenge-options .choice').filter(has=page.get_by_text(label,exact=True)).click()
 page.locator('.activity-footer>.primary').click()
 assert 'success' in page.locator('.challenge-feedback').get_attribute('class'),item['id']
 if item['id'].endswith('-a'):page.locator('.activity-footer>.primary').click()

with sync_playwright() as p:
 browser=p.chromium.launch(channel='chrome',headless=True,args=['--renderer-process-limit=2'])
 page=browser.new_page(viewport={'width':1280,'height':800},reduced_motion='reduce')
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE,wait_until='networkidle')
 page.get_by_role('button',name='설정',exact=True).click()
 page.get_by_role('switch',name='움직임 줄이기').check();page.get_by_text('교사용 가이드',exact=True).click();page.get_by_text('교사용 도구',exact=True).click()
 page.get_by_role('button',name='관리자 전체 해금').click();page.get_by_role('button',name='닫기',exact=True).click()
 challenges=page.evaluate("async()=> (await import('/src/domain/challenges.ts')).challenges")
 for width,height in PROFILES:
  if results:
   page.get_by_role('button',name='설정',exact=True).click();page.get_by_text('교사용 가이드',exact=True).click();page.get_by_text('교사용 도구',exact=True).click();page.get_by_role('button',name='관리자 전체 해금').click();page.get_by_role('button',name='관리자 전체 해금').click();page.get_by_role('button',name='닫기',exact=True).click()
  page.set_viewport_size({'width':width,'height':height})
  for i in range(1,11):
   screen=f'S{i:02}';route(page,screen);shot(page,f'{width}-{screen}-lab')
   page.get_by_role('button',name=re.compile('2 새 의뢰')).click();shot(page,f'{width}-{screen}-challenge-a')
   solve(page,next(c for c in challenges if c['id']==screen+'-a'));shot(page,f'{width}-{screen}-challenge-b')
   page.get_by_role('button',name=re.compile('3 15초 개념')).click()
   page.get_by_role('button',name='15초 개념 영상 보기').wait_for()
   shot(page,f'{width}-{screen}-concept')
   assert page.locator('dialog').evaluate('(e)=>Math.abs(e.getBoundingClientRect().y+e.getBoundingClientRect().height/2-innerHeight/2)<3')
   page.get_by_role('button',name='패널 닫기').click()
  page.get_by_role('button',name='설정',exact=True).click();shot(page,f'{width}-settings');page.get_by_role('button',name='닫기',exact=True).click()
  for phase in ['report','core','ending','certificate']:
   route(page,'S10/'+phase);shot(page,f'{width}-{phase}')
  route(page,'world');page.wait_for_timeout(700);shot(page,f'{width}-world')
  route(page,'home');shot(page,f'{width}-home')
  page.get_by_role('button',name='공방으로 출발!').click()
  for story in range(3):
   shot(page,f'{width}-story-{story+1}')
   if story<2:page.get_by_role('button',name='이야기 계속 듣기').click()
  page.get_by_role('button',name='패널 닫기').click()
  page.get_by_role('button',name='설정',exact=True).click();page.get_by_role('button',name='나의 연구 수첩 펼치기').click();shot(page,f'{width}-notebook');page.get_by_role('button',name='패널 닫기').click()
  page.get_by_role('button',name='설정',exact=True).click();page.get_by_role('button',name='연구 기록 초기화',exact=True).click();shot(page,f'{width}-reset');page.get_by_role('button',name='취소',exact=True).click();page.get_by_role('button',name='닫기',exact=True).click()
  route(page,'world')
  for i,name in enumerate(['재료 감정실','성질 시험실','상태 실험실','공기 추적실','발명 제작소']):
   page.locator('.map-label').nth(i).dispatch_event('click');page.get_by_role('button',name=name+' 들어가기').click();shot(page,f'{width}-mission-{i+1}');page.get_by_role('button',name='패널 닫기').click()
 page.get_by_role('button',name='설정',exact=True).click();page.get_by_text('교사용 가이드',exact=True).click();page.get_by_text('교사용 도구',exact=True).click();page.get_by_role('button',name='관리자 전체 해금').click();page.get_by_role('button',name='관리자 전체 해금').click();page.get_by_role('button',name='닫기',exact=True).click()
 # Solve all 20 transfer tasks through actual controls, including pointer capture classification.
 page.set_viewport_size({'width':1280,'height':800})
 for i in range(1,11):
  screen=f'S{i:02}';route(page,screen);page.get_by_role('button',name=re.compile('2 새 의뢰')).click()
  for item in [c for c in challenges if c['screen']==screen]:solve(page,item,drag=item['mode']=='classify')
  page.locator('.activity-footer>.primary').click();assert page.locator('dialog video').count()==1
  page.get_by_role('button',name='15초 개념 영상 보기').click();page.wait_for_function("document.querySelector('video').currentTime>0.3")
  assert page.locator('video').evaluate('(v)=>Math.abs(v.duration-9)<0.1')
  page.get_by_role('button',name=re.compile('건너뛰고')).click()
  if i%2==0:
   assert page.locator('.modal-reward').count()==1;shot(page,f'reward-{screen}');page.get_by_role('button',name='패널 닫기').click()
 # Small, real-pointer manipulation checks.
 route(page,'S05');block=page.locator('.wood-block');vessel=page.locator('.lab-vessel').first
 a=block.bounding_box();b=vessel.bounding_box();page.mouse.move(a['x']+a['width']/2,a['y']+a['height']/2);page.mouse.down();page.mouse.move(b['x']+b['width']/2,b['y']+b['height']*.7,steps=10);page.mouse.up()
 assert '20%' in block.get_attribute('style')
 route(page,'S09');before=page.locator('.design-model').inner_html();page.get_by_role('button',name='코팅하지 않은 나무',exact=True).click();page.get_by_role('button',name=re.compile('몸체:.*에 놓기')).click();assert page.locator('.design-model').inner_html()!=before
 # No teacher completion may leak into the student save.
 assert page.evaluate("JSON.parse(localStorage.getItem('material-workshop-mission.student.v1')).completedScreens.length")==0
 browser.close()

report={'profiles':PROFILES,'screens':len(results),'pageErrors':errors,'checks':results}
(OUT/'layout-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'screens':len(results),'pageErrors':errors,'layoutIssues':sum(len(r['issues']) for r in results),'overflows':[r['name'] for r in results if r['documentOverflow']]},ensure_ascii=True))
assert not errors
assert not any(r['issues'] or r['documentOverflow'] for r in results)
