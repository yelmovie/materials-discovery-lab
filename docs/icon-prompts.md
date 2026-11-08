# 공통 아이콘·장식 점검

2026-10-22 · 공통 아이콘과 최종 화면의 장식을 src/components/Icon.tsx의 직접 작성 SVG로 통일했어. 새 래스터 아이콘 생성은 필요하지 않아. SVG는 접근성 이름을 가진 48px 이상 버튼 안에 배치하고, 순수 장식은 aria-hidden으로 제공해.

| 위치 | 현재 표시 | 용도 | 처리 / 생성 프롬프트 | 규격 |
|---|---|---|---|---|
| src/components/Icon.tsx:1 | SVG home/back/sound/muted/settings | 공통 이동·설정 | SVG 유지, 생성 불필요 | 24×24 viewBox, 버튼48px 이상 |
| src/components/Icon.tsx:9 | SVG book/close | 수첩·닫기 | SVG 유지, 생성 불필요 | 동일 |
| src/screens/FinalPanels.tsx:17 | SVG crystal | 코어 형태 | 문자 장식을 SVG 결정체로 교체 완료 | 투명 SVG, 조작 UI 별도 |
| src/screens/FinalPanels.tsx:18 | SVG star | 엔딩 반짝임 | SVG 별로 교체 완료, 생성 불필요 | aria-hidden, 모션 감소 반영 |
| src/screens/FinalPanels.tsx:18 | SVG building | 복구 건물 | 문자 집을 SVG 건물로 교체 완료 | 투명 SVG |
| src/screens/FinalPanels.tsx:20 | SVG star | 인증서 도장·기록 표시 | SVG 별로 교체 완료, 생성 불필요 | 인쇄에서도 읽히게 |

최종 화면에서 사용하던 별·집 글리프는 모두 SVG star/crystal/building으로 바뀌었어. 기능과 모양을 코드로 정확하게 표현할 수 있는 별·집·화살표·소리·톱니는 생성 이미지 대신 SVG를 사용해. 핵심 일러스트 목록은 별도 [프롬프트 캔버스](3d-image-prompts.html)에 있어. 파일·줄은 점검 당시 소스 기준이야.
