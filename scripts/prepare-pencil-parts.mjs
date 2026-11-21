// S01 「연필의 재료 찾기」 연필 조각(2026-11-21, 같은 날 흑연심을 넣어 네 조각으로 다시 만듦).
// Codex GPT 이미지로 만든 분해도 한 장(references/generated/pencil-20261121/pencil4-exploded.png)에서
// 흑연심·나무 몸통·금속 띠·고무 지우개를 세로로 빈 틈으로 갈라 webp로 낸다. 실행: node scripts/prepare-pencil-parts.mjs
// 네 조각 모두 같은 위아래 범위로 잘라 높이·세로 위치가 같다(가는 심도 누르기 쉬운 크기가 된다).
// 지우개가 아닌 조각의 가장자리에 남은 붉은 반투명 번짐은 지운다.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url), at = (p) => fileURLToPath(new URL(p, root));
const src = at('references/generated/pencil-20261121/pencil4-exploded.png');
const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, A = (x, y) => data[(y * W + x) * 4 + 3];
const col = Array.from({ length: W }, (_, x) => { let n = 0; for (let y = 0; y < H; y++) if (A(x, y) > 20) n++; return n; });
const runs = []; let start = -1;
for (let x = 0; x <= W; x++) { const on = x < W && col[x] > 2; if (on && start < 0) start = x; if (!on && start >= 0) { if (x - start > 8) runs.push([start, x - 1]); start = -1; } }
if (runs.length !== 4) throw new Error(`조각이 4개가 아니야: ${runs.length} ${JSON.stringify(runs)}`);
const names = ['lead', 'body', 'band', 'eraser'];
let y0 = H, y1 = 0;
for (const [x0, x1] of runs) for (let y = 0; y < H; y++) for (let x = x0; x <= x1; x++) if (A(x, y) > 20) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
const boxes = {};
for (const [i, [x0, x1]] of runs.entries()) {
  const box = { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }; boxes[names[i]] = box;
  const part = Buffer.alloc(box.width * box.height * 4);
  for (let y = 0; y < box.height; y++) for (let x = 0; x < box.width; x++) {
    const s = ((y + y0) * W + x + x0) * 4, d = (y * box.width + x) * 4;
    data.copy(part, d, s, s + 4);
    const [r, g, b, a] = [part[d], part[d + 1], part[d + 2], part[d + 3]];
    if (names[i] !== 'eraser' && a < 240 && r > g + 60 && r > b + 60) part[d + 3] = 0;
  }
  await sharp(part, { raw: { width: box.width, height: box.height, channels: 4 } }).resize({ height: 160, withoutEnlargement: true }).webp({ quality: 88, alphaQuality: 95 }).toFile(at(`public/assets/generated/pencil/pencil4-${names[i]}.webp`));
}
console.log(JSON.stringify(boxes));
