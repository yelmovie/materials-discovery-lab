"""Strict, scroll-free stage QA. The root agent runs this; authoring it launches nothing.

Usage: .tmp/pwvenv/bin/python tools/check-fit.py [base URL] [label]
Filters: QA_PROFILES=915x412,390x844 QA_SCREENS=1,5,S07 QA_VIEWS=lab,challenge
Every browser profile, cache, crash directory, screenshot and report stays on the SSD.
A failing setup or individual stage still produces layout-report.json when the SSD is usable.
"""
import sys
sys.dont_write_bytecode = True
import json
import os
import plistlib
import re
import subprocess
import shutil
import tempfile
import traceback
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('QA_BASE', 'http://127.0.0.1:5319')
LABEL = sys.argv[2] if len(sys.argv) > 2 else 'after'
if not re.fullmatch(r'[A-Za-z0-9_.-]+', LABEL) or LABEL in ('.', '..'):
    raise SystemExit('The evidence label must be a simple directory name.')

# Do not fall back to an internal disk or the system temporary directory.
mount = ROOT
while not os.path.ismount(mount) and mount != mount.parent:
    mount = mount.parent
info = plistlib.loads(subprocess.check_output(['diskutil', 'info', '-plist', str(mount)]))
if info.get('Internal', True) or info.get('ReadOnlyVolume', False) or info.get('ReadOnlyMedia', False):
    raise SystemExit(f'External writable SSD required; refusing to write to {mount}')
if info.get('BusProtocol') not in ('USB', 'Thunderbolt', 'PCI-Express'):
    raise SystemExit(f'Physical external storage required, observed protocol: {info.get("BusProtocol")}')
if not os.access(ROOT, os.W_OK) or shutil.disk_usage(ROOT).free < 256 * 1024 * 1024:
    raise SystemExit('The external SSD is unavailable, read-only, or has insufficient free space.')

RUNTIME = ROOT / '.tmp' / ('fit-runtime-' + LABEL)
RUNTIME.mkdir(parents=True, exist_ok=True)
for key in ('TMPDIR', 'TMP', 'TEMP'):
    os.environ[key] = str(RUNTIME)
os.environ['PYTHONDONTWRITEBYTECODE'] = '1'
os.environ['PLAYWRIGHT_BROWSERS_PATH'] = str(ROOT / '.tmp/playwright-browsers')
OUT = ROOT / 'docs/reviews/fit-20261108' / LABEL
OUT.mkdir(parents=True, exist_ok=True)
PROFILES = [(1920, 1080), (1366, 768), (1280, 800), (1024, 600), (915, 412), (740, 360), (390, 844)]
if os.environ.get('QA_PROFILES'):
    PROFILES = [tuple(map(int, re.split('[xX]', value.strip()))) for value in os.environ['QA_PROFILES'].split(',')]
SCREENS = [int(value.strip().upper().removeprefix('S')) for value in os.environ.get('QA_SCREENS', '1,2,3,4,5,6,7,8,9,10').split(',')]
VIEWS = [value.strip() for value in os.environ.get('QA_VIEWS', 'lab,challenge').split(',')]
if any(len(profile) != 2 or min(profile) <= 0 for profile in PROFILES) or any(i not in range(1, 11) for i in SCREENS) or any(view not in ('lab', 'challenge') for view in VIEWS):
    raise SystemExit('Invalid QA_PROFILES, QA_SCREENS or QA_VIEWS filter.')

SCAN = r"""config => {
 const dialog=config.scope==='dialog'?document.querySelector('dialog[open]'):null;
 const root=dialog||document.querySelector('.app')||document.body;
 const issues=[],seen=new Set(),tol=2;
 const cls=e=>typeof e.className==='string'?e.className:e.className?.baseVal||e.tagName;
 const label=e=>(e.getAttribute('aria-label')||e.textContent||e.getAttribute('name')||e.tagName).replace(/\s+/g,' ').trim().slice(0,100);
 const rect=e=>e.getBoundingClientRect();
 const box=r=>({x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)});
 function add(kind,e,detail={}){const item={kind,label:label(e),selector:cls(e),...detail};const key=JSON.stringify(item);if(!seen.has(key)){seen.add(key);issues.push(item);}}
 function rendered(e){
  if(e.closest('[hidden],[aria-hidden="true"],[inert]')||e.matches('input[type="hidden"]'))return false;
  const closed=e.closest('details:not([open])');if(closed&&!closed.querySelector(':scope > summary')?.contains(e))return false;
  for(let a=e;a&&a!==document;a=a.parentElement){const s=getComputedStyle(a);if(s.display==='none'||s.visibility==='hidden'||s.visibility==='collapse')return false;}
  return true;
 }
 function opacity(e){let n=1;for(let a=e;a;a=a.parentElement)n*=Number(getComputedStyle(a).opacity);return n;}
 function clipping(r,e){
  const out=[];
  for(let a=e.parentElement;a;a=a.parentElement){
   const s=getComputedStyle(a),b=rect(a);
   // client box excludes the border: an overflow-hidden border does not hide its own border.
   const left=b.left+a.clientLeft,top=b.top+a.clientTop,right=left+a.clientWidth,bottom=top+a.clientHeight;
   const x=/^(hidden|clip|auto|scroll)$/.test(s.overflowX)&&(r.left<left-tol||r.right>right+tol);
   const y=/^(hidden|clip|auto|scroll)$/.test(s.overflowY)&&(r.top<top-tol||r.bottom>bottom+tol);
   if(x||y)out.push({by:cls(a),axes:(x?'x':'')+(y?'y':''),bounds:{left:Math.round(left),top:Math.round(top),right:Math.round(right),bottom:Math.round(bottom)}});
  }
  return out;
 }
 const containers=[];
 if(!dialog){
  for(const e of [document.documentElement,document.body,...root.querySelectorAll('main.activity-shell,.stage-body,.activity-grid,.workspace,.tools,.transfer-workspace')]){
   if(!rendered(e))continue;
   const data={selector:e===document.documentElement?'html':e===document.body?'body':cls(e),clientWidth:e.clientWidth,scrollWidth:e.scrollWidth,clientHeight:e.clientHeight,scrollHeight:e.scrollHeight};
   containers.push(data);
   if(e.scrollWidth>e.clientWidth+tol)add('scroll-x',e,data);
   if(e.scrollHeight>e.clientHeight+tol)add('scroll-y',e,data);
  }
 }
 const controls=[...root.querySelectorAll('button,a[href],input,select,textarea,summary,[role="button"],[role="slider"],[role="switch"]')];
 let controlsChecked=0,disabledChecked=0;
 for(const e of controls){
  if(!rendered(e))continue;
  controlsChecked++;
  const disabled=e.matches(':disabled,[aria-disabled="true"]');if(disabled)disabledChecked++;
  const hit=e.matches('input[type="checkbox"],input[type="radio"]')?e.closest('label')||e:e,r=rect(hit);
  if(r.width<1||r.height<1){add('collapsed-control',e,{...box(r),disabled});continue;}
  if(r.width<43||r.height<43)add('small-touch-target',e,{...box(r),disabled});
  if(r.left< -tol||r.right>innerWidth+tol||r.top< -tol||r.bottom>innerHeight+tol)add('control-viewport',e,{...box(r),disabled});
  const clips=clipping(r,hit);if(clips.length)add('control-clipped',e,{...box(r),disabled,clippedBy:clips});
  if(disabled)continue;
  if(opacity(e)<.05){add('invisible-control',e);continue;}
  if(getComputedStyle(e).pointerEvents==='none'){add('unhittable-control',e);continue;}
  const cx=r.left+r.width/2,cy=r.top+r.height/2,top=document.elementFromPoint(cx,cy);
  // The wood block intentionally lies inside a vessel; both controls move the same object.
  const woodInVessel=e.matches('.lab-vessel')&&top?.closest('.wood-block')&&e.closest('.solid-lab')===top.closest('.solid-lab');
  if(!top||(!hit.contains(top)&&!top.contains(hit)&&!woodInVessel))add('control-covered',e,{...box(r),by:top?cls(top):null});
 }
 // Inspect real text line fragments, not scrollHeight from decorative pseudo elements.
 let textNodesChecked=0;
 const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
 while(node=walk.nextNode()){
  if(!node.textContent.trim())continue;
  const e=node.parentElement;if(!e||!rendered(e)||opacity(e)<.05||e.closest('script,style,svg,option,.sr-only,.experiment-playback-announcement'))continue;
  if(getComputedStyle(e).pointerEvents==='none'&&e.closest('[aria-hidden="true"],.drag-ghost,.test-overlay,.air-bubbles'))continue;
  const r=rect(e);if(!r.width||!r.height)continue;
  const range=document.createRange();range.selectNodeContents(node);
  const lines=[...range.getClientRects()].filter(t=>t.width>.5&&t.height>.5);if(!lines.length)continue;
  textNodesChecked++;
  const text=node.textContent.replace(/\s+/g,' ').trim().slice(0,90);
  for(const t of lines){
   if(t.left<r.left-tol||t.right>r.right+tol||t.top<r.top-tol||t.bottom>r.bottom+tol)add('text-box-overflow',e,{text,line:box(t),parent:box(r)});
   if(t.left< -tol||t.right>innerWidth+tol||t.top< -tol||t.bottom>innerHeight+tol)add('text-viewport',e,{text,line:box(t)});
   const clips=clipping(t,e);if(clips.length)add('text-clipped',e,{text,line:box(t),clippedBy:clips});
  }
 }
 const diagramGroups={S01:'.object-scene',S02:'.object-scene',S03:'.experiment-scene',S04:'.assignment-visual,.request-illustration',S05:'.solid-scene',S06:'.liquid-vessels,.sand-comparison',S07:'.air-scene,.bag-simulation .experiment-scene',S08:'.air-scene,.bag-simulation .experiment-scene',S09:'.object-scene',S10:'.object-scene'};
 const diagrams=[];
 if(!dialog&&config.view==='lab'){
  const candidates=[...root.querySelectorAll(diagramGroups[config.screen]||'.object-scene,.experiment-scene,.matter-scene')];
  const actual=candidates.filter(rendered);
  if(!actual.length)add('diagram-missing',root,{screen:config.screen,expected:diagramGroups[config.screen]});
  for(const e of actual){const r=rect(e);diagrams.push({selector:cls(e),...box(r)});if(r.width<30||r.height<24)add('diagram-collapsed',e,box(r));}
 }
 // Automatic playback belongs to a toolbar above the experiment, never a bottom overlay.
 const grid=root.querySelector('.activity-grid,.transfer-workspace'),gridRect=grid?rect(grid):null;
 for(const e of controls.filter(e=>rendered(e)&&/자동.*(재생|진행|시연)|auto.?play/i.test(label(e)))){
  const toolbar=e.closest('.topbar,.activity-toolbar,.activity-heading,.demo-toolbar,[role="toolbar"],.toolbar'),r=rect(e);
  if(!toolbar||(gridRect&&r.bottom>gridRect.top+tol))add('autoplay-not-in-top-toolbar',e,{...box(r),toolbar:toolbar?cls(toolbar):null});
 }
 const modal=[...document.querySelectorAll('dialog[open]')].map(e=>({title:label(e),...box(rect(e))}));
 return {issues,containers,controlsChecked,disabledChecked,textNodesChecked,diagrams,openDialogs:modal,viewport:{width:innerWidth,height:innerHeight,scrollX,scrollY}};
}"""

report = {'startedAt': datetime.now(timezone.utc).isoformat(), 'base': BASE, 'label': LABEL,
          'profiles': PROFILES, 'stages': SCREENS, 'views': VIEWS, 'checks': [], 'dialogEvents': [],
          'pageErrors': [], 'consoleErrors': [], 'network404': [], 'requestFailures': [],
          'fatalErrors': [], 'runtime': str(RUNTIME), 'evidenceDirectory': str(OUT),
          'rules': {'overflowTolerancePx': 2, 'disabledControlsMustFit': True,
                    'scrollingAllowed': False, 'intentionalOverlap': 'wood block inside its vessel only'},
          'limitations': ['Headless Chrome only; real iPad/Android hardware is not measured.']}
page = None
context = None


def save_shot(name):
    if page is None or page.is_closed():
        return None
    target = OUT / f'{name}.jpg'
    try:
        page.screenshot(path=str(target), type='jpeg', quality=82, full_page=False, timeout=5000)
        return str(target)
    except Exception as error:
        report['fatalErrors'].append({'where': 'screenshot', 'name': name, 'error': str(error)})
        return None


def capture(name, screen, view, screenshot=False, scope='page'):
    try:
        data = page.evaluate(SCAN, {'screen': screen, 'view': view, 'scope': scope})
        item = {'name': name, 'screen': screen, 'view': view, 'scope': scope, **data}
    except Exception as error:
        item = {'name': name, 'screen': screen, 'view': view, 'scope': scope,
                'issues': [{'kind': 'scan-failed', 'error': str(error)}]}
    if screenshot or item['issues']:
        item['screenshot'] = save_shot(name)
    report['checks'].append(item)
    return item


def dismiss_dialogs(where):
    for index in range(3):
        opened = page.locator('dialog[open]')
        if not opened.count():
            return
        title = opened.first.inner_text()[:220]
        event = {'where': where, 'reason': 'Unexpected open dialog would cover the stage.', 'text': title}
        event['screenshot'] = save_shot(f'dialog-{len(report["dialogEvents"]):03}')
        report['dialogEvents'].append(event)
        buttons = opened.first.get_by_role('button', name=re.compile(r'^(패널 닫기|닫기|취소|돌아가기)$'))
        if buttons.count():
            buttons.first.click(timeout=3000)
        else:
            page.keyboard.press('Escape')
        page.wait_for_timeout(100)
    if page.locator('dialog[open]').count():
        raise RuntimeError(f'Could not close a blocking dialog at {where}')


def ready(screen):
    page.wait_for_function('(screen)=>document.querySelector(".app")?.classList.contains("route-"+screen)', arg=screen, timeout=10000)
    page.locator('.learning-rail button').first.wait_for(state='visible', timeout=10000)
    page.locator('main .loading').wait_for(state='hidden', timeout=10000)
    page.evaluate('document.fonts.ready')
    page.evaluate('window.scrollTo(0,0)')
    # Fonts and React layout effects have settled; this does not alter layout styles.
    page.wait_for_timeout(100)
    if page.locator('.activity-heading').count() == 0:
        raise RuntimeError(f'{screen} did not render its activity heading')


try:
    from playwright.sync_api import sync_playwright
    profile = Path(tempfile.mkdtemp(prefix='chrome-profile-', dir=RUNTIME))
    cache = RUNTIME / 'chrome-cache'
    crashes = RUNTIME / 'chrome-crashes'
    cache.mkdir(exist_ok=True)
    crashes.mkdir(exist_ok=True)
    report['browserProfile'] = str(profile)
    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            str(profile), channel='chrome', headless=True,
            viewport={'width': 1280, 'height': 800}, reduced_motion='reduce',
            accept_downloads=False, service_workers='block',
            args=['--renderer-process-limit=2', f'--disk-cache-dir={cache}',
                  f'--crash-dumps-dir={crashes}', '--disable-breakpad',
                  '--disable-background-networking', '--disable-component-update', '--disable-sync'])
        try:
            page = context.pages[0] if context.pages else context.new_page()
            page.set_default_timeout(7000)
            page.on('pageerror', lambda error: report['pageErrors'].append(str(error)))
            page.on('console', lambda message: report['consoleErrors'].append({'text': message.text, 'location': message.location}) if message.type == 'error' else None)
            page.on('response', lambda response: report['network404'].append({'url': response.url, 'status': response.status}) if response.status == 404 else None)
            page.on('requestfailed', lambda request: report['requestFailures'].append({'url': request.url, 'failure': request.failure}))
            page.goto(BASE, wait_until='networkidle', timeout=30000)
            page.get_by_role('button', name='설정', exact=True).click()
            page.get_by_text('교사용 가이드', exact=True).click()
            page.get_by_text('교사용 도구', exact=True).click()
            page.get_by_role('button', name='관리자 전체 해금', exact=True).click()
            page.get_by_role('button', name='닫기', exact=True).click()
            dismiss_dialogs('after teacher setup')
            for width, height in PROFILES:
                profile_start = len(report['checks'])
                page.set_viewport_size({'width': width, 'height': height})
                for number in SCREENS:
                    screen = f'S{number:02}'
                    prefix = f'{width}x{height}-{screen}'
                    try:
                        dismiss_dialogs(prefix)
                        page.evaluate('(screen)=>{location.hash=screen;window.scrollTo(0,0)}', screen)
                        ready(screen)
                        # Always reset to lab, even when React reuses a previous screen/view.
                        page.locator('.learning-rail button').nth(0).click()
                        ready(screen)
                        page.locator('.activity-grid').wait_for(state='visible')
                    except Exception as error:
                        report['checks'].append({'name': prefix+'-route', 'screen': screen, 'view': 'route',
                            'issues': [{'kind': 'route-failed', 'error': str(error)}], 'screenshot': save_shot(prefix+'-route-failed')})
                        continue
                    if 'lab' in VIEWS:
                        capture(prefix+'-lab', screen, 'lab', width in (1280, 915, 740, 390))
                    if 'challenge' in VIEWS:
                        try:
                            dismiss_dialogs(prefix+'-challenge')
                            page.locator('.learning-rail button').nth(1).click()
                            page.locator('.transfer-workspace').wait_for(state='visible')
                            page.evaluate('document.fonts.ready')
                            page.wait_for_timeout(80)
                            capture(prefix+'-challenge', screen, 'challenge')
                        except Exception as error:
                            report['checks'].append({'name': prefix+'-challenge', 'screen': screen, 'view': 'challenge',
                                'issues': [{'kind': 'challenge-failed', 'error': str(error)}], 'screenshot': save_shot(prefix+'-challenge-failed')})
                print(f'{width}x{height}: {len(report["checks"])-profile_start} views checked', flush=True)
            # Teacher fixtures must stay separate from the learner's saved progress.
            count = page.evaluate("()=>{const raw=localStorage.getItem('material-workshop-mission.student.v1');return raw?JSON.parse(raw).completedScreens.length:0}")
            report['studentCompletedScreens'] = count
            if count:
                report['fatalErrors'].append({'where': 'student-save', 'error': 'Teacher QA modified student completion progress.'})
        finally:
            context.close()
            context = None
except Exception as error:
    report['fatalErrors'].append({'where': 'run', 'error': str(error), 'traceback': traceback.format_exc()})
finally:
    report['finishedAt'] = datetime.now(timezone.utc).isoformat()
    issue_counts = {}
    for check in report['checks']:
        for issue in check.get('issues', []):
            kind = issue.get('kind', 'unknown')
            issue_counts[kind] = issue_counts.get(kind, 0) + 1
    report['summary'] = {'views': len(report['checks']), 'issues': sum(issue_counts.values()),
                         'issuesByKind': issue_counts,
                         'failedViews': [check['name'] for check in report['checks'] if check.get('issues')],
                         'pageErrors': len(report['pageErrors']), 'consoleErrors': len(report['consoleErrors']),
                         'network404': len(report['network404']), 'requestFailures': len(report['requestFailures']),
                         'fatalErrors': len(report['fatalErrors'])}
    report['passed'] = not any(report['summary'][key] for key in ('issues', 'pageErrors', 'consoleErrors', 'network404', 'requestFailures', 'fatalErrors'))
    (OUT / 'layout-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'passed': report['passed'], **report['summary'], 'report': str(OUT / 'layout-report.json')}, ensure_ascii=False), flush=True)

raise SystemExit(0 if report['passed'] else 1)
