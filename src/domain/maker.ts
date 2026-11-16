export interface MakerChoice {id:string;label:string;color:string}
export interface MakerSlot {id:string;label:string;choices:MakerChoice[];accept:string[];observed:string;failure:string}
export interface MakerOrder {screen:string;title:string;npc:string;request:string;trial:string;watch:string;success:string;note:string;slots:MakerSlot[]}
const c=(id:string,label:string,color:string):MakerChoice=>({id,label,color});

export const makerOrders:MakerOrder[]=[
 {
  screen:'S02',title:'비 오는 날의 작은 지붕',npc:'moru',
  request:'빗물이 아래로 새지 않고 지붕이 기울지 않게 만들어 줘.',
  trial:'비와 받침 시험',watch:'지붕 아래와 받침을 봐. 물이 떨어지거나 받침이 휘나요?',
  success:'아래로 물이 새지 않았고, 받침이 지붕을 받쳤어.',
  note:'같은 양의 물과 같은 무게로 시험하는 모형이에요. 실제 지붕은 두께와 연결 방법도 살펴야 해요.',
  slots:[
   {id:'roof',label:'지붕',choices:[c('cloth','천 조각','#deb6a3'),c('plastic','플라스틱 판','#87cdd7')],accept:['plastic'],observed:'빗물이 지붕 위로 흘렀고 아래로 새지 않았어.',failure:'천에 물이 스며들어 아래로 떨어졌어. 다른 조각도 시험해 봐.'},
   {id:'support',label:'받침',choices:[c('rubber','고무 막대','#f2a294'),c('metal','금속 막대','#a6b6c9')],accept:['metal'],observed:'같은 무게에서도 받침이 거의 휘지 않았어.',failure:'받침이 휘어서 지붕이 기울었어. 다른 막대와 비교해 봐.'}
  ]
 },
 {
  screen:'S06',title:'물을 옮기는 운반대',npc:'banguli',
  request:'받침의 모양을 유지하고, 물을 흘리지 않고 옮겨 줘.',
  trial:'물 옮기기 시험',watch:'받침 모양과 컵 아래를 봐. 물이 떨어지나요?',
  success:'받침 모양이 그대로였고 컵 밖으로 물이 새지 않았어.',
  note:'물은 담긴 용기에 따라 모양이 바뀌어요. 흘리지도 더하지도 않으면 물의 양은 같아요.',
  slots:[
   {id:'tray',label:'받침',choices:[c('solid','나무판','#bc8d59'),c('liquid','물만 놓기','#75c9ed')],accept:['solid'],observed:'받침이 모양을 그대로 유지했어.',failure:'물은 바닥에 퍼져 받침 모양을 유지하지 못했어. 다른 받침을 시험해 봐.'},
   {id:'cup',label:'용기',choices:[c('hole','컵 A','#d6e7df'),c('closed','컵 B','#94cdd2')],accept:['closed'],observed:'컵 밑으로 물이 떨어지지 않았어.',failure:'컵 밑 구멍으로 물이 새었어. 다른 컵도 같은 양으로 시험해 봐.'}
  ]
 },
 {
  screen:'S08',title:'공기로 돌리는 바람개비',npc:'barami',
  request:'펌프에서 나온 공기로 날개를 돌려 줘.',
  trial:'공기 보내기 시험',watch:'공기가 어디로 가는지, 날개가 도는지 봐.',
  success:'공기가 날개에 닿아 날개가 돌아갔어.',
  note:'흰 점은 보이지 않는 공기의 이동을 나타낸 표시예요. 공기 자체의 색은 아니에요.',
  slots:[
   {id:'tube',label:'연결관',choices:[c('blocked','관 A','#cbb9a7'),c('open','관 B','#94cdd2')],accept:['open'],observed:'흰 점이 관 끝까지 이동했어.',failure:'흰 점이 관 안의 막힌 부분을 지나지 못했어. 다른 관과 비교해 봐.'},
   {id:'aim',label:'관 끝',choices:[c('away','위쪽','#bec8df'),c('fan','가운데','#f3d074')],accept:['fan'],observed:'관 끝이 날개를 향했어.',failure:'관 끝이 날개와 다른 곳을 향해. 장치에서 위치를 비교해 봐.'}
  ]
 }
];
export function evaluateOrder(order:MakerOrder,parts:Record<string,string>){
 return order.slots.map(slot=>{const pass=slot.accept.includes(parts[slot.id]);return {id:slot.id,pass,feedback:pass?slot.observed:slot.failure};});
}
export function validDelivery(screen:string,parts:Record<string,string>){const order=makerOrders.find(o=>o.screen===screen);return !!order&&order.slots.every(s=>s.choices.some(c=>c.id===parts[s.id]))&&evaluateOrder(order,parts).every(r=>r.pass);}
