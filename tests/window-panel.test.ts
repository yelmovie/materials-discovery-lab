import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {windowPanelSurface} from '../src/game/window-panel';

describe('the opaque window insert fits its original outline',()=>{
 it.each(['z','x'] as const)('keeps every clipped corner when facing %s, without the raised star',axis=>{
  const contour=[[-2,-.8],[-1.8,-1],[1.8,-1],[2,-.8],[2,.8],[1.8,1],[-1.8,1],[-2,.8]];
  const positions=contour.flatMap(([x,y])=>axis==='z'?[x,y,.1]:[.1,y,-x]);
  positions.push(...(axis==='z'?[0,0,.4]:[.4,0,0])); // the decorative star must not affect the silhouette
  const mesh=new THREE.Mesh(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(positions,3)));
  mesh.scale.setScalar(.25);mesh.position.set(.1,.5,-.2);mesh.updateMatrix();
  const front=new THREE.Vector3(axis==='x'?1:0,0,axis==='z'?1:0),right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),front);
  const surface=windowPanelSurface(mesh,front),pos=surface.geometry.getAttribute('position'),point=new THREE.Vector3(),xs=[],ys=[];
  for(let i=0;i<pos.count;i++){point.fromBufferAttribute(pos,i);xs.push(point.dot(right));ys.push(point.y);expect(Math.abs(point.dot(front))).toBeLessThan(1e-7);}
  expect(Math.max(...xs)-Math.min(...xs)).toBeCloseTo(1);
  expect(Math.max(...ys)-Math.min(...ys)).toBeCloseTo(.5);
  const indices=surface.geometry.index!;let area=0;
  for(let i=0;i<indices.count;i+=3){const a=new THREE.Vector3().fromBufferAttribute(pos,indices.getX(i)),b=new THREE.Vector3().fromBufferAttribute(pos,indices.getX(i+1)),c=new THREE.Vector3().fromBufferAttribute(pos,indices.getX(i+2));area+=b.sub(a).cross(c.sub(a)).length()/2;}
  expect(area).toBeCloseTo((8-4*.2*.2/2)*.25**2);
  const reliefDepth=axis==='z'?-.2+.4*.25:.1+.4*.25;
  expect(surface.position.dot(front)).toBeGreaterThan(reliefDepth);
  expect(surface.position.dot(front)-reliefDepth).toBeLessThan(.001);
 });
});

it('uses the glass sheet contour rather than the separate latch above it',()=>{
 const sheet=new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-2,-1),new THREE.Vector2(2,-1),new THREE.Vector2(2,1),new THREE.Vector2(-2,1)]));
 const base=Array.from(sheet.getAttribute('position').array);
 base.push(-.1,1.6,.2,.1,1.6,.2,0,2,.2);
 const indices=Array.from(sheet.index!.array);indices.push(4,5,6);
 const source=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(base,3)).setIndex(indices);
 const {geometry}=windowPanelSurface(new THREE.Mesh(source),new THREE.Vector3(0,0,1));
 geometry.computeBoundingBox();expect(geometry.boundingBox!.max.y).toBeCloseTo(1);expect(geometry.boundingBox!.min.y).toBeCloseTo(-1);
 source.computeBoundingBox();expect(source.boundingBox!.max.y).toBe(2); // the original asset remains unchanged
});
