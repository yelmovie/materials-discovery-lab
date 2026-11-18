# 인계 · 2026-11-18 (성취 카드)
목표: 지도 악당 격퇴 보상으로 성취 카드 6장(공방 5장 + 중앙 코어 보너스)을 넣는다. 기준 문서는 `_shared/reward-cards/INTEGRATION.md`.
완료:
- 연결(src/reward-card-set.tsx): 카드 설정, 보유 계산(`mapHits`의 3, 새 저장 값 없음), 소리 버튼 앞 6칸(React는 자리만 잡고 공통 모듈이 그림), 세 번째 타격이 저장될 때 한 번만 카드 열기(퇴장 연출 뒤 760ms, 움직임 줄이기 520ms). 날아가는 중인 칸은 도착할 때까지 비워 둔다.
- App.tsx: 헤더 소리 버튼 앞에 칸, `onMapHit`에서 2→3이 되는 순간 카드 획득, 방향판 `blocked`에 inert 확인 추가. 지도(WorldCanvas)와 악당(map-encounters)은 원래 inert를 보고 멈추므로 고치지 않았다. 피날레 영상은 카드(와 6장 완성 축하)를 닫은 다음에 열린다.
- 공통 모듈 reward-cards.js·css·d.ts는 수정 없이 복사. 이 앱의 유리 버튼 스타일이 카드 버튼을 덮지 않게 하는 덮어쓰기와 칸 크기(폭 960px 이하·활동 화면 44px)는 src/reward-card-set.css.
- 소리: services/audio.ts `playSound`에 `card-*` 5종 추가(음소거·효과음 크기·탭 숨김을 그대로 따름). 파일은 공통 CC0 라이브러리에서 복사, 출처는 public/assets/CREDITS.md.
- 그림: public/assets/reward-cards/ 카드 6장(640×960)·썸네일 6장(96×144). GPT 이미지로 생성, `_shared/reward-cards/convert.cjs`로 변환. 빌드 때 오프라인 사전 저장 목록에 들어간다(그림 12·효과음 5).
검증: 테스트 9파일 72개 통과(작업 폴더에서 돌리면 .tmp 안 예전 사본까지 17파일 142개), 빌드 통과. 헤드리스 Chrome으로 빌드본 확인 99항목 통과·콘솔 오류 0: 실제 공격 버튼으로 1·2타(카드 없음) → 3타 → 카드 → 칸, 카드가 열린 동안 방향키·공격키 무시, 새로고침 뒤 칸 유지·재등장 없음, 보관함, 6장 완성 축하 → 닫은 뒤 피날레, 움직임 줄이기, 헤더 9개 해상도(1024×768 포함), 활동 10개·최종 단계·교사용 시연에서 칸이 글자·버튼과 겹치지 않음.
남은 것: 실제 태블릿에서 칸 누르기와 카드 넣기 터치 확인. 카드 그림의 상업 이용 근거(ChatGPT 요금제·이미지 약관) 보관. 2번 카드에서 모루가 구부린 고무 띠가 말굽자석처럼 보일 수 있어 필요하면 그 장만 다시 생성.
배포: 2026-11-18 Cloudflare Workers `materials-discovery-lab` 버전 e03bf7c1-5440-4c9d-bedf-641d9388632c(커밋 7442444, `_scratch/deploy-20261118/deploy.sh`를 `KEEP_DOCS=1 … 09e "9 things" worker-cfg materials-discovery-lab`으로 실행). 운영 주소에서 메인 스크립트·WorldCanvas·CSS·카드 그림·효과음·sw.js의 SHA-256이 빌드와 같았고, 헤드리스로 실제 격퇴 한 번(카드 → 칸 → 새로고침 뒤 유지, 콘솔 오류 0)을 확인했다.

# 인계 · 2026-11-07
목표: 제작 현황 시트 완료작 5개의 지도 이동 방식과 디자인을 참고해 지도 화면 고도화.
완료:
- 오프라인(scripts/prepare-offline.mjs): exFAT의 `._*` 파일이 사전 저장 목록에 들어가던 문제를 막음. 목록 109개 모두 dist에 존재 확인.
- 길(src/domain/worldMap.ts): 그림의 돌길을 다시 따서 노드·문 좌표 교체. 중심선 좌우 18 안에서 자유 이동(walkRoad), 임의 위치 간 경로(routeBetween), 문 판정(doorAt). 테스트 tests/world-map.test.ts 8개.
- 지도(src/game/WorldCanvas.tsx): 누르고 있으면 걷기, 경로 점선, 문 앞 도착 판정, 재마운트 후 위치 유지, 한눈에 보기·손으로 둘러보기 카메라, 어스름·창문 불빛, 복구 직후 빛 이동 연출, 4방향 걷기 프레임·발먼지.
- 화면(src/App.tsx, src/styles.css): 친구 얼굴 간판 이름표·활동 진행 점, 상단 목표 표시, 황금 다음 행동 버튼, 화면 밖 다음 목표 고정 이름표.
- 걷기 그림: Canva 이미지 생성으로 연구원·모루 앞·옆·뒤 4프레임 시트를 만들어(참조: 기존 researcher·companion) references/generated/walk에 보관. scripts/prepare-walk-sprites.mjs로 자르고 왼쪽은 오른쪽을 뒤집음. 32프레임 약 310KiB.
남은 것: 걷기 시트의 상업 이용 근거(Canva 요금제·AI 약관) 보관. 실제 태블릿 터치·전자칠판 시청 거리 실측. 운영 배포는 자동 승인으로 바로 진행한다(2026-11-16 사용자 지시). 운영 주소 https://materials-discovery-lab.yelsam.workers.dev (Cloudflare Workers, wrangler 직접 배포).

# 이전 인계 · 2026-10-30
목표: 참고작 1~4번 기준으로 메인 화면·지도·교사 시연을 납품 직전 수준으로 고도화.
위치: /Volumes/T7 Shield/iscreammedia_sc34/9 things (Windows에선 D:\iscreammedia_sc34\9 things)
완료:
- 메인: 풀블리드 키아트(Higgsfield GPT Image 2.5로 생성, 후보2장 references/generated/title-keyart) + 로고·문구·출발 버튼. 하단 카드 띠 제거.
- 지도(src/game/WorldCanvas.tsx): Scale.NONE+전용 캔버스, 화면 꽉 채움·cover×1.7 확대(세로 화면 ×1.15)·연구원 추적, 손 커서 드래그 이동, 탭하면 길 따라 걷기. DOM 이름표는 렌더 직후 카메라 값으로 배치, 가장자리·하단 버튼 영역은 숨김.
- 교사 시연(src/App.tsx): ◀ ▶·←→로 14단계 넘기기, ‘다음 스테이지’ 버튼. 전체 해금 시 공방5+코어 모두 열림 확인.
- 버그 수정: Phaser 캔버스 풀링 때문에 빨리 지나간 실험 게임이 지도 캔버스 크기를 망가뜨리던 문제(실험 캔버스도 전용 캔버스), 지도 위 DOM 버튼 클릭이 아래 건물 선택으로 새던 문제.
검증: typecheck·test 28개·build 통과. check-experience 4해상도 233상태 가림/넘침/에러 0. check-student-flow 활동10·적용20·보고·인증서·재접속 통과. 브라우저로 1024×768·1280×800·1920×1080·844×390·375×812 확인.
남은 것: 실제 태블릿 터치 드래그 감도·전자칠판 시청 거리 실측. 키아트 상업 이용 근거(Higgsfield 계정·요금제) 보관. Phaser 청크 500KB 경고는 기존 그대로.
메모: 맥에서는 node_modules에 darwin-arm64 rollup/esbuild를 --no-save로 추가함(윈도우로 돌아가면 npm ci). 점검 스크립트용 Playwright는 .tmp/pwvenv(무시 폴더)에 설치. tools/check-experience.py는 화면 밖 이름표를 dispatch_event로 누르게 바꿈.
