import {assistMapStep} from '../map-controls.js';
export const MAP_WIDTH = 1536;
export const MAP_HEIGHT = 1024;
export type MapDirection = 'up' | 'down' | 'left' | 'right';
export interface MapPoint {x:number;y:number}
// All coordinates use the original map image. Labels and walking share this contract.
// x,y is the doorstep the researcher stands on; labelX,labelY is the building's sign.
export const worldDestinations = [
 {id:'materials',x:428,y:238,labelX:410,labelY:128,name:'재료 감정실',node:'materials'},
 {id:'properties',x:1058,y:243,labelX:1100,labelY:150,name:'성질 시험실',node:'properties'},
 {id:'states',x:1228,y:548,labelX:1235,labelY:420,name:'상태 실험실',node:'states'},
 {id:'air',x:1072,y:884,labelX:1095,labelY:755,name:'공기 추적실',node:'air'},
 {id:'invention',x:388,y:764,labelX:390,labelY:655,name:'발명 제작소',node:'invention'},
 {id:'core',x:768,y:544,labelX:768,labelY:318,name:'중앙 코어',node:'core'},
] as const;
// Centerlines traced from the paved roads painted in workshop-island.webp.
export const roadNodes:Record<string,MapPoint> = {
 spawn:{x:768,y:596},core:{x:768,y:544},
 ringWest1:{x:700,y:583},ringWest2:{x:645,y:569},ringWest3:{x:600,y:545},westFork:{x:572,y:506},
 north1:{x:583,y:489},north2:{x:600,y:460},north3:{x:629,y:418},north4:{x:648,y:395},north5:{x:646,y:364},
 north6:{x:625,y:339},north7:{x:583,y:320},north8:{x:533,y:297},north9:{x:483,y:272},north10:{x:446,y:246},materials:{x:428,y:238},
 westBridge1:{x:508,y:506},westBridge2:{x:446,y:506},westBridge3:{x:387,y:514},westEnd:{x:356,y:526},
 ringEast1:{x:820,y:580},ringEast2:{x:874,y:563},ringEast3:{x:903,y:544},ringEast4:{x:926,y:515},ringEast5:{x:932,y:482},eastFork:{x:936,y:468},
 arc1:{x:895,y:435},neFork:{x:858,y:402},ne1:{x:890,y:368},ne2:{x:915,y:343},ne3:{x:965,y:314},ne4:{x:1002,y:289},ne5:{x:1032,y:260},properties:{x:1058,y:243},
 eastRoad:{x:973,y:479},eastBridge1:{x:1007,y:478},eastBridge2:{x:1097,y:478},dock1:{x:1128,y:505},dock2:{x:1150,y:535},dock3:{x:1190,y:546},states:{x:1228,y:548},
 south1:{x:766,y:619},south2:{x:741,y:640},south3:{x:707,y:661},south4:{x:675,y:680},south5:{x:654,y:706},southFork:{x:646,y:739},
 sw1:{x:629,y:768},sw2:{x:592,y:789},sw3:{x:529,y:802},sw4:{x:467,y:793},sw5:{x:417,y:781},invention:{x:388,y:764},
 southBridge1:{x:662,y:785},southBridge2:{x:717,y:797},southBridge3:{x:771,y:812},se1:{x:832,y:843},se2:{x:882,y:868},se3:{x:948,y:885},se4:{x:998,y:897},se5:{x:1048,y:897},air:{x:1072,y:884},
};
const chain=(...ids:string[])=>ids.slice(1).map((id,i)=>[ids[i],id] as const);
export const roadEdges:readonly (readonly [string,string])[] = [
 ['spawn','core'],
 ...chain('spawn','ringWest1','ringWest2','ringWest3','westFork','north1','north2','north3','north4','north5','north6','north7','north8','north9','north10','materials'),
 ...chain('westFork','westBridge1','westBridge2','westBridge3','westEnd'),
 ...chain('spawn','ringEast1','ringEast2','ringEast3','ringEast4','ringEast5','eastFork','arc1','neFork','ne1','ne2','ne3','ne4','ne5','properties'),
 ...chain('eastFork','eastRoad','eastBridge1','eastBridge2','dock1','dock2','dock3','states'),
 ...chain('spawn','south1','south2','south3','south4','south5','southFork','sw1','sw2','sw3','sw4','sw5','invention'),
 ...chain('southFork','southBridge1','southBridge2','southBridge3','se1','se2','se3','se4','se5','air'),
];
// Warm lights that switch on with each restored workshop; stage 5 is the central crystal.
export const worldLights = [
 {stage:0,x:479,y:177,r:46},{stage:0,x:587,y:308,r:40},{stage:0,x:621,y:427,r:40},{stage:0,x:424,y:150,r:74},
 {stage:1,x:994,y:177,r:44},{stage:1,x:1192,y:206,r:44},{stage:1,x:1030,y:185,r:34},{stage:1,x:1105,y:197,r:34},{stage:1,x:1142,y:120,r:82},
 {stage:2,x:1172,y:475,r:50},{stage:2,x:1306,y:504,r:50},{stage:2,x:1139,y:512,r:34},{stage:2,x:1114,y:454,r:34},{stage:2,x:1231,y:444,r:62},
 {stage:3,x:969,y:818,r:42},{stage:3,x:1182,y:818,r:42},{stage:3,x:869,y:754,r:36},{stage:3,x:1084,y:779,r:62},
 {stage:4,x:335,y:720,r:40},{stage:4,x:442,y:710,r:40},{stage:4,x:556,y:660,r:34},{stage:4,x:592,y:743,r:34},{stage:4,x:583,y:689,r:42},{stage:4,x:390,y:650,r:64},
 {stage:5,x:768,y:400,r:150},
] as const;
export const ROAD_HALF_WIDTH = 18;
const DOOR_RADIUS = 28;
export interface RoadProjection extends MapPoint {edge:number;gap:number}
export function projectRoad(point:MapPoint):RoadProjection{
 let best:RoadProjection={x:point.x,y:point.y,edge:-1,gap:Infinity};
 roadEdges.forEach(([from,to],edge)=>{
  const a=roadNodes[from],b=roadNodes[to],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/(dx*dx+dy*dy))),x=a.x+dx*t,y=a.y+dy*t,gap=Math.hypot(point.x-x,point.y-y);
  if(gap<best.gap)best={x,y,edge,gap};
 });
 return best;
}
/** One held-movement step: pushing against a road's edge slides along it instead of leaving it. */
export function walkRoad(start:MapPoint,direction:MapPoint,step:number):MapPoint{
 const length=Math.hypot(direction.x,direction.y)||1;
 return assistMapStep(start,{x:direction.x/length*step,y:direction.y/length*step},p=>projectRoad(p).gap<=ROAD_HALF_WIDTH);
}
export function roadRoute(start:string,end:string):string[]{
 const costs:Record<string,number>={[start]:0},previous:Record<string,string>={},pending=new Set(Object.keys(roadNodes));
 while(pending.size){const current=[...pending].sort((a,b)=>(costs[a]??Infinity)-(costs[b]??Infinity))[0];if(!Number.isFinite(costs[current]))break;pending.delete(current);if(current===end)break;
  for(const edge of roadEdges){const next=edge[0]===current?edge[1]:edge[1]===current?edge[0]:null;if(!next||!pending.has(next))continue;const a=roadNodes[current],b=roadNodes[next],cost=costs[current]+Math.hypot(a.x-b.x,a.y-b.y);if(cost<(costs[next]??Infinity)){costs[next]=cost;previous[next]=current;}}
 }
 if(start===end)return [];
 if(!previous[end])return [];
 const route=[end];while(route[0]!==start)route.unshift(previous[route[0]]);return route.slice(1);
}
export function pathLength(points:readonly MapPoint[]):number{
 return points.slice(1).reduce((total,point,i)=>total+Math.hypot(point.x-points[i].x,point.y-points[i].y),0);
}
export function pointAlong(points:readonly MapPoint[],distance:number):MapPoint{
 let left=Math.max(0,distance);
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],length=Math.hypot(b.x-a.x,b.y-a.y);
  if(left<=length&&length>0)return {x:a.x+(b.x-a.x)*left/length,y:a.y+(b.y-a.y)*left/length};
  left-=length;
 }
 const last=points[points.length-1];return {x:last.x,y:last.y};
}
/** Road route between two free positions: join the road, follow it, end on the road point nearest the goal. */
export function routeBetween(from:MapPoint,to:MapPoint):MapPoint[]{
 const start=projectRoad(from),end=projectRoad(to),goal={x:end.x,y:end.y},join={x:start.x,y:start.y};
 if(start.edge===end.edge)return [join,goal];
 let best:MapPoint[]=[],cost=Infinity;
 for(const first of roadEdges[start.edge])for(const last of roadEdges[end.edge]){
  const nodes=[first,...roadRoute(first,last)].map(id=>roadNodes[id]),line=[join,...nodes,goal],length=pathLength(line);
  if((first===last||nodes.length>1)&&length<cost){cost=length;best=line;}
 }
 return best;
}
export function doorAt(point:MapPoint):number{
 return worldDestinations.findIndex(door=>Math.hypot(door.x-point.x,door.y-point.y)<=DOOR_RADIUS);
}
