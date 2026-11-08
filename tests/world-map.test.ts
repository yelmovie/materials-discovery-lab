import {describe,expect,it} from 'vitest';
import {doorAt,pathLength,pointAlong,projectRoad,roadEdges,roadNodes,ROAD_HALF_WIDTH,routeBetween,walkRoad,worldDestinations} from '../src/domain/worldMap';

const onRoad=(p:{x:number;y:number})=>projectRoad(p).gap<=ROAD_HALF_WIDTH+.001;

describe('world map walking',()=>{
 it('connects every door to the spawn plaza along the road network',()=>{
  for(const door of worldDestinations){
   const route=routeBetween(roadNodes.spawn,door);
   expect(route.length).toBeGreaterThan(0);
   expect(route.at(-1)).toEqual({x:door.x,y:door.y});
   for(const point of route)expect(onRoad(point)).toBe(true);
  }
 });
 it('uses only known road nodes in its edges',()=>{
  for(const [a,b] of roadEdges){expect(roadNodes[a]).toBeTruthy();expect(roadNodes[b]).toBeTruthy();}
 });
 it('starts a route from a free position inside the road, not from the nearest node',()=>{
  const from=walkRoad(roadNodes.spawn,{x:1,y:0},30),route=routeBetween(from,worldDestinations[0]);
  expect(Math.hypot(route[0].x-from.x,route[0].y-from.y)).toBeLessThan(ROAD_HALF_WIDTH+1);
 });
 it('keeps held movement inside the road corridor and slides along it',()=>{
  let point={...roadNodes.spawn};
  for(let i=0;i<600;i++){point=walkRoad(point,{x:.7071,y:-.7071},4);expect(onRoad(point)).toBe(true);}
  expect(point.x).toBeGreaterThan(roadNodes.spawn.x+40);
 });
 it('never leaves the road when pushed straight off a dead end',()=>{
  let point:{x:number;y:number}={x:worldDestinations[0].x,y:worldDestinations[0].y};
  for(let i=0;i<200;i++)point=walkRoad(point,{x:-1,y:0},5);
  expect(onRoad(point)).toBe(true);
 });
 it('reports the door only when standing at it',()=>{
  worldDestinations.forEach((door,i)=>expect(doorAt(door)).toBe(i));
  expect(doorAt(roadNodes.spawn)).toBe(-1);
 });
 it('does not pass through another door on the way across the plaza',()=>{
  const route=routeBetween(worldDestinations[0],worldDestinations[2]),line=[worldDestinations[0],...route],total=pathLength(line);
  for(let d=40;d<total-40;d+=10)expect([-1,0,2]).toContain(doorAt(pointAlong(line,d)));
 });
 it('measures and samples a path',()=>{
  const line=[{x:0,y:0},{x:10,y:0},{x:10,y:10}];
  expect(pathLength(line)).toBe(20);
  expect(pointAlong(line,15)).toEqual({x:10,y:5});
  expect(pointAlong(line,99)).toEqual({x:10,y:10});
 });
});
