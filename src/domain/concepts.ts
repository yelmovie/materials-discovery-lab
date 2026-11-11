import type {Screen} from './model';
import screenSpec from '../../docs/screen-spec.json';

export interface KeyConcept {goal:string;observe:string;takeaway:string;question:string}
// goal/observe guide the investigation. takeaway/question follow the learner's judgment.
export const keyConcepts=Object.fromEntries(screenSpec.screens.map(screen=>[screen.id,screen.learning.keyConcept])) as Record<Screen,KeyConcept>;

// 개념영상 길이와 장면 경계(초). films/concept-clips/kit.mjs 의 SECONDS·CHAPTERS 와 같아야 한다.
export const CONCEPT_SECONDS=15, CONCEPT_CHAPTER_SECONDS=5;
export interface Concept {title:string;summary:string;cues:[string,string,string];}
export const concepts:Record<Screen,Concept>={
 S01:{title:'한 물체, 여러 재료',summary:'이 우산은 천·금속·나무처럼 서로 다른 재료로 이루어져요.',cues:['우산 천, 살, 손잡이를 따로 살펴봐요.','천은 펼쳐지고, 살은 천을 받쳐요. 손잡이는 손으로 잡아요.','한 물체도 부분의 쓰임에 맞춰 여러 재료로 만들 수 있어요.']},
 S02:{title:'부품과 재료를 연결해',summary:'관찰한 모습과 확인 자료를 함께 써서 재료를 설명해요.',cues:['우산 부품을 벌려 하나씩 살펴봐요.','천·금속·나무를 이 우산의 관찰 기록과 연결해요.','겉모습이 비슷해도 다른 재료일 수 있어요. 확인 자료도 근거예요.']},
 S03:{title:'조건은 같게, 재료만 다르게',summary:'실험마다 재료만 바꾸고 다른 조건은 같게 해요.',cues:['같은 도구로 서로 다른 시료를 비교해요.','같은 힘으로 눌렀다 놓아 두 시료의 반응을 비교해요.','빛, 물, 힘을 비교할 때는 실험마다 같은 조건을 지켜요.']},
 S04:{title:'성질을 알면 쓰임이 보여',summary:'뒤쪽 표시가 보인 시료는 창 후보예요. 눌림·복원은 보호대 후보를 고르는 단서예요.',cues:['빛을 비춰 창 뒤쪽이 보이는지 살펴봐요.','누름판을 떼자 고무 조각이 돌아오는 모습을 봐요.','쓰임에 맞는 관찰 근거로 후보를 골라요. 실제 보호 성능은 따로 시험해야 해요.']},
 S05:{title:'용기만 바꾼 나무토막',summary:'이 나무토막은 누르거나 자르지 않고 옮겨 모양과 부피가 그대로예요.',cues:['같은 나무토막을 처음 컵에 넣어요.','넓은 용기와 길쭉한 용기로 옮겨 윤곽을 비교해요.','점선과 토막을 겹쳐 봐요. 위치는 달라져도 토막은 그대로예요.']},
 S06:{title:'물높이와 물의 양을 따로 봐요',summary:'흘리거나 더하지 않은 물은 높이와 모양이 달라져도 양은 같아요.',cues:['물은 액체예요. 처음 컵의 물높이를 표시해요.','같은 양의 물도 용기에 따라 높이와 모양이 달라져요.','흘리지 않고 처음 컵으로 돌아오니 물높이가 기준선과 같아요.']},
 S07:{title:'빈 컵에도 공기가 있어',summary:'컵 안에 공기가 남아서 물이 위쪽 휴지까지 닿지 않았어요.',cues:['마른 휴지를 컵 안쪽 위에 붙여요.','입구를 아래로 향하게 곧게 넣어요. 아래에 물이 조금 들어와요.','위쪽에 남은 공기가 공간을 차지해 휴지는 마른 채였어요.']},
 S08:{title:'공기가 나가면 물이 들어와',summary:'배출구만 열자 공기가 빠져나가고 그 자리에 물이 더 들어와요.',cues:['컵의 크기, 입구 방향, 물속 깊이를 같게 해요.','배출구에서 공기가 기포로 빠져나오는 모습을 봐요.','열린 쪽에 물이 더 들어와요. 닫힌 쪽에는 공기가 남아요.']},
 S09:{title:'증거를 조립하면 발명이 돼',summary:'몸체·창·보호대에 필요한 성질을 관찰 기록과 연결해요.',cues:['보관함의 세 부분은 맡은 일이 달라요.','비를 막을 몸체, 안이 보일 창, 닿는 곳에 붙일 보호대를 살펴봐요.','실제로 남긴 시료 기록을 근거로 재료 후보를 골라 조립해요.']},
 S10:{title:'시험하고, 고치고, 다시 시험해',summary:'고친 설계를 같은 조건의 모형 시험으로 다시 확인해요. 실제 제품의 성능은 따로 시험해야 해요.',cues:['모형에서 비·빛·모서리 시험의 결과를 봐요.','창 뒤쪽이 보이지 않으면 빛 시험 기록을 참고해 창 재료를 고쳐요.','현재 설계로 같은 조건의 세 모형 시험을 다시 확인해요.']},
};
