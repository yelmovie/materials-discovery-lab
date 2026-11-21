#!/usr/bin/env python3
"""인트로·아웃트로 이야기 영상 합성 (2026-11-21, 같은 날 마무리 지침 _shared/FILMS-FINISH-20261121.md 반영).

장면 영상(Gemini 앱 동영상 만들기, 첫 장면 그림은 Codex GPT 이미지)을 0.5초 교차 페이드로 잇고,
끝에 모션그래픽을 얹은 뒤, 대사 자막을 공용 도구 _shared/caption-motion-20261118/burn.py(주아체, libass)로 그림 안에 입힌다.
- 인트로 끝: 마지막 장면을 멈춘 채 살짝 어둡게 → 게임 제목 로고가 떠오르고 호기심 한 줄 → 토리의 초대.
- 아웃트로 끝: 하늘 자리에 금빛 별 도장과 「임무 완료!」 띠, 반짝임 두 겹 → 토리의 고마움 → 인증서 바탕색(크림)으로 사라짐.
영상에는 소리를 넣지 않는다: 앱이 영상을 음소거로 틀고, 같은 자막 시각에 ElevenLabs 목소리 파일을 대사 재생기로 따로 튼다
(목소리·소리 설정과 배경 음악 낮추기를 다른 대사와 똑같이 따르게. 시각은 src/domain/story-films.json 하나를 앱과 같이 쓴다).
장면 영상이 없으면 첫 장면 그림에 천천히 다가가는 카메라 움직임(임시 판)으로 채운다.

실행: python3 scripts/compose-story-films.py intro|outro      작업 폴더(외장 SSD): .tmp/story-films-20261121/
"""
import json, os, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / '.tmp' / 'story-films-20261121'
CLIPS = ROOT / '.tmp' / 'video-intro-20261121'
SHARED = Path('/Volumes/T7 Shield/iscreammedia_sc34/_shared/caption-motion-20261118')
BURN, FONT = SHARED / 'burn.py', SHARED / 'fonts' / 'Jua-Regular.ttf'
PY = Path.home() / '.local/share/uv/tools/earshot/bin/python'
BIN = Path.home() / '.local/node/bin'
FPS, W, H, XF = 24, 1920, 1080, 0.5

# 장면: (영상 또는 그림, 원본에서 쓸 앞부분 초, 화면에 보일 길이 초). 마지막 장면 뒤 TAIL초는 끝 화면을 멈춰 두고 모션그래픽을 얹는다.
# intro-2는 7초쯤부터 우산 천이 사라져 앞 6.8초를 8.5초로 늘인다. final-1은 6.6초 뒤 빛 구슬이 다시 나타나 앞 6.6초만 쓴다.
SCENES = {
    'intro': [('gemini/intro-1.mp4', 9.6, 9.6), ('gemini/intro-2.mp4', 6.8, 8.5), ('gemini/intro-3.mp4', 10.0, 10.0)],
    'outro': [('final/final-1', 6.6, 7.5), ('final/final-2', 7.5, 7.5), ('final/final-3', 9.5, 9.5)],
}
TAIL = {'intro': 5.0, 'outro': 2.5}
SPEAKERS = {'토리': ['#f2e6c9', '#3a2a12'], '모루': '#9a6a3c', '방울이': '#3d8fd6'}
CREAM, INK, GREEN, GOLD = '#fff6df', '#3a2a12', '#2f6f4f', '#f3c64a'

def run(cmd):
    env = dict(os.environ, PATH=f"{BIN}:{os.environ['PATH']}", TMPDIR=str(WORK))
    subprocess.run([str(c) for c in cmd], check=True, env=env)

def source(name):
    """영상이 있으면 영상, 없으면 그림(임시 판)."""
    for p in (CLIPS / name, CLIPS / (name + '.mp4')):
        if p.suffix == '.mp4' and p.exists(): return p, False
    png = CLIPS / (name + '.png')
    if not png.exists(): sys.exit(f'장면 재료가 없어: {name}')
    return png, True

def svg_png(svg, out):
    (WORK / 'tmp.svg').write_text(svg, encoding='utf-8')
    run(['node', '-e', f'require("sharp")("{WORK / "tmp.svg"}").png().toFile("{out}")'])
    return out

def star(cx, cy, r, fill, op=1):
    k = r * .28
    return (f'<path d="M{cx} {cy - r} Q{cx + k} {cy - k} {cx + r} {cy} Q{cx + k} {cy + k} {cx} {cy + r} Q{cx - k} {cy + k} {cx - r} {cy} '
            f'Q{cx - k} {cy - k} {cx} {cy - r}Z" fill="{fill}" opacity="{op}"/>')

def outro_art():
    """금빛 별 도장, 초록 띠, 반짝임 두 겹(하늘 자리, 위쪽 3분의 1)."""
    seal = svg_png(f'''<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
<defs><radialGradient id="g" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fff3b8"/><stop offset=".55" stop-color="{GOLD}"/><stop offset="1" stop-color="#c98a1c"/></radialGradient></defs>
<g fill="url(#g)" stroke="{INK}" stroke-width="5">{''.join(f'<circle cx="{120 + 96 * __import__("math").cos(i * 0.3927)}" cy="{120 + 96 * __import__("math").sin(i * 0.3927)}" r="20"/>' for i in range(16))}</g>
<circle cx="120" cy="120" r="96" fill="url(#g)" stroke="{INK}" stroke-width="5"/>
<circle cx="120" cy="120" r="76" fill="none" stroke="#fff6df" stroke-width="4" stroke-dasharray="6 8" opacity=".9"/>
<path d="M120 62 L135 103 L178 104 L144 130 L156 172 L120 147 L84 172 L96 130 L62 104 L105 103Z" fill="#fff6df" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>
</svg>''', WORK / 'seal.png')
    band = svg_png(f'''<svg xmlns="http://www.w3.org/2000/svg" width="980" height="124" viewBox="0 0 980 124">
<path d="M40 14 H940 L968 62 L940 110 H40 L12 62Z" fill="{GREEN}" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>
<path d="M52 26 H928 L948 62 L928 98 H52 L32 62Z" fill="none" stroke="{GOLD}" stroke-width="4" stroke-linejoin="round"/>
</svg>''', WORK / 'band.png')
    import random
    rnd = random.Random(9)
    def sparkles(seed_shift):
        s = ''.join(star(rnd.randint(120, 1800), rnd.randint(40, 420), rnd.randint(10, 26), rnd.choice(['#fff6df', '#ffe48a', GOLD]), rnd.choice([.75, .9, 1]))
                    for _ in range(16))
        return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}">{s}</svg>'
    return seal, band, svg_png(sparkles(0), WORK / 'spark-a.png'), svg_png(sparkles(1), WORK / 'spark-b.png')

def esc(text):
    return text.replace('\\', '\\\\').replace(':', '\\:').replace("'", "’").replace(',', '\\,')

def compose(kind):
    WORK.mkdir(parents=True, exist_ok=True)
    film = json.loads((ROOT / 'src/domain/story-films.json').read_text(encoding='utf-8'))[kind]
    scenes, tail = SCENES[kind], TAIL[kind]
    inputs, chains, report = [], [], []
    for i, (name, take, show) in enumerate(scenes):
        src, still = source(name)
        pad = f',tpad=stop_mode=clone:stop_duration={tail:.2f}' if i == len(scenes) - 1 else ''
        if still:
            inputs += ['-loop', '1', '-t', f'{show:.2f}', '-i', src]
            frames = round(show * FPS)
            chains.append(f'[{i}:v]scale=7680:-2,zoompan=z=\'1+0.06*on/{frames}\':x=\'iw/2-(iw/zoom/2)\':y=\'ih/2-(ih/zoom/2)\':d=1:s={W}x{H}:fps={FPS},'
                          f'trim=duration={show:.2f},setpts=PTS-STARTPTS,format=yuv420p,setsar=1{pad}[s{i}]')
            report.append(f'{name}: 임시 판(그림 + 카메라 움직임) {show}초')
        else:
            inputs += ['-t', f'{take:.2f}', '-i', src]
            chains.append(f'[{i}:v]setpts={show / take:.4f}*(PTS-STARTPTS),fps={FPS},scale={W}:{H}:flags=lanczos,'
                          f'trim=duration={show:.2f},setpts=PTS-STARTPTS,format=yuv420p,setsar=1{pad}[s{i}]')
            report.append(f'{name}: 영상 {take}초 → {show}초')
    shows = [s[2] for s in scenes]; shows[-1] += tail
    last, offset = 's0', 0.0
    for i in range(1, len(shows)):
        offset += shows[i - 1] - XF
        chains.append(f'[{last}][s{i}]xfade=transition=fade:duration={XF}:offset={offset:.2f}[x{i}]'); last = f'x{i}'
    total = sum(shows) - XF * (len(shows) - 1)
    if abs(total - film['duration']) > 0.05: sys.exit(f'길이가 story-films.json({film["duration"]})과 달라: {total:.2f}')
    end = total - tail  # 마지막 장면 영상이 끝나는 때(그 뒤는 멈춘 화면)
    n, extra = len(scenes), []
    font = str(FONT).replace(':', '\\:')
    if kind == 'intro':
        logo = WORK / 'logo.png'
        run(['node', '-e', f'require("sharp")("{ROOT / "public/assets/logo.webp"}").png().toFile("{logo}")'])
        extra = ['-f', 'lavfi', '-t', f'{total:.2f}', '-i', f'color=c=black@0.42:s={W}x{H}:r={FPS},format=rgba', '-loop', '1', '-t', f'{total:.2f}', '-i', logo]
        t0 = end - 0.2
        chains += [f'[{n}:v]fade=t=in:st={t0:.2f}:d=0.8:alpha=1[dim]', f'[{last}][dim]overlay=0:0:shortest=1[e1]',
                   f'[{n + 1}:v]scale=980:-1,format=rgba,fade=t=in:st={t0 + 0.3:.2f}:d=0.7:alpha=1[lg]',
                   f'[e1][lg]overlay=x=(W-w)/2:y=\'230+36*max(0\\,1-(t-{t0 + 0.3:.2f})/0.7)\':shortest=1[e2]',
                   f"[e2]drawtext=fontfile='{font}':text='{esc(film['tagline'])}':fontsize=66:fontcolor={CREAM}:borderw=7:bordercolor={INK}:"
                   f"x=(w-text_w)/2:y=560:alpha='if(lt(t\\,{t0 + 0.9:.2f})\\,0\\,min(1\\,(t-{t0 + 0.9:.2f})/0.6))'[e3]"]
        last, fade_color = 'e3', 'black'
    else:
        seal, band, sa, sb = outro_art()
        extra = []
        for p in (seal, band, sa, sb): extra += ['-loop', '1', '-t', f'{total:.2f}', '-i', p]
        t0 = film['cues'][-1]['at'] - 0.3
        chains += [f'[{n}:v]format=rgba,fade=t=in:st={t0:.2f}:d=0.5:alpha=1[seal]',
                   f'[{n + 1}:v]format=rgba,fade=t=in:st={t0 + 0.35:.2f}:d=0.5:alpha=1[band]',
                   f'[{n + 2}:v]format=rgba,fade=t=in:st={t0 + 0.5:.2f}:d=0.4:alpha=1,fade=t=out:st={t0 + 1.6:.2f}:d=0.5:alpha=1,fade=t=in:st={t0 + 2.4:.2f}:d=0.5:alpha=1[spa]',
                   f'[{n + 3}:v]format=rgba,fade=t=in:st={t0 + 1.0:.2f}:d=0.4:alpha=1,fade=t=out:st={t0 + 2.1:.2f}:d=0.5:alpha=1,fade=t=in:st={t0 + 2.9:.2f}:d=0.5:alpha=1[spb]',
                   f'[{last}][spa]overlay=0:0:shortest=1[o1]', f'[o1][spb]overlay=0:0:shortest=1[o2]',
                   f'[o2][seal]overlay=x=(W-w)/2:y=\'26+30*max(0\\,1-(t-{t0:.2f})/0.5)\':shortest=1[o3]',
                   f'[o3][band]overlay=x=(W-w)/2:y=262:shortest=1[o4]',
                   f"[o4]drawtext=fontfile='{font}':text='{esc(film['tagline'])}':fontsize=60:fontcolor={CREAM}:borderw=4:bordercolor={INK}:"
                   f"x=(w-text_w)/2:y=262+(124-text_h)/2:alpha='if(lt(t\\,{t0 + 0.45:.2f})\\,0\\,min(1\\,(t-{t0 + 0.45:.2f})/0.5))'[o5]"]
        last, fade_color = 'o5', '0xfffaf0'
    chains.append(f'[{last}]fade=t=in:st=0:d=0.5,fade=t=out:st={total - 0.8:.2f}:d=0.8:color={fade_color},format=yuv420p[v]')
    raw = WORK / f'{kind}-raw.mp4'
    run(['ffmpeg', '-nostdin', '-v', 'error', '-y', *inputs, *extra, '-filter_complex', ';'.join(chains), '-map', '[v]', '-an',
         '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-maxrate', '2200k', '-bufsize', '4400k', '-pix_fmt', 'yuv420p', '-r', str(FPS), raw])
    cues = [{'s': c['at'], 'e': c['end'], 'speech': [c['at'], c['end'] - 0.4], 'who': c['who'], 'text': c['text']} for c in film['cues']]
    spec = {'src': raw.name, 'out': f'{kind}-captioned.mp4', 'theme': {'box': '#1d2a1f', 'accent': '#ffd35c', 'hot': '#ffd35c'},
            'speakers': SPEAKERS, 'bottom': 64, 'sweep': False, 'cues': cues}
    (WORK / f'{kind}.json').write_text(json.dumps(spec, ensure_ascii=False, indent=1), encoding='utf-8')
    run([PY, BURN, WORK / f'{kind}.json'])
    out = ROOT / 'public/assets/story' / f'{kind}.mp4'; out.parent.mkdir(parents=True, exist_ok=True)
    run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', WORK / f'{kind}-captioned.mp4', '-c', 'copy', '-movflags', '+faststart', out])
    poster = WORK / f'{kind}-poster.png'
    run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-ss', '1.2', '-i', raw, '-frames:v', '1', '-vf', 'scale=1280:-2', poster])
    run(['node', '-e', f'require("sharp")("{poster}").webp({{quality:80}}).toFile("{ROOT / "public/assets/story" / (kind + "-poster.webp")}")'])
    print('\n'.join(report)); print(f'{kind}: {total:.2f}초 → {out.relative_to(ROOT)} ({out.stat().st_size / 1e6:.1f}MB)')

if __name__ == '__main__':
    if len(sys.argv) != 2 or sys.argv[1] not in SCENES: sys.exit('사용: compose-story-films.py intro|outro')
    os.chdir(ROOT); compose(sys.argv[1])
