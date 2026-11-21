# 권리 대장 · 물질 공방 대작전 (2026-11-21)

운영 빌드(`dist/`)에 실려 나가는 그림·영상·음악·효과음·목소리·글꼴의 출처와 이용 조건을 한곳에 모은 대장이다. 법률 판정이 아니라 저장소와 공용 폴더에서 찾은 기록을 정리한 것이다.

## 범위와 기준

- 대상: `dist/assets/**`(`._*` 제외)에 있는 미디어 파일. `public/` 복사본과 `src`에서 묶여 나온 해시 파일(`dist/assets/map-*-reaction-*.webp`)을 함께 셌다. 코드 안 SVG 아이콘도 번들에 들어가므로 한 줄로 넣었다.
- 미디어가 아닌 동봉 파일(`CREDITS.md`, `audio/sources.json`, `audio/Kenney-CC0.txt`, 각 폴더 `manifest.json`, 글꼴 `*-OFL.txt`)은 근거 파일로만 적었다.
- 파일 수 대조: 그림 webp 142(개념 영상 포스터 10 포함)·png 2, mp3 210, m4a 1, mp4 11, webm 10, woff2 5. 아래 표의 개수 합과 같다.
- 날짜: 「git 추가」는 `git log --diff-filter=A` 결과다. 저장소 첫 커밋이 `4ceb290`(2026-11-09)이라, 그날 추가된 파일은 실제 제작일이 더 이를 수 있다.
- 상태: **확인됨** = 출처와 이용 조건을 함께 적은 구체 기록이 있음. **근거 약함** = 기록은 있으나 도구·날짜·조건 중 일부가 없음(예: 「AI 생성」만 있고 요금제·약관 없음, 「사용자 제공」만 있고 계약 없음). **출처 미확인** = 기록을 찾지 못함.
- 경로는 따로 적지 않으면 `9 things/` 기준이다. `_shared/`, `_scratch/`는 `/Volumes/T7 Shield/iscreammedia_sc34/` 아래다.

## 1. 그림

| 파일(묶음) | 개수 | 만든 곳(생성 도구·제공처·라이브러리) | 만든 날·기록 위치(프롬프트 기록, 생성 로그, CREDITS, 계약) | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| `backgrounds/stage-1~5.webp` | 5 | 사용자 제공 이미지(원본 이름 `chatgpt_generated_034·041·038·042·043.png`). 생성 도구·원저작자 기록 없음. 원본 파일 이름만으로 도구가 입증되지 않는다고 CREDITS에 적혀 있음 | 만든 날 기록 없음. git 추가 2026-11-09(`4ceb290`, 첫 커밋). 변환 기록 `public/assets/manifest.json` | Codex(GPT 이미지) 유료 요금제로 생성(사용자 확인). 요금제 화면 캡처는 납품 증빙으로 따로 남김 | `public/assets/CREDITS.md`(기존 사용자 제공 이미지 매핑), `public/assets/manifest.json`, `references/images/`; 사용자 확인 2026-11-21(「16곳 그림은 전부 Codex(GPT), 모두 유료 요금제」 → 「전부 맞아」), `_shared/CODEX-IMAGE-RECORDS-20261121.md` | 확인됨(사용자 확인) |
| `characters/moru·dandani·banguli·barami·tori.webp` | 5 | 사용자 제공 이미지(원본 `chatgpt_generated_051~055.png`에서 캐릭터 추출) | 만든 날 기록 없음. git 추가 2026-11-09(`4ceb290`) | Codex(GPT 이미지) 유료 요금제로 생성(사용자 확인). 요금제 화면 캡처는 납품 증빙으로 따로 남김 | `public/assets/CREDITS.md`, `public/assets/manifest.json`, `references/images/`; 사용자 확인 2026-11-21(「16곳 그림은 전부 Codex(GPT), 모두 유료 요금제」 → 「전부 맞아」), `_shared/CODEX-IMAGE-RECORDS-20261121.md` | 확인됨(사용자 확인) |
| `logo.webp` | 1 | 사용자 제공 이미지(원본 `chatgpt_generated_050.png`) | 만든 날 기록 없음. git 추가 2026-11-09(`4ceb290`) | Codex(GPT 이미지) 유료 요금제로 생성(사용자 확인). 요금제 화면 캡처는 납품 증빙으로 따로 남김 | `public/assets/CREDITS.md`, `public/assets/manifest.json`; 사용자 확인 2026-11-21(「16곳 그림은 전부 Codex(GPT), 모두 유료 요금제」 → 「전부 맞아」), `_shared/CODEX-IMAGE-RECORDS-20261121.md` | 확인됨(사용자 확인) |
| `generated/workshop-island·researcher·companion·umbrella·invention.webp` | 5 | OpenAI image generation | 2026-10-22. 원본 `references/generated/*.png`, 프롬프트 `docs/3d-image-prompts.md`·`.html` | Codex(GPT 이미지) 유료 요금제로 생성(사용자 확인). 요금제 화면 캡처는 납품 증빙으로 따로 남김 | `public/assets/generated/manifest.json`, `public/assets/CREDITS.md`(이번 신규 생성 이미지); 사용자 확인 2026-11-21(「16곳 그림은 전부 Codex(GPT), 모두 유료 요금제」 → 「전부 맞아」), `_shared/CODEX-IMAGE-RECORDS-20261121.md` | 확인됨(사용자 확인) |
| `generated/title-keyart.webp` | 1 | Higgsfield GPT Image 2.5. 토리·모루 시트(`chatgpt_generated_055·051`)와 지도 그림을 참조로 생성 | 2026-10-29. 원본 `references/generated/title-keyart/keyart-b.png`. 운영 `index.html`의 공유 이미지(og)로도 쓰임 | 요금제·상업 이용 근거 「별도 보관 필요」. 참조한 사용자 제공 그림의 권리도 따라감 | `public/assets/generated/manifest.json`, `public/assets/CREDITS.md`; 사용자 확인은 「전부 Codex」이나 저장소 manifest·CREDITS는 Higgsfield GPT Image 2.5로 적음. 증거대로 두고 보고 | 근거 약함(증거와 사용자 확인이 어긋남) |
| `generated/walk/researcher/*`, `generated/walk/companion/*` (4방향 걷기 프레임) | 32 | Canva 이미지 생성. 기존 researcher·companion 그림을 참조 | 2026-11-07. 원본 `references/generated/walk/*-sheet.png`, 자르기 `scripts/prepare-walk-sprites.mjs` | Canva 요금제·AI 생성물 이용 조건 「별도 보관 필요」 | `public/assets/generated/manifest.json`, `public/assets/generated/walk/manifest.json`, `public/assets/CREDITS.md`; 사용자 확인은 「전부 Codex」이나 저장소 manifest·CREDITS는 Canva 이미지 생성으로 적음. 증거대로 두고 보고 | 근거 약함(증거와 사용자 확인이 어긋남) |
| `generated/sand-observation.webp`, `generated/wood-sample.webp` | 2 | OpenAI 기본 image_gen(「not Imagen」) | 2026-11-08. 원본 `references/generated/overnight-20261108/` | Codex(GPT 이미지) 유료 요금제로 생성(사용자 확인). 요금제 화면 캡처는 납품 증빙으로 따로 남김 | `public/assets/generated/manifest.json`; 사용자 확인 2026-11-21(「16곳 그림은 전부 Codex(GPT), 모두 유료 요금제」 → 「전부 맞아」), `_shared/CODEX-IMAGE-RECORDS-20261121.md` | 확인됨(사용자 확인) |
| `generated/lab-glass·air-pump·wood-block·air-pouch-flat·air-pouch-inflated.webp` | 5 | OpenAI 기본 image_gen | 2026-11-12. 전체 프롬프트가 manifest에 있음. 원본 `references/generated/science-20261112/` | Codex(GPT 이미지) 유료 요금제로 생성(사용자 확인). 요금제 화면 캡처는 납품 증빙으로 따로 남김 | `public/assets/generated/manifest.json`, `public/assets/CREDITS.md`(학습 자료와 표현); 사용자 확인 2026-11-21(「16곳 그림은 전부 Codex(GPT), 모두 유료 요금제」 → 「전부 맞아」), `_shared/CODEX-IMAGE-RECORDS-20261121.md`; Codex 생성 기록 2026-11-11 15:35~15:39 UTC 5건(`_shared/codex-image-records-20261121/index.jsonl`, project 「9 things」: 실험 도구·나무토막·공기 주머니 투명 그림) | 확인됨(사용자 확인) |
| `generated/lab-bench.webp`, `generated/materials/*`(6), `generated/quests/quest-1~5.webp` | 12 | ChatGPT 구독의 Codex 내장 이미지 생성(GPT 이미지). 메인 키아트를 화풍 참조 | CREDITS 2026-11-17, 자르기 스크립트 주석은 「2026-11-16 GPT image sources」. 원본 `references/generated/ux-20261116/`. git 추가 2026-11-17(`5a9fd51`). 프롬프트 기록 못 찾음 | Codex(GPT 이미지) 유료 요금제로 생성(사용자 확인). 요금제 화면 캡처는 납품 증빙으로 따로 남김 | `public/assets/CREDITS.md`(학습 흐름 그림), `scripts/prepare-flow-art.mjs`; 사용자 확인 2026-11-21(「16곳 그림은 전부 Codex(GPT), 모두 유료 요금제」 → 「전부 맞아」), `_shared/CODEX-IMAGE-RECORDS-20261121.md`; Claude Code `gpt-imagegen` 기록 2026-11-16 15:19 UTC `lab-bench.png`(`index-claude.jsonl`) | 확인됨(사용자 확인) |
| `generated/glass-tank.webp`, `generated/material-core.webp` | 2 | 스크립트 주석에 「GPT image sources」만 있음. CREDITS·manifest에 항목 없음 | 원본 `references/generated/ux-20261116/glass-tank.png`·`material-core.png`. git 추가 2026-11-17(`5a9fd51`) | Codex(GPT 이미지) 유료 요금제로 생성(사용자 확인). 요금제 화면 캡처는 납품 증빙으로 따로 남김 | `scripts/prepare-flow-art.mjs`; 사용자 확인 2026-11-21(「16곳 그림은 전부 Codex(GPT), 모두 유료 요금제」 → 「전부 맞아」), `_shared/CODEX-IMAGE-RECORDS-20261121.md` | 확인됨(사용자 확인) |
| `generated/workshops/ws-1~5.webp`, `generated/maker/*`(6) | 11 | ChatGPT 구독의 Codex 내장 이미지 생성(GPT 이미지) | 원본 `references/generated/ux-20261116/workshops.png`·`maker-props.png`. git 추가 2026-11-17(`d6cbeb5`) | Codex(GPT 이미지) 유료 요금제로 생성(사용자 확인). 요금제 화면 캡처는 납품 증빙으로 따로 남김 | `public/assets/CREDITS.md`(학습 흐름 그림), `scripts/prepare-flow-art.mjs`; 사용자 확인 2026-11-21(「16곳 그림은 전부 Codex(GPT), 모두 유료 요금제」 → 「전부 맞아」), `_shared/CODEX-IMAGE-RECORDS-20261121.md`; `gpt-imagegen` 기록 2026-11-16 22:01·22:02 UTC `workshops.png`·`maker-props.png`(`index-claude.jsonl`) | 확인됨(사용자 확인) |
| `run-stage/*.webp` (벽·바닥·서랍장·소품·재료 무늬 6·연구원 동작) | 16 | `gpt-imagegen`(Codex 내장 GPT 이미지). 기존 `stage-2`·걷기 시트를 참조로 붙임 | 2026-11-17. 원본 `references/generated/run-stage-20261117/`, 프롬프트 요지는 계획 문서 표, 전체 프롬프트 `.tmp/run-stage/image-queue.sh`(Git 밖). git 추가 2026-11-17(`8834cb1`, `8637f65`). **CREDITS에 항목 없음** | Codex(GPT 이미지) 유료 요금제로 생성(사용자 확인). 요금제 화면 캡처는 납품 증빙으로 따로 남김 | `docs/RUN-STAGE-3D-PLAN-20261117.md`(이미지 기록), `scripts/prepare-run-stage.mjs`; 사용자 확인 2026-11-21(「16곳 그림은 전부 Codex(GPT), 모두 유료 요금제」 → 「전부 맞아」), `_shared/CODEX-IMAGE-RECORDS-20261121.md`; `gpt-imagegen` 기록 2026-11-17 02:16·02:19 UTC `material-surfaces.png`·`researcher-actions.png`(`index-claude.jsonl`) | 확인됨(사용자 확인) |
| `npc-expressions/*-happy·neutral·think.webp` (5명 × 3표정) | 15 | Codex image_gen. 기존 캐릭터(사용자 제공 그림)를 참고 | CREDITS 2026-11-12, git 추가 2026-11-13(`fe07d71`). 원본·SHA-256·내장 원본 삭제 기록 `output/npc-dialogue-expanded-20261112/image-manifest.json` | Codex(GPT 이미지) 유료 요금제로 생성(사용자 확인). 요금제 화면 캡처는 납품 증빙으로 따로 남김 | `public/assets/CREDITS.md`(NPC 대화 확장), `output/npc-dialogue-expanded-20261112/image-manifest.json`; 사용자 확인 2026-11-21(「16곳 그림은 전부 Codex(GPT), 모두 유료 요금제」 → 「전부 맞아」), `_shared/CODEX-IMAGE-RECORDS-20261121.md` | 확인됨(사용자 확인) |
| `reward-cards/card-1~6-*.webp`, `thumb-1~6-*.webp` | 12 | ChatGPT 구독의 Codex 내장 이미지 생성(GPT 이미지). 연구원·모루 그림, 걷기 프레임, 공방 배경을 화풍 참조 | 2026-11-18, git 추가 2026-11-18(`7442444`). 원본 PNG·프롬프트 위치는 찾지 못함 | Codex(GPT 이미지) 유료 요금제로 생성(사용자 확인). 요금제 화면 캡처는 납품 증빙으로 따로 남김 | `public/assets/CREDITS.md`(성취 카드 · 2026-11-18); 사용자 확인 2026-11-21(「16곳 그림은 전부 Codex(GPT), 모두 유료 요금제」 → 「전부 맞아」), `_shared/CODEX-IMAGE-RECORDS-20261121.md` | 확인됨(사용자 확인) |
| `map-encounter/map-villain-left·right·poses-left·poses-right.webp` (재료 바꿔치기 봇) | 4 | 시안은 Codex 기본 이미지 도구로 생성(시안은 「최종 애셋이 아니다」로 적힘). **최종 스프라이트를 만든 도구 기록은 없음** | git 추가 2026-11-14(`07f07c2`, `baeb6cd` 「newly drawn battle poses」). 시안 프롬프트 `_scratch/villain-concepts-20261114/prompts-v2.md`. CREDITS에 항목 없음 | Codex(GPT 이미지) 유료 요금제로 생성(사용자 확인). 요금제 화면 캡처는 납품 증빙으로 따로 남김 | `_shared/MAP-VILLAINS-HANDOFF-20261114.md`, `docs/MAP-VILLAIN-HANDOFF-20261114.md`; 사용자 확인 2026-11-21(「16곳 그림은 전부 Codex(GPT), 모두 유료 요금제」 → 「전부 맞아」), `_shared/CODEX-IMAGE-RECORDS-20261121.md` | 확인됨(사용자 확인) |
| `map-encounter/map-hero-reaction.webp`, `map-ally-reaction.webp` + 번들 사본 `dist/assets/map-hero-reaction-PJ2ojN9S.webp`, `map-ally-reaction-DRl7Xvjb.webp` | 4 (그림 2종) | 「새로운 캐릭터 반응 자세를 제작」이라고만 적힘. 도구 기록 없음. 번들 사본은 `src/game/WorldCanvas.tsx`의 `import.meta.glob`으로 같은 그림이 한 번 더 실림 | 2026-11-14 지도 연계 작업. 작업 파일 `_scratch/villain-resume-20261114/09-sheets/`, `09-actors-original.png`. CREDITS에 항목 없음 | Codex(GPT 이미지) 유료 요금제로 생성(사용자 확인). 요금제 화면 캡처는 납품 증빙으로 따로 남김 | `_scratch/villain-resume-20261114/README.md`, `_shared/MAP-VILLAINS-HANDOFF-20261114.md`; 사용자 확인 2026-11-21(「16곳 그림은 전부 Codex(GPT), 모두 유료 요금제」 → 「전부 맞아」), `_shared/CODEX-IMAGE-RECORDS-20261121.md` | 확인됨(사용자 확인) |
| `icons/app-192.png`, `icons/app-512.png` (앱 아이콘, `manifest.webmanifest`·`index.html`에서 사용) | 2 | 2026-11-21 교체: 새 그림을 만들지 않고 사용자 제공 토리 캐릭터 시트 `references/images/chatgpt_generated_055.png`(Codex GPT 이미지, 사용자 확인)를 잘라 코드로 그린 크림→연두 그라디언트 바탕에 얹음 | 2026-11-21, `scripts/prepare-app-icon.mjs`(자르기 영역·바탕 색), 커밋 `44fd03f`. 옛 아이콘(출처 사용자 확인)은 git `4ceb290`에 남음 | 원본 시트의 조건을 따름: Codex(GPT 이미지) 유료 요금제(사용자 확인 2026-11-21) | `scripts/prepare-app-icon.mjs`, `public/assets/manifest.json`(055 시트 → tori.webp 자르기 기록), 사용자 확인 2026-11-21, `_shared/CODEX-IMAGE-RECORDS-20261121.md` | 확인됨(사용자 확인) |
| `generated/pencil/pencil-lead·body·band·eraser.webp` (S01-c 연필 조각, 같은 날 흑연심을 넣어 다시 만듦) | 4 | Codex CLI 기본 이미지 도구(GPT 이미지, `gpt-imagegen`). 참고 그림 `quests/quest-1.webp` | 2026-11-21. 전체 프롬프트 `references/generated/pencil-20261121/PROMPT.md`, 원본 `references/generated/pencil-20261121/pencil4-exploded.png`(1차 `pencil-exploded.png`), 자르기 `scripts/prepare-pencil-parts.mjs` | Codex(GPT 이미지) 유료 요금제(사용자 확인 2026-11-21과 같은 계정·요금제) | `references/generated/pencil-20261121/PROMPT.md`, `public/assets/CREDITS.md` | 확인됨 |
| 코드 안 SVG 아이콘(홈·뒤로·소리·설정·책·닫기·별·결정체·건물) | 번들 안 | 프로젝트 코드로 직접 작성한 SVG. 유료 아이콘 팩 없음 | 2026-10-22 점검 기록 `docs/icon-prompts.md` | 프로젝트 자체 제작물 | `src/components/Icon.tsx`, `src/screens/FinalPanels.tsx`, `docs/icon-prompts.md`, `public/assets/CREDITS.md`(SVG 공통 아이콘) | 확인됨 |

## 2. 영상

| 파일(묶음) | 개수 | 만든 곳(생성 도구·제공처·라이브러리) | 만든 날·기록 위치(프롬프트 기록, 생성 로그, CREDITS, 계약) | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| `concepts/S01~S10.mp4·webm·webp`(개념 영상과 포스터) | 30 | HyperFrames 0.9.26(오픈소스 CLI, 로컬 렌더)로 직접 만든 HTML 장면 → FFmpeg. 애니메이션 GSAP 3.15.0(제작 소스에만). 장면 글꼴 NanumSquare Neo, 2026-11-18 영상 안 자막은 Jua로 입힘. 새 생성 이미지·음원 없음, 소리 트랙 없음 | 2026-11-09 교체, 2026-11-18 갱신. 소스 `films/concept-clips/`(SPEC·REVIEW), 자막 큐 `docs/concept-captions-20261118/`. git 추가 2026-11-09 | 영상 제작 자체는 자체 제작. 단 장면 안에 사용자 제공 캐릭터(토리·단단이·방울이·바람이)와 OpenAI 생성 그림(companion·umbrella·invention·wood-sample)이 들어 있어 그 권리를 따라감 | `public/assets/concepts/manifest.json`, `public/assets/CREDITS.md`(개념 모션 영상 10개), `films/concept-clips/assets/img/`, `_shared/FULLSCREEN-CAPTION-CONCEPTS-20261118.md`; 영상은 HyperFrames로 직접 렌더한 자체 제작물. 장면 속 그림은 위 그림 줄이 사용자 확인으로 확인됨. (사용자 확인의 「영상은 제미나이」와는 어긋남: 이 영상은 제미나이 생성물이 아니라 로컬 렌더 기록이 있어 증거대로 둠) | 확인됨 |
| `story/intro.mp4`·`outro.mp4`·`*-poster.webp` (인트로·아웃트로 이야기 영상, 2026-11-21) | 4 | 첫 장면 그림: Codex GPT 이미지(`gpt-imagegen`) 6장. 움직임: 인트로 3장면은 Gemini 앱 동영상 만들기(Veo), 주 계정. 아웃트로 3장면은 지금 그림에 카메라 움직임만 넣은 임시 판(FFmpeg). 자막: 공용 `burn.py`(주아체 OFL). 끝 로고는 앱 `logo.webp` | 2026-11-21. 합성 `scripts/compose-story-films.py`, 대사 시각 `src/domain/story-films.json`, 장면별 출처·프롬프트 `docs/story-films-20261121/README.md`. 원본은 외장 SSD `.tmp/video-intro-20261121/` | Codex(GPT 이미지) 유료 요금제(사용자 확인 2026-11-21). Gemini 앱 주 계정: 화면 표시 PRO, 사용자 확인 2026-11-21 「유료」. 영상 오른쪽 아래 작은 Veo 표시 남음. 영상 생성기 소리는 쓰지 않음(무음 영상, 목소리는 기존 파일을 앱이 따로 재생) | `docs/story-films-20261121/README.md`, `scripts/compose-story-films.py` | 확인됨 |
| `map-encounters/map-finale.mp4` (지도 피날레, 무음 6초) | 1 | FFmpeg 스크립트가 운영 지도 캡처 `_scratch/live-map-contact-review/originals/09-attack.png`를 줌 영상으로 만들고 제목 글자 3줄을 입힘. **글자는 macOS 시스템 글꼴 `/System/Library/Fonts/AppleSDGothicNeo.ttc`로 렌더** | git 추가 2026-11-14(`bcb4779`). 제작 스크립트 `_scratch/stage-villain-dialogue/movies.py`(저장소 밖). CREDITS에 항목 없음 | 캡처 속 그림(지도·연구원·모루·악당)의 권리를 따라감. Apple 시스템 글꼴을 영상에 구워 배포하는 조건 미확인 | `_scratch/stage-villain-dialogue/movies.py`, `HANDOFF.md`, `_shared/BGM-APPLY-BRIEF-20261117.md`; 캡처 속 그림은 사용자 확인으로 풀렸으나, Apple 시스템 글꼴을 구운 배포 조건은 여전히 미확인 | 근거 약함 |

## 3. 음악

| 파일(묶음) | 개수 | 만든 곳(생성 도구·제공처·라이브러리) | 만든 날·기록 위치(프롬프트 기록, 생성 로그, CREDITS, 계약) | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| `audio/bgm/main-theme.mp3`, `audio/bgm/finale.mp3` | 2 | Suno. 사용자가 직접 생성해 제공. 메인 테마는 반복용 26마디로 편집 | 2026-11-17. 프롬프트 `docs/SUNO-BGM-PROMPTS.md`, 원본 `references/suno/main_theme.mp3`·`final.mp3`. git 추가 2026-11-17(`aed7f1b`) | Suno **Premier(유료)** 요금제로 생성(2026-11-18 사용자 확인) | `public/assets/CREDITS.md`, `docs/SUNO-BGM-PROMPTS.md`, `_shared/voice-provenance-20261118.md`(요금제 표) | 확인됨 |

## 4. 효과음

| 파일(묶음) | 개수 | 만든 곳(생성 도구·제공처·라이브러리) | 만든 날·기록 위치(프롬프트 기록, 생성 로그, CREDITS, 계약) | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| `audio/select·drop·success·hint·experiment·pour·air·retry.mp3` | 8 | Kenney, Interface Sounds 1.0(원본 매핑 `sources.json`). FFmpeg로 MP3 변환·음량 정규화 | 2026-10-22 추가. 받은 원본 `references/audio/kenney_interface-sounds.zip`(License.txt 포함). git 추가 2026-11-09 | CC0 1.0 | `public/assets/audio/sources.json`, `public/assets/audio/Kenney-CC0.txt`, `public/assets/CREDITS.md` | 확인됨 |
| `audio/map-swing·map-hit-1~3·map-exit·map-appear·map-bump·map-victory.mp3` (지도 악당) | 8 | Freesound(qubodup, Raclure, HenKonen, insanity54, valeofhearts, michorvath, se2001, mickleness). 과학34 공통 효과음 라이브러리에서 이름만 바꿔 복사 | 2026-11-17. 라이브러리 처리·원본 페이지 CC0 재확인 기록 | CC0 1.0(2026-11-17 원본 페이지 재확인) | `public/assets/CREDITS.md`(지도 악당 효과음 표), `_shared/sfx-library-20261117/CREDITS.md`, `_shared/sfx-library-20261117/manifest.json` | 확인됨 |
| `audio/card-whoosh·card-reveal·card-epic·card-slot·card-complete.mp3` (성취 카드) | 5 | Freesound(qubodup, ZenithInfinitiveStudios, CogFireStudios, DeltaCode, el_boss). 공통 효과음 라이브러리 | 2026-11-18 적용, 라이브러리 2026-11-17 | CC0 1.0(원본 페이지 재확인) | `public/assets/CREDITS.md`(성취 카드 표), `_shared/sfx-library-20261117/CREDITS.md`, `_shared/sfx-library-20261117/manifest.json` | 확인됨 |
| `audio/step-1·step-2·jump·open-door·open-shine.mp3` (발자국·점프·공방 복구) | 5 | Freesound(sgossner, Yoyodaman234, qubodup, ZenithInfinitiveStudios) 4개, Kenney Interface Sounds(`open-door`) 1개. 공통 효과음 라이브러리 | 2026-11-19 적용, 라이브러리 2026-11-17 | CC0 1.0(라이브러리 manifest에 재확인 기록) | `public/assets/CREDITS.md`(발자국·공방 복구 소리 표), `_shared/sfx-library-20261117/manifest.json` | 확인됨 |

참고: `pour`·`air`는 오디오가 켜져 있으면 코드(`src/services/audio.ts`의 사인파 합성)로 소리를 내고 MP3는 대체용이다. 코드 합성 소리는 파일이 아니라 표에 따로 넣지 않았다(`docs/AUDIO-PROVENANCE-20261109.md`에 자체 작성 기록).

## 5. 목소리

| 파일(묶음) | 개수 | 만든 곳(생성 도구·제공처·라이브러리) | 만든 날·기록 위치(프롬프트 기록, 생성 로그, CREDITS, 계약) | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| `audio/npc-elevenlabs/` 의뢰·복구 20줄 + `tori-welcome.mp3` | 21 | ElevenLabs v4 한국어 라이브러리 음성(모루 Klamon, 단단이 Taek, 방울이 Jisun, 바람이 Rumi, 토리 Aria). voice ID·generation ID 기록 | 2026-11-12 생성(토리는 2026-11-13 교체). 원문·생성 정보 `manifest.json`, 검수 기록 `output/npc-dialogue-expanded-20261112/` | 생성 당시 ElevenLabs **Starter(유료)** 구독, 상업 이용 가능(2026-11-18 사용자 확인). 실제 사람 목소리 복제 없음 | `public/assets/audio/npc-elevenlabs/manifest.json`, `public/assets/CREDITS.md`(NPC 대화 확장), `docs/AUDIO-PROVENANCE-20261109.md`(2026-11-13 토리), `_shared/voice-provenance-20261118.md` | 확인됨 |
| `audio/npc-elevenlabs/` 2026-11-18 채움 (모루 121·재료 바꿔치기 봇 30·단단이 4·토리 3·방울이 1: 시작 이야기, 힌트, 개념 영상, 안내, 악당, 엔딩, 시험 길) | 159 | ElevenLabs `eleven_v4` 공식 API(text-to-speech, mp3_44100_128). 봇 목소리는 Harry - Character | 2026-11-18. 줄마다 원문·voiceId·generationId·받아쓰기 일치·SHA-256 기록 | 「ElevenLabs (유료 요금제, 상업 이용 가능)」. 공용 기록: 2026-11-18 같은 날 Starter → **Creator(유료, 연간)** 로 올림, 생성 시점 모두 유료(사용자 확인) | `docs/VOICE-FILL-20261118.json`, `public/assets/CREDITS.md`(시작 이야기 음성), `_shared/voice-provenance-20261118.md` | 확인됨 |
| `audio/npc-higgsfield/moru-story.mp3`, `banguli-story.mp3` (앱에서 재생 안 함, 파일만 실림) | 2 | Higgsfield Seed Audio. 기존 ElevenLabs 출력(`moru-reward.mp3`, `banguli-reward.mp3`)을 참조로 생성 | 2026-11-14, git 추가 2026-11-14(`7531e02`). generationId·받아쓰기·SHA-256 `manifest.json` | 요금제·이용 조건 문구 없음(공용 기록도 「저장소에 요금제 문구 없음」) | `public/assets/audio/npc-higgsfield/manifest.json`, `public/assets/CREDITS.md`, `_shared/voice-provenance-20261118.md` | 근거 약함 |
| `audio/npc-welcome.m4a` (앱에서 재생 안 함, 파일만 실림) | 1 | 모모(Momo) 로컬 Supertonic 3, 음성 F1 | 2026-11-07(`createdAt`). UUID·원본/배포 SHA-256·대본 기록 | OpenRAIL-M(Supertonic 3), 출력 6항과 이용 제한 준수. CC0 아님. 라이선스 전문 보존 | `docs/NPC-VOICE-PROVENANCE.json`, `docs/AUDIO-PROVENANCE-20261109.md`, `docs/SUPERTONIC3-LICENSE.txt` | 확인됨 |

## 6. 글꼴

| 파일(묶음) | 개수 | 만든 곳(생성 도구·제공처·라이브러리) | 만든 날·기록 위치(프롬프트 기록, 생성 로그, CREDITS, 계약) | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| `fonts/NanumSquareNeoTTF-bRg·cBd·dEb.woff2` (앱 UI·실험 Canvas) | 3 | NAVER Corporation, 나눔스퀘어 네오 | 2026-11-11 적용(git `4eb24c7`). 라이선스 원문 2026-11-10 공식 페이지에서 받음. 적용 검증 `docs/FONT-QA-20261111.md` | SIL Open Font License 1.1(글꼴 단독 판매 외 상업 사용 가능) | `public/assets/fonts/NanumSquareNeo-OFL.txt`, `public/assets/CREDITS.md`, `src/settingsContent.ts` | 확인됨 |
| `fonts/jua-korean-400.woff2`, `jua-latin-400.woff2` (운영 CSS·JS에서는 참조 없음, 개념 영상 제작용으로 실림) | 2 | Woowahan Brothers Corp., Jua(Google Fonts 배포). 기존 1udangtangtang 프로젝트에서 복사 | git 추가 2026-11-09(`4ceb290`) | SIL Open Font License 1.1 | `public/assets/fonts/Jua-OFL.txt`, `public/assets/CREDITS.md`(로컬 Jua 글꼴) | 확인됨 |

## 기록끼리 맞지 않는 곳 (고치지 않고 보고만 함)

1. `src/settingsContent.ts`의 `copyright` 문구가 지금 빌드와 다르다. 「배경 음악은 직접 합성했어요」(지금은 Suno 곡), 「효과음은 Kenney Interface Sounds(CC0)」(지금은 Freesound CC0도 있음), ElevenLabs 목소리 언급 없음.
2. `public/assets/CREDITS.md`에 다음 실림 파일의 항목이 없다: `run-stage/` 16개, `map-encounter/` 6개(+번들 사본 2), `map-encounters/map-finale.mp4`, `generated/glass-tank.webp`·`material-core.webp`, `icons/app-*.png`.
3. CREDITS 2026-10-22 절의 「자체 개념 클립: 직접 작성한 도형」은 2026-11-09 HyperFrames 교체 이전 설명이라 지금 영상(게임 그림 재사용)과 다르다.
4. `_shared/voice-provenance-20261118.md`의 9번 표(토리 5+3, 모루·단단이·방울이·바람이 16+2)는 `docs/VOICE-FILL-20261118.json`(2026-11-18 159줄: 모루 121, 재료 바꿔치기 봇 30 등)과 개수가 맞지 않고 악당 목소리 줄이 빠져 있다.
5. `map-finale.mp4`는 macOS 시스템 글꼴(Apple SD Gothic Neo)로 글자를 구웠다. 다른 영상은 OFL 글꼴만 쓴다.
6. 재생하지 않는 목소리 파일 3개(`npc-higgsfield/` 2개, `npc-welcome.m4a`)와 앱이 참조하지 않는 Jua woff2 2개가 운영 빌드에 실린다.

## 요약

**2026-11-21 사용자 확인 반영 뒤**(근거 `_shared/CODEX-IMAGE-RECORDS-20261121.md` 「16곳 전체 확인」)

- 전체 32줄(2026-11-21 S01-c 연필 조각 1줄 추가).
- 확인됨 28줄:
  - 확인됨(사용자 확인) 그림 15줄: 사용자 제공 3, Codex·OpenAI 생성 10, 지도 악당·반응 자세 2, 앱 아이콘 1. 그중 4줄은 Codex·`gpt-imagegen` 생성 기록 12건과도 맞음.
  - 2026-11-21 추가: 연필 조각(Codex GPT 이미지, 프롬프트·원본 저장소에 있음) 1줄.
  - 그 밖: SVG 아이콘, 개념 영상(자체 렌더), 음악 1, 효과음 4, 목소리 3, 글꼴 2.
- 근거 약함 4줄:
  - 키아트(Higgsfield)와 걷기 프레임(Canva): 저장소 증거가 사용자 확인과 어긋나 증거대로 둠.
  - `map-finale.mp4`: Apple 글꼴 문제.
  - Higgsfield 음성: 소리는 이번 확인의 범위 밖.
- 출처 미확인 0줄(전 1줄: 앱 아이콘).
- **「출처 미확인」 줄 수: 1 → 0**

이전(2026-11-21 오전) 요약: 확인됨 11, 근거 약함 19, 출처 미확인 1.

## 사용자가 줘야 하는 자료

2026-11-21 사용자 확인으로 1·2·3·6·7번은 장부를 채우는 데 더 필요하지 않다(요금제 화면 캡처는 납품 증빙으로만 남김). 남은 것은 4·5번(키아트·걷기 프레임의 실제 도구 확인), 8·9번 증빙, 10번 결정이다.

1. **사용자 제공 배경 5·캐릭터 5·로고 1**(`references/images/chatgpt_generated_0xx.png`): 누가 어떤 도구로 만들었는지와 재사용·상업 이용 권리 근거(외주라면 계약서·발주 메일, 본인 생성이라면 생성 계정과 당시 요금제). 표정 초상·키아트·카드·영상이 이 그림을 참조하므로 가장 먼저 필요하다.
2. **앱 아이콘 `icons/app-192.png`·`app-512.png`**: 만든 방법(로고에서 잘랐는지, 따로 생성했는지)과 근거.
3. **ChatGPT·Codex(OpenAI 이미지) 요금제 기록**: 2026-10-22 ~ 2026-11-18 사이 생성한 계정의 요금제 화면 캡처와 그 시기 OpenAI 이용약관(출력물 권리) 사본. 해당 그림: generated 전체, run-stage, npc-expressions, reward-cards, 지도 악당 시안.
4. **Higgsfield 요금제 기록**: 키아트(GPT Image 2.5, 2026-10-29)와 Seed Audio 음성(2026-11-14)을 만든 계정의 요금제 화면과 상업 이용 조건.
5. **Canva 요금제 기록**: 걷기 프레임(2026-11-07)을 만든 계정의 요금제와 AI 생성물 이용 조건.
6. **지도 악당 최종 스프라이트·주인공/동료 반응 자세**: 최종본을 어떤 도구로 만들었는지(시안만 Codex로 기록됨). 원본 생성 기록이 있으면 함께.
7. **성취 카드 그림 6종**: 원본 PNG와 프롬프트 위치(저장소와 `_shared`에서 찾지 못함).
8. **ElevenLabs 요금제 증빙**: 2026-11-12~13 Starter, 2026-11-18 Creator 구독 화면 또는 결제 영수증(지금은 사용자 확인 문구만 있음).
9. **Suno Premier 증빙**: 2026-11-17 생성 당시 구독 화면 또는 영수증(지금은 사용자 확인 문구만 있음).
10. **`map-finale.mp4`의 Apple SD Gothic Neo**: Apple 시스템 글꼴을 영상에 구워 배포해도 되는지 판단 자료. 어렵다면 OFL 글꼴(NanumSquare Neo·Jua)로 다시 만드는 쪽을 결정해 달라.
11. 글꼴 라이선스는 둘 다 원문이 있어 추가 자료가 필요 없다.
