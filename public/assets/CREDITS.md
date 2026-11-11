# 크레딧과 출처

## 도구·라이선스 검토 (2026-10-22)

이 표는 로컬 파일과 생성 manifest를 확인한 기록이야. 상업 납품에 필요한 계약·생성 당시 요금제 확인을 대신하지 않아.

| 도구·자료 | 사용처 | 확인한 내용 | 판정 / 후속 조치 |
|---|---|---|---|
| React·React DOM·scheduler | 런타임 UI | 설치본 LICENSE의 MIT 표기 | 고지 보존. 전체 배포 의존성의 notice 대조 필요 |
| Phaser 3.90.0 | 지도·실험 | 설치본 LICENSE.md의 MIT 표기 | 고지 보존 |
| Three.js 0.180.0 | 기존 의존성, 후속3D 준비 | 설치본 LICENSE의 MIT 표기 | 현재2D화면 사용 여부와 최종 번들 확인 |
| Vite·Vitest | 개발·검증 | 설치본 LICENSE.md의 MIT 표기 | 빌드 도구, 포함 notice 보존 |
| TypeScript·sharp | 타입 검사·이미지 최적화 | 설치본 LICENSE의 Apache-2.0 표기 | 배포에 도구를 포함하면 원문·관련 notice 보존 |
| 기존 배경5·NPC5·로고 | 모든 시설·대화·메인 | 사용자 제공 이미지에서 변환·추출 | **권리 근거 미확인: 상업 납품 전 생성서비스·요금제·재사용권 확인** |
| 신규 생성 이미지5 | 지도·연구원·모루·우산·보관함 | OpenAI image generation, 2026-10-22, generated/manifest.json | 생성 계정·요금제·상업 이용 근거 별도 보관 필요 |
| 메인 키아트1 | generated/title-keyart.webp (토리·모루·공방 마을) | Higgsfield GPT Image 2.5, 2026-10-29, 토리·모루 시트와 지도 그림을 참조로 생성. 원본 references/generated/title-keyart/ | 생성 계정·요금제·상업 이용 근거 별도 보관 필요 |
| 지도 걷기 시트2 | generated/walk 연구원·모루 4방향 프레임32 | Canva 이미지 생성, 2026-11-07, 기존 researcher·companion을 참조로 생성. 원본 references/generated/walk, 자르기 scripts/prepare-walk-sprites.mjs | Canva 계정 요금제·AI 생성물 이용 조건 별도 보관 필요 |
| 합성 BGM | src/services/audio.ts | Web Audio 코드에서 직접 합성 | 외부 음악 파일 사용 없음 |
| Kenney Interface Sounds 1.0 | 선택·놓기·발견·힌트·도구 등 효과음 8종 | 공식 사이트 CC0 표시 및 다운로드 ZIP License.txt 대조 | audio/Kenney-CC0.txt 원문·sources.json 매핑 보존 |
| 개념 모션 영상 10개 (2026-11-09 교체) | 활동 완료·다시 보기 | HyperFrames 0.9.26(오픈소스 CLI, 로컬 렌더)로 직접 만든 HTML 장면 → FFmpeg. 게임 안 그림(모루·NPC4·우산·보관함·나무 시료)과 Jua 글꼴을 재사용, 새 생성 이미지·음원 없음. 애니메이션 라이브러리 GSAP 3.15.0(GreenSock Standard License, 제작 소스에만 포함, 앱 번들에는 없음) | films/concept-clips(소스·SPEC·REVIEW), concepts/manifest.json |
| SVG 공통 아이콘 | src/components/Icon.tsx | 프로젝트 코드의 직접 작성 SVG | 별도 유료 아이콘 팩 없음 |
| NanumSquare Neo Regular·Bold·ExtraBold (400·700·800) / Jua 400 | NanumSquare Neo는 앱 UI·실험 Canvas, Jua는 기존 개념 영상 제작 | 자체 호스팅 WOFF2. NanumSquare Neo는 NAVER Corporation 저작권 및 SIL OFL 1.1, Jua는 기존 프로젝트에서 SIL OFL 1.1 고지와 함께 재사용 | `fonts/NanumSquareNeo-OFL.txt`·`fonts/Jua-OFL.txt` 원문과 저작권 고지 보존. 글꼴 적용 검증: `docs/FONT-QA-20261111.md` |

미확인 에셋 권리를 해결하기 전 **상업 배포 승인 완료로 판단하지 않아**. 기본 이미지는 학습용 재현 그림으로, 실제 재료의 성질이나 실험 결과를 보장하는 사진이 아니야.

## 기존 사용자 제공 이미지 매핑

원본은 references/images에 보존하고 scripts/prepare-assets.mjs로 최적화했어. 실제 변환 위치는 assets/manifest.json에 기록되어 있어.

| 배포 파일 | 제공 원본 | 처리 |
|---|---|---|
| backgrounds/stage-1.webp | chatgpt_generated_034.png | 1440px, WebP quality80 |
| backgrounds/stage-2.webp | chatgpt_generated_041.png | 동일 |
| backgrounds/stage-3.webp | chatgpt_generated_038.png | 동일 |
| backgrounds/stage-4.webp | chatgpt_generated_042.png | 동일 |
| backgrounds/stage-5.webp | chatgpt_generated_043.png | 동일 |
| characters/moru.webp | chatgpt_generated_051.png | 단일 캐릭터 추출, 240px, WebP |
| characters/dandani.webp | chatgpt_generated_052.png | 동일 |
| characters/banguli.webp | chatgpt_generated_053.png | 동일 |
| characters/barami.webp | chatgpt_generated_054.png | 동일 |
| characters/tori.webp | chatgpt_generated_055.png | 동일 |
| logo.webp | chatgpt_generated_050.png | 투명 여백 정리, 900px, WebP |

이 파일 이름만으로 AI 생성 도구·원저작자·생성일·상업 이용 허가가 입증되는 것은 아니야. 사용자 제공 자료의 출처와 권리 근거는 납품 담당자가 확인할 항목이야.

## 이번 신규 생성 이미지

생성 도구: OpenAI image generation. 생성일: 2026-10-22. 게임 참조 파일은 D: 프로젝트 안에 있어. 생성 원본·선택 출력·해상도·투명도 매핑은 generated/manifest.json을 봐.

| 파일 | 최적화 크기 | 목적 |
|---|---|---|
| generated/workshop-island.webp | 1536×1024 | 2.5D 픽셀 RPG 지도 |
| generated/researcher.webp | 256×384, alpha | 지도 주인공 |
| generated/companion.webp | 256×384, alpha | 모루 동료 |
| generated/umbrella.webp | 900×900, alpha | 우산 기본 그림·후속3D 기준 |
| generated/invention.webp | 900×900, alpha | 보관함 기본 그림·후속3D 기준 |

프롬프트 문서와 독립 캔버스는 docs/3d-image-prompts.md·html에 있어. 후속 부품8개·GLB는 이번 생성 완료 목록에 포함하지 않아. AI 생성 결과는 별도 상표·캐릭터·저작물과의 충돌 검토가 필요할 수 있으며, 이 문서는 법률 판정이 아니야.

## 학습 자료와 표현

- 2026-11-12 유리 용기, 나무토막, 손펌프, 공기주머니의 팽창 전후 그림 5개를 OpenAI 기본 이미지 생성 도구로 새로 제작했어. 원본은 외장 SSD의 `references/generated/science-20261112`에 보존했고 투명 여백을 정리한 WebP를 게임에 적용했어. 생성 프롬프트·크기·사용 화면·변환 기록은 `generated/manifest.json`에 있어. 물높이, 공기 이동, 재료 판정과 글자는 코드가 표현해.
- 성취기준별 목표, 관찰할 증거, 새 상황 문제, 과학 표현의 범위와 출처를 `docs/screen-spec.json`의 화면별 `learning`에 연결했어. 실제 교사 검토 상태는 별도 항목으로 보존했어.

- 사용자 제공 샘플과 기존 기획을 참고했어. 샘플 화면을 학생의 조작 가능한 UI처럼 배경에 그대로 붙이지 않았어.
- 성취기준 세 문장과 해설은 경기도교육청 「초등 깊이있는 수업 프레임워크」 부록, 3~4학년군(2024) PDF 77쪽 본문과 직접 대조했어. 출처 URL·문구는 docs/PRD.md의 대조 기록에 있어. 게임만으로 성취기준 전체 달성을 판정하지 않아.
- 재료의 성질은 게임에 명시한 시료와 조건의 단순화된 탐구 모형이야. 실제 모든 재료·제품에 일반화하지 않아.
- 학생 기록은 서버에 전송하지 않고 현재 브라우저에 저장해. 설정 초기화로 이 게임의 기록만 지울 수 있어.

## 고지 범위

기획·제작: 옐샘 & 아이스크림미디어.

프로젝트 자체 제작물의 무단 복제·재배포·판매를 금지해. 이 문구는 제3자 코드·자료의 권리를 새로 주장하는 의미가 아니야.

외부 라이브러리·자료에는 각 원저작자의 라이선스가 우선 적용돼. 최종 배포물에 필요한 저작권·라이선스 원문을 함께 보존해.

## 런타임 MIT 라이브러리 고지

### React / React DOM / scheduler

```text
MIT License

Copyright (c) Meta Platforms, Inc. and affiliates.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Phaser

```text
The MIT License (MIT)

Copyright (c) 2024 Richard Davey, Phaser Studio Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### Three.js

```text
The MIT License

Copyright © 2010-2025 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

## 로컬 Jua 글꼴

기존 1udangtangtang 프로젝트의 Jua 글꼴을 재사용했어. 아래 파일 세 개가 이번 프로젝트에 함께 복사된 것을 확인했어.

- fonts/jua-korean-400.woff2
- fonts/jua-latin-400.woff2
- fonts/Jua-OFL.txt

저작권 표기: Copyright (c) 2017 Woowahan Brothers Corp., Reserved Font Name “Jua”. 배포 표기는 Google Fonts, 라이선스는 SIL Open Font License 1.1이야. 글꼴과 함께 복사한 fonts/Jua-OFL.txt에 원문 고지를 보존했어.

## 2026-10-22 · 효과음과 개념 모션 영상 추가

- 원저작자: Kenney (www.kenney.nl), Interface Sounds 1.0, CC0 1.0.
- 공식 출처: https://kenney.nl/assets/interface-sounds
- 받은 원본: references/audio/kenney_interface-sounds.zip (License.txt 포함).
- 배포 고지: audio/Kenney-CC0.txt, 원본 파일 매핑: audio/sources.json.
- MP3 변환과 음량 정규화: 로컬 FFmpeg. 효과음은 UI 피드백용이며 실제 물·공기 녹음이라고 표시하지 않아.
- 자체 개념 클립: concepts/S01~S10의 WebM·MP4·WebP. 직접 작성한 도형이고 별도 유료 영상 소스·AI 영상 생성 서비스는 쓰지 않았어. FFmpeg 실행 파일은 배포하지 않아.
- 다람쥐 힌트 친구는 기존 generated/companion.webp를 지도·활동·영상 자막에 일관되게 활용했어. 새 이미지 생성·외부 캐릭터 구입은 하지 않았어.


## 2026-11-11 앱 글꼴 통일

본문·제목·버튼·입력란·실험 Canvas 라벨은 NAVER NanumSquare Neo Regular/Bold/ExtraBold 자체 호스팅 WOFF2를 사용한다. SIL Open Font License 1.1 원문은 fonts/NanumSquareNeo-OFL.txt에 포함한다. 기존 Jua 라이선스는 이미 렌더된 개념 영상의 출처 기록을 위해 보존하며, 영상 속 글자는 이번 UI 글꼴 변경에 포함하지 않는다.
