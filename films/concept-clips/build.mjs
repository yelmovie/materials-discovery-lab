// 사용법
//   node films/concept-clips/build.mjs            → S01.html~S10.html 생성, index.html 은 S01
//   node films/concept-clips/build.mjs S06        → index.html 을 S06 으로 (hyperframes check/snapshot/render 는 index.html 을 본다)
//   node films/concept-clips/build.mjs --render S01 S02 …  → 각 편을 렌더하고 앱용 파일(public/assets/concepts)까지 만든다
// 렌더 산출물·캐시는 TMPDIR(외장 SSD) 아래에 둔다. 앱 경로에는 결과 mp4/webm/webp 만 복사한다.
import {writeFileSync, readFileSync, mkdirSync, statSync, copyFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {page, SECONDS, FPS} from './kit.mjs';
import {films} from './films.mjs';

const dir = fileURLToPath(new URL('.', import.meta.url));
const app = fileURLToPath(new URL('../../public/assets/concepts/', import.meta.url));
const ids = Object.keys(films);
mkdirSync(join(dir, 'scenes'), {recursive: true});
for (const id of ids) writeFileSync(join(dir, 'scenes', id + '.html'), page({id, ...films[id]}));

const args = process.argv.slice(2);
const render = args[0] === '--render';
const targets = (render ? args.slice(1) : args).filter(Boolean);
const use = id => { if (!films[id]) throw new Error('모르는 편: ' + id); copyFileSync(join(dir, 'scenes', id + '.html'), join(dir, 'index.html')); };
use(targets[0] || 'S01');
if (!render) { console.log('built', ids.join(' '), '→ index.html =', targets[0] || 'S01'); process.exit(0); }

const tmp = process.env.TMPDIR;
if (!tmp || !tmp.startsWith('/Volumes/')) throw new Error('TMPDIR 를 외장 SSD 경로로 지정하세요');
const out = join(tmp, 'film-renders'); mkdirSync(out, {recursive: true});
const run = (cmd, a, opt = {}) => execFileSync(cmd, a, {stdio: ['ignore', 'pipe', 'inherit'], cwd: dir, maxBuffer: 64 << 20, ...opt}).toString();
const manifestPath = join(app, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
for (const id of targets.length ? targets : ids) {
  use(id);
  const master = join(out, id + '-1080p.mp4');
  run('hyperframes', ['render', '.', '--quality', 'delivery', '--fps', String(FPS), '-o', master]);
  const dur = Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', master]).trim());
  if (Math.abs(dur - SECONDS) > 0.15) throw new Error(`${id} 길이 ${dur}s ≠ ${SECONDS}s`);
  const vf = 'scale=960:540:flags=lanczos,format=yuv420p';
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', master, '-an', '-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-profile:v', 'high', '-movflags', '+faststart', join(app, id + '.mp4')]);
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', master, '-an', '-vf', vf, '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '0', '-row-mt', '1', '-cpu-used', '2', join(app, id + '.webm')]);
  // 포스터 = 마지막 장면(결론 + 반응). 움직임 줄이기 사용자는 이 그림과 문장으로 본다.
  const png = join(out, id + '-last.png');
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-sseof', '-0.2', '-i', master, '-frames:v', '1', '-vf', 'scale=960:540:flags=lanczos', png]);
  run('node', ['-e', `require('sharp')(process.argv[1]).webp({quality:82}).toFile(process.argv[2]).then(()=>{})`, png, join(app, id + '.webp')], {cwd: fileURLToPath(new URL('../../', import.meta.url))});
  const files = ['mp4', 'webm', 'webp'].map(ext => { const name = `${id}.${ext}`; const data = readFileSync(join(app, name)); return {name, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex')}; });
  const rec = {id, seconds: SECONDS, fps: FPS, width: 960, height: 540, files};
  const i = manifest.clips.findIndex(c => c.id === id); if (i >= 0) manifest.clips[i] = rec; else manifest.clips.push(rec);
  console.log(id, dur.toFixed(2) + 's', files.map(f => `${f.name} ${(f.bytes / 1024).toFixed(0)}KB`).join(', '));
}
manifest.created = '2026-11-09';
manifest.source = 'HyperFrames 0.9.26 (films/concept-clips, 1920x1080 30fps master) → FFmpeg 960x540 H.264/VP9, no audio';
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
use('S01');
