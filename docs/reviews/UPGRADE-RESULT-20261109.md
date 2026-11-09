# 고도화 결과 — 9 things (materials-discovery-lab) · 2026-11-09 밤

브랜치 `claude/upgrade-20261109` (시작 `9ba57e5` = 운영본). 배포·push 안 함. 점수는 `SCORE-20261109.md`, 계획은 `UPGRADE-PLAN-20261109.md`.

## 바꾼 것
| 커밋 | 내용 |
|---|---|
| `ec84ed1` | S10 '결과' 버튼 44→48px(`stage-fit.css`, `activity-stages.css`) · 버튼/지도 이름표/부품 표식 hover 이동을 `(hover:hover) and (pointer:fine)` 로 한정(`styles.css`) · 반응형 검사기 0×0 숨은 글자 오탐 제거(`tools/check-responsive.py`) · 로딩·개념영상·새로고침 검사 `tools/check-concept-load.mjs` 추가 · 계획서 |
| `b3f7f18` | 개념영상 10편 교체(HyperFrames "모루의 발견 극장", 9 s → 15 s) · `films/concept-clips`(kit/films/build, SPEC, REVIEW, 게임 그림 사본) · 앱 시간 상수 `CONCEPT_SECONDS=15`, `CONCEPT_CHAPTER_SECONDS=5` · 테스트 `tests/concept-clips.test.ts` · 옛 SVG 렌더러 제거(`npm run concepts:render` 는 새 파이프라인 호출) · 검사 스크립트 버튼 이름 '15초' · CREDITS |
| (이 커밋) | SCORE·PLAN·RESULT 문서, 반응형 before/after JSON, 로딩·영상 실측 JSON(`docs/reviews/upgrade-20261109/`) |

학습 판정·저장·보상·지도 로직은 바꾸지 않았다. 원본 폴더의 미커밋 사진/지도 복원 작업은 가져오지 않았다.

## 개념영상
- 10편 모두 교체: `public/assets/concepts/S01~S10.{mp4,webm,webp}` (경로·파일명·형식 그대로, 960×540 30fps, mp4 faststart 확인).
- 길이 10편 모두 15.00 s(ffprobe). 용량 mp4 150~203KB, webm 160~222KB, 포스터 22~37KB, 30파일 합계 4,053,723 B.
- 장면 경계 0/5/10 s = 앱 장면 버튼·자막 cue. 포스터 = 마지막 장면(결론 + 반응) → 움직임 줄이기 사용자에게 결론 그림 + 요약 문장.
- 소스: `films/concept-clips/` (1920×1080 마스터는 커밋하지 않음, TMPDIR 에만).

## 검증 명령과 실제 결과
| 명령 | 결과 |
|---|---|
| `npm run typecheck` | 통과 |
| `npm test` | 4파일 45개 통과 (BEFORE 3파일 42개) |
| `npm run build` | 통과. Phaser 1.21MB 청크 경고(기존 그대로). 오프라인 사전 저장 112파일 8.98 MiB (BEFORE 6.13 MiB) |
| `QA_PROFILES=1280x800,1920x1080,1024x768,915x412,1024x600 python tools/check-responsive.py http://127.0.0.1:5118 upgrade-20261109-after` | 100화면 이슈 0, 가로 넘침 0, 페이지 오류 0 (BEFORE 이슈 27: 실제 3종 + 오탐 18) |
| `node tools/check-concept-load.mjs http://127.0.0.1:5118` | 첫 그림 1332 ms(빌드 직후 첫 실행)/10Mbps 조건 836 ms, 0.96 MB, 외부 도메인 0 · 10편 readyState 4, 15.0 s, 포스터 OK, 3장 이동 10.25 s, Esc 닫힘 · reduced-motion 자동재생 없음 · S01 새로고침 복원 · 잠긴 S07 직접 진입 차단 |
| `hyperframes check --json` (10편 각각) | 10편 ok=true, 오류 0. 경고는 `films/concept-clips/REVIEW.md` 에 이유와 함께 |
| `hyperframes snapshot --review` + 렌더 마스터 프레임 추출 | 10편 프레임 직접 확인, 발견한 결함 3건 고친 뒤 재렌더 |
| `python tools/check-student-flow-fit.py` (dev 서버) | **실패(검사기 문제)**: S01·S02 UI 완주 후 S03 에서 현 UI 에 없는 '멈추기' 버튼을 기다리다 시간 초과. 제품 오류가 아니라 11-08 이후 실험 재생 UI 와 검사기가 어긋난 것으로 판단(추정). 계획 1-6 |

## 미검증과 이유
- 학생 흐름 UI S03~S10 전체 완주: 위 검사기 문제. 도메인 완주 테스트(flow.test)는 통과.
- mp4 경로 실제 재생: 헤드리스 Chrome 은 webm 을 고름. mp4 는 ffprobe(h264, 15 s, faststart)로만 확인 — Safari/iPad 실기 재생 미확인.
- 실제 태블릿·전자칠판, 소리(영상은 무음), 글자 하한(C20)·텍스트 200%(C25), 저사양 FPS(D9), 뒤로가기(B13), 40분 분량(B16).
- 915×412 에서는 영상 속 이름표가 작아 읽기 어렵다(앱 자막이 같은 내용을 맡음).

## 남은 일
1. `check-student-flow-fit.py` 를 자동재생·배속 UI 에 맞게 고치고 S01~S10·보고·인증서 UI 완주(계획 1-6).
2. OG 이미지·카톡 썸네일·저장 origin 문서(배포 준비 6점).
3. 성취기준·검수 메타데이터 구조화(A11·A12), 오답 피드백 → 개념영상 장면 바로가기(2-4).
4. S04 결론 장면에 성질 이름표 다시 붙이기(REVIEW 약점).
5. 제공·생성 이미지 상업 이용 근거 보관(F12, 사람).
6. 다음 단계(범위 밖): 13~16번에 있는 hands-on 지도 복원 기능을 9번에 새로 설계.
