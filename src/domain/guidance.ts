import {canComplete,canCompleteInvestigation,experiments,requiredComparisons,observationId,experimentNames,shortNames,parts,linkedCorrectly,currentResults,type Save,type Screen,type UmbrellaPart} from './model';

export function guidance(s:Save,id:Screen):[string,string,string]{
 if(canComplete(s,id))return ['탐구와 새 의뢰를 모두 마쳤어. 오른쪽 완료 버튼을 눌러 봐!','개념 영상에서 네가 알아낸 원리를 다시 볼 수 있어.','영상을 본 뒤 다음 활동이나 복구된 공방으로 갈 수 있어.'];
 if(canCompleteInvestigation(s,id))return ['이제 「새 의뢰 풀기」에서 발견한 내용을 써 보자.','문제의 쓰임과 우리가 관찰한 성질을 연결해 봐.','틀려도 기록이 줄지 않아. 관찰 화면으로 돌아가 다시 비교해도 좋아.'];
 switch(id){
  case 'S01':{const missing=(['canopy','frame','handle'] as UmbrellaPart[]).find(p=>!s.checkpoints.inspected.includes(p))??'canopy';return [`우산의 ${{canopy:'천 부분',frame:'금속 살',handle:'손잡이'}[missing]}을 살펴보고 관찰을 기록해.`, '그림의 번호를 누르거나 돋보기를 끌어서 부품을 살펴봐.','천은 펼쳐지고, 살은 천을 받치고, 손잡이는 손으로 잡는 부분이야.'];}
  case 'S02':return ['재료 카드를 알맞은 부품으로 끌어 연결해 봐.','끌기가 어려우면 재료를 누른 뒤 부품 칸을 눌러도 돼.','이 우산은 천 부분=천, 살=금속, 손잡이=나무야. 관찰 기록도 같은 부품을 골라.'];
  case 'S03':{const e=experiments.find(e=>requiredComparisons[e].some(m=>!s.observations.some(o=>o.id===observationId(e,m))));return [e?`「${experimentNames[e]}」에서 ${requiredComparisons[e].filter(m=>!s.observations.some(o=>o.id===observationId(e,m))).map(m=>shortNames[m]).join('·')} 시료를 비교해.`:'모든 필수 비교를 마쳤어.','시료를 고르고 위의 「자동재생」을 눌러. 결과 문장은 직접 골라.','도구를 작동한 뒤 실제 반응과 맞는 문장을 골라 관찰을 기록해.'];}
  case 'S04':return ['재료를 창 또는 보호대에 끌어 놓고 필요한 성질을 골라.','창에는 빛 통과, 보호대에는 눌렸다 복원되는 성질이 필요해.','선택한 재료로 네가 직접 시험한 관찰 기록을 연결해야 의뢰를 해결할 수 있어.'];
  case 'S05':return [!s.predictions.S05?'먼저 예상한 뒤, 나무토막을 세 용기로 끌어 옮겨 봐.':s.checkpoints.solid.length<3?'나무토막을 아직 안 가 본 용기로 끌어 옮겨.':'처음과 나중의 나무토막 윤곽을 비교하고 결론을 골라.','옮기기 버튼으로도 할 수 있어. 세 용기를 모두 살펴봐.','이 조건에서는 용기가 달라도 나무토막의 모양과 크기는 그대로야.'];
  case 'S06':return [!s.predictions.S06?'먼저 물의 모양과 양이 어떻게 될지 예상해.':s.checkpoints.liquidStep<3?'기울기를 정하고 붓기 버튼을 길게 눌러. 놓으면 멈춰.':'처음 양 기준선을 비교하고, 모래알도 확대해 봐.','넓은 용기에서 낮아졌다고 물이 줄어든 건 아니야. 처음 컵까지 돌아와 비교해.','흘리지 않은 물의 양은 같아. 모래는 흘러도 알갱이 하나하나는 고체야.'];
  case 'S07':return ['마른 휴지를 확인한 뒤 컵을 아래로 끌어 물속에 넣어.','공기 위치 표시를 켜면 컵 위쪽에 남은 공간이 보여.','컵 안 공기도 공간을 차지해. 위쪽 휴지는 마른 채로 남아 있어.'];
  case 'S08':return [!s.checkpoints.open?'물속 컵의 배출구를 열어 기포를 관찰해.':!s.checkpoints.airCompared?'닫힌 컵과 열린 컵을 비교하고 차이를 기록해.':'펌프를 세 번 눌러 주머니에 공기를 넣어 봐.','깊이와 방향은 같아. 바꾼 것은 공기가 나갈 길뿐이야.','공기가 나간 자리에 물이 들어와. 공기를 넣은 주머니가 부푸는 것도 공간을 차지한다는 증거야.'];
  case 'S09':{const p=parts.find(p=>!linkedCorrectly(s,p));return ['필요한 성질 세 개를 확인하고 재료를 부품에 끌어 조립해.',p?`${{body:'몸체',window:'창',bumper:'보호대'}[p]}의 재료와 연결할 관찰 근거를 살펴봐.`:'관찰 근거가 모두 연결됐어. 필요한 성질 세 개도 확인해.','관련 관찰이 없다면 「시험실에서 근거 더 모으기」로 돌아갈 수 있어.'];}
  case 'S10':return [`현재 설계의 ${3-currentResults(s).filter(r=>r.pass).length}개 시험을 더 확인해.`, '통과하지 못한 시험의 설명을 보고 재료·근거를 수정해.','설계를 바꾸면 예전 결과와 구분해서 세 시험을 다시 해야 해.'];
 }
}
