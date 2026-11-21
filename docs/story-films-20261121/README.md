# 인트로·아웃트로 이야기 영상 (2026-11-21)

게임에 들어간 파일: `public/assets/story/intro.mp4`, `outro.mp4`, 포스터 `*-poster.webp`. 대사 시각: `src/domain/story-films.json`(앱과 합성 스크립트가 같이 씀).

재생(`src/components/StoryFilm.tsx`, `src/App.tsx`):
- 인트로: 진행 기록이 없을 때 홈의 「실험 바로 시작」을 처음 누르면. 아웃트로: 코어를 다시 켠 뒤 처음 인증서에 왔을 때. 둘 다 설정에서 「인트로 영상 다시 보기」「마무리 영상 다시 보기」.
- 본 적이 있는지는 저장 기록과 따로 `material-workshop-mission.films-seen`에 둔다. 「연구 기록 지우기」를 하면 같이 지운다. 교사 시연 중에는 저절로 뜨지 않는다.
- 전체 화면·검은 바탕·contain. 자막은 그림 안 아래쪽에 입혀 있어 버튼은 오른쪽 위에만 둔다. 건너뛰기, 일시 정지, Esc로 닫기. 동작 줄이기면 저절로 재생하지 않고 「영상 보기」를 누른다. 8초 안에 못 불러오면 대사를 글로 보여 준다.
- 소리: 영상은 늘 음소거로 틀고, 자막이 뜨는 시각에 기존 목소리 파일(토리·모루·방울이)을 대사 재생기로 튼다. 목소리 끄기·전체 소리 끄기·배경 음악 줄이기가 다른 대사와 똑같이 적용된다. 영상 생성기 소리는 쓰지 않았다.

## 장면별 출처

| 장면 | 첫 장면 그림(Codex GPT 이미지, `gpt-imagegen`) | 움직임 | 목소리(기존 파일) |
|---|---|---|---|
| I-1 멈춰 버린 마을 | `intro-1.png`(참고 `title-keyart`) | Gemini 앱 동영상 만들기(Veo), 주 계정, 10초 중 9.6초 | `tori-welcome.mp3` |
| I-2 우산을 살펴보는 공방 | `intro-2.png`(참고 연구원 그림) | Gemini 앱 동영상 만들기(Veo), 주 계정. 7초쯤부터 우산 천이 사라져 앞 6.8초를 8.5초로 천천히 | `moru-story.mp3` |
| I-3 설계도와 응원 | `intro-3.png`(참고 연구원 그림) | Gemini 앱 동영상 만들기(Veo), 주 계정, 10초 | `banguli-story.mp3` |
| F-1 코어로 돌아오는 빛 | `final-1.png`(참고 `intro-1.png`) | 지금 임시 판: 그림에 천천히 다가가는 카메라 움직임(FFmpeg, 7.5·7.5·9.5초). Gemini 앱 `u/1`은 2026-11-21 첫 사용 안내 화면이 떠서 누르지 않고 멈춤(생성 0) | `tori-ending-0.mp3` |
| F-2 다시 깨어난 마을 | `final-2.png`(참고 `intro-1.png`) | 지금 임시 판: 그림에 천천히 다가가는 카메라 움직임(FFmpeg, 7.5·7.5·9.5초). Gemini 앱 `u/1`은 2026-11-21 첫 사용 안내 화면이 떠서 누르지 않고 멈춤(생성 0) | `tori-ending-1.mp3` |
| F-3 인증서와 보관함 | `final-3.png`(참고 `intro-3.png`) | 지금 임시 판: 그림에 천천히 다가가는 카메라 움직임(FFmpeg, 7.5·7.5·9.5초). Gemini 앱 `u/1`은 2026-11-21 첫 사용 안내 화면이 떠서 누르지 않고 멈춤(생성 0) | `tori-ending-2.mp3` |

- 자막: 공용 도구 `_shared/caption-motion-20261118/burn.py`(주아체 OFL, libass), 말 속도 스윕 없음(목소리가 영상 밖에서 따로 나와서). 아웃트로 마지막 3.4초에 게임 제목 로고(`public/assets/logo.webp`).
- 원본·작업 파일(외장 SSD, 저장소 밖): 그림 `.tmp/video-intro-20261121/`, 장면 영상 `…/gemini/`, `…/final/`, 합성 `.tmp/story-films-20261121/`.
- 다시 만들기: `python3 scripts/compose-story-films.py intro|outro`. 장면 영상이 없으면 그 장면은 그림에 천천히 다가가는 카메라 움직임(임시 판)으로 채운다.
- 워터마크: Gemini 영상 오른쪽 아래의 작은 Veo 표시가 남아 있다.

## 아웃트로 장면 영상 프롬프트(Gemini 앱 동영상 만들기, 16:9, 첫 장면 그림 첨부)

- F-1: Animate the attached image as the first frame, 8 seconds, 16:9. The five glowing orbs fly along their curved light trails and sink into the aqua crystal one after another; with each one the crystal brightens a step, then it glows bright aqua and a soft ring of light spreads gently across the village. The three friends in the foreground jump up and cheer. Slow push-in toward the core. Keep every character exactly on model and in the same painted storybook style. Joyful and magical, gentle glow, no strobing. No dialogue, no on-screen text, no new characters.
- F-2: Animate the attached image as the first frame, 8 seconds, 16:9. The ring of light spreads outward from the shining crystal; the windmill and the water wheel turn, water sparkles in the streams, little steam puffs rise from the chimneys. The beaver, the water-droplet and the cloud character wave and bounce happily. Far away the small robot hurries off over the bridge. The camera pans slowly across the village. Keep every character exactly on model and in the same painted storybook style. Lively and bright. No dialogue, no on-screen text, no new characters.
- F-3: Animate the attached image as the first frame, 8 seconds, 16:9. The rabbit hands the blank certificate to the child, who lifts the storage box a little higher; the friends cheer, the water-droplet and the cloud float up happily, confetti and soft sparkles drift down. The camera pulls back gently and ends on a calm, steady wide shot with open warm sky at the top. Keep every character exactly on model and in the same painted storybook style. Warm and joyful. No dialogue, no on-screen text, no new characters.
