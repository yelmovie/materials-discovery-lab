// 10편 데이터: 소품 그림(SVG/게임 그림), 이름표 위치, 움직임 시간표.
// 시간 규칙(15초): 0~5 관찰하기(질문+실험 준비) / 5~10 비교하기(실험 전·후, 바뀐 곳 이름표) / 10~15 기억하기(결론 한 줄+반응).
// 과학 내용은 src/domain/concepts.ts 의 cues 와 docs/screen-spec.json 의 시료 성질을 그대로 따른다.

const glass = (id, x, y, w, h) => `<path id="${id}" d="M${x} ${y} L${x} ${y + h - 14} Q${x} ${y + h} ${x + 14} ${y + h} L${x + w - 14} ${y + h} Q${x + w} ${y + h} ${x + w} ${y + h - 14} L${x + w} ${y}" fill="#EEF7F4" fill-opacity=".72" stroke="#6E9A92" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
// 물: 아래에서 위로 차오르게 y/height 를 움직인다(시작 높이 h0).
const water = (id, x, y, w, h, h0) => `<rect id="${id}" x="${x + 6}" y="${y + h - h0}" width="${w - 12}" height="${h0}" rx="8" fill="#5CC4D6" fill-opacity=".85"/>`;
const ring = (id, cx, cy, r) => `<circle id="${id}" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#214D43" stroke-width="5" stroke-dasharray="14 12" opacity="0"/>`;
const floor = (x1, x2, y) => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#B9CCBF" stroke-width="6" stroke-linecap="round"/>`;
const pic = (id, src, x, y, w, h, extra = '') => `<div class="pic" id="${id}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px${extra}"><img src="assets/img/${src}.webp" alt="" /></div>`;
const presser = (id, x, y) => `<g id="${id}"><rect x="${x}" y="${y}" width="180" height="58" rx="12" fill="#8FA39B" stroke="#214D43" stroke-width="5"/><rect x="${x + 70}" y="${y - 44}" width="40" height="44" fill="#8FA39B" stroke="#214D43" stroke-width="5"/></g>`;
const lamp = (x, y) => `<g><circle cx="${x}" cy="${y}" r="38" fill="#F6D45E" stroke="#214D43" stroke-width="5"/><rect x="${x - 70}" y="${y - 22}" width="40" height="44" rx="8" fill="#8FA39B" stroke="#214D43" stroke-width="5"/></g>`;
const invCup = (id, x, y, w, h, extra = '') => `<g id="${id}">${extra}<path d="M${x} ${y + h} L${x} ${y + 16} Q${x} ${y} ${x + 16} ${y} L${x + w - 16} ${y} Q${x + w} ${y} ${x + w} ${y + 16} L${x + w} ${y + h}" fill="none" stroke="#6E9A92" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></g>`;

export const films = {
 S01: {
  title: '한 물체, 여러 재료', npc: null,
  question: '우산은 한 가지 재료로 만들었을까?',
  conclusion: {words: ['한', '물체,', '여러', '재료'], key: [2, 3]},
  props: `${ring('r1', 435, 460, 78)}${ring('r2', 652, 640, 66)}${ring('r3', 752, 866, 70)}`,
  pics: pic('umb', 'umbrella', 260, 250, 700, 700),
  labels: [
   {id: 'l1', x: 1150, y: 360, main: '천', sub: '펼쳐지고 접혀', to: [435, 460]},
   {id: 'l2', x: 1150, y: 600, main: '금속', sub: '단단히 받쳐', to: [652, 640]},
   {id: 'l3', x: 1150, y: 840, main: '나무', sub: '잡기 좋아', to: [752, 866]},
  ],
  anim: `
K.open(.7, 4.4);
K.ring('#r1', 2.3, 5.0); K.ring('#r2', 2.8, 5.0); K.ring('#r3', 3.3, 5.0);
K.cam(5.0, 1.06, 610, 600);
K.label('l1', 5.6); K.label('l2', 6.8); K.label('l3', 8.0);
K.cam(10.0, 1, 610, 600, .7);
K.close(10.4, 11.0, 12.0);`,
 },
 S02: {
  title: '부품과 재료를 연결해', npc: null,
  question: '어느 부품이 어떤 재료일까?',
  conclusion: {words: ['관찰한', '특징이', '근거야'], key: [2]},
  // 부품을 하나씩 떼어 보듯, 같은 우산 그림을 2.2배로 확대한 동그란 창 3개로 살펴본다.
  props: [[0.25, 0.32, 384], [0.50, 0.36, 612], [0.68, 0.88, 840]].map(([fx, fy, y], i) => `<line id="z${i}" x1="${200 + fx * 640}" y1="${260 + fy * 640}" x2="860" y2="${y}" stroke="#214D43" stroke-width="4" stroke-dasharray="12 10" opacity="0"/>`).join(''),
  pics: pic('umb', 'umbrella', 200, 260, 640, 640) + [[0.25, 0.32, 384], [0.50, 0.36, 612], [0.68, 0.88, 840]].map(([fx, fy, y], i) => `<div class="pic" id="in${i}" style="left:860px;top:${y - 100}px;width:212px;height:212px;border-radius:50%;overflow:hidden;border:6px solid #214D43;background:#fff"><img src="assets/img/umbrella.webp" alt="" style="position:absolute;filter:none;width:1408px;height:1408px;left:${100 - fx * 1408}px;top:${100 - fy * 1408}px;max-width:none" /></div>`).join(''),
  labels: [
   {id: 'l1', x: 1250, y: 384, tag: '관찰', main: '천', sub: '펼쳐지고 접혀'},
   {id: 'l2', x: 1250, y: 612, tag: '관찰', main: '금속', sub: '단단히 받쳐'},
   {id: 'l3', x: 1250, y: 840, tag: '관찰', main: '나무', sub: '잡기 좋아'},
  ],
  anim: `
K.open(.7, 3.6);
[0, 1, 2].forEach(i => { tl.fromTo('#z' + i, {opacity: 0}, {opacity: 1, duration: .25}, 1.6 + i * .6); tl.fromTo('#in' + i, {opacity: 0, scale: .4, transformOrigin: '0% 50%'}, {opacity: 1, scale: 1, duration: .45, ease: 'expo.out'}, 1.7 + i * .6); });
['l1','l2','l3'].forEach((id, i) => { tl.fromTo('#' + id + ' .card', {opacity: 0, x: 40}, {opacity: 1, x: 0, duration: .4, ease: 'expo.out'}, 5.2 + i * .35); tl.fromTo('#' + id + ' .main', {opacity: 0, scale: .7}, {opacity: 1, scale: 1, duration: .3, ease: 'back.out(1.8)'}, 6.6 + i * 1.0); });
K.close(10.6, 11.2, 12.2);`,
 },
 S03: {
  title: '조건은 같게, 재료만 다르게', npc: 'dandani',
  question: '같은 힘으로 누르면 시료마다 다를까?',
  conclusion: {words: ['조건은', '같게,', '시료만', '바꿔'], key: [0, 1]},
  props: `${floor(300, 820, 556)}${floor(300, 820, 846)}
   <rect x="360" y="470" width="400" height="80" rx="10" fill="none" stroke="#214D43" stroke-width="3" stroke-dasharray="10 9" opacity=".55"/>
   <rect id="rub" x="360" y="470" width="400" height="80" rx="14" fill="#E98981" stroke="#214D43" stroke-width="5"/>
   <rect x="360" y="760" width="400" height="80" rx="4" fill="none" stroke="#214D43" stroke-width="3" stroke-dasharray="10 9" opacity=".55"/>
   <rect id="met" x="360" y="760" width="400" height="80" rx="4" fill="#AAB7C8" stroke="#214D43" stroke-width="5"/>
   ${presser('p1', 470, 332)}${presser('p2', 470, 622)}
   <g id="force"><path d="M900 380 L900 520" stroke="#D99A1E" stroke-width="8" stroke-linecap="round"/><path d="M880 498 L900 528 L920 498" fill="none" stroke="#D99A1E" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M900 670 L900 810" stroke="#D99A1E" stroke-width="8" stroke-linecap="round"/><path d="M880 788 L900 818 L920 788" fill="none" stroke="#D99A1E" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></g>`,
  notes: `<div class="note" id="n1" style="left:220px;top:486px">부드러운 고무</div><div class="note" id="n2" style="left:270px;top:776px">금속</div><div class="lab" id="same" style="left:900px;top:600px"><div class="card"><span class="sub">같은 힘</span></div></div>`,
  labels: [
   {id: 'l1', x: 1110, y: 420, main: '눌렸다가', sub: '다시 돌아와', to: [760, 506], accent: true},
   {id: 'l2', x: 1110, y: 760, main: '거의 그대로', to: [760, 800]},
  ],
  anim: `
K.open(.7, 3.8);
K.show('#n1', 1.8); K.show('#n2', 2.3);
tl.fromTo('#p1', {y: -40, opacity: 0}, {y: 0, opacity: 1, duration: .5, ease: 'expo.out'}, 3.0);
tl.fromTo('#p2', {y: -40, opacity: 0}, {y: 0, opacity: 1, duration: .5, ease: 'expo.out'}, 3.2);
K.cam(5.0, 1.06, 600, 640);
K.show('#force', 5.2); K.reveal('#same .card', 5.3);
tl.to(['#p1','#p2'], {y: 80, duration: .35, ease: 'power2.in'}, 5.8);
tl.to('#p1', {y: 110, duration: .35, ease: 'power2.out'}, 6.15);
tl.to('#rub', {scaleY: .625, transformOrigin: '50% 100%', duration: .35, ease: 'power2.out'}, 6.15);
K.out('#force', 6.4);
tl.to('#p1', {y: -10, duration: .45, ease: 'power2.out'}, 7.0);
tl.to('#p2', {y: -10, duration: .45, ease: 'power2.out'}, 7.0);
tl.to('#rub', {scaleY: 1, duration: .8, ease: 'elastic.out(1, 0.45)'}, 7.0);
K.label('l1', 7.7); K.label('l2', 8.4);
K.out('#same .card', 9.8);
K.cam(10.0, 1, 600, 640, .7);
K.close(10.4, 11.0, 12.0);`,
 },
 S04: {
  title: '성질을 알면 쓰임이 보여', npc: 'dandani',
  question: '관찰창에는 어떤 재료가 필요할까?',
  conclusion: {words: ['성질을', '알면', '쓰임이', '보여'], key: [0]},
  props: `<rect id="win" x="224" y="538" width="342" height="174" rx="16" fill="none" stroke="#D99A1E" stroke-width="7" stroke-dasharray="16 12" opacity="0"/>
   ${ring('corner', 590, 488, 62)}
   <g id="rig1">${lamp(760, 470)}
    <polygon id="beam" points="760,440 1200,370 1200,570 760,500" fill="#F7D774" fill-opacity=".55"/>
    <rect x="950" y="392" width="34" height="156" rx="6" fill="#C6EAF3" fill-opacity=".8" stroke="#6E9A92" stroke-width="5"/>
    <rect x="1196" y="360" width="22" height="220" rx="6" fill="#fff" stroke="#214D43" stroke-width="5"/>
    <ellipse id="spot" cx="1196" cy="470" rx="14" ry="62" fill="#F2C335"/></g>
   <g id="rig2">${floor(860, 1220, 646)}
    <rect id="rub" x="920" y="566" width="240" height="76" rx="14" fill="#E98981" stroke="#214D43" stroke-width="5"/>
    ${presser('p1', 950, 440)}</g>`,
  pics: pic('inv', 'invention', 160, 300, 560, 560),
  labels: [
   {id: 'l1', x: 970, y: 300, main: '빛이 통과해', to: [967, 410], accent: true},
   {id: 'l2', x: 1040, y: 360, main: '눌렸다가 돌아와', to: [1040, 566]},
  ],
  anim: `
K.open(.6, 3.0);
K.ring('#win', 2.0, 4.9);
K.show('#rig1', 3.1);
tl.fromTo('#beam', {opacity: 0}, {opacity: 1, duration: .35, ease: 'power2.out'}, 3.5);
tl.fromTo('#spot', {opacity: 0}, {opacity: 1, duration: .25}, 3.8);
K.label('l1', 4.0, 4.9);
K.out('#rig1', 4.9);
tl.fromTo('#rig2', {opacity: 0}, {opacity: 1, duration: .3, ease: 'power2.out'}, 5.3);
K.ring('#corner', 5.3, 9.8);
tl.to('#p1', {y: 56, duration: .35, ease: 'power2.in'}, 6.0);
tl.to('#p1', {y: 86, duration: .3, ease: 'power2.out'}, 6.35);
tl.to('#rub', {scaleY: .6, transformOrigin: '50% 100%', duration: .3, ease: 'power2.out'}, 6.35);
tl.to('#p1', {y: -6, duration: .4, ease: 'power2.out'}, 7.0);
tl.to('#rub', {scaleY: 1, duration: .8, ease: 'elastic.out(1, 0.45)'}, 7.0);
K.label('l2', 7.8, 9.8);
K.out('#rig2', 9.8);
tl.to('#inv', {x: 280, duration: .8, ease: 'power2.inOut'}, 10.0);
tl.to('#win', {x: 280, opacity: 1, duration: .8, ease: 'power2.inOut'}, 10.0);
tl.to('#corner', {x: 280, opacity: 1, duration: .8, ease: 'power2.inOut'}, 10.0);
K.close(10.5, 11.1, 12.1);`,
 },
 S05: {
  title: '용기만 바꾼 나무토막', npc: 'banguli',
  question: '용기만 바꾸면 토막은 어떻게 될까?',
  conclusion: {words: ['옮긴', '토막은', '모양과', '부피가', '그대로'], key: [4]},
  props: `${floor(180, 1200, 868)}${glass('c1', 220, 520, 200, 340)}${glass('c2', 520, 680, 400, 180)}${glass('c3', 1020, 380, 120, 480)}
   <rect id="ghost" x="275" y="770" width="90" height="90" rx="6" fill="none" stroke="#214D43" stroke-width="4" stroke-dasharray="10 8" opacity="0"/>
   <rect id="block" x="275" y="770" width="90" height="90" rx="6" fill="url(#wood)" stroke="#7A5530" stroke-width="5"/>`,
  notes: `<div class="note" style="left:320px;top:884px">처음 컵</div><div class="note" style="left:720px;top:884px">넓은 용기</div><div class="note" style="left:1080px;top:884px">길쭉한 용기</div>`,
  labels: [
   {id: 'l0', x: 320, y: 410, main: '나무토막', to: [320, 770]},
   {id: 'l1', x: 720, y: 560, main: '모양 그대로', to: [720, 770]},
   {id: 'l2', x: 840, y: 330, main: '부피 그대로', to: [1080, 770], accent: true},
  ],
  anim: `
K.open(.7, 3.0);
tl.fromTo('#block', {y: -420}, {y: 0, duration: .55, ease: 'power2.in'}, 1.2);
tl.to('#block', {y: -14, duration: .12, ease: 'power2.out'}, 1.75).to('#block', {y: 0, duration: .14, ease: 'power2.in'}, 1.87);
tl.fromTo('#ghost', {opacity: 0}, {opacity: 1, duration: .3}, 2.4);
K.label('l0', 3.3, 4.9);
const moveBlock = (t, x, rise) => {
 tl.to('#block', {y: rise, duration: .24, ease: 'power2.out'}, t);
 tl.to('#block', {x, duration: .34, ease: 'power2.inOut'}, t + .24);
 tl.to('#block', {y: 0, duration: .24, ease: 'power2.in'}, t + .58);
};
moveBlock(5.3, 400, -390);
K.label('l1', 6.3, 6.9);
moveBlock(7.0, 760, -510);
K.label('l2', 8.1);
tl.to('#ghost', {x: 760, duration: .7, ease: 'power2.inOut'}, 10.2);
tl.to('#ghost', {stroke: '#D99A1E', strokeWidth: 7, duration: .2}, 10.9);
K.close(11.2, 11.7, 12.6);`,
 },
 S06: {
  title: '물높이가 달라도 양은 같아', npc: 'banguli',
  question: '넓은 그릇에 옮기면 양이 줄까?',
  conclusion: {words: ['모양은', '달라도', '양은', '같아'], key: [2, 3]},
  props: `${floor(180, 1260, 868)}${glass('a', 240, 500, 200, 360)}${water('wa', 240, 500, 200, 360, 180)}
   ${glass('b', 560, 700, 440, 160)}${water('wb', 560, 700, 440, 160, 0)}
   ${glass('c', 1100, 400, 100, 460)}${water('wc', 1100, 400, 100, 460, 0)}
   <line id="ref" x1="214" y1="680" x2="466" y2="680" stroke="#D99A1E" stroke-width="6" stroke-dasharray="16 10" stroke-linecap="round"/>
   <path id="ar1" d="M340 470 Q560 330 770 650" fill="none" stroke="#214D43" stroke-width="7" stroke-linecap="round"/>
   <path id="ar2" d="M800 660 Q980 330 1150 380" fill="none" stroke="#214D43" stroke-width="7" stroke-linecap="round"/>
   <path id="ar3" d="M1150 370 Q760 250 350 470" fill="none" stroke="#214D43" stroke-width="7" stroke-linecap="round"/>`,
  notes: `<div class="note" style="left:340px;top:884px">처음 컵</div><div class="note" style="left:780px;top:884px">넓은 그릇</div><div class="note" style="left:1150px;top:884px">좁은 컵</div>`,
  labels: [
   {id: 'l0', x: 340, y: 400, main: '처음 물 높이', to: [380, 680], accent: true},
   {id: 'l1', x: 780, y: 560, main: '낮게', to: [780, 785]},
   {id: 'l2', x: 900, y: 450, main: '높게', to: [1100, 512]},
   {id: 'l3', x: 760, y: 560, main: '처음 기준선과 같아', to: [466, 680], accent: true},
  ],
  anim: `
K.open(.7, 2.9);
K.label('l0', 1.4, 3.0);
K.draw('#ar1', 3.1, .3); tl.fromTo('#ar1', {opacity: 1}, {opacity: 0, duration: .2, immediateRender: false}, 4.6);
tl.to('#wa', {attr: {y: 860, height: 0}, duration: 1.2, ease: 'power1.inOut'}, 3.3);
tl.to('#wb', {attr: {y: 778, height: 82}, duration: 1.2, ease: 'power1.inOut'}, 3.35);
K.label('l1', 5.3, 6.0);
K.draw('#ar2', 6.0, .3); tl.fromTo('#ar2', {opacity: 1}, {opacity: 0, duration: .2, immediateRender: false}, 7.6);
tl.to('#wb', {attr: {y: 860, height: 0}, duration: 1.2, ease: 'power1.inOut'}, 6.2);
tl.to('#wc', {attr: {y: 500, height: 360}, duration: 1.2, ease: 'power1.inOut'}, 6.25);
K.label('l2', 7.7, 9.8);
K.draw('#ar3', 10.1, .3); tl.fromTo('#ar3', {opacity: 1}, {opacity: 0, duration: .2, immediateRender: false}, 11.4);
tl.to('#wc', {attr: {y: 860, height: 0}, duration: 1.0, ease: 'power1.inOut'}, 10.3);
tl.to('#wa', {attr: {y: 680, height: 180}, duration: 1.0, ease: 'power1.inOut'}, 10.35);
tl.to('#ref', {strokeWidth: 10, duration: .2}, 11.35);
K.label('l3', 11.4);
K.close(11.9, 12.3, 12.8);`,
 },
 S07: {
  title: '빈 컵에도 공기가 있어', npc: 'barami',
  question: '컵을 거꾸로 넣으면 휴지가 젖을까?',
  conclusion: {words: ['공기도', '공간을', '차지해'], key: [1]},
  props: `<rect x="260" y="560" width="920" height="400" rx="18" fill="#F3FAF8" stroke="#6E9A92" stroke-width="7"/>
   <rect x="267" y="640" width="906" height="313" rx="12" fill="#7FD0DE" fill-opacity=".85"/>
   <g id="cup">
    <rect x="604" y="234" width="232" height="296" rx="12" fill="#F7FBFA"/>
    <rect id="inw" x="604" y="530" width="232" height="0" fill="#7FD0DE" fill-opacity=".95"/>
    <path id="tissue" d="M650 244 q30 -6 60 4 q34 -10 70 2 q12 26 -4 48 q-30 12 -62 2 q-34 10 -60 -6 q-14 -24 -4 -50z" fill="#fff" stroke="#9DB6AC" stroke-width="4"/>
    ${invCup('cupline', 600, 230, 240, 300)}
   </g>
   <g id="down"><path d="M960 250 L960 440" stroke="#214D43" stroke-width="8" stroke-linecap="round"/><path d="M938 414 L960 446 L982 414" fill="none" stroke="#214D43" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></g>`,
  labels: [
   {id: 'l0', x: 1020, y: 290, main: '마른 휴지', to: [800, 270]},
   {id: 'l1', x: 1110, y: 500, main: '입구를 아래로', sub: '곧게 넣어', to: null},
   {id: 'l2', x: 1040, y: 700, main: '공기', to: [790, 690], accent: true},
   {id: 'l3', x: 1040, y: 470, main: '휴지는 말라 있어', to: [770, 565]},
  ],
  anim: `
K.open(.7, 3.1);
tl.fromTo('#tissue', {x: -330, y: 120, opacity: 0}, {x: 0, y: 0, opacity: 1, duration: .8, ease: 'power2.inOut'}, 1.4);
K.label('l0', 3.3, 4.9);
K.show('#down', 5.1); K.label('l1', 5.3, 7.4);
tl.to('#cup', {y: 300, duration: 1.6, ease: 'power2.inOut'}, 5.5);
tl.to('#inw', {attr: {y: 500, height: 30}, duration: .6, ease: 'power2.out'}, 6.6);
K.out('#down', 7.2);
K.cam(7.6, 1.08, 720, 700, .9);
K.label('l2', 10.2); K.label('l3', 10.8);
K.close(11.5, 12.0, 12.8);`,
 },
 S08: {
  title: '공기가 나가면 물이 들어와', npc: 'barami',
  question: '공기가 나갈 길을 열면 어떻게 될까?',
  conclusion: {words: ['공기가', '나가면', '물이', '들어와'], key: [2, 3]},
  props: `<rect x="200" y="400" width="1020" height="580" rx="18" fill="#F3FAF8" stroke="#6E9A92" stroke-width="7"/>
   <rect x="207" y="440" width="1006" height="533" rx="12" fill="#7FD0DE" fill-opacity=".85"/>
   <rect x="344" y="564" width="212" height="296" fill="#F7FBFA"/><rect x="344" y="830" width="212" height="30" fill="#7FD0DE"/>
   <rect x="764" y="564" width="212" height="296" fill="#F7FBFA"/><rect id="inB" x="764" y="830" width="212" height="30" fill="#7FD0DE"/>
   ${invCup('ca', 340, 560, 220, 300)}${invCup('cb', 760, 560, 220, 300)}
   <rect x="852" y="552" width="36" height="16" fill="#F7FBFA"/>
   <rect id="cap" x="846" y="540" width="48" height="22" rx="6" fill="#E8A06A" stroke="#214D43" stroke-width="4"/>
   <line id="depth" x1="300" y1="860" x2="1020" y2="860" stroke="#D99A1E" stroke-width="6" stroke-dasharray="16 10" stroke-linecap="round"/>
   ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `<circle class="bub" id="b${i}" cx="${862 + (i % 3) * 8}" cy="548" r="${11 + (i % 4) * 2}" fill="#fff" fill-opacity=".7" stroke="#3FA0B6" stroke-width="4" opacity="0"/>`).join('')}`,
  labels: [
   {id: 'l0', x: 660, y: 945, main: '같은 깊이', to: null, accent: true},
   {id: 'l1', x: 1080, y: 300, main: '배출구 열기', to: [880, 540]},
   {id: 'l2', x: 1100, y: 470, main: '기포', to: [900, 495]},
   {id: 'l3', x: 1110, y: 730, main: '물이 들어와', to: [930, 700], accent: true},
   {id: 'l4', x: 450, y: 330, main: '공기 그대로', to: [450, 640]},
  ],
  anim: `
K.open(.7, 3.2);
K.draw('#depth', 2.3, .5); K.label('l0', 2.8, 9.8);
K.label('l1', 5.2, 7.0);
tl.to('#cap', {x: 40, y: -60, rotation: 30, transformOrigin: '50% 50%', duration: .45, ease: 'power2.out'}, 5.5);
K.out('#cap', 6.4);
for (let i = 0; i < 10; i++) { const t = 6.0 + i * .36; tl.fromTo('#b' + i, {y: 0, opacity: 0}, {opacity: 1, duration: .1}, t); tl.to('#b' + i, {y: -112 - (i % 2) * 6, x: (i % 2 ? 10 : -8), duration: .8, ease: 'power1.in'}, t); tl.to('#b' + i, {opacity: 0, duration: .12}, t + .78); }
K.label('l2', 6.6, 9.8);
tl.to('#inB', {attr: {y: 576, height: 284}, duration: 3.8, ease: 'power1.inOut'}, 6.0);
K.label('l3', 10.2); K.label('l4', 10.8);
K.close(11.4, 11.9, 12.8);`,
 },
 S09: {
  title: '증거를 조립하면 발명이 돼', npc: 'tori',
  question: '세 부분에 같은 재료를 써도 될까?',
  conclusion: {words: ['증거를', '모으면', '발명이', '돼'], key: [0]},
  props: `${ring('rb', 763, 652, 72)}<rect id="rw" x="270" y="569" width="398" height="204" rx="18" fill="none" stroke="#214D43" stroke-width="5" stroke-dasharray="14 12" opacity="0"/>${ring('rc', 686, 830, 62)}`,
  pics: pic('inv', 'invention', 200, 300, 640, 640),
  labels: [
   {id: 'l1', x: 1100, y: 420, main: '몸체', sub: '비를 막아', to: [763, 652]},
   {id: 'l2', x: 1100, y: 640, main: '창', sub: '안이 보여', to: [580, 671]},
   {id: 'l3', x: 1100, y: 860, main: '모서리', sub: '충격을 줄여', to: [700, 830]},
  ],
  notes: [1, 2, 3].map(i => `<div class="lab accent" id="e${i}" style="left:1000px;top:${330 + (i - 1) * 220}px"><div class="card" style="padding:4px 16px 8px"><span class="sub" style="font-size:30px;color:#214D43">기록 ✓</span></div></div>`).join(''),
  anim: `
K.open(.6, 3.4);
K.ring('#rb', 2.0, 5.0); K.ring('#rw', 2.5, 5.0); K.ring('#rc', 3.0, 5.0);
K.label('l1', 5.4); K.label('l2', 6.6); K.label('l3', 7.8);
K.reveal('#e1 .card', 10.2); K.reveal('#e2 .card', 10.5); K.reveal('#e3 .card', 10.8);
K.close(11.3, 11.8, 12.7);`,
 },
 S10: {
  title: '시험하고, 고치고, 다시 시험해', npc: 'tori',
  question: '세 시험을 모두 통과할까?',
  conclusion: {words: ['고치고', '다시', '시험해'], key: [1, 2]},
  stamp: ['발명', '완성!'],
  props: `<g id="rain">${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M${300 + i * 60} 230 l-10 34" stroke="#3FA0B6" stroke-width="7" stroke-linecap="round"/>`).join('')}</g>
   <g id="light">${lamp(990, 330)}<polygon id="beam" points="975,350 1005,360 652,768 292,700" fill="#F7D774" fill-opacity=".5"/></g>`,
  pics: pic('inv', 'invention', 220, 330, 600, 600) + `<svg class="pic" id="cover" style="left:0;top:0;width:1920px;height:1080px;overflow:visible" viewBox="0 0 1920 1080"><rect x="290" y="586" width="364" height="184" rx="16" fill="url(#wood2)" stroke="#7A5530" stroke-width="6"/><defs><pattern id="wood2" patternUnits="userSpaceOnUse" width="300" height="105"><image href="assets/img/wood-sample.webp" width="300" height="105" preserveAspectRatio="none"/></pattern></defs></svg>`
   + `<svg class="pic" id="glow" style="left:0;top:0;width:1920px;height:1080px" viewBox="0 0 1920 1080"><rect x="292" y="588" width="360" height="180" rx="16" fill="#F7D774" fill-opacity=".45"/></svg>`
   + `<svg class="pic" id="press-rig" style="left:0;top:0;width:1920px;height:1080px;opacity:0" viewBox="0 0 1920 1080" aria-hidden="true">
      <path d="M766 876 H856" fill="none" stroke="#214D43" stroke-width="8" stroke-linecap="round"/>
      <rect id="press-pad" x="771" y="814" width="80" height="60" rx="15" fill="#E98981" stroke="#214D43" stroke-width="5"/>
      <path d="M770 814 H854" fill="none" stroke="#214D43" stroke-width="4" stroke-dasharray="7 7" opacity=".55"/>
      <g id="press-plate"><rect x="755" y="722" width="112" height="32" rx="9" fill="#8FA39B" stroke="#214D43" stroke-width="5"/><rect x="799" y="682" width="24" height="40" fill="#8FA39B" stroke="#214D43" stroke-width="5"/></g>
    </svg>`,
  notes: [['t1', '비 시험', 420], ['t2', '빛 시험', 600], ['t3', '모서리 누르기 시험', 780]].map(([id, n, y]) => `<div class="lab" id="${id}" style="left:1110px;top:${y}px"><div class="card" style="min-width:300px"><span class="sub" style="color:#214D43;font-size:40px">${n} <b class="ok" style="font-weight:400">✓</b><b class="no" style="font-weight:400;color:#C9503F"> ✗ 다시</b></span></div></div>`).join(''),
  labels: [
   {id: 'l1', x: 560, y: 250, main: '창: 투명한 재료로', sub: '근거: 빛 시험 기록', to: [472, 640], accent: true},
  ],
  anim: `
K.open(.6, 2.3);
['#t1','#t2','#t3'].forEach(s => { tl.set(s + ' .ok', {opacity: 0}, 0); tl.set(s + ' .no', {opacity: 0}, 0); });
tl.fromTo('#rain', {y: -60, opacity: 0}, {y: 70, opacity: 1, duration: .6, ease: 'power1.in'}, 2.4); K.out('#rain', 3.0);
K.reveal('#t1 .card', 3.1); tl.to('#t1 .ok', {opacity: 1, duration: .2}, 3.2);
K.show('#light', 3.3); K.reveal('#t2 .card', 3.9); tl.to('#t2 .no', {opacity: 1, duration: .2}, 4.0); K.out('#light', 4.2);
const press = t => {
 tl.to('#press-rig', {opacity: 1, duration: .14}, t);
 tl.to('#press-plate', {y: 60, duration: .22, ease: 'power2.in'}, t + .14);
 tl.to('#press-plate', {y: 85, duration: .16, ease: 'power1.out'}, t + .36);
 tl.to('#press-pad', {scaleY: .58, transformOrigin: '50% 100%', duration: .16, ease: 'power1.out'}, t + .36);
 tl.to('#press-plate', {y: 0, duration: .28, ease: 'power2.out'}, t + .65);
 tl.to('#press-pad', {scaleY: 1, duration: .28, ease: 'power2.out'}, t + .65);
 tl.to('#press-rig', {opacity: 0, duration: .2}, t + 1.14);
};
press(4.1);
K.reveal('#t3 .card', 5.05); tl.to('#t3 .ok', {opacity: 1, duration: .2}, 5.18);
tl.to('#cover', {y: 60, opacity: 0, duration: .6, ease: 'power3.in'}, 5.6);
K.label('l1', 6.3);
tl.to('#t2 .no', {opacity: 0, duration: .2}, 7.4);
K.out(['#l1 .card', '#l1-ln', '#l1-dot'], 9.3);
tl.set('#t1 .ok', {opacity: 0}, 9.55); tl.set('#t3 .ok', {opacity: 0}, 9.55);
tl.fromTo('#rain', {y: -60, opacity: 0}, {y: 70, opacity: 1, duration: .6, ease: 'power1.in', immediateRender: false}, 9.6); K.out('#rain', 10.2);
tl.to('#t1 .ok', {opacity: 1, duration: .2}, 10.22);
tl.fromTo('#light', {opacity: 0}, {opacity: 1, duration: .3, immediateRender: false}, 10.3);
tl.fromTo('#glow', {opacity: 0}, {opacity: 1, duration: .3}, 10.55);
tl.to('#t2 .ok', {opacity: 1, duration: .2}, 10.86); K.out('#light', 11.03);
press(10.86);
tl.to('#t3 .ok', {opacity: 1, duration: .2}, 11.94);
K.close(12.15, 12.45, 12.8);`,
 },
};
