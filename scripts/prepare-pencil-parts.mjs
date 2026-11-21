// S01 「연필의 재료 찾기」 연필 조각(2026-11-21): Codex GPT 이미지로 만든 분해도 한 장
// (references/generated/pencil-20261121/pencil-exploded.png, 가장자리 붉은 번짐을 지운 정리본 pencil-clean.png)에서
// 나무 몸통·금속 띠·고무 지우개를 투명 영역으로 잘라 webp로 낸다. 실행: node scripts/prepare-pencil-parts.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url), at = (p) => fileURLToPath(new URL(p, root));
const src = at('references/generated/pencil-20261121/pencil-clean.png');
const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
// 세로로 비어 있는 틈으로 조각을 가른다(왼쪽부터 몸통, 띠, 지우개).
const col = Array.from({ length: W }, (_, x) => { let n = 0; for (let y = 0; y < H; y++) if (data[(y * W + x) * 4 + 3] > 20) n++; return n; });
const runs = []; let start = -1;
for (let x = 0; x <= W; x++) { const on = x < W && col[x] > 3; if (on && start < 0) start = x; if (!on && start >= 0) { runs.push([start, x - 1]); start = -1; } }
if (runs.length !== 3) throw new Error(`조각이 3개가 아니야: ${runs.length}`);
const names = ['body', 'band', 'eraser']; const boxes = {};
for (const [i, [x0, x1]] of runs.entries()) {
  let y0 = H, y1 = 0; for (let y = 0; y < H; y++) for (let x = x0; x <= x1; x++) if (data[(y * W + x) * 4 + 3] > 20) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const box = { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }; boxes[names[i]] = box;
  await sharp(src).extract(box).resize({ height: 160, withoutEnlargement: true }).webp({ quality: 88, alphaQuality: 95 }).toFile(at(`public/assets/generated/pencil/pencil-${names[i]}.webp`));
}
console.log(JSON.stringify(boxes));
