import json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
base=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:5399'
out=Path('/tmp/material-maker-qa');out.mkdir(exist_ok=True)
reports=[];errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,channel='chrome')
 page=b.new_page(viewport={'width':1280,'height':800},has_touch=True)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base,wait_until='networkidle')
 page.get_by_role('button',name='설정',exact=True).click();page.get_by_text('교사용 가이드',exact=True).click();page.get_by_text('교사용 도구',exact=True).click();page.get_by_role('button',name='관리자 전체 해금',exact=True).click();page.get_by_role('button',name='닫기',exact=True).click()
 for w,h in [(1280,800),(1024,768),(873,580),(390,844)]:
  page.set_viewport_size({'width':w,'height':h})
  for screen in ['S02','S04','S06','S08','S10']:
   page.evaluate('(s)=>location.hash=s',screen);page.wait_for_timeout(300)
   page.locator('.activity-toolbar').get_by_role('button',name='주문 제작',exact=False).click()
   bench=page.locator('.maker-mission');bench.wait_for()
   groups=bench.locator('fieldset');slots=bench.locator('.maker-socket')
   # Intentionally first choices fail, then retain and repair selected slots.
   for i in range(groups.count()):
    groups.nth(i).locator('button').first.click();slots.nth(i).click()
   bench.locator('.maker-actions .primary').click();page.wait_for_timeout(1400)
   assert bench.locator('.maker-feedback .fix').count()>0
   bench.screenshot(path=str(out/f'{w}-{screen}-fail.png'))
   for i in range(groups.count()):
    groups.nth(i).locator('button').last.click();slots.nth(i).click()
   # S06 valid tray is the first choice.
   if screen=='S06':groups.nth(0).locator('button').first.click();slots.nth(0).click()
   bench.locator('.maker-actions .primary').click();page.wait_for_timeout(1400)
   assert bench.locator('.maker-feedback .fix').count()==0
   bench.get_by_role('button',name='주민에게 전달하기',exact=False).click()
   assert bench.get_by_role('button',name='주민에게 납품했어',exact=False).is_disabled()
   # Inspect all controls after browser scrolls them into view.
   for control in bench.locator('button').all():
    if control.is_disabled():continue
    control.scroll_into_view_if_needed()
    issue=control.evaluate('e=>{const r=e.getBoundingClientRect(),t=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {label:e.textContent,w:r.width,h:r.height,blocked:!t||!(e.contains(t)||t.contains(e))}}')
    assert not issue['blocked'],issue
   assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+2')
   bench.screenshot(path=str(out/f'{w}-{screen}-pass.png'))
   reports.append({'screen':screen,'size':[w,h],'failedThenRepaired':True,'delivered':True})
 b.close()
assert not errors,errors
(out/'result.json').write_text(json.dumps({'cases':reports,'errors':errors},ensure_ascii=False,indent=2))
print('PASS',len(reports),'cases; errors',errors)
