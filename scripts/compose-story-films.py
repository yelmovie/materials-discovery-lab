#!/usr/bin/env python3
"""인트로·아웃트로 이야기 영상 합성 (2026-11-21).

장면 영상(Gemini 앱 동영상 만들기, 첫 장면 그림은 Codex GPT 이미지)을 1초 디졸브로 잇고,
대사 자막을 공용 도구 _shared/caption-motion-20261118/burn.py(주아체, libass)로 그림 안에 입힌다.
영상에는 소리를 넣지 않는다: 앱이 영상을 음소거로 틀고, 같은 자막 시각에 기존 목소리 파일을 따로 재생한다
(목소리·소리 설정을 그대로 따르게. 시각은 src/domain/story-films.json 하나를 앱과 같이 쓴다).
장면 영상이 아직 없으면 첫 장면 그림에 천천히 다가가는 카메라 움직임을 넣은 임시 판으로 채운다.

실행: python3 scripts/compose-story-films.py intro|outro
작업 폴더(외장 SSD): .tmp/story-films-20261121/
"""
import json, os, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / '.tmp' / 'story-films-20261121'
CLIPS = ROOT / '.tmp' / 'video-intro-20261121'
BURN = Path('/Volumes/T7 Shield/iscreammedia_sc34/_shared/caption-motion-20261118/burn.py')
PY = Path.home() / '.local/share/uv/tools/earshot/bin/python'
BIN = Path.home() / '.local/node/bin'
FPS, W, H, XF = 24, 1920, 1080, 1.0

# 장면: (영상 또는 그림, 원본에서 쓸 앞부분 초, 화면에 보일 길이 초)
# intro-2는 7초쯤부터 우산 천이 사라져서 앞 6.8초만 써서 8.5초로 늘인다(천천히 재생).
SCENES = {
    'intro': [('gemini/intro-1.mp4', 9.6, 9.6), ('gemini/intro-2.mp4', 6.8, 8.5), ('gemini/intro-3.mp4', 10.0, 10.0)],
    'outro': [('final/final-1', 7.5, 7.5), ('final/final-2', 7.5, 7.5), ('final/final-3', 9.5, 9.5)],
}
SPEAKERS = {'토리': ['#f2e6c9', '#3a2a12'], '모루': '#9a6a3c', '방울이': '#3d8fd6'}

def run(cmd):
    env = dict(os.environ, PATH=f"{BIN}:{os.environ['PATH']}", TMPDIR=str(WORK))
    subprocess.run([str(c) for c in cmd], check=True, env=env)

def source(name):
    """영상이 있으면 영상, 없으면 그림(임시 판)."""
    p = CLIPS / name
    if p.suffix == '.mp4' and p.exists(): return p, False
    for ext in ('.mp4',):
        if (CLIPS / (name + ext)).exists(): return CLIPS / (name + ext), False
    png = CLIPS / (name + '.png')
    if not png.exists(): sys.exit(f'장면 재료가 없어: {name}')
    return png, True

def compose(kind):
    WORK.mkdir(parents=True, exist_ok=True)
    films = json.loads((ROOT / 'src/domain/story-films.json').read_text(encoding='utf-8'))
    film = films[kind]
    inputs, chains, report = [], [], []
    for i, (name, take, show) in enumerate(SCENES[kind]):
        src, still = source(name)
        if still:
            inputs += ['-loop', '1', '-t', f'{show:.2f}', '-i', src]
            frames = round(show * FPS)
            # 그림에 천천히 다가가는 카메라(임시 판). 확대 뒤 잘라서 떨림을 줄인다.
            chains.append(f'[{i}:v]scale=7680:-2,zoompan=z=\'1+0.06*on/{frames}\':x=\'iw/2-(iw/zoom/2)\':y=\'ih/2-(ih/zoom/2)\':d=1:s={W}x{H}:fps={FPS},'
                          f'trim=duration={show:.2f},setpts=PTS-STARTPTS,format=yuv420p,setsar=1[s{i}]')
            report.append(f'{name}: 임시 판(그림 + 카메라 움직임)')
        else:
            inputs += ['-t', f'{take:.2f}', '-i', src]
            chains.append(f'[{i}:v]setpts={show / take:.4f}*(PTS-STARTPTS),fps={FPS},scale={W}:{H}:flags=lanczos,'
                          f'trim=duration={show:.2f},setpts=PTS-STARTPTS,format=yuv420p,setsar=1[s{i}]')
            report.append(f'{name}: 영상 {take}초 → {show}초')
    shows = [s[2] for s in SCENES[kind]]
    last, offset = 's0', 0.0
    for i in range(1, len(shows)):
        offset += shows[i - 1] - XF
        chains.append(f'[{last}][s{i}]xfade=transition=fade:duration={XF}:offset={offset:.2f}[x{i}]'); last = f'x{i}'
    total = sum(shows) - XF * (len(shows) - 1)
    if abs(total - film['duration']) > 0.05: sys.exit(f'길이가 story-films.json({film["duration"]})과 달라: {total:.2f}')
    extra = []
    if kind == 'outro':
        # 마지막 장면 하늘 자리에 게임 제목 로고(앱의 logo.webp를 png로 바꾼 것)
        logo = WORK / 'logo.png'
        run(['node', '-e', f'require("sharp")("{ROOT / "public/assets/logo.webp"}").png().toFile("{logo}")'])
        extra = ['-loop', '1', '-t', f'{total:.2f}', '-i', logo]
        li, t0 = len(SCENES[kind]), total - 3.4
        chains.append(f'[{li}:v]scale=820:-1,format=rgba,fade=t=in:st={t0:.2f}:d=0.7:alpha=1[lg]')
        chains.append(f'[{last}][lg]overlay=x=(W-w)/2:y=70:shortest=1[lo]'); last = 'lo'
    chains.append(f'[{last}]fade=t=in:st=0:d=0.5,fade=t=out:st={total - 0.8:.2f}:d=0.8,format=yuv420p[v]')
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
    # 포스터: 자막 없는 첫 장면 1초 자리
    poster = WORK / f'{kind}-poster.png'
    run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-ss', '1.2', '-i', raw, '-frames:v', '1', '-vf', 'scale=1280:-2', poster])
    run(['node', '-e', f'require("sharp")("{poster}").webp({{quality:80}}).toFile("{ROOT / "public/assets/story" / (kind + "-poster.webp")}")'])
    print('\n'.join(report)); print(f'{kind}: {total:.2f}초 → {out.relative_to(ROOT)} ({out.stat().st_size / 1e6:.1f}MB)')

if __name__ == '__main__':
    if len(sys.argv) != 2 or sys.argv[1] not in SCENES: sys.exit('사용: compose-story-films.py intro|outro')
    os.chdir(ROOT); compose(sys.argv[1])
