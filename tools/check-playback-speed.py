"""Exercise real playback timing, live speed changes and cancellation in Chrome.

Run with the project's .tmp/pwvenv/bin/python. Profiles, caches and evidence stay
below the externally mounted project, using the storage check in check-fit.py.
"""
import sys
sys.dont_write_bytecode = True
import json
import os
import tempfile
import time
import traceback
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# Reuse the physical-drive validation without executing the layout sweep.
source = (ROOT / 'tools/check-fit.py').read_text()
setup = source[:source.index('SCAN = r')]
namespace = {'__file__': str(ROOT / 'tools/check-fit.py')}
exec(compile(setup, 'check-fit-setup', 'exec'), namespace)
RUNTIME, OUT = namespace['RUNTIME'], namespace['OUT']
BASE = namespace['BASE']
tempfile.tempdir = str(RUNTIME)
os.environ['XDG_CACHE_HOME'] = str(RUNTIME / 'cache')
os.environ['XDG_CONFIG_HOME'] = str(RUNTIME / 'config')
from playwright.sync_api import sync_playwright

checks, errors = [], []
report = {'checks': checks, 'pageErrors': errors}
page = None

def judgments():
    return page.evaluate("""() => {
      const s=JSON.parse(localStorage.getItem('material-workshop-mission.student.v1'));
      return {predictions:s.predictions,initial:s.initialPredictions,
        challenges:s.challengeResults,parts:s.design.parts,needs:s.design.needs};
    }""")

def start():
    page.get_by_role('button', name='자동재생', exact=True).click()
    page.wait_for_function("document.querySelector('.experiment-playback-button').getAttribute('aria-pressed')==='true'")

def ended():
    page.wait_for_function("document.querySelector('.experiment-playback-button').getAttribute('aria-pressed')==='false'", timeout=15000)
    assert not page.locator('.experiment-playback-error').count()

try:
    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            tempfile.mkdtemp(prefix='speed-profile-', dir=RUNTIME),
            channel='chrome', headless=True, viewport={'width':1280,'height':800},
            reduced_motion='no-preference', service_workers='block',
            args=[f'--disk-cache-dir={RUNTIME}/speed-cache',
                  f'--crash-dumps-dir={RUNTIME}/speed-crashes', '--disable-breakpad'])
        try:
            page = context.pages[0]
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(BASE+'/#S01', wait_until='networkidle')
            page.locator('.umbrella-stage').wait_for()
            before = judgments()
            durations = {}
            for rate in ['0.5','1','1.5','2']:
                page.get_by_role('combobox', name='자동재생 속도').select_option(rate)
                begun = time.monotonic()
                start()
                ended()
                elapsed = time.monotonic()-begun
                expected = 3.3/float(rate)
                assert expected*.85 < elapsed < expected+1.5, (rate, elapsed, expected)
                assert judgments() == before, 'Playback changed a student decision'
                durations[rate] = round(elapsed,3)
            assert durations['0.5'] > durations['1'] > durations['1.5'] > durations['2']
            checks.append({'name':'four real playback rates','seconds':durations,'judgmentsPreserved':True})

            page.get_by_role('combobox', name='자동재생 속도').select_option('0.5')
            begun = time.monotonic()
            start()
            page.wait_for_timeout(250)
            page.get_by_role('combobox', name='자동재생 속도').select_option('2')
            assert page.get_by_role('button', name='멈추기', exact=True).is_visible()
            ended()
            elapsed = time.monotonic()-begun
            assert elapsed < durations['0.5']*.65, elapsed
            checks.append({'name':'change speed during the current wait','seconds':round(elapsed,3)})

            start()
            page.get_by_role('button', name='멈추기', exact=True).click()
            selected = page.locator('.object-selected-badge').inner_text()
            page.wait_for_timeout(1000)
            assert page.locator('.object-selected-badge').inner_text() == selected
            assert judgments() == before
            checks.append({'name':'stop cancels pending part transitions'})

            start()
            page.get_by_role('button', name='금속 살 살펴보기', exact=True).click()
            ended()
            page.wait_for_timeout(700)
            assert '금속 살' in page.locator('.object-selected-badge').inner_text()
            checks.append({'name':'manual input takes over from playback'})

            start()
            page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))")
            ended()
            page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,value:false})")
            checks.append({'name':'backgrounding stops playback'})

            page.get_by_role('button', name='설정', exact=True).click()
            page.get_by_text('교사용 가이드', exact=True).click()
            page.get_by_text('교사용 도구', exact=True).click()
            page.get_by_role('button', name='관리자 전체 해금', exact=True).click()
            page.get_by_role('button', name='닫기', exact=True).click()
            page.evaluate("location.hash='S03'")
            page.locator('.sample-simulation').wait_for()
            assert page.get_by_role('combobox', name='자동재생 속도').input_value() == '2'
            start()
            ended()
            page.locator('.sample-answer-options').wait_for()
            assert page.locator('.sample-answer-options .choice[aria-pressed=true]').count() == 0
            assert page.locator('.tools [data-next-action=true]').count() == 1
            checks.append({'name':'speed remembered across stages; stops for a manual observation'})
            page.screenshot(path=str(OUT/'speed-answer-boundary.jpg'),type='jpeg',quality=85)

            page.evaluate("location.hash='S02'")
            page.locator('.material-placement-stage').wait_for()
            assert page.get_by_role('button', name='자동재생', exact=True).count() == 0
            page.evaluate("location.hash='S09'")
            page.locator('.invention-stage').wait_for()
            assert page.get_by_role('button', name='자동재생', exact=True).count() == 0
            checks.append({'name':'material and evidence decisions are manual'})
            assert judgments() == before
            assert not errors, errors
            report['passed'] = True
        finally:
            context.close()
except Exception as error:
    report.update({'passed':False,'error':str(error),'traceback':traceback.format_exc()})
finally:
    (OUT/'speed-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(json.dumps(report,ensure_ascii=False),flush=True)
raise SystemExit(0 if report['passed'] else 1)
