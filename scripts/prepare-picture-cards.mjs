// 그림 카드(2026-11-21): Codex GPT 이미지로 만든 「한 줄로 늘어놓은 물건들」 그림을 투명한 틈으로 갈라
// 물건마다 카드용 webp로 낸다. 원본과 프롬프트는 references/generated/cards-20261121/. 실행: node scripts/prepare-picture-cards.mjs
// 막대처럼 가로로 긴 조각은 받침 그림용으로 세운 판(-v)도 같이 낸다.
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url), at = (p) => fileURLToPath(new URL(p, root));
const OUT = 'public/assets/generated/cards';
const SHEETS = [
  { src: 'materials3.png', names: ['material-cloth', 'material-metal', 'material-wood'] },
  { src: 'maker4.png', names: ['maker-cloth', 'maker-plastic', 'maker-rubber', 'maker-metal'], upright: ['maker-rubber', 'maker-metal'] },
  { src: 'cup-notebook.png', names: ['cup', 'notebook'] },
  { src: 'objects4.png', names: ['clip', 'nail', 'chopsticks', 'gloves'] },
];
mkdirSync(at(OUT), { recursive: true });
for (const sheet of SHEETS) {
  const src = at(`references/generated/cards-20261121/${sheet.src}`);
  if (!existsSync(src)) { console.log(`건너뜀(아직 없음): ${sheet.src}`); continue; }
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, A = (x, y) => data[(y * W + x) * 4 + 3];
  const col = Array.from({ length: W }, (_, x) => { let n = 0; for (let y = 0; y < H; y++) if (A(x, y) > 20) n++; return n; });
  const runs = []; let start = -1;
  for (let x = 0; x <= W; x++) { const on = x < W && col[x] > 2; if (on && start < 0) start = x; if (!on && start >= 0) { if (x - start > 12) runs.push([start, x - 1]); start = -1; } }
  if (runs.length !== sheet.names.length) throw new Error(`${sheet.src}: 조각 ${runs.length}개(기대 ${sheet.names.length})`);
  for (const [i, [x0, x1]] of runs.entries()) {
    let y0 = H, y1 = 0; for (let y = 0; y < H; y++) for (let x = x0; x <= x1; x++) if (A(x, y) > 20) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const box = { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }, name = sheet.names[i];
    const piece = sharp(src).extract(box).resize({ width: 360, height: 360, fit: 'inside', withoutEnlargement: true });
    await piece.clone().webp({ quality: 88, alphaQuality: 95 }).toFile(at(`${OUT}/${name}.webp`));
    if (sheet.upright?.includes(name)) await sharp(await sharp(src).extract(box).png().toBuffer()).rotate(90).resize({ height: 360, withoutEnlargement: true }).webp({ quality: 88, alphaQuality: 95 }).toFile(at(`${OUT}/${name}-v.webp`));
    console.log(name, JSON.stringify(box));
  }
}
