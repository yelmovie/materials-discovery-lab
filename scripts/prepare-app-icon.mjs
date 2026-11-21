// 앱 아이콘(2026-11-21, 3-3a): 새 그림을 만들지 않고, 사용자 제공 토리 캐릭터 시트(references/images/chatgpt_generated_055.png)의
// 큰 전신 그림에서 얼굴 쪽을 정사각형으로 잘라 앱 색 바탕(크림→연두 둥근 그라디언트)에 얹는다. 옛 아이콘은 git 기록(4ceb290)에 있다.
// 실행: node scripts/prepare-app-icon.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url), at = (p) => fileURLToPath(new URL(p, root));
const background = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><defs><radialGradient id="g" cx="50%" cy="40%" r="72%"><stop offset="0" stop-color="#fff8e4"/><stop offset=".6" stop-color="#f3e6bf"/><stop offset="1" stop-color="#cfe2c3"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>');
// 오른쪽은 옆 표정 그림(x 485~) 앞에서 끊고, 인물을 아이콘 바닥까지 붙여 가슴 위만 보이게 한다.
const face = await sharp(at('references/images/chatgpt_generated_055.png')).extract({ left: 40, top: 0, width: 430, height: 430 }).resize(484, 484).png().toBuffer();
const icon = await sharp(background).composite([{ input: face, left: 14, top: 28 }]).png().toBuffer();
await sharp(icon).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(at('public/assets/icons/app-512.png'));
await sharp(icon).resize(192, 192).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(at('public/assets/icons/app-192.png'));
console.log('app icons written');
