# 납품 안내 · 물질 공방 대작전

이어서 볼 문서: 작업 인계 기록 [`HANDOFF.md`](../HANDOFF.md), 사용 설명 [`README.md`](../README.md). 이 문서는 두 파일을 대신하지 않고 요점만 모았습니다.

## 1. 한눈에

| 항목 | 내용 |
|---|---|
| 프로젝트 | 물질 공방 대작전 (패키지 이름 `material-workshop-mission` 1.0.0) |
| 운영 주소 | https://materials-discovery-lab.yelsam.workers.dev/ |
| 저장소 | https://github.com/yelmovie/materials-discovery-lab (브랜치 `main`) |
| 앱 코드 마지막 커밋 | `0491e31` (2026-11-22, A4 가로 인증서·빈칸·PNG) |

## 2. 폴더 구조

배포되는 것:
- `src/` 앱 코드(React 19, Phaser, three), `index.html`, `vite.config.ts`
- `public/` 그림·소리·영상·글꼴·3D 모형(`public/assets/`, 출처 `public/assets/CREDITS.md`)
- `worker/media-range.js` 영상 Range 처리
- 빌드 결과 `dist/`(저장소에는 올리지 않음)

보관용(배포되지 않음):
- `docs/` 기획·검토·성적표·권리 장부, `references/` 원본 그림·Meshy 원본, `films/` 개념 영상 제작 소스
- `tools/` 점검 스크립트, `tests/` 단위 시험, `scripts/` 그림·오프라인 파일 준비, `thumbnails/` 납품 썸네일

## 3. 실행·빌드·검사 명령 (`package.json`)

~~~sh
mkdir -p .tmp/runtime .tmp/npm-cache .tmp/node-compile-cache
export TMPDIR="$PWD/.tmp/runtime" TMP="$PWD/.tmp/runtime" TEMP="$PWD/.tmp/runtime"
export npm_config_cache="$PWD/.tmp/npm-cache" NODE_COMPILE_CACHE="$PWD/.tmp/node-compile-cache"
npm ci
npm run typecheck     # tsc --noEmit
npm test              # vitest run
npm run build         # tsc, vite build, scripts/prepare-offline.mjs (sw.js 생성)
npm run dev           # 개발 서버 127.0.0.1
npm run preview -- --port 5320
npm run check:layout  # python tools/check-experience.py (화면 겹침·넘침 검사)
~~~

- 브라우저 점검은 Python Playwright와 시스템 Chrome을 씁니다(`README.md`). 학생 완주 검사는 `tools/check-flow-clicks.py`입니다.
- 외장 SSD에서 작업할 때는 임시파일과 캐시를 위처럼 같은 SSD로 지정합니다.

## 4. 배포

- 호스팅: Cloudflare Workers `materials-discovery-lab`(정적 파일 + 영상 Range용 Worker).
- 설정 파일은 이 저장소 밖 공용 폴더에 있습니다: `_scratch/deploy-20261118/cfg/09.json`. 내용은 정적 파일 폴더 `dist`, 화면 전환은 단일 페이지 앱 방식, Worker 진입점 `worker/media-range.js`, 이름 `materials-discovery-lab`입니다.
- 배포 명령(공용 스크립트, `_shared/CREDIT-LINE-20261120.md` 09번 줄): `KEEP_DOCS=1 deploy.sh 09 "9 things" worker-cfg materials-discovery-lab`. 이 스크립트는 `origin/main`을 받아 빌드하고 `wrangler deploy --config`를 실행합니다.
- 영상 Range 처리: `worker/media-range.js`. Cloudflare 정적 파일은 Range 요청에 파일 전체를 돌려주어 영상 탐색이 안 됩니다. `/assets/concepts/*`, `/assets/map-encounters/*`, `/assets/story/*` 요청만 이 Worker가 먼저 받아 206 조각으로 답합니다.
- 운영 확인: `_scratch/final-recheck-20261120/prodcmp.sh 09`(운영과 저장소 파일 대조)와 영상 Range 206 응답.
- 이 저장소에는 푸시로 배포되는 자동 워크플로가 없습니다(`.github` 없음). 푸시만으로는 운영이 바뀌지 않습니다.

## 5. 다른 호스팅으로 옮길 때 챙길 것

- 정적 파일 폴더: `dist/` 전체(`npm run build` 결과). 화면 전환이 주소 이동이 아니라 앱 안에서 일어나므로, 없는 경로를 `index.html`로 돌려주는 설정이 필요합니다.
- 서비스 워커: `dist/sw.js`(빌드 때 `scripts/prepare-offline.mjs`가 생성). 이미지·화면 코드·개념 영상·효과음을 미리 저장하며 영상 Range도 캐시에서 처리합니다. 새 버전은 모든 게임 탭을 닫은 뒤 적용됩니다.
- Range 처리: 호스팅이 mp4·webm의 Range 요청에 206으로 답하는지 확인합니다. 답하지 않으면 `worker/media-range.js`와 같은 처리가 필요합니다. 이야기 영상(`/assets/story/`)이 iPad Safari에서 재생되려면 필수입니다.
- 환경 값: 없음. 서버·로그인·외부 API를 쓰지 않습니다. 학생 기록은 브라우저 저장소에만 있고 주소(origin)마다 따로입니다.
- 공유 이미지 주소와 아이콘은 `index.html`·`manifest.webmanifest`가 가리킵니다. 주소를 바꾸면 함께 확인합니다.

## 6. 버전과 변경 이력 (`git log`)

- 2026-11-21 `7afe823` S04 보관함 창의 별 가림, 개념 영상 끝 정리, 태블릿 끌기
- 2026-11-21 `cef6700` 공방을 마치면 성취 카드 펼침, 시작 화면 정리, 3D 상자 재료 느낌
- 2026-11-21 `0b6f211` 새 의뢰 화면 배경 보이게, 그림 카드, 개념 영상 쉬운 말
- 2026-11-21 `13a616c` 그림 카드·끌기 고도화
- 2026-11-21 `5174b40` Activities.tsx를 옮기기만으로 나눔(코드 품질 E2)
- 2026-11-21 `eae4c9c` 이야기 영상 토리 말투를 해요체로 통일
- 2026-11-21 `053c935` 아웃트로 세 장면을 Gemini 영상으로, 끝 모션그래픽
- 2026-11-21 `7cf5562` 우산·보관함을 Meshy 3D 관찰 모형으로
- 2026-11-21 `5b3c1ec` 인트로·아웃트로 이야기 영상을 앱에 붙임
- 2026-11-20 제작·저작권 표기를 시작 화면에 추가(`HANDOFF.md`)

## 7. 권리·출처

[`docs/RIGHTS-LEDGER-20261121.md`](RIGHTS-LEDGER-20261121.md)에 그림·영상·음악·효과음·목소리·글꼴·3D 모형의 출처와 이용 조건을 모았습니다. 법률 판정이 아니라 저장소 기록을 정리한 것입니다.

한 줄 요약: 그림은 Codex(GPT 이미지) 유료 요금제 생성이 대부분이고, 키아트(Higgsfield)와 걷기 프레임(Canva)은 저장소 기록이 달라 「근거 약함」으로 남아 있습니다. 이야기 영상은 Gemini(Veo) 유료 계정, 배경 음악은 Suno, 효과음은 Kenney·Freesound CC0, 목소리는 ElevenLabs, 글꼴은 OFL입니다. 3D 모형 줄은 2026-11-22에 추가했습니다.

## 8. 알려진 한계와 남은 일

성적표 `docs/reviews/SCORE-20261121.md` 기준 99점(실기기 제외 100점)입니다.

- 남은 감점 1점: 학생 40분 수업(실기기·수업 확인 대기).
- 학교 태블릿 실기기 속도 미확인(`docs/MESHY-3D-OBJECT-PLAN-20261121.md`).
- 권리 장부: 근거 약함 4줄(키아트, 걷기 프레임, `map-finale.mp4`의 시스템 글꼴, Higgsfield 목소리 2개), 3D 모형 약관·요금제 화면은 사용자 자료 대기.
- 설정 화면의 저작권 문구(`src/settingsContent.ts`)가 현재 빌드와 다릅니다(배경 음악은 Suno, 효과음에 Freesound CC0 추가, ElevenLabs 목소리). 코드 수정은 이 작업 범위가 아니어서 보고만 했습니다.
- `public/assets/CREDITS.md`에 빠진 파일 항목이 있습니다(`docs/RIGHTS-LEDGER-20261121.md`의 「기록끼리 맞지 않는 곳」).

## 운영 대조 기록 (2026-11-22 12:56)

- 조율 세션이 운영 주소의 `index`와 스크립트·스타일 파일 14개를 저장소 `origin/main`과 대조했습니다. 결과는 모두 일치입니다(불일치 0).
- 위 본문에 「운영 반영 확인 필요」로 적힌 칸은 이 대조로 확인된 것입니다. 이후 앱을 다시 배포하면 `_scratch/final-recheck-20261120/prodcmp.sh 09`로 다시 대조합니다.

## 인증서 운영 반영 (2026-11-22)

- 그림 `4490d62`, 앱 `0491e31`, 안내·장부 `28f2eca`. 공방 소재 테두리, A4 가로 한 장, 손으로 쓰는 학교·학년·반·번호·이름 빈칸, 2400×1697 PNG 저장을 적용했습니다.
- 기존 Worker `materials-discovery-lab` 버전 `9fea77ef-4191-43da-843e-2fbbe3d0cba8`에 반영했습니다. 공식 운영 주소는 바꾸지 않았습니다.
- 타입 검사·단위 시험177개·빌드 통과. 운영 세 화면 크기에서 종이 전체·버튼 표시, 콘솔 오류0, PDF1쪽(A4 가로), 학교54.9mm·이름68.3mm·칸 높이11.3mm, PNG 저장을 확인했습니다. 운영 index·코드/스타일15개·새 테두리 SHA-256이 배포 빌드와 일치합니다.
- 전후·05 기준·운영 PNG 비교 그림은 `.tmp/cert-design-20261122/compare.png`입니다. 저장 형식과 기존 완료 기록은 보존했습니다.
