"""Verify water layers and material motion that control rectangles cannot detect.

Usage: .tmp/pwvenv/bin/python tools/check-science-visuals.py [base URL]
The test uses a fresh teacher demonstration profile on the external SSD.
"""
import sys
sys.dont_write_bytecode = True
import json
import os
import plistlib
import re
import shutil
import subprocess
import tempfile
import traceback
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:5320'
MOUNT = ROOT
while not os.path.ismount(MOUNT) and MOUNT != MOUNT.parent:
    MOUNT = MOUNT.parent
INFO = plistlib.loads(subprocess.check_output(['diskutil', 'info', '-plist', str(MOUNT)]))
if (INFO.get('Internal', True) or INFO.get('ReadOnlyVolume') or INFO.get('ReadOnlyMedia')
        or INFO.get('BusProtocol') not in ('USB', 'Thunderbolt', 'PCI-Express')
        or not os.access(ROOT, os.W_OK) or shutil.disk_usage(ROOT).free < 256*1024*1024):
    raise SystemExit(f'Writable physical external SSD required: {MOUNT}')
RUNTIME = ROOT/'.tmp/science-art-motion'
OUT = ROOT/'docs/reviews/science-20261112'
for directory in [OUT, RUNTIME/'cache', RUNTIME/'crashes']:
    directory.mkdir(parents=True, exist_ok=True)
for key in ['TMPDIR', 'TMP', 'TEMP']:
    os.environ[key] = str(RUNTIME)
os.environ['XDG_CACHE_HOME'] = str(RUNTIME/'cache')
tempfile.tempdir = str(RUNTIME)
REPORT = {'base': BASE, 'checks': [], 'pageErrors': [], 'consoleErrors': [], 'network404': [], 'status': 'failed'}


def navigate(page, screen):
    page.evaluate('(s)=>{location.hash=s}', screen)
    page.wait_for_function('(s)=>document.querySelector(".app")?.classList.contains("route-"+s)', arg=screen)
    page.locator('.activity-grid').wait_for()
    page.evaluate('document.fonts.ready')


def fresh_demo(page):
    page.get_by_role('button', name='설정', exact=True).click()
    page.get_by_text('교사용 가이드', exact=True).click()
    page.get_by_text('교사용 도구', exact=True).click()
    demo = page.get_by_role('button', name='관리자 전체 해금', exact=True)
    if demo.get_attribute('aria-pressed') == 'true':
        demo.click()
        page.wait_for_function('!document.querySelector(".app.demo-mode")')
    demo.click()
    page.wait_for_function('!!document.querySelector(".app.demo-mode")')
    page.get_by_role('button', name='닫기', exact=True).click()


def screenshot(page, filename):
    path = OUT/(filename+'.jpg')
    page.locator('.companion-button img').evaluate('(image)=>image.decode()')
    page.screenshot(path=str(path), type='jpeg', quality=82)
    return str(path)


def inspect_vessels(page, size):
    navigate(page, 'S05')
    assets = page.locator('.vessel-art').evaluate_all('''async imgs=>{
      await Promise.all(imgs.map(i=>i.decode()));
      return imgs.map(i=>({width:i.naturalWidth,height:i.naturalHeight}));
    }''')
    assert len(assets) == 3 and all(i['width'] > 0 for i in assets), assets
    REPORT['checks'].append({'size': size, 'screen': 'S05', 'loadedVessels': assets,
                             'screenshot': screenshot(page, f'{size}-S05-vessels')})


def inspect_cups(page, size):
    states = []
    for screen in ['S07', 'S08']:
        navigate(page, screen)
        page.locator('.air-cup-art').evaluate('(image)=>image.decode()')
        sample = page.locator('.air-lab').evaluate('''lab=>{
          const cup=lab.querySelector('.air-cup'), water=lab.querySelector('.cup-water');
          const tank=lab.querySelector('.tank-water'), hit=lab.querySelector('.cup-drag-handle');
          const art=lab.querySelector('.air-cup-art'), r=cup.getBoundingClientRect(), h=getComputedStyle(hit);
          const waterBox=tank.getBoundingClientRect();
          return {waterFraction:water.getBoundingClientRect().height/r.height,
                  capBelowSurface:r.top-waterBox.top,bottomBeyondTank:r.bottom-waterBox.bottom,
                  artBottomBeyondTank:art.getBoundingClientRect().bottom-waterBox.bottom,
                  hitHeight:hit.getBoundingClientRect().height,
                  hitBackground:h.backgroundColor, hitBlur:h.backdropFilter,
                  cupBackground:getComputedStyle(cup).backgroundColor,
                  waterZ:Number(getComputedStyle(water).zIndex),artZ:Number(getComputedStyle(art).zIndex)};
        }''')
        sample.update({'size': size, 'screen': screen, 'screenshot': screenshot(page, f'{size}-{screen}-cup')})
        REPORT['checks'].append(sample)
        states.append(sample)
        assert sample['hitBackground'] == 'rgba(0, 0, 0, 0)' and sample['hitBlur'] == 'none', sample
        # The light cup cross-section must mask the surrounding tank water.
        assert sample['cupBackground'].startswith('rgb('), sample
        assert sample['capBelowSurface'] >= 0 and sample['waterZ'] >= sample['artZ'], sample
        assert max(sample['bottomBeyondTank'], sample['artBottomBeyondTank']) <= 2, sample
        assert sample['hitHeight'] >= 44, sample
    closed, opened = states
    assert closed['waterFraction'] < .25 and opened['waterFraction'] > .65, states
    assert abs(closed['capBelowSurface']-opened['capBelowSurface']) < 2, states


def inspect_liquid_precision(page, size):
    navigate(page, 'S06')
    page.get_by_role('button', name='다시 옮겨 보기', exact=True).click()
    page.get_by_role('slider', name='붓기 기울기').fill('60')
    page.get_by_role('button', name='누르는 동안 붓기', exact=True).focus()
    # Run one 50ms pour tick while holding the real keyboard control.
    now = datetime.fromtimestamp(page.evaluate('Date.now()') / 1000 + 1, timezone.utc)
    page.clock.pause_at(now)
    try:
        page.keyboard.down('Space')
        page.clock.run_for(65)
        page.keyboard.up('Space')
    finally:
        page.clock.resume()
    sample = page.locator('.water-balance').evaluate('''bar=>{
      const box=bar.closest('.workspace').getBoundingClientRect();
      const labels=[...bar.children], bounds=labels.map(e=>e.getBoundingClientRect());
      return {amounts:labels.slice(0,3).map(e=>e.querySelector('b').textContent),
              total:labels[3].textContent,
              contained:bounds.every(r=>r.left>=box.left&&r.right<=box.right&&r.bottom<=box.bottom),
              overlaps:bounds.some((a,i)=>bounds.slice(i+1).some(b=>
                a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top)),
              accessible:bar.parentElement.querySelector('.liquid-vessels').getAttribute('aria-label')};
    }''')
    sample.update({'size': size, 'screen': 'S06', 'screenshot': screenshot(page, f'{size}-S06-decimals')})
    REPORT['checks'].append(sample)
    assert sample['amounts'] == ['95.5%', '4.5%', '0%'] and sample['total'] == '총량 100%', sample
    assert sample['contained'] and not sample['overlaps'], sample
    assert '처음 컵 95.5, 넓은 용기 4.5' in sample['accessible'], sample


def inspect_rubber(page, size):
    navigate(page, 'S10')
    page.get_by_role('button', name='모서리 누르기 시험', exact=True).click()
    page.wait_for_function('''()=>{
      const e=document.querySelector('.design-model.is-pressing .tested-bumper');
      return e&&new DOMMatrix(getComputedStyle(e).transform).d<.88;
    }''', timeout=4000)
    sample = page.locator('.design-model.is-pressing').evaluate('''e=>{
      const bumper=e.querySelector('.tested-bumper'), s=getComputedStyle(bumper);
      return {scaleY:new DOMMatrix(s.transform).d,animation:s.animationName,
              plate:!!e.querySelector('.bumper-press-tool.can-compress')};
    }''')
    sample.update({'size': size, 'screen': 'S10', 'material': 'rubber',
                   'screenshot': screenshot(page, f'{size}-S10-rubber-pressed')})
    page.locator('.design-model.is-pressing').wait_for(state='hidden')
    sample['returnedToScale'] = page.locator('.tested-bumper').evaluate(
        "e=>{const t=getComputedStyle(e).transform;return t==='none'?1:new DOMMatrix(t).d;}")
    REPORT['checks'].append(sample)
    assert sample['plate'] and sample['animation'] == 'bumper-compress', sample
    assert sample['scaleY'] < .88 and sample['returnedToScale'] == 1, sample


def inspect_metal(page, size):
    navigate(page, 'S09')
    page.get_by_role('button', name='모서리 보호대 살펴보기', exact=True).click()
    page.get_by_role('combobox', name='설계 재료', exact=True).select_option('metal_plate')
    page.get_by_role('button', name=re.compile('관찰 근거 연결')).click()
    for check in page.locator('dialog[open] .design-evidence-pair input').all():
        check.check()
    page.get_by_role('button', name='탐구로 돌아가기', exact=True).click()
    navigate(page, 'S10')
    page.get_by_role('button', name='모서리 누르기 시험', exact=True).click()
    page.locator('.design-model.is-pressing').wait_for()
    page.wait_for_timeout(450)
    sample = page.locator('.design-model.is-pressing').evaluate('''e=>{
      const plate=e.querySelector('.bumper-press-tool');
      return {plate:!!plate,plateMoves:plate&&getComputedStyle(plate).animationName!=='none',
              anyCompressingPart:!!e.querySelector('.tested-bumper,.can-compress')};
    }''')
    sample.update({'size': size, 'screen': 'S10', 'material': 'metal',
                   'screenshot': screenshot(page, f'{size}-S10-metal-pressed')})
    page.locator('.design-model.is-pressing').wait_for(state='hidden')
    sample['retryShown'] = page.locator('.compact-test-row.retry').count() == 1
    REPORT['checks'].append(sample)
    assert sample['plate'] and not sample['plateMoves'] and not sample['anyCompressingPart'] and sample['retryShown'], sample


def main():
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            context = p.chromium.launch_persistent_context(
                tempfile.mkdtemp(prefix='profile-', dir=RUNTIME), channel='chrome', headless=True,
                viewport={'width': 1280, 'height': 800}, reduced_motion='no-preference',
                service_workers='allow', accept_downloads=False,
                args=['--renderer-process-limit=2', f'--disk-cache-dir={RUNTIME/"cache"}',
                      f'--crash-dumps-dir={RUNTIME/"crashes"}', '--disable-breakpad',
                      '--disable-background-networking', '--disable-component-update', '--disable-sync'])
            try:
                page = context.pages[0] if context.pages else context.new_page()
                page.set_default_timeout(10000)
                page.on('pageerror', lambda error: REPORT['pageErrors'].append(str(error)))
                page.on('console', lambda msg: REPORT['consoleErrors'].append(msg.text) if msg.type == 'error' else None)
                page.on('response', lambda r: REPORT['network404'].append(r.url) if r.status == 404 else None)
                page.clock.install()
                page.goto(BASE, wait_until='networkidle', timeout=30000)
                REPORT['assets'] = page.locator('script[type=module][src],link[rel=stylesheet]').evaluate_all(
                    "elements=>elements.map(e=>e.getAttribute('src')||e.getAttribute('href'))")
                for width, height in [(1280, 800), (740, 360)]:
                    size = f'{width}x{height}'
                    page.set_viewport_size({'width': width, 'height': height})
                    fresh_demo(page)
                    inspect_vessels(page, size)
                    inspect_cups(page, size)
                    inspect_rubber(page, size)
                    inspect_metal(page, size)
                    print(size + ': vessels, closed/open cup, rubber and metal passed', flush=True)
                for width, height in [(1024, 768), (740, 360)]:
                    size = f'{width}x{height}'
                    page.set_viewport_size({'width': width, 'height': height})
                    fresh_demo(page)
                    inspect_liquid_precision(page, size)
                    print(size + ': decimal water labels fit and total 100%', flush=True)
                assert not REPORT['pageErrors'] and not REPORT['consoleErrors'] and not REPORT['network404'], REPORT
                REPORT['status'] = 'passed'
            finally:
                context.close()
    except Exception as error:
        REPORT['error'] = str(error)
        REPORT['traceback'] = traceback.format_exc()
    finally:
        (OUT/'visuals.json').write_text(json.dumps(REPORT, ensure_ascii=False, indent=2), encoding='utf-8')
        print(json.dumps({k:v for k,v in REPORT.items() if k!='traceback'}, ensure_ascii=False), flush=True)
    return int(REPORT['status'] != 'passed')


if __name__ == '__main__':
    sys.exit(main())
