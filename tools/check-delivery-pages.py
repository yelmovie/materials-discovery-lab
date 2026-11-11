"""Check delivery pages outside the lab grid with an isolated Chrome profile on SSD."""
import sys
sys.dont_write_bytecode = True
import ast
import json
import os
import re
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUNTIME = ROOT / '.tmp/delivery-pages'
RUNTIME.mkdir(parents=True, exist_ok=True)
for key in ('TMPDIR', 'TMP', 'TEMP'):
    os.environ[key] = str(RUNTIME)
os.environ['PLAYWRIGHT_BROWSERS_PATH'] = str(ROOT / '.tmp/playwright-browsers')
tempfile.tempdir = str(RUNTIME)
LABEL = sys.argv[2] if len(sys.argv) > 2 else ''
if LABEL and (not re.fullmatch(r'[A-Za-z0-9_-]+', LABEL)):
    raise SystemExit('Use a simple QA label for the output directory.')
OUT = ROOT / 'docs/reviews/delivery-20261111/pages' / LABEL
OUT.mkdir(parents=True, exist_ok=True)
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:5320'
PROFILES = [(1280,800),(1024,768),(768,1024),(873,580),(390,844)]
if os.environ.get('QA_PROFILES'):
    PROFILES = [tuple(map(int, value.split('x'))) for value in os.environ['QA_PROFILES'].split(',')]
CERTIFICATE_ONLY = os.environ.get('QA_CERTIFICATE_ONLY') == '1'
CHECK_PRINT = os.environ.get('QA_PRINT') == '1'
SCAN = next(n.value.value for n in ast.parse((ROOT/'tools/check-fit.py').read_text()).body
            if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'SCAN' for t in n.targets))
# Keep every measured issue; only classify reachable vertical overflow in the
# designated reading areas as intentional. Never discount a visible hit failure.
SCAN = SCAN.replace('const issues=[],seen=', 'const issues=[],readingScroll=[],seen=')
SCAN = SCAN.replace('seen.add(key);issues.push(item);', r'''seen.add(key);
  const area=config.scope==='dialog'&&e.closest('.settings-body,.modal-evidence > .modal-content,.concept-dialog > .modal-content');
  const r=detail.line||(Number.isFinite(detail.y)?detail:box(rect(e))),a=area&&rect(area);
  let nestedClip=false;
  for(let b=e.parentElement;area&&b&&b!==area;b=b.parentElement){
   const y=getComputedStyle(b).overflowY,br=rect(b),top=br.top+b.clientTop;
   if(/^(hidden|clip|auto|scroll)$/.test(y)&&(r.y<top-2||r.y+r.h>top+b.clientHeight+2))nestedClip=true;
  }
  const reachY=area&&r.y+r.h<=a.top+area.scrollHeight-area.scrollTop+2&&r.y>=a.top-area.scrollTop-2;
  const verticalHidden=area&&(r.y<a.top-2||r.y+r.h>a.bottom+2);
  const horizontalOK=area&&r.x>=a.left-2&&r.x+r.w<=a.right+2&&!detail.clippedBy?.some(c=>c.axes.includes('x'));
  const qualifies=area&&!nestedClip&&area.scrollHeight>area.clientHeight+2&&area.clientHeight>=r.h&&reachY&&verticalHidden&&horizontalOK&&
    (['control-clipped','control-viewport','text-clipped','text-viewport'].includes(kind)||kind==='control-covered'&&(r.y+r.h/2<a.top||r.y+r.h/2>a.bottom));
  if(qualifies)readingScroll.push({...item,region:cls(area),reason:'Reachable by scrolling the dialog reading region.'});else issues.push(item);''')
SCAN = SCAN.replace('return {issues,containers,', 'return {issues,readingScroll,containers,')
report = {'base':BASE,'profiles':PROFILES,'checks':[], 'errors':[], 'consoleErrors':[], 'network404':[], 'navigationFixtures':[], 'printChecks':[]}

from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    profile=Path(tempfile.mkdtemp(prefix='chrome-',dir=RUNTIME))
    browser=p.chromium.launch_persistent_context(str(profile),channel='chrome',headless=True,
        viewport={'width':1280,'height':800},has_touch=True,reduced_motion='reduce',
        args=['--disk-cache-dir='+str(RUNTIME/'cache'), '--crash-dumps-dir='+str(RUNTIME/'crashes'),
              '--disable-background-networking','--disable-component-update','--disable-breakpad','--renderer-process-limit=2'])
    page=browser.pages[0] if browser.pages else browser.new_page()
    page.set_default_timeout(15000)
    page.on('pageerror',lambda error:report['errors'].append(str(error)))
    page.on('console',lambda message:report['consoleErrors'].append(message.text) if message.type=='error' else None)
    page.on('response',lambda response:report['network404'].append(response.url) if response.status==404 else None)

    def capture(name):
        page.evaluate('document.fonts.ready')
        dialog=page.locator('dialog[open]')
        data=page.evaluate(SCAN,{'screen':'other','view':'other','scope':'dialog' if dialog.count() else 'page'})
        if dialog.count():
            data['dialog']=dialog.first.get_attribute('aria-label')
        report['checks'].append({'name':name,**data})
        page.screenshot(path=str(OUT/(name+'.jpg')),type='jpeg',quality=82)

    def wait_world():
        page.locator('.world-canvas canvas').wait_for(state='visible')
        # CSS supplies fallback values too; require the inline value reported by
        # Phaser after rendering its first camera frame.
        page.wait_for_function("()=>!!document.querySelector('.map-destination-labels')?.style.getPropertyValue('--zoom')")
        page.wait_for_timeout(350)

    def route(value):
        page.evaluate('''value=>{
          const next='#'+value;
          if(location.hash===next)window.dispatchEvent(new HashChangeEvent('hashchange'));
          else location.hash=value;
          window.scrollTo(0,0);
        }''',value)
        name,_,phase=value.partition('/')
        page.locator('.app.route-'+name).wait_for(state='visible')
        page.locator('main .loading').wait_for(state='hidden')
        if phase:
            page.locator({'report':'.final-card.report','core':'.core-panel','ending':'.ending-panel','certificate':'.certificate-wrap'}[phase]).wait_for(state='visible')
            if phase=='ending':
                page.locator('.ending-panel .design-model').wait_for(state='visible')
        if name=='world':
            wait_world()

    def close_dialog():
        page.locator('dialog[open]').get_by_role('button',name='패널 닫기',exact=True).click()
        page.locator('dialog[open]').wait_for(state='hidden')

    def check_print(prefix):
        page.emulate_media(media='print')
        try:
            layout=page.evaluate('''()=>({
              certificate:!!document.querySelector('.certificate')?.getClientRects().length,
              visibleControls:[...document.querySelectorAll('.topbar,.final-toprail,.certificate-actions')].filter(e=>e.getClientRects().length).length
            })''')
            # Inspect Chrome's actual print output in memory; no certificate file is exported.
            data=page.pdf(prefer_css_page_size=True,print_background=True)
            count=len(re.findall(rb'/Type\s*/Page\b',data))
            boxes=[[float(v) for v in raw.split()] for raw in re.findall(rb'/MediaBox\s*\[([^]]+)\]',data)]
            a4=any(len(b)==4 and abs(b[2]-b[0]-841.89)<2 and abs(b[3]-b[1]-595.28)<2 for b in boxes)
            item={'profile':prefix,'pages':count,'mediaBoxes':boxes,'a4Landscape':a4,**layout}
            report['printChecks'].append(item)
            if count!=1 or not a4 or not layout['certificate'] or layout['visibleControls']:
                raise AssertionError(f'Certificate print must be one A4 landscape sheet without UI controls: {item}')
        finally:
            page.emulate_media(media='screen')

    where='setup'
    try:
        page.goto(BASE,wait_until='networkidle',timeout=60000)
        page.get_by_role('button',name='설정',exact=True).click()
        page.get_by_role('switch',name='움직임 줄이기').check()
        page.get_by_text('교사용 가이드',exact=True).click()
        page.get_by_text('교사용 도구',exact=True).click()
        page.get_by_role('button',name='관리자 전체 해금',exact=True).click()
        page.get_by_role('button',name='닫기',exact=True).click()
        for width,height in PROFILES:
            page.set_viewport_size({'width':width,'height':height})
            prefix=f'{width}x{height}'
            if CERTIFICATE_ONLY:
                where=prefix+'-certificate'
                route('S10/certificate');capture(where)
                if CHECK_PRINT:check_print(prefix)
                print(prefix,'certificate checked',flush=True)
                continue
            where=prefix+'-home'
            route('home');capture(where)
            page.get_by_role('button',name=re.compile(r'^공방으로 출발!')).click()
            page.locator('dialog.modal-story[open]').wait_for()
            for i in range(3):
                where=prefix+f'-story-{i+1}'
                capture(where)
                if i<2:page.get_by_role('button',name=re.compile(r'^이야기 계속 듣기')).click()
            page.get_by_role('button',name=re.compile(r'^모루와 공방으로 출발!')).click()
            where=prefix+'-world'
            page.locator('.app.route-world').wait_for();wait_world();capture(where)
            page.get_by_role('button',name='지도 한눈에 보기',exact=True).click()
            page.locator('.world-page.overview').wait_for();wait_world();capture(prefix+'-world-overview')
            for i,name in enumerate(['재료 감정실','성질 시험실','상태 실험실','공기 추적실','발명 제작소']):
                where=prefix+f'-mission-{i+1}'
                label=page.locator('.map-label').nth(i)
                if label.is_visible():
                    label.click()
                else:
                    # Off-camera labels are intentionally hidden. The fixture
                    # selects the same destination; the arrival button is clicked normally.
                    report['navigationFixtures'].append({'at':where,'reason':'Destination label outside the visible map or behind fixed map controls.'})
                    label.dispatch_event('click')
                page.get_by_role('button',name=re.compile('^'+name+' 들어가기')).click()
                page.locator('dialog.modal-mission[open]').wait_for()
                capture(where);close_dialog()
            for number in range(1,11):
                where=prefix+f'-concept-{number}'
                route(f'S{number:02}')
                page.locator('.learning-rail button').nth(2).click()
                page.locator('dialog.concept-dialog[open]').wait_for()
                capture(where);close_dialog()
            for phase in ['report','core','ending','certificate']:
                where=prefix+'-'+phase
                route('S10/'+phase);capture(where)
                if phase=='certificate' and CHECK_PRINT:check_print(prefix)
            where=prefix+'-settings'
            page.get_by_role('button',name='설정',exact=True).click();capture(where)
            page.get_by_text('교사용 가이드',exact=True).click()
            page.get_by_text('성취기준',exact=True).click()
            page.get_by_text(re.compile(r'^활동별 학습 목표 · 교사 검토 대기 10개$')).click()
            where=prefix+'-settings-curriculum'
            assert page.get_by_text(re.compile(r'^S\d\d · ')).count()==10, 'All 10 curriculum goals must be present'
            capture(where)
            page.get_by_role('button',name='나의 연구 수첩 펼치기',exact=True).click()
            where=prefix+'-notebook';capture(where);close_dialog()
            page.get_by_role('button',name='설정',exact=True).click()
            page.get_by_role('button',name='연구 기록 초기화',exact=True).click()
            where=prefix+'-reset';capture(where)
            page.get_by_role('button',name='취소',exact=True).click()
            page.get_by_role('button',name='닫기',exact=True).click()
            print(prefix,'done',flush=True)
    except Exception as error:
        report['errors'].append({'where':where,'error':str(error)})
        try:page.screenshot(path=str(OUT/'failure.jpg'),timeout=5000)
        except Exception:pass
    finally:
        report['summary']={'views':len(report['checks']),
            'issues':sum(len(c['issues']) for c in report['checks']),
            'smallText':sum(len(c.get('smallText',[])) for c in report['checks']),
            'intentionalReadingScroll':sum(len(c['readingScroll']) for c in report['checks']),
            'errors':len(report['errors']),'consoleErrors':len(report['consoleErrors']),'network404':len(report['network404'])}
        (OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
        print(json.dumps(report['summary'],ensure_ascii=False),flush=True)
        browser.close()

raise SystemExit(1 if any(report['summary'][k] for k in ('issues','errors','consoleErrors','network404')) else 0)
