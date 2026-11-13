import {roadNodes,worldDestinations} from './worldMap';

const approaches=[roadNodes.north10,roadNodes.ne5,roadNodes.dock3,roadNodes.se5,roadNodes.sw5,roadNodes.spawn];
const lines=[
 ['반짝이는 판은 내가 챙겼어!','천으로 바꿔 끼워 볼까?'],
 ['이 천에서 물이 뚝뚝!','이쪽도 한번 꾹 짜 볼까?'],
 ['이 표지는 반대로 꽂아야지!','어느 쪽이 앞이더라?'],
 ['여기도 천으로 막아 볼까?','바람이 어디로 가지?'],
 ['부품이 하나 모자라지?','이 판은 내가 갖고 있을래!'],
 ['이 덮개는 내가 잡고 있을래!','코어 판을 옆으로 밀어 볼까?'],
];
export const mapVillainStages=worldDestinations.map((stage,i)=>({
 id:stage.id,...approaches[i],name:'재료 바꿔치기 봇',
 lines:lines[i],prop:['plate','drop','flip','vent','gear','cap'][i],
 hit:['앗, 판이 덜컹했어!','천까지 풀리잖아!'],finish:'부품을 두고 물러날게!',
}));
