# 인트로·아웃트로 이야기 영상 (2026-11-21)

게임에 들어간 파일: `public/assets/story/intro.mp4`(32.1초), `outro.mp4`(26.0초), 포스터 `*-poster.webp`. 1920×1080, 24fps, H.264, 무음. 대사 시각·자막 글·화면 글: `src/domain/story-films.json`(앱과 합성 스크립트가 같이 씀). 마무리 기준: `_shared/FILMS-FINISH-20261121.md`.

## 이야기

- **인트로 = 탐험하고 싶다.** 해 질 녘 숲속 공방 마을, 흐려진 물질 코어 옆으로 재료 바꿔치기 봇이 섞인 물건을 들고 살금살금 빠져나간다(눈길·수수께끼) → 공방에서 우산을 부분별로 살펴보는 연구원과 모루 → 설계도를 든 연구원을 방울이·단단이·바람이가 응원 → 화면이 살짝 어두워지며 제목 로고와 「뒤섞인 재료의 비밀, 같이 찾아볼까요?」, 토리 「도움이 필요해요. 우리 같이 공방을 깨우러 가요!」(초대). 답(어느 재료가 어떤 성질인지)은 말하지 않는다. 끝나면 바로 첫 활동(S01)으로 이어진다.
- **아웃트로 = 해냈다! 재미있었다!** 다섯 공방에서 모은 기록(우산·창·물컵·바람개비·보관함이 든 빛 구슬)이 코어로 날아가 코어가 다시 빛남(학생이 한 일의 결과) → 인트로와 같은 마을이 한낮에 다시 움직임(달라진 세계) → 노을 아래 완성한 보관함과 인증서를 든 연구원과 친구들 → 금빛 별 도장과 「임무 완료! 다섯 공방이 다시 깨어났어요」, 토리 「고마워요! 덕분에 다섯 공방이 다시 깨어났어요!」 → 인증서 바탕색(크림)으로 사라지며 인증서 화면으로.
- 캐릭터·장소·악당 이름과 생김새는 앱 안의 시작 이야기·의뢰·지도·엔딩과 같다. 앱에 없는 설정은 넣지 않았다.

## 장면별 출처

| 장면 | 첫 장면 그림(Codex GPT 이미지, `gpt-imagegen`) | 움직임(Gemini 앱 동영상 만들기, Veo) | 목소리(ElevenLabs `eleven_v4`) |
|---|---|---|---|
| I-1 멈춰 버린 마을 | `intro-1.png`(참고 `title-keyart`) | 주 계정, 2026-11-21 11:27 KST 받음, 10초 중 9.6초 | 토리 Aria `tori-welcome.mp3`(기존) |
| I-2 우산을 살펴보는 공방 | `intro-2.png`(참고 연구원 그림) | 주 계정, 2026-11-21 11:34 KST 받음. 7초쯤부터 우산 천이 사라져 앞 6.8초를 8.5초로 천천히 | 모루 Klamon `moru-story.mp3`(기존) |
| I-3 설계도와 응원 + 끝 화면 | `intro-3.png`(참고 연구원 그림) | 주 계정, 2026-11-21 11:40 KST 받음, 10초 + 끝 화면 멈춤 5초 | 방울이 Jisun `banguli-story.mp3`(기존), 토리 Aria `tori-film-invite2.mp3`(**새 줄**, requestId `tp7NdfB0kSyreLFAk25w`) |
| F-1 코어로 돌아오는 빛 | `final-1.png`(참고 `intro-1.png`) | 보조 계정 2(`u/1`), 채팅 `8b7ad278e6a06e4f`, 16:11 KST. 6.6초 뒤 빛 구슬이 다시 나타나 앞 6.6초를 7.5초로 | 토리 `tori-film-ending-0.mp3`(**새 줄**, `tqI9KBvWqqVxZYreCA0p`) |
| F-2 다시 깨어난 마을 | `final-2.png`(참고 `intro-1.png`) | 보조 계정 2(`u/1`), 채팅 `5b73e106ca204601`, 16:15 KST, 앞 7.5초 | 토리 `tori-film-ending-1.mp3`(**새 줄**, `chRSo0drm59hVUudFi56`) |
| F-3 인증서와 보관함 + 끝 화면 | `final-3.png`(참고 `intro-3.png`) | 보조 계정 2(`u/1`), 채팅 `9ce936cefca51dc6`, 16:21 KST, 앞 9.5초 + 끝 화면 멈춤 2.5초 | 토리 `tori-film-ending-2.mp3`(**새 줄**, `sxzVGv1zQFHJY9OPfj6j`), `tori-film-thanks2.mp3`(**새 줄**, `tNTKUiq6DLdlrThk3b5B`) |

- Gemini 앱 계정 화면 표시: PRO(조율 세션 확인), 사용자 확인 2026-11-21 「유료」. 보조 계정 2(`u/1`) 사용량 0% → 40%(오후 6:17 초기화). 임시 장면 0개.
- 영상 오른쪽 아래 작은 Veo 표시가 남아 있다(지우지 않음). 영상 생성기가 붙인 소리는 쓰지 않았다.
- 처음 판의 새 목소리 두 줄(반말, 지움)은 토리의 앱 목소리(Aria `O2KReOFLpoR65nz6C9Se`)로 공용 `voice-fill-20261118/el_api.py`(공식 API, `fc-voice` 잠금)에서 한 번씩 만들었다. 받아쓰기(Whisper large-v3-turbo) 일치. 원본 −19.9·−21.0 LUFS를 −17.7·−18.7 LUFS(최고 −1.9dBFS)로 맞춤. 앱 안 토리 줄은 −16.4(엔딩)~−20.1(시작) LUFS. 기록 `docs/VOICE-FILL-20261118.json`.

## 토리 말투(2026-11-21 고침)

- 토리는 앱에서 해요체로 말한다(시작 이야기, 발명 제작소 의뢰 세 줄). 그래서 영상 속 토리 대사를 모두 해요체로 맞췄다. 처음 판의 반말 두 줄(`tori-film-invite`·`tori-film-thanks`)은 지우고, 앱 엔딩 화면에서 반말로 쓰는 `tori-ending-0~2`는 그대로 두고(목소리와 이어진 문구라 바꾸지 않음) 영상에는 같은 뜻의 해요체 새 줄 `tori-film-ending-0~2`를 쓴다.
- 새 줄 다섯 개: 같은 목소리(Aria `O2KReOFLpoR65nz6C9Se`, `eleven_v4`)로 한 줄씩. −17.7~−17.9 LUFS, 최고 −1.9~−3.9dBFS. 받아쓰기 모두 일치.

## 자막과 대사

| 시각(초) | 화자 | 자막(= 목소리 글) | 받아쓰기 |
|---|---|---|---|
| 인트로 0.8 | 토리 | 물질 코어가 멈추면서 재료 정보가 뒤섞였어요. 친구들과 공방을 다시 움직여 주세요. | 일치 |
| 인트로 9.6 | 모루 | 한 번에 한 가지를 바꿔 실험해요. 무엇이 달라졌는지 기록해 친구의 새 부탁을 해결해요. | 일치(기존 기록) |
| 인트로 17.6 | 방울이 | 마지막에는 나만의 보관함을 만들어요. 관찰 기록으로 재료를 고르고, 시험 결과를 보고 고쳐요. | 일치(기존 기록) |
| 인트로 27.5 | 토리 | 도움이 필요해요. 우리 같이 공방을 깨우러 가요! | 일치 |
| 아웃트로 1.0 | 토리 | 코어에 빛이 돌아왔어요! | 일치 |
| 아웃트로 7.5 | 토리 | 다섯 공방이 다시 움직여요! | 일치 |
| 아웃트로 14.5 | 토리 | 관찰 기록이 발명에 쓰였어요! | 일치 |
| 아웃트로 18.2 | 토리 | 고마워요! 덕분에 다섯 공방이 다시 깨어났어요! | 일치 |

- 자막: 공용 `_shared/caption-motion-20261118/burn.py`(주아체 OFL, libass). 화자 이름표, 장면마다 핵심 낱말 하나 강조, 진행 줄. 말 속도 스윕은 끔(목소리가 영상 밖에서 따로 나와서). 자막 상자는 아래 64px, 얼굴·Veo 표시를 가리지 않음(프레임 그림 `.tmp/films-finish-20261121/intro-sheet.png`, `final-sheet.png`).
- 모션그래픽(FFmpeg): 장면 사이 0.5초 교차 페이드. 인트로 끝은 마지막 장면을 멈추고 42% 어둡게 → 제목 로고(`public/assets/logo.webp`)가 0.7초에 떠오름 → 호기심 한 줄(주아체). 아웃트로 끝은 하늘 자리에 금빛 별 도장(인증서 별 도장과 같은 모양)·초록 띠 「임무 완료!」·반짝임 두 겹이 번갈아 → 크림색으로 사라짐.

## 앱에서 뜨는 방식(`src/components/StoryFilm.tsx`, `src/App.tsx`)

- 인트로: 진행 기록이 없을 때 홈의 「실험 바로 시작」을 처음 누르면. 아웃트로: 이번에 코어를 다시 켠 뒤 처음 인증서에 왔을 때(옛 완료 기록으로 인증서를 열 때는 저절로 뜨지 않음). 다시 보기: 설정 「인트로 영상 다시 보기」「마무리 영상 다시 보기」, 인증서 화면 「마무리 영상 다시 보기」.
- 본 적이 있는지는 저장 기록과 따로 `material-workshop-mission.films-seen`. 「연구 기록 지우기」 때 같이 지움. 교사 시연 중에는 저절로 뜨지 않음.
- 전체 화면·검은 바탕·contain. 버튼은 오른쪽 위만(건너뛰기 48px, 일시 정지). Esc로 닫기. 동작 줄이기면 저절로 재생하지 않고 「영상 보기」. 8초 안에 못 불러오면 대사를 글로 보여 주고 「계속하기」.
- 소리: 영상은 늘 음소거. 자막이 뜨는 시각에 목소리 파일을 대사 재생기로 튼다 → 목소리 끄기·전체 소리 끄기를 다른 대사와 똑같이 따름(자막은 남음). 배경 음악(인트로: 주제곡, 아웃트로: 마무리 곡)은 평소대로 나고 목소리가 나오는 동안만 1/4.
- 운영: `/assets/story/*`를 Range 워커 경로에 넣음(`_scratch/deploy-20261118/cfg/09.json`) → 206.

## 다시 만들기

`python3 scripts/compose-story-films.py intro|outro`. 원본·작업 파일(외장 SSD, 저장소 밖): 그림 `.tmp/video-intro-20261121/`, 장면 영상 `…/gemini/`, `…/final/`, 합성 `.tmp/story-films-20261121/`. 장면 영상이 없으면 그 장면은 그림에 천천히 다가가는 카메라 움직임(임시 판)으로 채운다.

## 아웃트로 장면 영상 프롬프트(Gemini 앱 동영상 만들기, 16:9, 첫 장면 그림 첨부)

- F-1: Animate the attached image as the first frame, 8 seconds, 16:9. The five glowing orbs fly along their curved light trails and sink into the aqua crystal one after another; with each one the crystal brightens a step, then it glows bright aqua and a soft ring of light spreads gently across the village. The three friends in the foreground jump up and cheer. Slow push-in toward the core. Keep every character exactly on model and in the same painted storybook style. Joyful and magical, gentle glow, no strobing. No dialogue, no on-screen text, no new characters.
- F-2: Animate the attached image as the first frame, 8 seconds, 16:9. The ring of light spreads outward from the shining crystal; the windmill and the water wheel turn, water sparkles in the streams, little steam puffs rise from the chimneys. The beaver, the water-droplet and the cloud character wave and bounce happily. Far away the small robot hurries off over the bridge. The camera pans slowly across the village. Keep every character exactly on model and in the same painted storybook style. Lively and bright. No dialogue, no on-screen text, no new characters.
- F-3: Animate the attached image as the first frame, 8 seconds, 16:9. The rabbit hands the blank certificate to the child, who lifts the storage box a little higher; the friends cheer, the water-droplet and the cloud float up happily, confetti and soft sparkles drift down. The camera pulls back gently and ends on a calm, steady wide shot with open warm sky at the top. Keep every character exactly on model and in the same painted storybook style. Warm and joyful. No dialogue, no on-screen text, no new characters.
