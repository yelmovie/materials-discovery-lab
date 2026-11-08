"""Exercise every lab through student UI, real pointer drags and the saved reducer."""
import json,os,re,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
os.environ.setdefault('TEMP','D:/DevTemp');os.environ.setdefault('TMP','D:/DevTemp')
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:5189'
OUT=Path(os.environ.get('QA_OUTPUT',Path(__file__).resolve().parents[1]/'docs/reviews/upgrade-nine-20261107'));OUT.mkdir(parents=True,exist_ok=True)
events=[];errors=[]

def drag(page,source,target,relative_y=.5):
 source.scroll_into_view_if_needed();target.scroll_into_view_if_needed();a=source.bounding_box();b=target.bounding_box()
 page.mouse.move(a['x']+a['width']/2,a['y']+a['height']/2);page.mouse.down();page.mouse.move(b['x']+b['width']/2,b['y']+b['height']*relative_y,steps=12);page.mouse.up()

def solve(page,screen):
 page.locator('.activity-footer>.primary').click()
 for task in [c for c in challenges if c['screen']==screen]:
  if task['mode']=='classify':
   for ans in task['answer']:
    t,g=ans.split(':');token=next(o['label'] for o in task['options'] if o['id']==t);group=next(o['label'] for o in task['groups'] if o['id']==g)
    source=page.locator('.challenge-classify .drag-token').filter(has_text=re.compile('^'+re.escape(token)+'$'))
    target=page.locator('.challenge-classify .drop-slot').filter(has=page.get_by_text(group,exact=True));drag(page,source,target)
  else:
   for ans in task['answer']:
    label=next(o['label'] for o in task['options'] if o['id']==ans)
    page.locator('.challenge-options .choice').filter(has=page.get_by_text(label,exact=True)).click()
  page.locator('.activity-footer>.primary').click();page.locator('.challenge-feedback.success').wait_for()
  if task['id'].endswith('-a'):page.locator('.activity-footer>.primary').click()

def finish(page,screen,failure=False):
 solve(page,screen)
 if failure:page.route('**/assets/concepts/S02.*',lambda route:route.abort())
 page.locator('.activity-footer>.primary').click();page.locator('dialog video').wait_for()
 if failure:page.locator('.concept-fallback').wait_for();events.append('Video failure keeps captions and continuation available')
 else:
  page.get_by_role('button',name='9초 개념 영상 보기').click();page.wait_for_function("document.querySelector('video').currentTime>.2")
  if screen=='S01':
   page.get_by_role('button',name='개념 영상 일시 정지').click();t=page.locator('video').evaluate('(v)=>v.currentTime');page.get_by_role('button',name='이어서 보기').click();page.wait_for_function('(t)=>document.querySelector("video").currentTime>t+.1',arg=t);events.append('Video pause/resume preserves time')
 page.locator('.concept-actions .primary').click()
 if failure:page.unroute('**/assets/concepts/S02.*')
 if int(screen[1:])%2==0:page.get_by_role('button',name='불이 켜진 공방 보러 가기').click()
 events.append(screen+' lab + 2 transfer tasks + concept + continuation');print(screen+' OK',flush=True)
 page.wait_for_timeout(80)

with sync_playwright() as p:
 browser=p.chromium.launch(channel='chrome',headless=True,args=['--renderer-process-limit=2'])
 width,height=map(int,os.environ.get('QA_VIEWPORT','1280x800').split('x'))
 page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/#S01',wait_until='networkidle')
 challenges=page.evaluate("async()=> (await import('/src/domain/challenges.ts')).challenges")
 lab=page.evaluate("async()=>{const m=await import('/src/domain/model.ts');return {experiments:m.experiments,comparisons:m.requiredComparisons,names:m.shortNames,results:Object.fromEntries(m.experiments.map(e=>[e,Object.fromEntries(m.materials.map(s=>[s.id,m.resultFor(e,s.id)]))]))}}")
 # Magnifier + direct part recording.
 for i in range(3):page.locator('.part-pills button').nth(i).click();page.get_by_role('button',name='이 부분 기록하기',exact=True).click()
 finish(page,'S01')
 for material,part in [('천','canopy'),('금속','frame'),('나무','handle')]:
  names={'canopy':'우산 천','frame':'금속 살','handle':'손잡이'}
  drag(page,page.locator('.drag-token').filter(has_text=re.compile('^'+material+'$')),page.locator('.drop-slot').filter(has=page.get_by_text(names[part],exact=True)))
  page.get_by_role('combobox',name='연결할 관찰 기록').select_option(part);page.get_by_role('button',name='근거와 함께 연결').click()
 finish(page,'S02',failure=True)
 page.evaluate("location.hash='S03'");page.locator('.experiment-tabs').wait_for()
 def observe(experiment,sample):
  page.locator('.sample-grid .choice').filter(has_text=lab['names'][sample]).click();page.locator('.experiment-trigger').click()
  expected=lab['results'][experiment][sample]
  page.locator('.tools .stack .choice').filter(has_text=expected).click();page.get_by_role('button',name='관찰 기록하기',exact=True).click()
  page.get_by_role('button',name='다른 시료와 비교').click()
 for i,experiment in enumerate(lab['experiments']):
  page.locator('.experiment-tabs button').nth(i).click()
  for sample in lab['comparisons'][experiment]:observe(experiment,sample)
 finish(page,'S03')
 for sample,part,prop in [('glass_clear','관찰창','transparent'),('rubber_soft','모서리 보호대','cushioning')]:
  source=page.locator('.drag-token').filter(has_text=lab['names'][sample]);target=page.locator('.drop-slot').filter(has=page.get_by_text(part,exact=True));drag(page,source,target)
  page.get_by_role('combobox',name='필요한 성질').select_option(prop);page.get_by_role('combobox',name='내가 기록한 관찰').select_option(index=1);page.get_by_role('button',name='이 재료로 의뢰 해결').click()
 finish(page,'S04')
 page.evaluate("location.hash='S05'");page.get_by_role('button',name='용기에 맞춰 달라질 것 같아',exact=True).click()
 for i in range(3):drag(page,page.locator('.wood-block'),page.locator('.lab-vessel').nth(i),.7)
 page.get_by_role('button',name='나무토막의 모양과 크기는 그대로야.',exact=True).click();finish(page,'S05')
 page.get_by_role('button',name='모양과 양이 모두 달라질 것 같아',exact=True).click();page.get_by_role('slider',name='붓기 기울기').press('End')
 for step in range(3):
  b=page.get_by_role('button',name='누르는 동안 붓기').bounding_box();page.mouse.move(b['x']+b['width']/2,b['y']+b['height']/2);page.mouse.down();page.wait_for_timeout(1250);page.mouse.up()
 page.get_by_role('button',name='용기에 따라 모양은 바뀌지만, 돌아온 물의 양은 같아.',exact=True).click();page.get_by_role('button',name='모래알 확대 관찰하기').click();page.get_by_role('button',name='모래는 흘러도, 알갱이 하나하나는 모양을 유지하는 고체야.',exact=True).click();finish(page,'S06')
 page.evaluate("location.hash='S07'");page.get_by_role('button',name='마른 휴지 먼저 확인').click()
 handle=page.locator('.cup-drag-handle');a=handle.bounding_box();page.mouse.move(a['x']+a['width']/2,a['y']+a['height']/2);page.mouse.down();page.mouse.move(a['x']+a['width']/2,a['y']+a['height']/2+185,steps=12);page.mouse.up()
 page.get_by_role('button',name='휴지와 공기 공간 기록').click();finish(page,'S07')
 page.get_by_role('button',name='컵의 공기 배출구 열기').click();page.get_by_role('button',name='열린 조건 기록하기').click();page.get_by_role('button',name='공기는 공간을 차지해. 빠져나간 자리에 물이 들어왔어.',exact=True).click()
 for i in range(3):page.get_by_role('button',name=re.compile('펌프를 세 번 눌러 봐')).click()
 finish(page,'S08')
 page.evaluate("location.hash='S09'");page.locator('.design-requirements').wait_for()
 for i in range(3):page.locator('.design-requirements input').nth(i).check()
 page.get_by_role('button',name='시험실에서 근거 더 모으기').click();page.locator('.experiment-tabs button').nth(2).click();page.get_by_role('button',name='다른 시료도 시험하기').click();observe('water_absorption','metal_plate');page.get_by_role('button',name='설계로 돌아가기').click()
 for part in ['몸체','관찰창','모서리 보호대']:
  page.get_by_role('button',name=part+' 살펴보기',exact=True).click()
  for checkbox in page.locator('.tool-panel input[type=checkbox]').all():checkbox.check()
 finish(page,'S09')
 for name in ['비 시험','빛 시험','모서리 충격 시험']:
  page.locator('.test-card>button').filter(has_text=name).click();page.locator('.test-card>summary').filter(has_text=name).wait_for()
 finish(page,'S10')
 page.evaluate("location.hash='S10/report'");page.get_by_role('button',name='연구 보고서 전달하기').click()
 for button in page.locator('.core-panel .stack .choice').all():button.click()
 button=page.get_by_role('button',name='길게 눌러 코어 재가동');a=button.bounding_box();page.mouse.move(a['x']+a['width']/2,a['y']+a['height']/2);page.mouse.down();page.wait_for_timeout(1600);page.mouse.up();page.get_by_role('button',name='연출 건너뛰기').click()
 page.get_by_role('textbox',name='인증서 별명').fill('모루와 탐구한 연구원');page.screenshot(path=str(OUT/'student-certificate.jpg'),type='jpeg',quality=85)
 saved=page.evaluate("JSON.parse(localStorage.getItem('material-workshop-mission.student.v1'))")
 assert len(saved['completedScreens'])==10 and len(saved['evidence'])==5 and len(saved['challengeResults'])==20 and saved['coreComplete'] and len(saved['completionArchive'])==1
 page.reload(wait_until='networkidle');assert page.get_by_role('heading',name='모루와 탐구한 연구원',exact=True).count()==1
 events.append('Report, core, certificate, nickname, archive and reload persisted')
 browser.close()
report={'events':events,'pageErrors':errors,'completedScreens':len(saved['completedScreens']),'observations':len(saved['observations']),'evidence':len(saved['evidence']),'challenges':len(saved['challengeResults']),'archives':len(saved['completionArchive'])}
(OUT/'student-flow-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=True));assert not errors
