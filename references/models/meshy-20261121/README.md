# Meshy 3D 모형 원본 · 2026-11-21

S01·S02 우산과 S09·S10 보관함을 3D로 바꾸기 위한 시험 생성 기록이다. 원본 GLB는 용량이 커서 Git에 올리지 않는다(`.gitignore`). 이 폴더(외장 SSD)에만 보관한다.

| 파일 | 입력 그림 | Meshy 작업 ID | 모델명(Meshy) | 크레딧 | 삼각형 | 크기 | SHA-256 |
|---|---|---|---|---|---|---|---|
| `umbrella-meshy71-std-tex2k.glb` | `references/generated/umbrella.png` (U01) | `01a1fce0-dec1-700c-b004-a7e0f66c66e2` | Blue Umbrella | 30 | 315,240 | 15,896,452 B | `50821634dc49b0767e983db5016471016cda1c186c0e962820fa2869301bbe02` |
| `box-meshy71-std-tex2k.glb` | `references/generated/invention.png` (B01) | `01a1fcec-0e0c-701b-a211-9fd443e7854a` | Starfish Keepsake Case | 30 | 713,324 | 27,183,184 B | `e0389b3d907c090f7c84a9b6f31329734201254521a9a8dfd1860ec20c0f1630` |

## 생성 조건

- 서비스: Meshy 웹 작업 공간 Image to 3D(높은 디테일), 사용자 계정(Premium 연간 구독).
- 설정: Meshy 7.1, 해상도 표준, 텍스처 켬(Meshy 7, 2K), 포즈 끔, 이미지 향상 기본값(켬), 라이선스 「비공식적인」(비공개, CC BY 아님).
- 조작: Claude Code가 Aside CLI로 사용자 브라우저를 조작했다. 장당 1회씩만 생성했다.
- 받기: 다운로드 버튼이 만드는 `assets.meshy.ai` 서명 주소를 받아, 외장 SSD로 바로 `curl` 했다(내장 다운로드 폴더를 거치지 않음). 파일 머리가 `glTF`인 것을 확인했다.
- 입력 그림 출처: Codex(GPT 이미지) 생성본. `docs/3d-image-prompts.md`의 U01·B01 프롬프트.

## 상태

- 두 모형 모두 메시 1개, 재질 1개(색·금속거칠기·노멀 텍스처 2048px JPEG 3장)다. 부품이 나뉘어 있지 않다.
- 아직 화면에 넣지 않았다. 축소·부품 분리·적용은 따로 진행한다.
- 상업 이용 조건: Meshy 유료 요금제 생성물. 약관 원문 확인은 권리 장부 작업 때 함께 한다.
