# 수노 배경음 프롬프트 · 물질 공방 대작전

2026-11-17 정리. 지금 게임 배경음은 코드로 만든 단순한 사인파 8음 반복이라, 화면마다 어울리는 곡으로 바꾸려고 정리했어.

## 공통 규칙

- **Instrumental**을 켜고 가사 없이 만들어. Style 칸에 아래 영어 프롬프트를 그대로 붙여 넣어.
- 수업 중 계속 나오는 곡이라 **잔잔하고 반복해도 질리지 않게**, 효과음(물방울·딸깍·성공음)보다 앞에 나서지 않게.
- 길이는 1분 30초~2분이면 충분해. 곡이 페이드아웃 없이 끝나야 자연스럽게 반복돼.
- 상업 납품용이라 **수노 유료 요금제(Pro 이상)로 만든 곡만** 써. 무료 요금제로 만든 곡은 상업적으로 쓸 수 없어.
- 받은 파일은 아래 파일 이름으로 `public/assets/audio/bgm/`에 넣어 주면 내가 화면별로 연결할게.

## 곡 목록

| # | 파일 이름 | 쓰는 화면 | 분위기 |
|---|---|---|---|
| 1 | `title.mp3` | 시작 화면 | 설렘, 공방 마을의 아침 |
| 2 | `map.mp3` | 공방 탐험 지도 | 걷기 좋은 모험 |
| 3 | `materials.mp3` | 재료 공방 (S01·S02) | 나무 작업대, 차분한 관찰 |
| 4 | `properties.mp3` | 성질 시험실 (S03·S04, 3D 시험 길) | 통통 튀는 실험 |
| 5 | `states.mp3` | 상태 실험실 (S05·S06) | 흐르는 물, 유리그릇 |
| 6 | `air.mp3` | 공기 추적실 (S07·S08) | 가볍고 바람 같은 |
| 7 | `invention.mp3` | 발명 제작소 (S09·S10) | 태엽과 톱니, 만드는 즐거움 |
| 8 | `core.mp3` | 중앙 코어 연결 | 빛이 차오르는 긴장과 기대 |
| 9 | `finale.mp3` | 엔딩·인증서 (파이널) | 다섯 공방이 모두 살아난 축제 |

## 프롬프트

### 1. 시작 화면 `title.mp3`

```
whimsical cozy fantasy village morning, instrumental, warm acoustic guitar, glockenspiel, pizzicato strings, soft flute melody, light hand percussion, hopeful and curious, children's educational game title theme, 100 BPM, major key, gentle, no vocals, seamless loop
```

### 2. 공방 탐험 지도 `map.mp3`

```
lighthearted adventure overworld music, instrumental, bouncy marimba, ukulele strum, playful woodwinds, soft brushed drums, walking pace, sunny steampunk workshop village, cheerful but not loud, kids game exploration theme, 110 BPM, major key, no vocals, seamless loop
```

### 3. 재료 공방 `materials.mp3`

```
calm curious workshop music, instrumental, wooden marimba, kalimba, soft upright bass, light wood block clicks, warm and focused, carpenter's craft room, gentle thinking music for children observing objects, 92 BPM, major key, minimal, no vocals, seamless loop
```

### 4. 성질 시험실 `properties.mp3`

```
playful science lab music, instrumental, bouncy pizzicato strings, xylophone, bubbly synth plucks, light claps, springy rubbery bass, curious experimenting mood, cartoon laboratory for kids, 112 BPM, major key, fun but not distracting, no vocals, seamless loop
```

### 5. 상태 실험실 `states.mp3`

```
flowing gentle water lab music, instrumental, celesta, harp arpeggios, soft rhodes piano, glassy chimes, slow liquid pulse, calm wonder, pouring water between glass beakers, children's science game, 96 BPM, major key, dreamy and clear, no vocals, seamless loop
```

### 6. 공기 추적실 `air.mp3`

```
airy breezy discovery music, instrumental, light flute and recorder melody, soft accordion pads, wind chimes, gentle bubble-like synth, floating lightly, invisible air everywhere, whimsical windmill workshop, kids game, 104 BPM, major key, soft dynamics, no vocals, seamless loop
```

### 7. 발명 제작소 `invention.mp3`

```
cheerful steampunk inventor workshop music, instrumental, clockwork ticking percussion, music box, bassoon and clarinet melody, plucked banjo, brass accents, gears turning, building something clever, kids game, 108 BPM, major key, playful and determined, no vocals, seamless loop
```

### 8. 중앙 코어 연결 `core.mp3`

```
building anticipation music, instrumental, soft pulsing synth arpeggio, rising string pads, glockenspiel sparkles, gentle timpani swells, crystal core slowly lighting up, hopeful suspense for children, 100 BPM, major key, gradually brightening, no vocals, seamless loop
```

### 9. 파이널 · 엔딩과 인증서 `finale.mp3`

```
triumphant joyful celebration finale, instrumental, full whimsical orchestra, bright brass fanfare, sweeping strings, glockenspiel and marimba, festive hand percussion, the whole workshop village restored and glowing, proud and heartwarming ending theme for a children's science adventure, 116 BPM, major key, big but warm, no vocals, clear ending
```

파이널만 반복 대신 **확실하게 끝나는 곡**이 좋아. 인증서 화면에서 곡이 끝나면 조용히 멈추게 연결할게.

## 고를 때 확인할 것

- 처음 5초 안에 큰 북·심벌이 터지지 않는지 (교실에서 깜짝 놀라지 않게).
- 같은 프롬프트로 2개씩 나오면 멜로디가 덜 튀고 고음이 덜 날카로운 쪽.
- 공방 곡 3~7번을 이어 들었을 때 음량이 비슷한지. 차이가 크면 내가 맞출게.
