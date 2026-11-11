import {keyConcepts} from './concepts';
import {canComplete,canCompleteInvestigation,experiments,requiredComparisons,observationId,experimentNames,parts,partNames,linkedCorrectly,currentResults,testNames,type Save,type Screen,type UmbrellaPart} from './model';

/** Hints point to evidence. The explanation is available after the learner's decisions. */
export function guidance(s:Save,id:Screen):[string,string,string]{
 const concept=keyConcepts[id];
 if(canComplete(s,id))return ['완료 버튼을 눌러 개념을 정리해 봐요.',concept.takeaway,concept.question];
 if(canCompleteInvestigation(s,id))return ['이제 다음 활동에서 발견을 써 봐요.','문제에서 무엇을 알아내야 하는지 먼저 읽어 봐요.','생각이 막히면 탐구로 돌아가 비교했던 장면을 다시 봐요.'];
 switch(id){
  case 'S01':{
   const missing=(['canopy','frame','handle'] as UmbrellaPart[]).find(p=>!s.checkpoints.inspected.includes(p))??'canopy';
   return [`그림에서 「${partNames[missing]}」 번호를 눌러요.`,'그림의 번호를 눌러 부품을 하나씩 살펴봐요.',concept.observe];
  }
  case 'S02':return ['재료 카드를 고른 뒤 놓을 부품을 눌러요.','카드를 끌어 같은 자리에 놓아도 돼요.',concept.observe];
  case 'S03':{
   const experiment=experiments.find(e=>requiredComparisons[e].some(m=>!s.observations.some(o=>o.id===observationId(e,m))));
   return [experiment?`「${experimentNames[experiment]}」에서 아직 기록하지 않은 재료를 살펴봐요.`:concept.goal,'시험할 재료를 고르고 「자동재생」을 눌러요.',concept.observe];
  }
  case 'S04':return ['재료를 고르고 관찰창이나 보호대 자리를 눌러요.','그 부품이 해야 할 일을 먼저 생각해 봐요.',concept.observe];
  case 'S05':return [!s.predictions.S05?'「먼저 예상해 보자」를 눌러요.':s.checkpoints.solid.length<3?'아직 안 가 본 용기를 눌러 토막을 옮겨요.':'옮기기 전후의 토막 모양과 크기를 비교해요.','토막을 끌거나 용기를 눌러 옮길 수 있어요.',concept.observe];
  case 'S06':return [!s.predictions.S06?'「먼저 예상해 보자」를 눌러요.':s.checkpoints.liquidStep<3?'「조금씩 붓기」를 눌러 물을 옮겨요.':'처음 컵에 돌아온 물을 눈금과 비교해요.','「누르는 동안 붓기」는 손을 떼면 멈춰요.',concept.observe];
  case 'S07':return ['마른 휴지를 확인하고 컵을 물속에 넣어요.','「공기 위치 표시 켜기」에서 공기가 있는 곳을 봐요.',concept.observe];
  case 'S08':return [!s.checkpoints.open?'배출구를 열고 컵 안을 살펴봐요.':!s.checkpoints.airCompared?'닫힌 컵과 열린 컵에서 달라진 것을 비교해요.':'펌프를 세 번 눌러 주머니를 관찰해요.','같은 컵을 같은 깊이로 넣었어요. 이번에 바꾼 것은 배출구예요.',concept.observe];
  case 'S09':{
   const part=parts.find(p=>!linkedCorrectly(s,p));
   return ['「필요한 성질 확인」에서 세 부품의 쓰임을 읽어요.',part?`${partNames[part]}에 고른 재료의 관찰 기록을 찾아요.`:'관찰 기록을 모두 연결했어요. 부품의 쓰임도 확인해요.',concept.observe];
  }
  case 'S10':{
   const results=currentResults(s),failed=results.find(r=>!r.pass),next=Object.keys(testNames).find(t=>!results.some(r=>r.testId===t)) as keyof typeof testNames|undefined;
   return [failed?`「${testNames[failed.testId]}」의 결과를 열어 고칠 곳을 찾아요.`:next?`「${testNames[next]}」에서 어떤 변화가 보이는지 살펴봐요.`:concept.goal,'설계를 고치면 고친 설계로 다시 시험해요.',concept.observe];
  }
 }
}
