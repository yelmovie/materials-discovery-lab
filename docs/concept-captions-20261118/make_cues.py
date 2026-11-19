"""9 things 개념 영상 자막 큐 생성 (실행: python3 docs/concept-captions-20261118/make_cues.py . 18 → 각 JSON 을 _shared/caption-motion-20261118/burn.py 로 렌더): src/domain/concepts.ts 문장 + ConceptVideo.tsx termMap 키워드 → docs/concept-captions-20261118/SNN.json"""
import json, re, sys
from pathlib import Path
repo = Path(sys.argv[1]); bottom = int(sys.argv[2]) if len(sys.argv) > 2 else 64
ts = (repo / 'src/domain/concepts.ts').read_text()
tsx = (repo / 'src/components/ConceptVideo.tsx').read_text()
terms = {k: re.findall(r"'([^']+)'", v) for k, v in re.findall(r"(S\d\d):\[([^\]]*)\]", tsx.split('const termMap', 1)[1].split(';', 1)[0])}
out = repo / 'docs/concept-captions-20261118'; out.mkdir(parents=True, exist_ok=True)
def mark(text, ts_):  # ConceptVideo.tsx Highlight 과 같은 규칙(가장 앞, 같으면 긴 낱말)
    res, rest = '', text
    while rest:
        hits = sorted([(rest.find(t), -len(t), t) for t in ts_ if t in rest])
        if not hits: return res + rest
        i, _, t = hits[0]; res += rest[:i] + '[' + t + ']'; rest = rest[i + len(t):]
    return res
for sid, body in re.findall(r"\n (S\d\d):\{(.*?)\},?(?=\n)", ts):
    cues = re.search(r"cues:\[(.*)\]", body).group(1)
    cues = re.findall(r"'([^']*)'", cues); assert len(cues) == 3, sid
    film = {"src": f"../../../_scratch/caption-motion-20261118/concepts/09/src/{sid}.mp4",
            "out": f"../../public/assets/concepts/{sid}.mp4", "out_webm": f"../../public/assets/concepts/{sid}.webm",
            "theme": {"box": "#214d43", "accent": "#d99a1e", "hot": "#ffe98a"}, "bottom": bottom, "sweep": False,
            "cues": [{"s": i * 5.0, "e": (i + 1) * 5.0 - 0.1 if i < 2 else 15.0, "text": mark(c, terms[sid])} for i, c in enumerate(cues)]}
    (out / f'{sid}.json').write_text(json.dumps(film, ensure_ascii=False, indent=1) + '\n')
    print(sid, [c['text'] for c in film['cues']])
