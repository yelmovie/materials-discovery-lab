# 물질 공방 대작전

다섯 공방을 복구하며 재료·성질·고체·액체·공기를 탐구하고 보관함을 설계하는 교육게임 MVP야. 스테이지 선택은 2.5D 픽셀 RPG, 시설 안은 2D야. 기존 탐구10개에 적용 과제20문항을 더했고, 우산·보관함은 생성 기본 그림을 사용해 추후 GLB로 교체할 수 있게 했어.

## 실행

프로젝트 위치는 D:\iscreammedia_sc34\9 things야. Node.js와 npm이 준비된 환경에서 실행해.

~~~powershell
$env:TEMP = 'D:\DevTemp'
$env:TMP = 'D:\DevTemp'
npm ci
npm run dev -- --port 5189
~~~

기본 로컬 주소는 http://127.0.0.1:5189이야. 이미 node_modules가 있으면 설치를 생략할 수 있어. typecheck / test / build / preview 명령은 package.json에 정의되어 있어.

~~~powershell
npm run typecheck
npm test
npm run build
npm run preview -- --port 5190
~~~

## 구현 범위

- 지도에서 연구원과 동료가 길을 따라 이동하고, 공방 의뢰·실험·적용 과제·연구 기록·시설 복구로 이어져.
- 적용 과제는 선택·복수 근거·순서 구성·카드 분류 네 가지로 구성돼. 기본 탐구 뒤에 열리고 오답 관찰 안내를 제공해.
- 공통 홈·이전·소리·설정, 연구 수첩, 자동 저장, 시연 상태 분리, 보고·코어·엔딩·인증서·인쇄를 포함해.
- 설정의 교사용 도구에서 전체 해금 토글 하나로 시연해. 학생 진행·보상과 따로 진행하며 끄거나 새로고침하면 원래 학생 기록이 남아.
- 우산·보관함은 이번엔 2D 기본 그림이야. 실제3D 모델과 분리 부품 기준도8개는 후속 범위야.

## 문서

| 문서 | 내용 |
|---|---|
| [PRD](docs/PRD.md) | 학습 목표·동기·보상·활동·수용 기준 |
| [TRD](docs/TRD.md) | 상태·저장·실험 불변식·시연·검증 계약 |
| [에셋 계획](docs/ASSET-PLAN.md) | 기존 자료·이번 생성5개·후속부품8개 |
| [독립 프롬프트 캔버스](docs/3d-image-prompts.html) | 이미지 미리보기·목록 필터·프롬프트 복사·인쇄 |
| [3D 전환 프롬프트](docs/3d-image-prompts.md) | 적용 화면·부품 ID·제작 기준 |
| [화면 명세](docs/screen-spec.json) | 기존 화면·재료·기본 판정 데이터 |
| [CREDITS](public/assets/CREDITS.md) | 출처·라이선스 확인 상태·라이브러리 고지 |

캔버스는 게임과 독립된 HTML 파일이야. 파일을 브라우저에서 열면 돼. 지도·물체 미리보기는 프로젝트의 public/assets/generated 파일을 참조해.

## 저장과 납품 전 확인

학생 기록은 현재 브라우저의 material-workshop-mission.student.v1 키에 저장돼. 서버 동기화는 없어. 초기화는 확인 단계를 거쳐 이 게임의 기록만 지우고 소리 설정은 유지해. 다른 기기·브라우저에는 자동으로 이어지지 않아.

최종 검증 결과는 docs/reviews에서 확인해. 실제 태블릿·교실 네트워크·학생 사용성은 별도 실측이 필요해. 기존 사용자 제공 이미지와 신규 생성물의 상업 이용 근거는 납품 전에 확인해야 해. 최신 납품 점검과 점수는 RELEASE-REVIEW-20261111.md와 SCORE-20261111.md에 기록해.

운영 주소는 https://materials-discovery-lab.yelsam.workers.dev/ 야. 운영·미리보기·localhost는 origin이 달라서 학생 저장 기록이 각각 분리돼. 같은 운영 주소의 업데이트는 기존 기록을 이어 읽어. 새 버전 안내가 나오면 모든 게임 탭을 닫고 다시 열면 돼.

Mac에서는 외장 SSD의 프로젝트에서 실행하고 임시파일과 캐시도 같은 SSD로 지정해.

~~~sh
mkdir -p .tmp/runtime .tmp/npm-cache .tmp/node-compile-cache
export TMPDIR="$PWD/.tmp/runtime" TMP="$PWD/.tmp/runtime" TEMP="$PWD/.tmp/runtime"
export npm_config_cache="$PWD/.tmp/npm-cache" NODE_COMPILE_CACHE="$PWD/.tmp/node-compile-cache"
npm test
npm run build
npm run preview -- --port 5320
~~~

브라우저 회귀 검사는 설치된 Python Playwright와 시스템 Chrome을 사용해. `tools/check-fit.py`는 실험·문제의 겹침과 스크롤, `tools/check-maker.py`는 제작 실패·수정·납품, `tools/check-delivery-pages.py`는 홈·팝업·마무리 페이지를 확인해. 프로덕션 빌드의 학생 완주는 먼저 `node tools/export-qa-reference.mjs`를 실행하고 `QA_REFERENCE="$PWD/.tmp/delivery-reference.json"`을 지정해 `tools/check-student-flow-fit.py`를 실행해. 정답 참조 데이터를 읽고 실제 화면의 버튼을 눌러 진행해.

원본65개와 샘플10장은 references에 보존돼. 이전 기획은 references/source-documents에 있고, 현재 구현 기준은 docs/PRD.md·TRD.md와 실제 도메인 데이터야.

배포 빌드는 서비스워커로 이미지·화면 코드·개념 영상·효과음을 사전 저장해. 미디어의 Range 요청도 캐시에서 처리해. 최초 온라인 준비 후 서버 중단 상태에서 지도·새 활동·관찰 저장·재로딩을 확인했어. 업데이트는 수업 중 강제로 갈아끼우지 않고 모든 게임 창을 닫은 뒤 적용해. [최종점검](docs/reviews/FINAL-CHECK-20261022.md)에 실측과 미검증 항목을 구분했어.


## 메인 · 지도 · 교사 시연 고도화 (2026-10-30)

참고작(우당탕 힘 실험실·동물기록 복구작전·초록정원 연구기지·생명시계 연구실)의 화면 구성을 맞췄어.

- **메인**: 아래 다섯 카드 띠를 없애고, 새로 만든 풀블리드 키아트(토리·모루·공방 마을, `assets/generated/title-keyart.webp`) 위에 로고·문구·출발 버튼만 둬. 세로 폰에서는 문구가 아래로 내려가.
- **지도**: 화면 비율과 상관없이 위아래·좌우 띠 없이 꽉 채우고 연구원을 따라가. 이후 고도화 내용은 아래 ‘지도 이동 · 디자인 고도화’에 있어.
- **교사용 전체 해금**: 다섯 공방과 중앙 코어가 모두 열려. 활동 화면 왼쪽 아래 ◀ ▶ 와 키보드 ← → 로 14단계(활동10+보고·코어·복구·인증서)를 넘기고, 오른쪽 아래 ‘다음 스테이지’로 다음 공방 첫 활동에 바로 가. 낮은 가로 화면에서는 두 버튼이 상단 메뉴 줄로 올라가. 학생 기록은 그대로야.

## 지도 이동 · 디자인 고도화 (2026-11-07)

제작 현황 시트의 완료작 5개(우당탕 힘 실험실·동물기록 복구작전·초록정원 연구기지·생명시계 연구실·밀고 당기는 도시)의 지도를 직접 눌러 보고 공통 방식을 맞췄어.

- **길**: 그림에 칠해진 돌길을 다시 따서 `src/domain/worldMap.ts`의 길 데이터를 바꿨어. 문 앞 좌표도 실제 문에 맞췄어. 길 폭 안에서 움직이고, 길 가장자리를 밀면 미끄러지듯 따라가.
- **이동**: 방향판·방향키·WASD를 누르고 있으면 계속 걸어(대각선 포함). 땅이나 건물 이름을 누르면 길을 따라 걸어가고, 가는 길이 점선으로 보여. 문 앞에 닿으면 버튼이 ‘들어가기’로 바뀌고 벗어나면 돌아와.
- **카메라**: 지도 한눈에 보기, 손으로 둘러보기, 연구원 따라 보기를 넣었어. 공방에서 돌아오면 광장이 아니라 그 공방 문 앞에서 다시 시작해.
- **복구 연출**: 지도 전체가 어스름했다가 공방을 복구할수록 밝아져. 복구 직후에는 창문에 불이 켜지고 빛이 길을 따라 중앙 코어로 흘러가. 움직임 줄이기를 켜면 연출은 건너뛰어.
- **화면**: 이름표는 공방 친구 얼굴·잠금/완료 표시·활동 2칸 진행 점을 담은 간판으로 바꿨어. 위쪽에 다음 목표와 복구 수, 오른쪽 아래에 황금색 다음 행동 버튼이 있어. 다음 목표가 화면 밖이면 이름표가 가장자리에 붙어서 방향을 가리켜.

연구원·모루는 앞·왼쪽·오른쪽·뒤 네 방향 4프레임 걷기 그림을 써. 움직이는 쪽으로 방향이 바뀌고, 모루는 연구원이 걸은 길을 그대로 따라와. 시트는 `references/generated/walk`, 잘라 낸 프레임은 `public/assets/generated/walk`에 있고, `node scripts/prepare-walk-sprites.mjs`로 다시 만들 수 있어.

## 개념 영상 · 직접 조작 강화

각 활동에 15초 모션 영상 10개를 적용했어. 탐구→새 의뢰→개념 정리의 흐름, 다람쥐 모루의 단계별 힌트, 재료 카드 끌기와 분류, 고체·컵 직접 이동, 기울기와 연속 붓기, 공기 펌프, 재료에 따라 변하는 설계 모형을 포함해. 완료한 요구 조건과 예상은 접어 긴 패널을 줄였고, 의뢰의 주 버튼은 하단의 같은 자리에 있어.

Kenney의 CC0 효과음 8개와 기존 합성 BGM을 사용해. 영상 중에는 게임 소리가 겹치지 않아. 제작·출처·재생성 방법은 [모션과 상호작용](docs/MOTION-AND-INTERACTION.md)에 정리했어.

```powershell
# 개발 서버를 켠 상태에서, Python Playwright + Chrome으로 점검
npm run check:layout
python tools/check-student-flow.py
# FFmpeg 경로는 FFMPEG 환경변수로 바꿀 수 있어.
npm run concepts:render
```

화면 검수와 실제 조작 결과는 docs/reviews/experience의 JSON·JPG에 남아. 좁고 낮은 가로 화면에서는 일부 관찰 근거만 패널 안에서 스크롤해. 실제 태블릿·전자칠판에서의 터치 감도와 시청 거리는 별도 실기기 검증이 필요해.
