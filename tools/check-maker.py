"""Check all five maker commissions with real touch input and no scrolling.

Usage: .tmp/pwvenv/bin/python tools/check-maker.py [base URL] [evidence label]
QA_PROFILES and QA_MAKER_SCREENS optionally limit a focused retry. Reports are
written even if navigation, an interaction, or the geometry audit fails.
"""
import sys
sys.dont_write_bytecode = True
import ast
import json
import os
import plistlib
import re
import shutil
import subprocess
import tempfile
import traceback
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:5320'
LABEL = sys.argv[2] if len(sys.argv) > 2 else 'maker'
if not re.fullmatch(r'[A-Za-z0-9_.-]+', LABEL) or LABEL in ('.', '..'):
    raise SystemExit('Choose a simple evidence directory name.')
mount = ROOT
while not os.path.ismount(mount) and mount != mount.parent:
    mount = mount.parent
info = plistlib.loads(subprocess.check_output(['diskutil', 'info', '-plist', str(mount)]))
if (info.get('Internal', True) or info.get('ReadOnlyVolume') or info.get('ReadOnlyMedia')
        or info.get('BusProtocol') not in ('USB', 'Thunderbolt', 'PCI-Express')
        or not os.access(ROOT, os.W_OK) or shutil.disk_usage(ROOT).free < 256*1024*1024):
    raise SystemExit(f'Writable physical external SSD required: {mount}')
RUNTIME = ROOT/'.tmp'/'maker-qa'/LABEL
OUT = ROOT/'docs/reviews/delivery-20261111'/LABEL
for directory in (RUNTIME, OUT, RUNTIME/'cache', RUNTIME/'crashes'):
    directory.mkdir(parents=True, exist_ok=True)
for key in ('TMPDIR', 'TMP', 'TEMP'):
    os.environ[key] = str(RUNTIME)
os.environ['PYTHONDONTWRITEBYTECODE'] = '1'
os.environ['XDG_CACHE_HOME'] = str(RUNTIME/'cache')
os.environ['PLAYWRIGHT_BROWSERS_PATH'] = str(ROOT/'.tmp/playwright-browsers')
tempfile.tempdir = str(RUNTIME)

PROFILES = [tuple(map(int, p.strip().lower().split('x'))) for p in os.environ.get('QA_PROFILES', '1280x800,1024x768,768x1024,873x580,740x360,390x844').split(',')]
SCREENS = os.environ.get('QA_MAKER_SCREENS', 'S02,S04,S06,S08,S10').split(',')
SCAN = next(n.value.value for n in ast.parse((ROOT/'tools/check-fit.py').read_text()).body
            if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SCAN' for t in n.targets))
MAKER_SCAN = """() => {
 const issues=[],tol=2;
 for(const e of document.querySelectorAll('.maker-mission,.maker-layout,.maker-controls,.maker-fields,.maker-feedback')){
  if(!e.getClientRects().length)continue;
  const size={width:e.clientWidth,height:e.clientHeight,scrollWidth:e.scrollWidth,scrollHeight:e.scrollHeight,scrollTop:e.scrollTop,scrollLeft:e.scrollLeft};
  if(size.scrollHeight>size.height+tol||size.scrollWidth>size.width+tol||Math.abs(size.scrollTop)>tol||Math.abs(size.scrollLeft)>tol)
   issues.push({kind:'maker-scroll',selector:e.className,...size});
 }
 const maker=document.querySelector('.maker-mission');
 const minimum=innerHeight>460?48:44;
 for(const b of maker?.querySelectorAll('button')||[]){
  const r=b.getBoundingClientRect();if(b.closest('dialog')||!r.width||!r.height)continue;
  if(r.width<minimum-.5||r.height<minimum-.5)issues.push({kind:'maker-touch-size',label:b.getAttribute('aria-label')||b.textContent,width:r.width,height:r.height,minimum});
 }
 const minFont=innerWidth>=1500&&innerHeight>=850?18:innerWidth>=1024?14:0;
 if(minFont&&maker){
  const walker=document.createTreeWalker(maker,NodeFilter.SHOW_TEXT);let node;
  while(node=walker.nextNode()){
   const e=node.parentElement;if(!node.textContent.trim()||e.closest('.sr-only,[aria-hidden=true],dialog,svg')||!e.getClientRects().length)continue;
   const size=parseFloat(getComputedStyle(e).fontSize);if(size<minFont-.05)issues.push({kind:'maker-small-text',text:node.textContent.trim(),size,minimum:minFont});
  }
 }
 const svg=document.querySelector('.maker-apparatus'),r=svg?.getBoundingClientRect();
 if(!r||r.width<30||r.height<24)issues.push({kind:'maker-apparatus-collapsed',width:r?.width,height:r?.height});
 return issues;
}"""
report = {'base': BASE, 'profiles': PROFILES, 'screens': SCREENS, 'cases': [], 'pageErrors': [], 'network404': [], 'fatalErrors': []}


def shot(page, name):
    path = OUT/(name+'.jpg')
    page.screenshot(path=str(path),type='jpeg',quality=82,full_page=False,timeout=6000)
    return str(path)


def capture(page, case, name, keep=False, dialog=False):
    audit = page.evaluate(SCAN,{'screen':case['screen'],'view':'maker','scope':'dialog' if dialog else 'page'})
    if not dialog:
        audit['issues'] += page.evaluate(MAKER_SCAN)
    case['issues'] += [dict(issue,phase=name) for issue in audit['issues']]
    case['phases'].append({'name':name,'issues':audit['issues'],'controlsChecked':audit['controlsChecked']})
    if keep or audit['issues']:
        case['phases'][-1]['screenshot'] = shot(page, f'{case["id"]}-{name}')


def open_bench(page, screen):
    page.keyboard.press('Escape')
    page.evaluate('(s)=>{location.hash=s}', screen)
    page.wait_for_function('(s)=>document.querySelector(".app")?.classList.contains("route-"+s)',arg=screen)
    page.locator('.activity-toolbar').get_by_role('button',name='주문 제작',exact=False).tap()
    bench = page.locator('.maker-mission')
    bench.wait_for()
    page.evaluate('document.fonts.ready')
    return bench


def select_parts(bench, screen, repair):
    groups,slots=bench.locator('fieldset'),bench.locator('.maker-socket')
    count=groups.count()
    assert count == (3 if screen=='S10' else 2), 'Maker parts did not render'
    for index in range(count):
        options=groups.nth(index).locator('button')
        option=options.last if repair and not (screen=='S06' and index==0) else options.first
        option.tap()
        slots.nth(index).tap()


def trial(page, bench, case, phase):
    bench.locator('.maker-actions .primary').tap()
    bench.locator('.maker-scene.is-testing').wait_for()
    capture(page, case, phase+'-testing')
    bench.locator('.maker-scene.is-testing').wait_for(state='hidden')


def run_case(page,case):
    bench=open_bench(page,case['screen'])
    capture(page,case,'initial')
    conditions=bench.get_by_role('button',name='시험 조건',exact=True)
    if conditions.is_visible():
        conditions.tap()
        page.get_by_role('heading',name='의뢰와 시험 조건',exact=True).wait_for()
        capture(page,case,'conditions',dialog=True)
        page.get_by_role('button',name='작업대로 돌아가기',exact=True).tap()
    select_parts(bench,case['screen'],False)
    trial(page,bench,case,'first')
    assert bench.locator('.maker-scene.trial-fail').count()==1
    assert bench.locator('.maker-feedback .fix').count()>0
    capture(page,case,'fail',keep=True)
    reasons=bench.get_by_role('button',name='원인 보기',exact=True)
    if reasons.is_visible():
        reasons.tap()
        page.locator('dialog[open] .maker-result-list .fix').first.wait_for()
        capture(page,case,'failure-details',dialog=True)
        page.get_by_role('button',name='작업대로 돌아가기',exact=True).tap()
    select_parts(bench,case['screen'],True)
    trial(page,bench,case,'repair')
    assert bench.locator('.maker-scene.trial-pass').count()==1
    assert bench.locator('.maker-feedback .fix').count()==0
    capture(page,case,'pass')
    bench.get_by_role('button',name='주민에게 전달하기',exact=False).tap()
    assert bench.get_by_role('button',name='주민에게 납품했어',exact=False).is_disabled()
    capture(page,case,'delivered',keep=True)
    case.update({'failedThenRepaired':True,'delivered':True})


def enable_fresh_demo(page):
    page.get_by_role('button',name='설정',exact=True).click()
    page.get_by_text('교사용 가이드',exact=True).click()
    page.get_by_text('교사용 도구',exact=True).click()
    demo=page.get_by_role('button',name='관리자 전체 해금',exact=True)
    if demo.get_attribute('aria-pressed')=='true':
        demo.click()
        page.wait_for_function('!document.querySelector(".app.demo-mode")')
    demo.click()
    page.wait_for_function('!!document.querySelector(".app.demo-mode")')
    page.get_by_role('button',name='닫기',exact=True).click()
    page.locator('dialog[open]').wait_for(state='hidden')


def main():
    page=None
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            profile=tempfile.mkdtemp(prefix='profile-',dir=RUNTIME)
            context=p.chromium.launch_persistent_context(
                profile,headless=True,channel='chrome',has_touch=True,accept_downloads=False,
                viewport={'width':1280,'height':800},service_workers='allow',
                args=['--renderer-process-limit=2',f'--disk-cache-dir={RUNTIME/"cache"}',
                      f'--crash-dumps-dir={RUNTIME/"crashes"}','--disable-breakpad',
                      '--disable-background-networking','--disable-component-update','--disable-sync'])
            try:
                page=context.pages[0] if context.pages else context.new_page()
                page.set_default_timeout(7500)
                page.on('pageerror',lambda error:report['pageErrors'].append(str(error)))
                page.on('response',lambda response:report['network404'].append(response.url) if response.status==404 else None)
                page.goto(BASE,wait_until='networkidle')
                for width,height in PROFILES:
                    page.set_viewport_size({'width':width,'height':height})
                    enable_fresh_demo(page)
                    for screen in SCREENS:
                        case={'id':f'{width}x{height}-{screen}','screen':screen,'size':[width,height],'phases':[],'issues':[]}
                        report['cases'].append(case)
                        try:
                            run_case(page,case)
                        except Exception as error:
                            case['issues'].append({'kind':'interaction-failed','error':str(error)})
                            case['traceback']=traceback.format_exc()
                            try:
                                case['failureScreenshot']=shot(page,case['id']+'-failure')
                            except Exception as capture_error:
                                case['captureError']=str(capture_error)
                        print(f'{case["id"]}: {"delivered" if case.get("delivered") else "not delivered"}; {len(case["issues"])} issues',flush=True)
            finally:
                context.close()
    except Exception as error:
        report['fatalErrors'].append({'error':str(error),'traceback':traceback.format_exc()})
    finally:
        summary={'cases':len(report['cases']),'delivered':sum(bool(c.get('delivered')) for c in report['cases']),
                 'issues':sum(len(c['issues']) for c in report['cases']),'pageErrors':report['pageErrors'],
                 'network404':report['network404'],'fatalErrors':report['fatalErrors']}
        report['summary']=summary
        (OUT/'result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
        print(json.dumps(summary,ensure_ascii=False),flush=True)
    return int(summary['delivered']!=len(PROFILES)*len(SCREENS) or any(summary[k] for k in ('issues','pageErrors','network404','fatalErrors')))


if __name__=='__main__':
    sys.exit(main())
