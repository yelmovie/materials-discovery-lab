# 인트로 · 파이널 영상 프롬프트 · 물질 공방 대작전

2026-11-17 정리. 그림 3장을 먼저 만들고, 각 그림을 첫 장면으로 넣어 짧은 영상(5~8초)으로 움직인 뒤 이어 붙이는 방식이야.

## 공통 규칙

- **크기:** 16:9, 1920×1080. 영상도 같은 비율.
- **글자 없음:** 그림·영상에 글자·로고·숫자를 넣지 않아. 제목과 자막은 내가 나중에 합성할게. 프롬프트 끝의 `no text, no letters, no logos`는 지우지 마.
- **참고 그림:** 캐릭터가 매번 달라지지 않게 아래 파일을 참고 이미지로 같이 올려.
  - 연구원(주인공): `public/assets/generated/researcher.webp`
  - 토리(공방장 토끼): `public/assets/characters/tori.webp`
  - 모루(다람쥐): `public/assets/characters/moru.webp`
  - 단단이(비버)·방울이(물방울)·바람이(구름): `public/assets/characters/` 안의 같은 이름 파일
  - 악당 재료 바꿔치기 봇: `public/assets/map-encounter/map-villain-poses-right.webp`
  - 마을 전체 분위기: `public/assets/generated/title-keyart.webp`
- **그림체(모든 그림 앞에 붙이기):**

```
cozy storybook steampunk fantasy illustration for a children's science game, warm golden light, rich painterly detail, cute rounded characters with clean outlines, soft cel shading, brass gears, wooden workshops, glass domes, waterfalls and floating forest islands, 16:9 wide shot
```

- 영상은 무섭지 않게: 악당은 장난꾸러기처럼, 번쩍임·흔들림은 약하게(교실 화면, 빛에 예민한 학생 배려).

## 캐릭터 한 줄 설명 (프롬프트에 그대로 써)

- **연구원:** `a young researcher kid with a mustard beret with brass goggles, cream shirt, green shorts with suspenders, leather satchel, brown boots, holding a small notebook`
- **토리:** `Tori, a white rabbit workshop master with aviator goggles on the head and an orange neck scarf`
- **모루:** `Moru, a cheerful brown squirrel companion with a big fluffy tail`
- **악당:** `the Material Swap Bot, a small mischievous patchwork robot with a wooden plank head and a riveted metal plate, denim overalls, holding a purple cloth bag that drips a blue water drop`

---

## 인트로 (멈춰 버린 공방 마을 → 출발)

### 그림 1 · 멈춰 버린 마을 `intro-1.png`

```
[그림체] A forest workshop village at dusk, everything dim and grey-blue, the giant crystal Material Core in the central plaza has gone dark and cracked with faint flickers, windmill blades stopped, workshop chimneys without smoke, scattered mismatched parts on the stone paths: a cloth sheet stuck in a window frame, a metal spoon where a wooden handle should be, a rubber ball on a glass shelf. Quiet, mysterious but not scary. no text, no letters, no logos
```

**영상 1 (6초):**
```
Slow camera push-in from high above the dim village toward the dark crystal core. The core flickers weakly twice and fades. A gentle breeze moves the stopped windmill a little then it halts. Fireflies drift. Calm, mysterious, soft motion, no flashing.
```

### 그림 2 · 범인은 바꿔치기 봇 `intro-2.png`

```
[그림체] Close shot inside a wooden material workshop at night, the Material Swap Bot [악당 설명] tiptoeing past shelves with a mischievous grin, swapping labeled-looking jars and samples (wood, metal, glass, rubber, cloth, plastic samples) into the wrong drawers, holding the purple cloth bag, warm lantern light from one side, playful sneaky mood like a cartoon caper, not scary. no text, no letters, no logos
```

**영상 2 (6초):**
```
The Swap Bot sneaks left to right on tiptoe, pulls a metal sample out of a drawer and pops in a wooden one, gives a cheeky shrug toward the camera, then scurries out of frame. Comedic, bouncy cartoon motion, lantern light sways slightly.
```

### 그림 3 · 연구원 도착, 출발 `intro-3.png`

```
[그림체] Morning light breaking over the village gate, the young researcher [연구원 설명] arrives with Moru [모루 설명] on the shoulder, Tori [토리 설명] greets them at the gate pointing toward the five dim workshops on the hills (a wooden material workshop, a testing lab, a glass liquid lab, a windmill air lab, an inventor's workshop) and the dark core in the middle, hopeful heroic mood, wide establishing shot, empty sky at the top for a title. no text, no letters, no logos
```

**영상 3 (7초):**
```
Sunrise light sweeps across the village. Tori waves and points toward the workshops, the researcher nods and opens the notebook, Moru hops excitedly. Camera slowly pulls back and rises to reveal the whole village path ahead. Warm, encouraging, ending on a calm wide shot.
```

---

## 파이널 (공방 복구 → 코어 점등 → 축제)

### 그림 4 · 다섯 공방이 깨어나요 `finale-1.png`

```
[그림체] The forest workshop village in late afternoon, the five workshops now glowing with warm light one by one: windows lit, windmill spinning, steam from chimneys, water sparkling through the glass lab. Glowing golden light lines run along the stone paths from each workshop toward the central crystal core, which is starting to shine. Dandani the beaver with safety goggles, Bangul the water drop with goggles and blue scarf, and Barami the white cloud friend cheer from their workshops. no text, no letters, no logos
```

**영상 4 (7초):**
```
Workshops light up in sequence from left to right, each one with a soft warm glow; a ribbon of golden light travels along the paths into the central core. Friends wave as their workshop lights. Smooth camera pan across the village. Gentle glow, no strobe.
```

### 그림 5 · 코어가 다시 빛나요 `finale-2.png`

```
[그림체] Central plaza, the giant Material Core crystal fully restored and shining bright cyan and gold, sparkles floating upward, the young researcher [연구원 설명] and Moru [모루 설명] standing in front of it looking up in awe, Tori [토리 설명] beside them with paws clasped happily. The Material Swap Bot peeks from behind a lamp post, sheepishly returning the swapped samples in its purple bag. Heartwarming, magical. no text, no letters, no logos
```

**영상 5 (7초):**
```
The core's light grows softly from the base to the top and settles into a steady glow. Sparkles drift up. The researcher and Moru look up and smile; Tori claps. The Swap Bot sheepishly sets the bag of samples down and gives a small embarrassed wave. Slow orbit around the core. Gentle brightness change only.
```

### 그림 6 · 공방 마을 축제 `finale-3.png`

```
[그림체] Festive evening celebration in the restored village plaza, string lights and paper lanterns, all friends together: the young researcher, Moru, Tori, Dandani, Bangul, Barami, and even the reformed Swap Bot wearing a small apprentice apron, everyone cheering around the glowing core, confetti-like flower petals, the researcher holding up the notebook proudly, wide group shot, empty space at the top for a title. no text, no letters, no logos
```

**영상 6 (8초):**
```
Friends cheer and bounce in place, petals float down, lanterns sway, Moru jumps onto the researcher's shoulder, the Swap Bot does a small happy dance. Camera slowly pulls back and up to show the whole lit village under a starry sky, ending on a calm wide frame to hold under the title.
```

---

## 만든 뒤 넘겨줄 것

- 그림 6장(png)과 영상 6개(mp4)를 외장 SSD의 `9 things/references/generated/story/`에 넣어 줘.
- 내가 할 일: 제목·자막 합성, 이어 붙이기, 수노 곡(`title.mp3` 인트로, `finale.mp3` 파이널) 얹기, 게임의 시작 이야기와 엔딩 화면에 연결.
- 생성 서비스의 상업 이용 조건(요금제)도 같이 알려 줘. 납품 출처 기록에 남길게.
