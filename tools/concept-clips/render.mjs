// 2026-11-09: 개념영상은 HyperFrames 소스(films/concept-clips)로 옮겼다. 예전 SVG 프레임 렌더러 대신 그 파이프라인을 부른다.
// 사용: TMPDIR=<외장 SSD 임시 폴더> npm run concepts:render -- S01 S02
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const build=fileURLToPath(new URL('../../films/concept-clips/build.mjs',import.meta.url));
const r=spawnSync(process.execPath,[build,'--render',...process.argv.slice(2)],{stdio:'inherit'});
process.exit(r.status??1);
