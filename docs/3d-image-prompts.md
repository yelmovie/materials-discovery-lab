# 3D 전환 기본 이미지·프롬프트

2026-10-22 · 이번 MVP는 지도만 2.5D 픽셀 RPG, 시설 안은 2D야. 우산과 보관함은 생성 기본 그림을 먼저 적용하고, 후속 GLB로 전환해. 실제 생성 로그는 public/assets/generated/manifest.json에 있어.

[독립 프롬프트 캔버스](3d-image-prompts.html) · [구조화 목록](asset-prompts-data.json)

## 3D를 넣으면 좋은 화면

| 위치 | 후속 제안 | 이유 | 이번 MVP |
|---|---|---|---|
| S01·S02 우산 조사 | 우선순위 P0 | 숨은 부분·천·살·손잡이의 연결을 직접 돌려 확인 | 2D 기본그림·부품 선택 |
| S09·S10 보관함 설계·시험 | 우선순위 P0 | 몸체·창·보호대의 재료와 기능을 입체로 비교 | 2D 기본그림·부품 선택 |
| S03·S04 성질 비교 | 2D 유지 | 변형·빛·물방울 반응을 크게 보여 줘야 함 | 동적2D |
| S05·S06 고체·액체 | 2D 유지 | 윤곽·물높이·처음 양의 비교가 핵심 | 동적2D |
| S07·S08 공기 | 2D 단면 유지 | 공기 공간·물 유입·휴지 관찰을 가리지 않음 | 동적2D |
| 스테이지 선택 | 2.5D 스프라이트 유지 | 길과 건물을 읽는 RPG 느낌, 가벼운 로딩 | 지도·연구원·동료 |

## 이번 생성·적용 목록 5개

생성파일5개가 프로젝트 안에 존재하고 manifest에 날짜·도구·최적화본 경로가 기록되어 있어. 실제 화면 배치 검수는 최종점검 보고서를 함께 봐. 런타임 크기는 최적화 과정에서 줄였으므로 생성 요청 해상도와 다를 수 있어.

| ID | 파일 | 용도 |
|---|---|---|
| M01 | assets/generated/workshop-island.webp | 홈·스테이지 선택 |
| C01 | assets/generated/researcher.webp | 스테이지 선택 |
| C02 | assets/generated/companion.webp | 스테이지 선택 |
| U01 | assets/generated/umbrella.webp | S01·S02 |
| B01 | assets/generated/invention.webp | S09·S10·엔딩 |

## 후속3D 부품 기준도 8개

아래8개는 GLB 제작 단계의 선택 목록이야. 이번 MVP 생성완료로 표시하지 않아. U01·B01 승인본을 참조해 같은 물체의 비율·색·접합을 유지해. 최종 런타임 모델은 우산·보관함 GLB 각1개가 목표야.

| ID | 대상 | semantic part |
|---|---|---|
| U02 | 우산 천 | canopy |
| U03 | 우산 살·중심 봉 | frame |
| U04 | 우산 나무 손잡이 | handle |
| B02 | 보관함 몸체 | body |
| B03 | 보관함 뚜껑 | lid; body와 재질 연동 |
| B04 | 보관함 관찰창 | window |
| B05 | 보관함 손잡이 | handle; 기본형 고정 |
| B06 | 모서리 보호대 1개 | bumper; 모델에서 복제 |

## 공통 제작·검수 기준

- 단일 물체·부품당 한 이미지, 1024×1024 이상 투명 PNG·true alpha. 전체 윤곽과 약10% 안전여백. 지도는1536×1024 불투명 배경.
- 같은 계열의 팔레트·시점·광원. 마스터 승인 후 부품을 만들고 승인 마스터를 참조로 제공해. 여러 뷰를 한 장에 섞지 않아.
- 글자·UI·상표·손·다른 물체·강한 반사·그림자 배경·잘림을 금지해. 투명창은 형태가 보이게 하되 최종 투명도는3D재질에서 정해.
- 우산 canopy/frame/handle, 보관함 body/lid/window/handle/bumper를 유지해. lid는 body와 같은 재료, handle은 기본형, bumper는 한 개만 만들어 복제해.
- 이미지가 자동 메시 분리·정확한 치수·깨끗한 연결을 보장하지 않아. 원점·피벗·부품이름·조립·선택·재질 슬롯을 별도 검수해. 전체20,000삼각형부터, 텍스처 1024px 기본, fallback은 같은 학습의 2D야.
- 2D 이미지를 회전한 것을 실제 3D·실제 뒷면 관찰로 안내하지 않아. 물체형상과 물질성질 판정은 분리하고, 생성그림을 실제 실험 증거로 쓰지 않아.
- 우산 천은 천, 살은 금속, 손잡이는 나무야. 모든 유리·플라스틱·금속을 같은 성질로 일반화하지 않아. 물·고체·공기 실험의 크기·양·조건은 동적 2D로 정확하게 유지해.

## 개별 프롬프트

### M01 숲속 공방 지도

이번 생성·적용 대상 · 홈·스테이지 선택 · 배경 그림; 문·길 좌표는 코드와 대조

> Create a polished cozy 2.5D pixel-art RPG island map for a materials-science learning adventure. Landscape 1536 x 1024. Oblique top-down view, consistent crisp pixel scale. Five distinct small science workshops arranged around a central crystal core plaza, each front door clearly visible. Warm winding sand paths connect every doorway to the plaza, with readable bridges over a small stream, lush forest edges, flowers, stones and lamps. Preserve broad clear walking routes and space around doors for DOM name labels. Distinct navy, teal, blue, green and warm copper workshop accents. No text, letters, numbers, labels, interface, people, animals or logos. No perspective camera tilt within the same scene.

### C01 메인 연구원

이번 생성·적용 대상 · 스테이지 선택 · 발 아래 pivot; 모루와 같은 픽셀 밀도

> One full-body chibi child field researcher sprite for the same cozy 2.5D pixel RPG science village. Single character, front three-quarter standing pose, complete visible feet on one baseline. Keep the approved identity: yellow beret with small turquoise goggles, short brown hair, cream shirt, turquoise suspender shorts, brown boots, tan satchel, and a small notebook. Friendly curious expression. Crisp deliberate pixel art with consistent pixels and a readable silhouette at 64-pixel display height. Transparent background with true alpha. No scenery, floor, shadow plane, text, weapon, extra person or sprite sheet. Square 1024 x 1024 with ten percent margin.

### C02 따라오는 모루

이번 생성·적용 대상 · 스테이지 선택 · 기존 모루 정체성; 연구원 발 기준 동행

> One full-body friendly brown squirrel apprentice companion named Moru, matching the provided character reference identity: large curled bushy tail, cream muzzle and belly, round brass goggles, a sage-green vest, and a magnifying glass. Adapt to crisp cozy 2.5D pixel RPG sprite art, the same pixel density and three-quarter view as the child researcher. Single standing pose, full feet and tail visible, clear silhouette at small game size. Transparent true-alpha background. No text, character sheet, props separated from body, second animal, scenery or ground plane. Square 1024 x 1024 with ten percent margin.

### U01 펼친 우산 마스터

이번 생성·적용 대상 · S01·S02 · canopy / frame / handle

> Create one clean single-object reference for a friendly educational game. Near-orthographic front three-quarter view, mild elevation, even diffuse studio lighting, restrained navy / turquoise / warm wood / cream palette. Complete silhouette centered with ten percent clear margin. Transparent background, true alpha, no ground plane and no cast background shadow. No text, labels, logo, interface, hands, characters, collage, multiple views, motion blur or dramatic reflections. Square 1024 x 1024 or larger. Keep functional part boundaries easy to read. Design one fully open navy umbrella. Eight broad woven opaque fabric canopy panels, eight readable silver metal ribs connected to a straight central metal shaft, warm wooden J-shaped handle. Angle gently so both canopy and some underside structure are visible. All components connected, ribs sufficiently thick for small-screen readability. No rain, stars, patterns or stand. The fabric must read as cloth, not plastic.

### B01 보관함 마스터

이번 생성·적용 대상 · S09·S10·엔딩 · body / lid / window / handle / bumper

> Create one clean single-object reference for a friendly educational game. Near-orthographic front three-quarter view, mild elevation, even diffuse studio lighting, restrained navy / turquoise / warm wood / cream palette. Complete silhouette centered with ten percent clear margin. Transparent background, true alpha, no ground plane and no cast background shadow. No text, labels, logo, interface, hands, characters, collage, multiple views, motion blur or dramatic reflections. Square 1024 x 1024 or larger. Keep functional part boundaries easy to read. One portable rectangular research storage box, closed and assembled. Muted turquoise opaque body, matching turquoise hinged lid with shallow overhang, broad rounded rectangular front observation window, warm brown arch handle attached to lid, coral pink rubber corner bumpers. Front and right side visible. Readable rounded functional part boundaries, window thickness and subtle blue tint, a small yellow star-shaped sample inside. No extra contents, floating parts, symbols or extra decoration.

### U02 우산 천

후속 선택 제작 · 후속3D: S01·S02 · canopy

> Create one clean single-object reference for a friendly educational game. Near-orthographic front three-quarter view, mild elevation, even diffuse studio lighting, restrained navy / turquoise / warm wood / cream palette. Complete silhouette centered with ten percent clear margin. Transparent background, true alpha, no ground plane and no cast background shadow. No text, labels, logo, interface, hands, characters, collage, multiple views, motion blur or dramatic reflections. Square 1024 x 1024 or larger. Keep functional part boundaries easy to read. Use approved U01 as reference. Isolate only the navy fabric canopy in exactly the same open eight-panel dome. Preserve proportions, edge contour and seams; subtle woven texture, small central attachment opening. Remove all metal ribs, shaft, handle and stand. One continuous cloth shell, readable edge thickness. Do not redesign.

### U03 우산 살·중심 봉

후속 선택 제작 · 후속3D: S01·S02 · frame

> Create one clean single-object reference for a friendly educational game. Near-orthographic front three-quarter view, mild elevation, even diffuse studio lighting, restrained navy / turquoise / warm wood / cream palette. Complete silhouette centered with ten percent clear margin. Transparent background, true alpha, no ground plane and no cast background shadow. No text, labels, logo, interface, hands, characters, collage, multiple views, motion blur or dramatic reflections. Square 1024 x 1024 or larger. Keep functional part boundaries easy to read. Use approved U01. Isolate its connected silver metal frame in the fully open state: one straight central shaft connected to eight evenly spaced curved ribs following the approved canopy. Keep ribs separate from neighbors yet connected at center and thick enough to read. Remove cloth and wooden handle. No detached rods, extra rings or impossible joints.

### U04 우산 나무 손잡이

후속 선택 제작 · 후속3D: S01·S02 · handle

> Create one clean single-object reference for a friendly educational game. Near-orthographic front three-quarter view, mild elevation, even diffuse studio lighting, restrained navy / turquoise / warm wood / cream palette. Complete silhouette centered with ten percent clear margin. Transparent background, true alpha, no ground plane and no cast background shadow. No text, labels, logo, interface, hands, characters, collage, multiple views, motion blur or dramatic reflections. Square 1024 x 1024 or larger. Keep functional part boundaries easy to read. Use approved U01. Isolate the warm wooden J-shaped handle, preserving curvature, thickness, length and wood tone. Show the top socket for the separate metal shaft, subtle lengthwise wood grain, softly rounded edges. One connected piece. No varnish glare, logo, shaft or cloth.

### B02 보관함 몸체

후속 선택 제작 · 후속3D: S09·S10 · body

> Create one clean single-object reference for a friendly educational game. Near-orthographic front three-quarter view, mild elevation, even diffuse studio lighting, restrained navy / turquoise / warm wood / cream palette. Complete silhouette centered with ten percent clear margin. Transparent background, true alpha, no ground plane and no cast background shadow. No text, labels, logo, interface, hands, characters, collage, multiple views, motion blur or dramatic reflections. Square 1024 x 1024 or larger. Keep functional part boundaries easy to read. Use approved B01. Isolate only the opaque turquoise body. Preserve width, depth, height, rounded corners and rim. Show open top, visible inner cavity, practical wall thickness and one empty rounded rectangular front opening for a separate observation window. Remove lid, handle, window insert and bumpers. Single connected body, no floating parts.

### B03 보관함 뚜껑

후속 선택 제작 · 후속3D: S09·S10 · lid; body와 재질 연동

> Create one clean single-object reference for a friendly educational game. Near-orthographic front three-quarter view, mild elevation, even diffuse studio lighting, restrained navy / turquoise / warm wood / cream palette. Complete silhouette centered with ten percent clear margin. Transparent background, true alpha, no ground plane and no cast background shadow. No text, labels, logo, interface, hands, characters, collage, multiple views, motion blur or dramatic reflections. Square 1024 x 1024 or larger. Keep functional part boundaries easy to read. Use approved B01. Isolate the turquoise lid with exact footprint, rounded corners, shallow height and overhanging rim. One connected solid piece with a readable edge profile and two simple sockets for the separate arch handle. Remove handle and all other parts. No hinges, symbols or exploded assembly.

### B04 보관함 관찰창

후속 선택 제작 · 후속3D: S09·S10 · window

> Create one clean single-object reference for a friendly educational game. Near-orthographic front three-quarter view, mild elevation, even diffuse studio lighting, restrained navy / turquoise / warm wood / cream palette. Complete silhouette centered with ten percent clear margin. Transparent background, true alpha, no ground plane and no cast background shadow. No text, labels, logo, interface, hands, characters, collage, multiple views, motion blur or dramatic reflections. Square 1024 x 1024 or larger. Keep functional part boundaries easy to read. Use approved B01. Isolate the one flat rounded rectangular front window insert. Preserve its exact aspect ratio and corner radius. Readable thickness, softly beveled edge, subtle blue tint and gentle translucency, ensuring the entire panel silhouette is visible. No box or second pane. No strong reflection, mirror effect or opaque paint. Final physical transparency is authored separately in the 3D material.

### B05 보관함 손잡이

후속 선택 제작 · 후속3D: S09·S10 · handle; 기본형 고정

> Create one clean single-object reference for a friendly educational game. Near-orthographic front three-quarter view, mild elevation, even diffuse studio lighting, restrained navy / turquoise / warm wood / cream palette. Complete silhouette centered with ten percent clear margin. Transparent background, true alpha, no ground plane and no cast background shadow. No text, labels, logo, interface, hands, characters, collage, multiple views, motion blur or dramatic reflections. Square 1024 x 1024 or larger. Keep functional part boundaries easy to read. Use approved B01. Isolate the warm brown rounded inverted-U arch handle with exact span, curvature, grip thickness and two short mounting ends. Opening under the grip stays clear, both mounting ends visible, smooth matte rounded geometry. No lid, metal fixtures, finger grooves or additional attachments.

### B06 모서리 보호대 1개

후속 선택 제작 · 후속3D: S09·S10 · bumper; 모델에서 복제

> Create one clean single-object reference for a friendly educational game. Near-orthographic front three-quarter view, mild elevation, even diffuse studio lighting, restrained navy / turquoise / warm wood / cream palette. Complete silhouette centered with ten percent clear margin. Transparent background, true alpha, no ground plane and no cast background shadow. No text, labels, logo, interface, hands, characters, collage, multiple views, motion blur or dramatic reflections. Square 1024 x 1024 or larger. Keep functional part boundaries easy to read. Use approved B01. Isolate one coral pink rubber lower corner bumper, a thick compact three-sided protector wrapping two perpendicular vertical walls and a short bottom edge. Show rounded outside corner and enough interior contact faces to explain mounting. Exact approved thickness and proportions, matte rubber. One piece only, no box, screws or copies.

