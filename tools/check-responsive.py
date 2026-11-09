"""Check stage layouts in real Chromium; all output and browser data stay on SSD.

Run with .tmp/pwvenv/bin/python tools/check-responsive.py [base] [label].
Labels keep before/after evidence separate. No student account or real save is used.
"""
import json
import os
import re
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
RUNTIME = ROOT / '.tmp/runtime'
RUNTIME.mkdir(parents=True, exist_ok=True)
for key in ('TMPDIR', 'TMP', 'TEMP'):
    os.environ[key] = str(RUNTIME)
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:5319'
LABEL = sys.argv[2] if len(sys.argv) > 2 else 'after'
OUT = ROOT / 'docs/reviews/responsive-20261108' / LABEL
OUT.mkdir(parents=True, exist_ok=True)
PROFILES = [(1920, 1080), (1366, 768), (1280, 800), (1024, 600), (915, 412), (740, 360), (390, 844)]
if os.environ.get('QA_PROFILES'):
    PROFILES = [tuple(map(int, value.split('x'))) for value in os.environ['QA_PROFILES'].split(',')]
SCAN = r"""() => {
 const root=document.querySelector('dialog[open]')||document.querySelector('main');
 const issues=[], visible=e=>{
  const s=getComputedStyle(e),r=e.getBoundingClientRect(),d=e.closest('details:not([open])');
  return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&(!d||d.querySelector('summary')?.contains(e));
 };
 const clipped=e=>{const r=e.getBoundingClientRect();for(let a=e.parentElement;a;a=a.parentElement){const s=getComputedStyle(a),b=a.getBoundingClientRect();if(/auto|scroll|hidden|clip/.test(s.overflowY)&&(r.bottom>b.bottom+2||r.top<b.top-2))return true;}return false;};
 for(const e of root.querySelectorAll('button,select,summary,input,textarea')){
  if(!visible(e)||e.disabled)continue;
  const hit=e.matches('input[type=checkbox]')?e.closest('label')||e:e;
  const r=hit.getBoundingClientRect(),label=(e.getAttribute('aria-label')||e.textContent||e.type).trim().slice(0,70);
  if(r.width<44||r.height<44)issues.push({kind:'target',label,w:Math.round(r.width),h:Math.round(r.height)});
  if(clipped(hit))continue; // A scrollable panel may intentionally show only part of a control.
  if(r.left< -2||r.right>innerWidth+2)issues.push({kind:'horizontal',label});
  if(r.top<0||r.bottom>innerHeight)continue;
  const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
  // The movable wood block deliberately rests inside the current vessel. Both are equivalent manipulation targets.
  const sameExperimentTarget=e.matches('.lab-vessel')&&top?.closest('.wood-block');
  if(top&&!hit.contains(top)&&!top.contains(hit)&&!sameExperimentTarget)issues.push({kind:'covered',label,by:top.className?.baseVal??top.className});
 }
 // Measure DOM text against its own box; ::before/::after decoration is not text overflow.
 for(const e of root.querySelectorAll('.learning-rail button,.vessel-label,.lab-instruction,.lab-metric,.canvas-label,.water-line,.air-space,.tissue,.drop-slot,.stage-badge,.activity-heading h1,.experiment-tabs button,.activity-footer>.primary')){
  if(!visible(e))continue;const b=e.getBoundingClientRect();
  const walk=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);let n;
  while(n=walk.nextNode()){if(!n.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(n);const t=range.getBoundingClientRect();if(!t.width&&!t.height)continue;if(t.left<b.left-2||t.right>b.right+2||t.top<b.top-2||t.bottom>b.bottom+2)issues.push({kind:'text-overflow',label:n.textContent.trim().slice(0,60)});}
 }
 const labels=[...root.querySelectorAll('.canvas-label,.inspection-lens,.tissue,.air-space,.water-line,.vent-switch,.vessel-label,.lab-instruction,.lab-metric,.air-flow span,.liquid-vessel-name,.liquid-reference,.water-balance,.journey,.workspace-note,.experiment-stage-heading,.experiment-observation,.experiment-trigger,.experiment-outline-key')].filter(visible);
 for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){
  const a=labels[i],b=labels[j];if(a.contains(b)||b.contains(a))continue;
  const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();
  if(Math.min(x.right,y.right)-Math.max(x.left,y.left)>4&&Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top)>4)issues.push({kind:'label-overlap',label:a.textContent.trim().slice(0,40),with:b.textContent.trim().slice(0,40)});
 }
 const footer=document.querySelector('.activity-footer')?.getBoundingClientRect();
 return {issues,horizontalOverflow:document.documentElement.scrollWidth>innerWidth+2,bodyHeight:document.documentElement.scrollHeight,footer:footer?{top:Math.round(footer.top),bottom:Math.round(footer.bottom)}:null};
}"""
results, errors = [], []

def capture(page, name, screenshot=False):
    data = page.evaluate(SCAN)
    results.append({'name': name, **data})
    if screenshot:
        page.screenshot(path=str(OUT / f'{name}.jpg'), type='jpeg', quality=80, full_page=True)

def route_stage(page, screen):
    page.evaluate('(s)=>{location.hash=s; window.scrollTo(0,0)}', screen)
    page.wait_for_timeout(180)
    page.locator('main .loading').wait_for(state='hidden')
    page.locator('.activity-grid').wait_for()

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True, args=[
        '--renderer-process-limit=2', f'--disk-cache-dir={ROOT / ".tmp/chrome-cache"}',
        '--disable-background-networking', '--disable-component-update', '--disable-sync'])
    page = browser.new_page(viewport={'width': 1280, 'height': 800}, reduced_motion='reduce')
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE, wait_until='networkidle')
    page.get_by_role('button', name='설정', exact=True).click()
    page.get_by_text('교사용 가이드', exact=True).click()
    page.get_by_text('교사용 도구', exact=True).click()
    page.get_by_role('button', name='관리자 전체 해금', exact=True).click()
    page.get_by_role('button', name='닫기', exact=True).click()
    for width, height in PROFILES:
        profile_start=len(results)
        page.set_viewport_size({'width': width, 'height': height})
        for i in [int(value) for value in os.environ.get('QA_SCREENS','1,2,3,4,5,6,7,8,9,10').split(',')]:
            screen = f'S{i:02}'
            page.evaluate('(s)=>{location.hash=s; window.scrollTo(0,0)}', screen)
            page.wait_for_timeout(140)
            page.locator('.learning-rail button').first.click()
            page.locator('main .loading').wait_for(state='hidden')
            page.locator('.activity-grid').wait_for()
            page.evaluate('document.fonts.ready')
            if screen=='S04':
                assert page.locator('.assignment-visual').evaluate("e=>{const w=e.closest('.workspace');w.scrollTop=0;return e.getBoundingClientRect().top>=w.getBoundingClientRect().top-1;}")
            capture(page, f'{width}-{screen}-lab', width in (1280, 915, 390))
            page.get_by_role('button', name=re.compile('2 새 의뢰')).click()
            page.locator('.transfer-workspace').wait_for()
            capture(page, f'{width}-{screen}-challenge', width == 915 and i in (1, 6, 9))
        print(f'{width}x{height}: {len(results)-profile_start} stage views scanned', flush=True)
    if os.environ.get('QA_STATES') == '1':
        for width, height in [(1280,800),(1024,600),(915,412),(390,844)]:
            page.set_viewport_size({'width':width,'height':height})
            page.get_by_role('button',name='설정',exact=True).click()
            page.get_by_text('교사용 가이드',exact=True).click()
            page.get_by_text('교사용 도구',exact=True).click()
            page.get_by_role('button',name='관리자 전체 해금',exact=True).click()
            page.get_by_role('button',name='관리자 전체 해금',exact=True).click()
            page.get_by_role('button',name='닫기',exact=True).click()
            route_stage(page,'S02')
            page.locator('.part-observation>summary').click()
            page.get_by_role('slider',name='선택한 부품 확대').press('End')
            for _ in range(4):
                page.get_by_role('button',name='확대',exact=True).click()
            assert page.locator('.object-marker').evaluate_all("els=>els.every(e=>{const r=e.getBoundingClientRect(),p=e.closest('.object-canvas').getBoundingClientRect();return r.left>=p.left-1&&r.right<=p.right+1&&r.top>=p.top-1&&r.bottom<=p.bottom+1;})"), 'Zoomed markers must remain inside the illustration'
            lens=page.locator('.inspection-lens')
            lens.scroll_into_view_if_needed()
            before=page.locator('.object-model-layer').get_attribute('style')
            b=lens.bounding_box()
            page.mouse.move(b['x']+b['width']/2,b['y']+b['height']/2)
            page.mouse.down()
            page.mouse.move(b['x']+b['width']/2+24,b['y']+b['height']/2-8,steps=6)
            page.mouse.up()
            assert page.locator('.object-model-layer').get_attribute('style') == before, 'Dragging the magnifier must not trigger a zoom click'
            page.evaluate("()=>{window.scrollTo(0,0);document.querySelectorAll('.workspace,.tools').forEach(e=>e.scrollTop=0)}")
            capture(page,f'{width}-S02-max-zoom',True)
            route_stage(page,'S03')
            for index in range(4):
                page.locator('.experiment-tabs button').nth(index).click()
                page.locator('.experiment-trigger').click()
                page.wait_for_function("document.querySelector('.sample-simulation')?.classList.contains('observed')")
                page.evaluate("()=>{window.scrollTo(0,0);document.querySelector('.workspace').scrollTop=0}")
                capture(page,f'{width}-S03-observed-{index+1}',True)
            route_stage(page,'S05')
            page.get_by_role('button',name='처음 컵에 나무토막 옮기기',exact=True).click()
            capture(page,f'{width}-S05-first-vessel',True)
            route_stage(page,'S06')
            page.get_by_role('button',name='모래알 확대 관찰하기',exact=True).click()
            capture(page,f'{width}-S06-sand',True)
            page.get_by_role('button',name='다시 옮겨 보기',exact=True).click()
            page.get_by_role('button',name='조금씩 붓기',exact=True).click()
            page.evaluate("()=>{window.scrollTo(0,0);document.querySelector('.workspace').scrollTop=0}")
            capture(page,f'{width}-S06-mid-pour',True)
            route_stage(page,'S07')
            assert page.locator('.air-cup.vented').count()==0, 'Closed-condition stage must stay closed after the open experiment was completed'
            assert page.locator('.tissue').inner_text()=='마른 휴지'
            page.get_by_role('button',name='공기 위치 표시 켜기',exact=True).click()
            capture(page,f'{width}-S07-air-space',True)
            route_stage(page,'S08')
            assert page.locator('.air-cup.vented').count()==1
            assert page.locator('.tissue').inner_text()=='젖은 휴지'
            capture(page,f'{width}-S08-open-vent',True)
            print(f'{width}x{height}: zoom, all material experiments, solid, liquid, sand and air states checked',flush=True)
    # Demo actions must never write completion into the student save.
    if os.environ.get('QA_NAV') == '1':
        page.set_viewport_size({'width':390,'height':844})
        route_stage(page,'S01')
        page.evaluate('window.scrollTo(0,document.documentElement.scrollHeight)')
        assert page.evaluate('window.scrollY')>0
        assert page.locator('.topbar').bounding_box()['y']<0, 'Menus must scroll away instead of covering the experiment'
        page.keyboard.press('ArrowRight')
        page.wait_for_timeout(250)
        assert '부품과 재료' in page.locator('.activity-heading h1').inner_text()
        assert page.evaluate('window.scrollY')==0, 'Opening another stage must start at its heading'
        capture(page,'390-stage-navigation',True)
    assert page.evaluate("JSON.parse(localStorage.getItem('material-workshop-mission.student.v1')).completedScreens.length") == 0
    browser.close()

report = {'profiles': PROFILES, 'screens': len(results), 'pageErrors': errors, 'checks': results,
          'limitations': ['Real iPad/Android hardware not measured', 'Scrollable content is checked separately from viewport clipping']}
(OUT / 'layout-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
summary = {'screens': len(results), 'pageErrors': errors,
           'issues': sum(len(r['issues']) for r in results),
           'horizontalOverflow': [r['name'] for r in results if r['horizontalOverflow']]}
print(json.dumps(summary, ensure_ascii=False), flush=True)
if LABEL != 'before':
    assert not errors and not summary['issues'] and not summary['horizontalOverflow'], summary
