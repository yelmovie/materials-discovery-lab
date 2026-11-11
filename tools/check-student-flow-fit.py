"""Student-only end-to-end check for the compact labs and real playback button.

Run: python tools/check-student-flow-fit.py [http://127.0.0.1:5319]
Optional QA_VIEWPORT=1280x800 and QA_OUTPUT=/absolute/external/SSD/output.
QA_REFERENCE may point to expected domain data exported from the tested source
when checking a production build. Service workers are blocked in this flow so
the deliberate video-network failure reaches the fallback. Offline QA is separate.
The browser and this process write temporary files only below the project .tmp.
No student state is seeded and no reducer is called from this test. Domain imports
provide expected labels/answers only; every experiment and decision uses the UI.
"""
import sys
sys.dont_write_bytecode = True
import json
import ast
import os
import re
import tempfile
import traceback
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TMP = Path(os.environ.get('QA_TMP', ROOT / '.tmp' / 'fit-student-flow'))
for directory in [TMP, TMP / 'downloads', TMP / 'chrome-cache', TMP / 'crashes']:
    directory.mkdir(parents=True, exist_ok=True)
for key in ('TMPDIR', 'TMP', 'TEMP'):
    os.environ[key] = str(TMP)
os.environ['PYTHONDONTWRITEBYTECODE'] = '1'
os.environ['PYTHONPYCACHEPREFIX'] = str(TMP / 'pycache')
os.environ['XDG_CACHE_HOME'] = str(TMP / 'cache')
tempfile.tempdir = str(TMP)

from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:5319').rstrip('/')
OUT = Path(os.environ.get('QA_OUTPUT', ROOT / 'docs/reviews/fit-20261108/student-flow'))
OUT.mkdir(parents=True, exist_ok=True)
SAVE_KEY = 'material-workshop-mission.student.v1'
events, errors, playback_checks = [], [], []
layout_checks=[]
FIT_SCAN=next(node.value.value for node in ast.parse((ROOT/'tools/check-fit.py').read_text()).body if isinstance(node,ast.Assign) and any(isinstance(target,ast.Name) and target.id=='SCAN' for target in node.targets))
current_step = 'initialization'
challenges, lab = [], {}
reference = json.loads(Path(os.environ['QA_REFERENCE']).read_text()) if os.environ.get('QA_REFERENCE') else None


def stage(name):
    global current_step
    current_step = name
    print(name, flush=True)


def saved(page):
    return page.evaluate('(key) => JSON.parse(localStorage.getItem(key))', SAVE_KEY)


def wait_saved(page, expression, timeout=10000):
    return page.wait_for_function(
        '(arg) => { const s=JSON.parse(localStorage.getItem(arg.key)); '
        'return s && new Function("s", "return ("+arg.expression+")")(s); }',
        arg={'key': SAVE_KEY, 'expression': expression}, timeout=timeout)


def decisions(state):
    return {key: state[key] for key in ['predictions', 'initialPredictions', 'challengeResults']} | {
        'designNeeds': state['design']['needs'],
        'designParts': state['design']['parts'],
    }


def fit_page(page,label):
    if os.environ.get('QA_FIT')!='1' or page.locator('dialog[open]').count() or not page.locator('.live-activity').count():
        return
    route=page.locator('.app').get_attribute('class')
    screen=re.search(r'route-(S\d{2})',route).group(1)
    view='challenge' if page.locator('.transfer-workspace').count() else 'lab'
    data=page.evaluate(FIT_SCAN,{'screen':screen,'view':view,'scope':'page'})
    layout_checks.append({'name':label,'screen':screen,'view':view,'issues':data['issues']})
    assert not data['issues'],f'{label}: screen needs scrolling or hides controls: {json.dumps(data["issues"],ensure_ascii=False)}'


def assert_decisions_unchanged(before, page, label):
    after = decisions(saved(page))
    assert after == before, f'{label}: autoplay changed a student judgment: {before!r} -> {after!r}'


def playback_is(page, playing):
    return page.locator('.experiment-playback-button').get_attribute('aria-pressed') == str(playing).lower()


def start_playback(page):
    button = page.get_by_role('button', name='자동재생', exact=True)
    button.wait_for(state='visible')
    page.wait_for_function(
        "document.querySelector('.experiment-playback-button')?.disabled===false", timeout=3000)
    assert button.is_enabled(), f'{current_step}: automatic playback is disabled'
    button.click()
    page.wait_for_function(
        "document.querySelector('.experiment-playback-button')?.getAttribute('aria-pressed')==='true'",
        timeout=3000)


def auto(page, label, timeout=20000):
    before = decisions(saved(page))
    stage(label)
    start_playback(page)
    page.wait_for_function(
        "document.querySelector('.experiment-playback-button')?.getAttribute('aria-pressed')==='false'",
        timeout=timeout)
    message = page.locator('.experiment-playback-error')
    assert not message.count() or not message.inner_text().strip(), f'{label}: {message.inner_text()}'
    assert_decisions_unchanged(before, page, label)
    fit_page(page,label+' completed')
    playback_checks.append({'name': label, 'judgmentsPreserved': True})


def go(page, screen):
    stage('open ' + screen)
    page.evaluate('(s) => {location.hash=s}', screen)
    page.locator('.live-activity .activity-grid').wait_for(state='visible')
    wait_saved(page, f's.lastRoute==={json.dumps(screen)} && s.lastPhase==="activity"')
    assert not page.locator('.demo-mode').count(), 'Teacher mode must never be used by this student flow'
    fit_page(page,screen+' initial')


def token(page, label, root='.workspace .drag-tokens'):
    return page.locator(root).get_by_role('button', name=label, exact=True)


def slot(page, label, root='.workspace .drop-slots'):
    return page.locator(root).locator('.drop-slot').filter(has=page.get_by_text(label, exact=True))


def drag(page, source, target, relative_y=.5):
    source.wait_for(state='visible')
    target.wait_for(state='visible')
    a, b = source.bounding_box(), target.bounding_box()
    assert a and b, f'{current_step}: drag target or token has no box'
    page.mouse.move(a['x']+a['width']/2, a['y']+a['height']/2)
    page.mouse.down()
    page.mouse.move(b['x']+b['width']/2, b['y']+b['height']*relative_y, steps=12)
    page.mouse.up()


def place(page, label, part, pointer=False):
    source, target = token(page, label), slot(page, part)
    if pointer:
        drag(page, source, target)
    else:
        source.click()
        target.click()


def solve(page, screen):
    stage(screen + ' manual transfer tasks')
    before = saved(page)
    fit_page(page,screen+' lab final')
    page.get_by_role('button', name=re.compile('2.*새 의뢰')).click()
    for task in [c for c in challenges if c['screen'] == screen]:
        page.locator('#challenge-title').wait_for(state='attached')
        assert page.locator('#challenge-title').inner_text()==task['title']
        assert page.locator('.challenge-options .choice[aria-pressed=true]').count() == 0, \
            task['id'] + ': answer already selected before student input'
        if task['mode'] == 'classify':
            for index, answer in enumerate(task['answer']):
                item, group = answer.split(':')
                item_label = next(o['label'] for o in task['options'] if o['id'] == item)
                group_label = next(g['label'] for g in task['groups'] if g['id'] == group)
                source = token(page, item_label, '.challenge-classify .drag-tokens')
                target = slot(page, group_label, '.challenge-classify .drop-slots')
                if index == 0:
                    drag(page, source, target)
                else:
                    source.click()
                    target.click()
        else:
            for answer in task['answer']:
                label = next(o['label'] for o in task['options'] if o['id'] == answer)
                page.locator('.challenge-options .choice').filter(has=page.get_by_text(label, exact=True)).click()
        fit_page(page,task['id']+' selected')
        page.locator('.activity-footer>.primary').click()
        page.locator('.challenge-feedback.success').wait_for()
        wait_saved(page, f's.challengeResults.some(r=>r.id==={json.dumps(task["id"])})')
        fit_page(page,task['id']+' result')
        if task['id'].endswith('-a'):
            page.locator('.activity-footer>.primary').click()
    assert len(saved(page)['challengeResults']) == len(before['challengeResults']) + 2


def finish(page, screen, video_failure=False):
    solve(page, screen)
    stage(screen + ' concept and continuation')
    if video_failure:
        page.route('**/assets/concepts/S02.*', lambda route: route.abort())
    page.locator('.activity-footer>.primary').click()
    page.locator('dialog[open] video').wait_for()
    if video_failure:
        play = page.get_by_role('button', name='15초 개념 영상 보기')
        if play.count() and play.is_visible():
            play.click()
        page.locator('.concept-fallback').wait_for(timeout=12000)
        assert page.locator('.concept-fallback li').count() == 3
        events.append('Video failure preserves three concept captions and continuation')
    else:
        page.get_by_role('button', name='15초 개념 영상 보기').click()
        page.wait_for_function('document.querySelector("dialog[open] video").currentTime>.2', timeout=12000)
        expected_duration = reference['conceptDuration'] if reference else page.evaluate("async()=> (await import('/src/domain/concepts.ts')).CONCEPT_SECONDS")
        assert page.locator('dialog[open] video').evaluate('(v,duration)=>Math.abs(v.duration-duration)<.15', expected_duration)
        if screen == 'S01':
            page.get_by_role('button', name='개념 영상 일시 정지').click()
            position = page.locator('dialog[open] video').evaluate('(v)=>v.currentTime')
            page.get_by_role('button', name='이어서 보기').click()
            page.wait_for_function('(t)=>document.querySelector("dialog[open] video").currentTime>t+.1', arg=position)
            events.append('Concept video pause/resume preserves its playback position')
    page.locator('.concept-actions .primary').click()
    if video_failure:
        page.unroute('**/assets/concepts/S02.*')
    if int(screen[1:]) % 2 == 0:
        page.get_by_role('button', name=re.compile('불이 켜진 공방 보러 가기')).click()
    wait_saved(page, f's.completedScreens.includes({json.dumps(screen)})')
    events.append(screen + ': lab, two manual transfer tasks, concept, continuation')
    print(screen + ' OK', flush=True)


def choose_sample(page, experiment, sample):
    label = lab['names'][sample]
    choice = page.locator('.tools .sample-grid').get_by_role('button', name=re.compile('^'+re.escape(label)+r'(?:\s*✓)?$'))
    if choice.count():
        choice.click()
    else:
        page.get_by_role('button', name=re.compile('다른 시료도 시험하기')).click()
        page.locator('dialog[open] .sample-grid').get_by_role('button', name=label, exact=True).click()
        page.locator('dialog[open]').wait_for(state='hidden')


def observe(page, experiment, sample):
    choose_sample(page, experiment, sample)
    before_count = len(saved(page)['observations'])
    if experiment=='elastic_return' and sample=='rubber_soft':
        before=decisions(saved(page))
        page.get_by_label('자동재생 속도',exact=True).select_option('0.5')
        start_playback(page)
        page.locator('.experiment-playback-button[aria-pressed=true]').click()
        page.wait_for_function("document.querySelector('.sample-simulation')?.classList.contains('ready')")
        assert_decisions_unchanged(before,page,'S03 interrupted experiment')
        playback_checks.append({'name':'S03 interrupted experiment returns to ready','judgmentsPreserved':True})
        page.get_by_label('자동재생 속도',exact=True).select_option('1')
    auto(page, f'S03 playback {experiment}/{sample}')
    page.locator('.sample-answer-options .choice').first.wait_for(state='visible')
    assert page.locator('.sample-answer-options .choice[aria-pressed=true]').count() == 0, \
        'Autoplay must stop before selecting the observed answer'
    assert len(saved(page)['observations']) == before_count, 'Autoplay must not submit the S03 observation'
    expected = lab['results'][experiment][sample]
    page.locator('.sample-answer-options .choice').filter(has=page.get_by_text(expected, exact=True)).click()
    page.get_by_role('button', name='관찰 기록하기', exact=True).click()
    wait_saved(page, f's.observations.some(o=>o.experiment==={json.dumps(experiment)}&&o.sampleId==={json.dumps(sample)})')
    fit_page(page,experiment+'/'+sample+' recorded')
    page.get_by_role('button', name=re.compile('다른 시료와 비교')).click()


def predict(page, label):
    page.get_by_role('button', name='1. 먼저 예상해 보자', exact=False).click()
    page.locator('dialog[open]').get_by_role('button', name=label, exact=True).click()
    page.locator('dialog[open]').wait_for(state='hidden')


def water_values(page):
    return page.locator('.water-balance>span b').all_text_contents()


def assert_stopped_water(page, before_decisions, label):
    page.wait_for_function(
        "document.querySelector('.experiment-playback-button')?.getAttribute('aria-pressed')==='false'",
        timeout=3000)
    page.wait_for_timeout(150)
    values = water_values(page)
    page.wait_for_timeout(350)
    assert water_values(page) == values, f'{label}: water keeps moving after playback stopped'
    assert_decisions_unchanged(before_decisions, page, label)
    playback_checks.append({'name': label, 'judgmentsPreserved': True, 'waterStopped': True, 'volumes': values})


def run_flow(page):
    global challenges, lab
    page.goto(BASE+'/#S01', wait_until='networkidle', timeout=60000)
    page.locator('.live-activity .umbrella-stage').wait_for()
    if reference:
        challenges, lab = reference['challenges'], reference['lab']
    else:
        challenges = page.evaluate("async()=> (await import('/src/domain/challenges.ts')).challenges")
        lab = page.evaluate("async()=>{const m=await import('/src/domain/model.ts');return {experiments:m.experiments,comparisons:m.requiredComparisons,names:m.shortNames,results:Object.fromEntries(m.experiments.map(e=>[e,Object.fromEntries(m.materials.map(s=>[s.id,m.resultFor(e,s.id)]))]))}}")
    assert saved(page)['origin'] == 'student' and saved(page)['completedScreens'] == []

    stage('S01 manual part recording')
    for part in ['우산 천', '금속 살', '손잡이']:
        page.get_by_role('button', name=part+' 살펴보기', exact=True).click()
        page.get_by_role('button', name='이 부분 기록하기', exact=True).click()
    finish(page, 'S01')

    go(page, 'S02')
    for index, (material, part, name) in enumerate([('천', 'canopy', '우산 천'), ('금속', 'frame', '금속 살'), ('나무', 'handle', '손잡이')]):
        place(page, material, name, pointer=index == 0)
        page.get_by_role('combobox', name='연결할 관찰 기록').select_option(part)
        page.get_by_role('button', name='근거와 함께 연결').click()
    finish(page, 'S02', video_failure=True)

    go(page, 'S03')
    for index, experiment in enumerate(lab['experiments']):
        page.locator('.experiment-tabs button').nth(index).click()
        for sample in lab['comparisons'][experiment]:
            observe(page, experiment, sample)
    finish(page, 'S03')

    go(page, 'S04')
    for sample, part, prop in [('glass_clear', '관찰창', 'transparent'), ('rubber_soft', '모서리 보호대', 'cushioning')]:
        place(page, lab['names'][sample], part)
        page.get_by_role('combobox', name='필요한 성질').select_option(prop)
        page.get_by_role('combobox', name='내가 기록한 관찰').select_option(index=1)
        page.get_by_role('button', name='이 재료로 의뢰 해결').click()
    finish(page, 'S04')

    go(page, 'S05')
    predict(page, '용기에 맞춰 달라질 것 같아')
    wait_saved(page, 's.predictions.S05==="change"')
    auto(page, 'S05 three vessel moves')
    wait_saved(page, 's.checkpoints.solid.length===3')
    assert 'solidConclusion' not in saved(page)['predictions'], 'Autoplay selected the solid conclusion'
    assert page.locator('.stage-conclusion-options .choice[aria-pressed=true]').count() == 0
    page.get_by_role('button', name='나무토막의 모양과 크기는 그대로야.', exact=True).click()
    finish(page, 'S05')

    go(page, 'S06')
    predict(page, '모양과 양이 모두 달라질 것 같아')
    wait_saved(page, 's.predictions.S06==="change"')
    before = decisions(saved(page))
    start_playback(page)
    page.wait_for_function("[...document.querySelectorAll('.water-balance>span b')].map(e=>e.textContent).join(',')!=='100%,0%,0%'")
    page.locator('.experiment-playback-button[aria-pressed=true]').click()
    assert_stopped_water(page, before, 'S06 explicit stop')
    before = decisions(saved(page))
    initial_water = water_values(page)
    start_playback(page)
    page.wait_for_function('(before)=>JSON.stringify([...document.querySelectorAll(".water-balance>span b")].map(e=>e.textContent))!==JSON.stringify(before)', arg=initial_water)
    page.get_by_role('slider', name='붓기 기울기').press('ArrowRight')
    assert_stopped_water(page, before, 'S06 manual slider input stops playback')
    auto(page, 'S06 real transfer through all three vessels', timeout=25000)
    wait_saved(page, 's.checkpoints.liquidStep===3')
    assert water_values(page) == ['100%', '0%', '0%']
    assert 'liquidConclusion' not in saved(page)['predictions']
    assert 'sandConclusion' not in saved(page)['predictions']
    page.get_by_role('button', name='용기에 따라 모양은 바뀌지만, 돌아온 물의 양은 같아.', exact=True).click()
    assert page.get_by_role('button', name='모래는 흘러도, 알갱이는 모양을 유지하는 고체야.', exact=True).count() == 0
    auto(page, 'S06 automatic sand magnification stops before conclusion')
    assert 'sandConclusion' not in saved(page)['predictions']
    assert page.get_by_role('button', name='용기에 따라 모양은 바뀌지만, 돌아온 물의 양은 같아.', exact=True).count() == 0
    page.get_by_role('button', name='모래는 흘러도, 알갱이는 모양을 유지하는 고체야.', exact=True).click()
    finish(page, 'S06')

    go(page, 'S07')
    auto(page, 'S07 dry tissue and closed-cup observation')
    wait_saved(page, 's.checkpoints.closed!==null')
    assert saved(page)['checkpoints']['closed']['tissueWet'] is False
    finish(page, 'S07')

    go(page, 'S08')
    assert page.locator('.air-cup.vented').count() == 0, 'S08 must start with the vent closed for a fresh comparison'
    auto(page, 'S08 open vent and record observations')
    wait_saved(page, 's.checkpoints.open!==null')
    assert saved(page)['checkpoints']['open']['tissueWet'] is True
    assert saved(page)['checkpoints']['airCompared'] is False, 'Autoplay answered the air comparison'
    assert saved(page)['checkpoints']['inflated'] is False
    page.get_by_role('button', name='공기가 빠져나갔어요', exact=True).click()
    wait_saved(page, 's.checkpoints.airCompared')
    start_playback(page)
    page.wait_for_function("parseFloat(document.querySelector('.pump-meter span')?.style.width||'0')>=60")
    page.locator('.experiment-playback-button[aria-pressed=true]').click()
    assert not saved(page)['checkpoints']['inflated']
    assert page.get_by_role('button',name=re.compile('펌프를 세 번 눌러 봐')).is_enabled()
    playback_checks.append({'name':'S08 interrupted pumping remains manually resumable','judgmentsPreserved':True})
    auto(page, 'S08 pump three times')
    wait_saved(page, 's.checkpoints.inflated')
    finish(page, 'S08')

    go(page, 'S09')
    stage('S09 manually choose needs and gather missing evidence')
    page.get_by_role('button', name=re.compile('필요한 성질 확인')).click()
    for checkbox in page.locator('dialog[open] input[type=checkbox]').all():
        checkbox.check()
    page.locator('dialog[open]').get_by_role('button', name='탐구로 돌아가기', exact=True).click()
    page.get_by_role('button', name=re.compile('시험실에서 근거 더 모으기')).click()
    page.locator('.experiment-tabs button').nth(2).click()
    observe(page, 'water_absorption', 'metal_plate')
    page.get_by_role('button', name=re.compile('설계로 돌아가기')).click()
    page.locator('.invention-stage').wait_for()
    for part in ['몸체', '관찰창', '모서리 보호대']:
        page.get_by_role('button', name=part+' 살펴보기', exact=True).click()
        page.get_by_role('button', name=re.compile('관찰 근거 연결')).click()
        checkboxes = page.locator('dialog[open] .design-evidence-pair input[type=checkbox]')
        assert checkboxes.count(), part + ': expected recorded evidence is missing'
        assert page.locator('dialog[open] .design-evidence-pair small').all_text_contents(), part + ': full evidence text is missing'
        for checkbox in checkboxes.all():
            checkbox.check()
        page.locator('dialog[open]').get_by_role('button', name='탐구로 돌아가기', exact=True).click()
    finish(page, 'S09')

    go(page, 'S10')
    before_tests=saved(page)['testResults']
    start_playback(page)
    page.locator('.object-area.testing').wait_for()
    page.wait_for_timeout(100)
    page.locator('.experiment-playback-button[aria-pressed=true]').click()
    page.locator('.object-area.testing').wait_for(state='hidden')
    page.wait_for_timeout(1300)
    assert saved(page)['testResults']==before_tests,'Stopped S10 playback saved a late result'
    playback_checks.append({'name':'S10 stopping cancels pending test result','judgmentsPreserved':True})
    auto(page, 'S10 current-design rain, light and impact tests', timeout=15000)
    wait_saved(page, 's.testResults.filter(t=>t.attemptId===s.design.attemptId&&t.designRevision===s.design.revision&&t.pass).length===3')
    finish(page, 'S10')

    stage('Research report, core and certificate')
    page.evaluate("location.hash='S10/report'")
    page.get_by_role('button', name=re.compile('연구 보고서 전달하기')).click()
    for button in page.locator('.core-panel .stack .choice').all():
        button.click()
    button = page.get_by_role('button', name='길게 눌러 코어 재가동', exact=True)
    button.scroll_into_view_if_needed()
    a = button.bounding_box()
    page.mouse.move(a['x']+a['width']/2, a['y']+a['height']/2)
    page.mouse.down()
    page.wait_for_timeout(1600)
    page.mouse.up()
    page.get_by_role('button', name=re.compile('연출 건너뛰기')).click()
    page.get_by_role('textbox', name='인증서 별명').fill('모루와 탐구한 연구원')
    wait_saved(page, 's.name==="모루와 탐구한 연구원"')
    page.screenshot(path=str(OUT/'student-certificate.jpg'), type='jpeg', quality=85)
    state = saved(page)
    assert len(state['completedScreens']) == 10
    assert len(state['evidence']) == 5
    assert len(state['challengeResults']) == 20
    assert state['coreComplete'] and len(state['completionArchive']) == 1
    assert state['initialPredictions'] == {'S05': 'change', 'S06': 'change'}
    assert state['predictions']['S05'] == 'change' and state['predictions']['S06'] == 'change'
    assert state['predictions']['solidConclusion'] == 'same'
    assert state['predictions']['liquidConclusion'] == 'same'
    assert state['predictions']['sandConclusion'] == 'solid'
    page.reload(wait_until='networkidle')
    page.get_by_role('heading', name='모루와 탐구한 연구원', exact=True).wait_for()
    assert len(saved(page)['completionArchive']) == 1, 'Reload duplicated the completion archive'
    events.append('Report, core, certificate, nickname, original predictions, archive and reload persisted')
    return saved(page)


def main():
    global current_step
    report = {'base': BASE, 'events': events, 'playbackChecks': playback_checks, 'layoutChecks':layout_checks,'pageErrors': errors}
    browser = page = None
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(
                channel='chrome', headless=True, downloads_path=str(TMP/'downloads'),
                args=['--renderer-process-limit=2', '--disk-cache-dir='+str(TMP/'chrome-cache'), '--crash-dumps-dir='+str(TMP/'crashes')])
            width, height = map(int, os.environ.get('QA_VIEWPORT', '1280x800').split('x'))
            page = browser.new_page(viewport={'width': width, 'height': height}, reduced_motion='reduce', service_workers='block')
            page.set_default_timeout(30000)
            page.on('pageerror', lambda error: errors.append(str(error)))
            state = run_flow(page)
            assert not errors, f'Browser errors: {errors}'
            report.update({'status': 'passed', 'viewport': [width, height], 'completedScreens': len(state['completedScreens']), 'observations': len(state['observations']), 'evidence': len(state['evidence']), 'challenges': len(state['challengeResults']), 'archives': len(state['completionArchive'])})
        except Exception as error:
            report.update({'status': 'failed', 'failedAt': current_step, 'error': str(error), 'traceback': traceback.format_exc()})
            if page:
                try:
                    page.screenshot(path=str(OUT/'failure.jpg'), type='jpeg', quality=85)
                    report['failureState'] = {'url': page.url, 'save': saved(page), 'buttons': page.locator('button').evaluate_all('(buttons)=>buttons.filter(b=>b.getClientRects().length).map(b=>({text:b.innerText,ariaLabel:b.getAttribute("aria-label"),pressed:b.getAttribute("aria-pressed"),disabled:b.disabled}))'), 'bodyText': page.locator('body').inner_text()[:12000]}
                except Exception as capture_error:
                    report['captureError'] = str(capture_error)
            raise
        finally:
            (OUT/'student-flow-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
            print(json.dumps({key: value for key, value in report.items() if key not in ['failureState', 'traceback']}, ensure_ascii=True), flush=True)
            if browser:
                browser.close()


if __name__ == '__main__':
    main()
