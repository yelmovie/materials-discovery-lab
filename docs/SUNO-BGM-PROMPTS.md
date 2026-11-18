# 수노 배경음 프롬프트 · 물질 공방 대작전

2026-11-17 정리. 지금 게임 배경음은 코드로 만든 단순한 사인파 8음 반복이라, 메인 테마와 파이널 두 곡으로 바꾸려고 정리했어.

## 공통 규칙

- **Instrumental**을 켜고 가사 없이 만들어. Style 칸에 아래 영어 프롬프트를 그대로 붙여 넣어.
- 길이는 1분 30초~2분이면 충분해.
- 상업 납품용이라 **수노 유료 요금제(Pro 이상)로 만든 곡만** 써. 무료 요금제로 만든 곡은 상업적으로 쓸 수 없어.
- 받은 파일은 아래 파일 이름으로 `public/assets/audio/bgm/`에 넣어 주면 내가 연결할게.

| 파일 이름 | 쓰는 화면 |
|---|---|
| `main-theme.mp3` | 시작 화면, 공방 탐험 지도, 공방 활동 전체 |
| `finale.mp3` | 엔딩·인증서 |

## 메인 테마 `main-theme.mp3`

```
cozy whimsical steampunk workshop village adventure, instrumental, bouncy marimba, pizzicato strings, glockenspiel, warm acoustic guitar, light flute melody, soft brushed drums, curious and cheerful, steady walking pace, children's science game main theme, 104 BPM, major key, gentle enough to sit under voices and sound effects, no vocals, seamless loop
```

지도와 공방 활동 내내 반복돼서 **페이드아웃 없이 끝나는 곡**을 골라. 수업 중 계속 나오니까 효과음(물방울·딸깍·성공음)과 인물 목소리보다 앞에 나서지 않는 쪽이 좋아.

## 파이널 `finale.mp3`

```
triumphant joyful celebration finale, instrumental, full whimsical orchestra, bright brass fanfare, sweeping strings, glockenspiel and marimba, festive hand percussion, the whole workshop village restored and glowing, proud and heartwarming ending theme for a children's science adventure, 116 BPM, major key, big but warm, no vocals, clear ending
```

반복 대신 **확실하게 끝나는 곡**이 좋아. 인증서 화면에서 곡이 끝나면 조용히 멈추게 연결할게.

## 고를 때 확인할 것

- 처음 5초 안에 큰 북·심벌이 터지지 않는지 (교실에서 깜짝 놀라지 않게).
- 같은 프롬프트로 2개씩 나오면 멜로디가 덜 튀고 고음이 덜 날카로운 쪽.

## 적용 기록 (2026-11-18)

- 수노 **Premier 요금제**로 만든 곡이야(사용자 확인). 원본은 `references/suno/main_theme.mp3`, `final.mp3`.
- `public/assets/audio/bgm/finale.mp3`는 원본 소리를 그대로 복사하고 앨범 그림만 뺐어.
- `public/assets/audio/bgm/main-theme.mp3`는 끊김 없는 반복용으로 다시 만들었어.
  - 곡 전체에 맞춘 박자 격자: 8분음표 0.28938초(103.7 BPM), 첫 강박 0.242초.
  - 반복 구간: 0.242초 → 60.433초(정확히 26마디, 샘플 11,616 → 2,900,786).
  - 마지막 화음의 울림(60.433초 뒤)은 반복 구간 첫머리에, 첫 강박 앞 꾸밈음(0~0.242초)은 반복 구간 끝에 겹쳐 넣었어.
  - 결과: 이음매 전후 소리 크기가 -17~-20 dB로 이어지고(원본은 약 1초 동안 -91 dB까지 떨어짐), 이음매 순간의 샘플 변화가 곡 평균보다 작아 딸깍 소리가 없어.
  - 게임은 Web Audio로 이 구간을 샘플 단위로 반복해. `<audio loop>`는 반복할 때 짧은 공백이 생겨서 쓰지 않아. 디코딩이 안 되는 기기에서만 `<audio loop>`로 대신해.
- 다시 만드는 명령은 `.tmp/loop/`의 분석 스크립트(`analyze.mjs`, `seam.mjs`)와 이 기록의 숫자를 쓰면 돼.
