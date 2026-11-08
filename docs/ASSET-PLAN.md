# 에셋 사용·제작 계획

2026-10-22 · [PRD](PRD.md) · [프롬프트 캔버스](3d-image-prompts.html)

## 이번 MVP에서 쓰는 자산

| 원본 또는 제작 대상 | 런타임 경로 | 용도 / 처리 |
|---|---|---|
| references/images/chatgpt_generated_034.png | assets/backgrounds/stage-1.webp | 재료 감정실 배경, 1440px·WebP |
| chatgpt_generated_041.png | assets/backgrounds/stage-2.webp | 성질 시험실 배경 |
| chatgpt_generated_038.png | assets/backgrounds/stage-3.webp | 상태 실험실 배경 |
| chatgpt_generated_042.png | assets/backgrounds/stage-4.webp | 공기 추적실 배경 |
| chatgpt_generated_043.png | assets/backgrounds/stage-5.webp | 발명 제작소 배경 |
| chatgpt_generated_051~055.png | assets/characters/{moru,dandani,banguli,barami,tori}.webp | 개별 NPC 추출, 240px |
| chatgpt_generated_050.png | assets/logo.webp | 기존 로고 투명 여백 정리·900px |
| 신규 생성 M01 | assets/generated/workshop-island.webp | 지도·메인 배경, 공방5+코어·이어지는 길 |
| 신규 생성 C01 | assets/generated/researcher.webp | 지도 연구원, 투명 단일 캐릭터 |
| 신규 생성 C02 | assets/generated/companion.webp | 뒤따르는 모루, 투명 단일 캐릭터 |
| 신규 생성 U01 | assets/generated/umbrella.webp | S01·S02 우산 기본 이미지·후속3D 마스터 |
| 신규 생성 B01 | assets/generated/invention.webp | S09·S10·엔딩 보관함 기본 이미지·후속3D 마스터 |
| 신규 생성 K01 (2026-10-29) | assets/generated/title-keyart.webp | 메인 화면 풀블리드 키아트. 토리·모루가 오른쪽, 왼쪽은 로고·문구 자리. 후보 2장은 references/generated/title-keyart |

신규 5개의 생성 파일·치수·투명도는 generated/manifest.json과 실제 파일로 확인했다. 적용·화면 시각 검수 결과는 최종 검증 보고서에서 확인한다. 경로 목록 자체를 생성 완료 증거로 사용하지 않는다. 원본65개와 샘플10장은 references에 보존하고 배포 필수 로딩에 포함하지 않는다. 기존 변환 매핑은 public/assets/manifest.json에 있다.

## 제작 순서와 화면 계약

1. M01 지도와 C01·C02를 같은 픽셀 밀도·시점·팔레트로 준비한다. 지도 그림의 입구와 코드의 좌표·길을 맞춘다.
2. U01·B01은 1024px 이상의 투명 단일 오브젝트 마스터다. MVP는 기본 그림+semantic 부품 버튼으로 사용한다.
3. 후속 GLB 착수 때만 아래 부품 기준도8개를 추가한다. 승인한 U01/B01을 참조해 비율·색·연결부를 유지한다.
4. UI 아이콘·눈금·물 표면·기포·도구 상태는 SVG/DOM/2D 렌더를 쓴다. 정확해야 할 기능 요소를 래스터에 굽지 않는다.

이번 범위는 지도만2.5D·실내2D다. 시설 배경 전체·NPC를3D로 만들지 않는다. 영상·더빙·클라우드·추가게임은 포함하지 않는다.

## 후속3D 부품 기준도

| ID | 대상 | semantic part | 상태 |
|---|---|---|---|
| U02 | 우산 천 | canopy | 후속 선택 제작 |
| U03 | 살·중심 봉 | frame | 후속 선택 제작 |
| U04 | 나무 손잡이 | handle | 후속 선택 제작 |
| B02 | 보관함 몸체 | body | 후속 선택 제작 |
| B03 | 뚜껑 | lid | 후속 선택 제작 |
| B04 | 관찰창 | window | 후속 선택 제작 |
| B05 | 손잡이 | handle | 후속 선택 제작 |
| B06 | 모서리 보호대1개 | bumper | 후속 선택 제작 |

최종 GLB는 우산·보관함 각1개다. 이미지 개수와 모델 파일 수는 다르다. 부품 이미지는 자동 메시 분리나 치수 정확도를 보장하지 않는다. body/lid 재질 연동, window 경계·두께·투명도, bumper 인스턴스와 프레임 연결을 검수한다.

## 그림·학습 품질 수용 조건

- 불필요한 글자·버튼·이모지·상표가 없어야 한다. 로고 외 문구는 DOM으로 표시한다.
- 지도와 캐릭터는 발 기준 접지·그림자·시점을 맞춘다. 건물·물길을 가로지르지 않고 길을 따라 걷는다.
- 모루는 기존 갈색 다람쥐·고글·조끼 정체성을 유지한다. 임의의 동물로 바꾸지 않는다.
- 우산은 천·금속·나무 구별, 보관함은 몸체·창·보호대의 기능 차이가 읽혀야 한다.
- 생성된 보관함이 기본 재료를 보여 줘도, 실제 선택 재료·판정은 게임의 시료 기록이 기준이다. 그림 하나를 모든 재료 상태의 증거로 사용하지 않는다.
- 양·고체 크기·물높이·공기 공간·휴지 상태는 동적2D 실험에서 정확하게 표현한다.
- 파일은 D: 프로젝트에 보관한다. WebP 최적화와 투명도·잘림·작은 화면·태블릿 가독성 검수를 거친다.

## 출처·납품 확인

기존 사용자 제공 이미지의 생성서비스·요금제·생성일·상업 이용 근거는 제공되지 않았다. 파일명에 generated가 있어도 계약 권리를 확인한 것으로 간주하지 않는다. 신규 생성물도 생성 도구·실제 생성일·선택 결과·상업 이용 근거를 함께 보관한다.

[public/assets/CREDITS.md](../public/assets/CREDITS.md)에 자료별 상태를 기록한다. 권리 미확인은 상업 납품 전 해소해야 한다. ‘1우당타앙’ 원본과의 직접 화질·상호작용 비교는 이번 자산 검토에서 수행하지 않았다.