import {test,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const read=(path:string)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('NanumSquareNeo is used for app controls and canvas labels, with local licensed fonts',()=>{
 const css=read('src/styles.css');expect(css).not.toMatch(/font-family:\s*["'](?:Jua|Pretendard)/);
 for(const name of ['bRg','cBd','dEb']){expect(css).toContain(`NanumSquareNeoTTF-${name}.woff2`);expect(readFileSync(new URL(`../public/assets/fonts/NanumSquareNeoTTF-${name}.woff2`,import.meta.url)).subarray(0,4).toString()).toBe('wOF2');}
 expect(css).toContain('textarea');expect(read('src/game/ExperimentCanvas.tsx')).toContain("fontFamily:'NanumSquareNeo");expect(read('src/game/ExperimentCanvas.tsx')).toContain("document.fonts.load('24px NanumSquareNeo')");expect(read('public/assets/fonts/NanumSquareNeo-OFL.txt')).toContain('SIL OPEN FONT LICENSE');
});
