"""Browser regression for immutable predictions and shared-tab storage protection."""
import json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:5319'
OUT=Path(__file__).resolve().parents[1]/'docs/reviews/upgrade-nine-20261107';OUT.mkdir(parents=True,exist_ok=True)
KEY='material-workshop-mission.student.v1'
errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(channel='chrome',headless=True)
 context=browser.new_context(viewport={'width':1024,'height':768},reduced_motion='reduce')
 a=context.new_page();a.on('pageerror',lambda e:errors.append(str(e)));a.goto(BASE,wait_until='networkidle')
 # The teacher mode is a deliberate independent fixture. Student slot must remain unchanged.
 a.get_by_role('button',name='설정',exact=True).click();a.get_by_text('교사용 가이드',exact=True).click();a.get_by_text('교사용 도구',exact=True).click();a.get_by_role('button',name='관리자 전체 해금').click();a.get_by_role('button',name='닫기',exact=True).click()
 a.evaluate("location.hash='S05'");a.locator('.prediction-card').wait_for();a.locator('.prediction-card summary').click();a.get_by_role('button',name='용기에 맞춰 달라질 것 같아',exact=True).click()
 # Demo keeps its explicit initial prediction even after a changed answer.
 assert '모양과 크기가 그대로' in a.locator('.prediction-history').inner_text()
 assert '지금은 생각이 바뀌었어' in a.locator('.prediction-history').inner_text()
 a.screenshot(path=str(OUT/'prediction-history-tablet.png'))
 a.get_by_role('button',name='설정',exact=True).click();a.get_by_role('button',name='나의 연구 수첩 펼치기',exact=True).click();assert '처음 예상과 지금 생각' in a.locator('dialog').inner_text();assert '처음: 모양·크기 그대로' in a.locator('dialog').inner_text();a.screenshot(path=str(OUT/'notebook-predictions.png'));a.get_by_role('button',name='패널 닫기',exact=True).click()
 a.get_by_role('button',name='설정',exact=True).click();a.get_by_text('교사용 가이드',exact=True).click();a.get_by_text('교사용 도구',exact=True).click();a.get_by_role('button',name='관리자 전체 해금').click();a.get_by_role('button',name='닫기',exact=True).click()
 b=context.new_page();b.goto(BASE,wait_until='networkidle');a.get_by_role('button',name='소리 끄기',exact=True).click();b.locator('.storage-notice').wait_for();raw=a.evaluate('(k)=>localStorage.getItem(k)',KEY)
 b.get_by_role('button',name='소리 끄기',exact=True).click();b.wait_for_timeout(100);assert b.evaluate('(k)=>localStorage.getItem(k)',KEY)==raw
 b.screenshot(path=str(OUT/'storage-conflict-tablet.png'))
 b.reload(wait_until='networkidle');assert b.locator('.storage-notice').count()==0;assert b.get_by_role('button',name='소리 켜기',exact=True).count()==1
 # Native keyboard and 48px control visibility checked by the layout suite; no external user data touched.
 browser.close()
report={'sharedTabProtection':True,'reloadAdoptsNewerSave':True,'demoInitialPredictionPreserved':True,'pageErrors':errors}
(OUT/'upgrade-regression.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report));assert not errors
