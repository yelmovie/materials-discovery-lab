"""Fresh-student playthrough that presses only visible UI and counts taps per activity.

Run: .tmp/pwvenv/bin/python tools/check-flow-clicks.py http://127.0.0.1:5178 [1280x800]
Fails if any step cannot be pressed, a lab can be finished without its key action,
or the concept film can be left before its first scene. Temporary files stay in .tmp.
"""
import sys, os, json, re, time, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
TMP = ROOT / '.tmp' / 'flow-clicks'
TMP.mkdir(parents=True, exist_ok=True)
for k in ('TMPDIR', 'TMP', 'TEMP'):
    os.environ[k] = str(TMP)
tempfile.tempdir = str(TMP)
from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:5178').rstrip('/')
W, H = map(int, (sys.argv[2] if len(sys.argv) > 2 else '1280x800').split('x'))
OUT = TMP / f'{W}x{H}'
OUT.mkdir(parents=True, exist_ok=True)
clicks, errors, notes = {}, [], []
where = 'home'


def tap(loc, label=None, timeout=8000):
    loc = loc.first
    loc.wait_for(state='visible', timeout=timeout)
    t0 = time.time()
    while not loc.is_enabled():
        if time.time() - t0 > timeout / 1000:
            raise RuntimeError(f'{where}: disabled {label or loc}')
        time.sleep(.1)
    loc.click(timeout=timeout)
    clicks[where] = clicks.get(where, 0) + 1


def gesture(page, loc):
    """Perform the hand motion the control asks for: tap, press-and-hold, or slide."""
    global where
    loc = loc.first
    loc.wait_for(state='visible', timeout=8000)
    kind = loc.get_attribute('data-gesture')
    box = loc.bounding_box()
    y = box['y'] + box['height'] / 2
    if kind == 'tap':
        loc.click()
    elif kind == 'hold':
        page.mouse.move(box['x'] + 28, y); page.mouse.down(); page.wait_for_timeout(1100); page.mouse.up()
    else:
        page.mouse.move(box['x'] + 28, y); page.mouse.down()
        for i in range(1, 13):
            page.mouse.move(box['x'] + 28 + (box['width'] - 30) * i / 12, y); page.wait_for_timeout(30)
        page.mouse.up()
    clicks[where] = clicks.get(where, 0) + 1


def route(page):
    return page.evaluate('location.hash.slice(1)')


def footer(page):
    return page.locator('.activity-footer .primary')


def wait_footer(page, text, timeout=15000):
    page.wait_for_function('t=>{const b=document.querySelector(".activity-footer .primary");return b&&!b.disabled&&b.innerText.includes(t)}', arg=text, timeout=timeout)


def challenges(page, screen, refs):
    wait_footer(page, '새 의뢰')
    tap(footer(page), 'open requests')
    for c in [c for c in refs if c['screen'] == screen]:
        page.wait_for_function('t=>document.querySelector("#challenge-title")?.innerText===t', arg=c['title'], timeout=10000)
        labels = {o['id']: o['label'] for o in c['options']}
        if c['mode'] == 'classify':
            for a in c['answer']:
                oid, g = a.split(':')
                tap(page.locator('.challenge-classify .drag-token', has_text=labels[oid]))
                tap(page.locator(f'.challenge-classify [data-drop-slot="{g}"]'))
        else:
            for a in c['answer']:
                tap(page.locator('.challenge-options .choice', has_text=labels[a]))
        page.wait_for_selector('.challenge-feedback.success', timeout=5000)
    page.wait_for_function('()=>{const b=document.querySelector(".activity-footer .primary");return b&&!b.disabled&&b.innerText.includes("개념 보고")}', timeout=8000)


def concept(page, final_text):
    tap(footer(page), 'concept')
    btn = page.locator('.concept-actions .primary')
    btn.wait_for(timeout=8000)
    if btn.is_enabled() and '첫 장면' in btn.inner_text():
        errors.append(f'{where}: concept leave enabled too early')
    page.wait_for_function('()=>{const b=document.querySelector(".concept-actions .primary");return b&&!b.disabled}', timeout=25000)
    tap(btn, 'concept continue')
    if final_text:
        tap(page.get_by_role('button', name=re.compile(final_text)), 'reward', timeout=12000)


def to_next(page, expect):
    global where
    if route(page) == 'world':
        page.wait_for_function('()=>{const b=document.querySelector(".map-next-action");return b&&!b.disabled}', timeout=30000)
        where = expect
        tap(page.locator('.map-next-action'), 'map next')
    page.wait_for_function('r=>location.hash.startsWith("#"+r)', arg=expect, timeout=15000)
    where = expect
    page.wait_for_timeout(600)


def maker(page, screen, orders):
    order = next(o for o in orders if o['screen'] == screen)
    wait_footer(page, '주문 제작')
    tap(footer(page), 'open maker')
    for slot in order['slots']:
        choice = next(c for c in slot['choices'] if c['id'] in slot['accept'])
        tap(page.locator('.maker-choice-row', has_text=slot['label']).locator('button', has_text=choice['label']))
        tap(page.locator(f'.maker-socket[aria-label^="{slot["label"]} 자리"]'))
    tap(page.get_by_role('button', name=order['trial']))
    tap(page.locator('.maker-deliver'), timeout=6000)


PAGE=[None]

def main():
    global where
    with sync_playwright() as p:
        b = p.chromium.launch(channel='chrome', args=['--autoplay-policy=no-user-gesture-required'])
        ctx = b.new_context(viewport={'width': W, 'height': H}, service_workers='block')
        page = ctx.new_page()
        PAGE[0] = page
        page.on('pageerror', lambda e: errors.append(f'pageerror {e}'))
        page.on('console', lambda m: m.type == 'error' and 'Failed to load resource' not in m.text and errors.append(f'console {m.text[:160]}'))
        page.goto(BASE + '/#home')
        page.evaluate('localStorage.clear()')
        page.reload()
        page.wait_for_timeout(1200)
        refs = page.evaluate("async()=>(await import('/src/domain/challenges.ts')).challenges")
        orders = page.evaluate("async()=>(await import('/src/domain/maker.ts')).makerOrders")
        model = page.evaluate("async()=>{const m=await import('/src/domain/model.ts');const r={};for(const e of m.experiments){r[e]={};for(const x of m.materials)r[e][m.shortNames[x.id]]=m.resultFor(e,x.id);}return {results:r,names:m.experimentNames}}")
        try:
            tap(page.get_by_role('button', name=re.compile('실험 바로 시작')))
            to_next(page, 'S01')
            # S01
            for name in ['우산 천', '금속 살', '손잡이']:
                tap(page.get_by_role('button', name=f'{name} 살펴보기').first)
            page.screenshot(path=str(OUT / 'S01.png'))
            challenges(page, 'S01', refs); concept(page, None)
            to_next(page, 'S02')
            for mat, slot in [('천', 'canopy'), ('금속', 'frame'), ('나무', 'handle')]:
                src = page.locator('.drag-token', has_text=mat).first.bounding_box()
                dst = page.locator(f'.object-marker[data-drop-slot="{slot}"]').first.bounding_box()
                page.mouse.move(src['x'] + src['width'] / 2, src['y'] + src['height'] / 2); page.mouse.down()
                for i in range(1, 11):
                    page.mouse.move(src['x'] + (dst['x'] + dst['width'] / 2 - src['x']) * i / 10, src['y'] + (dst['y'] + dst['height'] / 2 - src['y']) * i / 10); page.wait_for_timeout(20)
                page.mouse.up(); clicks[where] = clicks.get(where, 0) + 1
                page.wait_for_timeout(300)
            page.wait_for_function('()=>JSON.parse(localStorage.getItem("material-workshop-mission.student.v1")).checkpoints.matched.length===3', timeout=5000)
            page.screenshot(path=str(OUT / 'S02.png'))
            maker(page, 'S02', orders)
            challenges(page, 'S02', refs); concept(page, '불이 켜진 공방')
            to_next(page, 'S03')
            page.screenshot(path=str(OUT / 'S03-ready.png'))
            lab_samples(page, model)
            challenges(page, 'S03', refs); concept(page, None)
            to_next(page, 'S04')
            for mat, slot, prop in [('투명 유리', 'window', '빛이 통과한다'), ('부드러운 고무', 'bumper', '눌렸다가 돌아온다')]:
                tap(page.locator('.drag-token', has_text=mat)); tap(page.locator(f'[data-drop-slot="{slot}"]'))
                tap(page.locator('.property-choices .choice', has_text=prop))
                page.wait_for_timeout(300)
            page.screenshot(path=str(OUT / 'S04.png'))
            challenges(page, 'S04', refs); concept(page, '불이 켜진 공방')
            to_next(page, 'S05')
            page.screenshot(path=str(OUT / 'S05-predict.png'))
            tap(page.locator('.prediction-inline .choice', has_text='모양과 크기가 그대로'))
            for n in ['처음 컵', '넓은 용기', '길쭉한 용기']:
                tap(page.get_by_role('button', name=f'{n}에 나무토막 옮기기'))
                page.wait_for_timeout(250)
            tap(page.locator('.choice', has_text='나무토막의 모양과 크기는 그대로야'))
            page.screenshot(path=str(OUT / 'S05.png'))
            challenges(page, 'S05', refs); concept(page, None)
            to_next(page, 'S06')
            tap(page.locator('.prediction-inline .choice', has_text='모양은 달라지고 양은 같을'))
            for i in range(3):
                tap(page.get_by_role('button', name='끝까지 붓기'))
                page.wait_for_function('n=>JSON.parse(localStorage.getItem("material-workshop-mission.student.v1")).checkpoints.liquidStep>n', arg=i, timeout=10000)
                page.wait_for_timeout(300)
            tap(page.get_by_role('button', name='용기에 따라 모양은 바뀌지만, 돌아온 물의 양은 같아.'))
            tap(page.get_by_role('button', name=re.compile('모래알 확대 관찰하기')))
            tap(page.get_by_role('button', name=re.compile('모래는 흘러도')))
            page.screenshot(path=str(OUT / 'S06.png'))
            maker(page, 'S06', orders)
            challenges(page, 'S06', refs); concept(page, '불이 켜진 공방')
            to_next(page, 'S07')
            tap(page.get_by_role('button', name=re.compile('마른 휴지 먼저 확인')))
            tap(page.get_by_role('button', name='컵을 물속에 넣기'))
            page.wait_for_selector('.evidence-card', timeout=6000)
            page.screenshot(path=str(OUT / 'S07.png'))
            challenges(page, 'S07', refs); concept(page, None)
            to_next(page, 'S08')
            tap(page.get_by_role('button', name='같은 깊이에서 배출구 열기'))
            tap(page.locator('.choice', has_text='공기가 빠져나갔어요'), timeout=8000)
            for _ in range(3):
                tap(page.locator('button', has_text=re.compile('펌프를 세 번')))
                page.wait_for_timeout(200)
            page.screenshot(path=str(OUT / 'S08.png'))
            maker(page, 'S08', orders)
            challenges(page, 'S08', refs); concept(page, '불이 켜진 공방')
            to_next(page, 'S09')
            page.screenshot(path=str(OUT / 'S09-start.png'))
            for mat, slot in [('금속', 'body'), ('투명 플라스틱', 'window'), ('부드러운 고무', 'bumper')]:
                tap(page.locator('.drag-token', has_text=re.compile('^' + mat))); tap(page.locator(f'[data-drop-slot="{slot}"]'))
            # Metal has no water record yet: the designed trip back to the lab.
            tap(page.get_by_role('button', name=re.compile('몸체 살펴보기')))
            tap(page.get_by_role('button', name=re.compile('시험실에서 근거 더 모으기')))
            to_next(page, 'S03')
            where = 'S09'
            tap(page.get_by_role('button', name=re.compile('물방울 떨어뜨리기')))
            tap(page.get_by_role('button', name=re.compile('다른 재료도 시험하기')))
            tap(page.locator('.modal .choice', has_text='금속'))
            page.wait_for_selector('.sample-answer-options', timeout=6000)
            tap(page.locator('.sample-answer-options .choice', has_text=model['results']['water_absorption']['금속']))
            tap(page.get_by_role('button', name=re.compile('설계로 돌아가기')))
            to_next(page, 'S09')
            tap(page.locator('.drag-token', has_text=re.compile('^금속'))); tap(page.locator('[data-drop-slot="body"]'))
            page.screenshot(path=str(OUT / 'S09.png'))
            challenges(page, 'S09', refs); concept(page, None)
            to_next(page, 'S10')
            for t in ['비 시험', '빛 시험', '모서리 누르기 시험']:
                tap(page.get_by_role('button', name=t, exact=True))
                gesture(page, page.locator('.test-gesture'))
                page.wait_for_timeout(1600)
            page.screenshot(path=str(OUT / 'S10.png'))
            challenges(page, 'S10', refs); concept(page, '불이 켜진 공방')
            page.wait_for_function('()=>location.hash==="#world"', timeout=15000)
            where = 'final'
            page.wait_for_function('()=>{const b=document.querySelector(".map-next-action");return b&&!b.disabled}', timeout=30000)
            tap(page.locator('.map-next-action'))
            tap(page.get_by_role('button', name=re.compile('연구 보고서 전달하기')))
            hold = page.get_by_role('button', name='길게 눌러 코어 재가동')
            hold.wait_for(); box = hold.bounding_box()
            page.mouse.move(box['x'] + 20, box['y'] + 10); page.mouse.down(); page.wait_for_timeout(1900); page.mouse.up()
            clicks[where] += 1
            page.screenshot(path=str(OUT / 'core.png'))
            page.wait_for_function('()=>location.hash.includes("ending")||location.hash.includes("certificate")', timeout=10000)
            if 'ending' in route(page):
                tap(page.get_by_role('button', name=re.compile('연출 건너뛰기')))
            page.wait_for_selector('#certificate', timeout=10000)
            page.screenshot(path=str(OUT / 'certificate.png'))
        except Exception:
            page.screenshot(path=str(OUT / 'failure.png'))
            raise
        b.close()


def lab_samples(page, model):
    names = {v: k for k, v in model['names'].items()}
    for _ in range(40):
        if page.evaluate('()=>{const b=document.querySelector(".activity-footer .primary");return !!b&&!b.disabled&&b.innerText.includes("새 의뢰")}'):
            return
        run = page.locator('.experiment-run-button')
        if run.count() and run.is_visible():
            gesture(page, run)
        page.wait_for_selector('.sample-answer-options .choice:not([disabled])', timeout=8000)
        sample = page.locator('.experiment-eyebrow').inner_text().strip()
        exp = names[re.sub(r'^\d+|✓', '', page.locator('.experiment-tabs [aria-pressed=true]').inner_text()).strip()]
        tap(page.locator('.sample-answer-options .choice', has_text=model['results'][exp][sample]))
        page.wait_for_timeout(2300)
    raise RuntimeError('S03 did not finish')


try:
    main()
    status = 'PASS' if not errors else 'FAIL'
except Exception as e:  # noqa: BLE001
    status = 'FAIL'
    try:
        PAGE[0].screenshot(path=str(OUT / 'failure.png'))
    except Exception:
        pass
    errors.append(f'{where}: {e}')
report = {'viewport': f'{W}x{H}', 'status': status, 'taps': clicks, 'total': sum(clicks.values()), 'errors': errors}
(OUT / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=1))
print(json.dumps(report, ensure_ascii=False, indent=1))
sys.exit(0 if status == 'PASS' else 1)
