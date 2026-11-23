import * as THREE from 'three';

/** Fill the existing window's outline in its own parent space, including its clipped corners.
 * A fixed fraction of its bounding box leaves gaps at the frame. Projecting the original
 * silhouette also removes the decorative star relief from an opaque replacement. */
export function windowPanelSurface(mesh:THREE.Mesh,front:THREE.Vector3){
 mesh.updateMatrix();
 const up=new THREE.Vector3(0,1,0),right=new THREE.Vector3().crossVectors(up,front).normalize();
 const positions=mesh.geometry.getAttribute('position'),point=new THREE.Vector3(),points:THREE.Vector2[]=[];
 let depth=-Infinity;
 for(let i=0;i<positions.count;i++){
  point.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrix);
  points.push(new THREE.Vector2(point.dot(right),point.y));depth=Math.max(depth,point.dot(front));
 }
 const parent=Array.from({length:points.length},(_,i)=>i);
 const find=(i:number):number=>parent[i]===i?i:parent[i]=find(parent[i]);
 const join=(a:number,b:number)=>{parent[find(a)]=find(b);};
 const indices=mesh.geometry.index;
 let face=points;
 if(indices){
  // The GLB's window node also contains the star and small latch fragments.
  // Keep the largest connected sheet; including the latch makes a false peak above the frame.
  const weld=new Map<string,number>();
  for(let i=0;i<positions.count;i++){
   point.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrix);
   const key=point.toArray().map(n=>n.toFixed(6)).join();
   const earlier=weld.get(key);if(earlier===undefined)weld.set(key,i);else join(i,earlier);
  }
  for(let i=0;i<indices.count;i+=3){join(indices.getX(i),indices.getX(i+1));join(indices.getX(i),indices.getX(i+2));}
  const groups=new Map<number,THREE.Vector2[]>();
  points.forEach((p,i)=>{const root=find(i),group=groups.get(root)??[];group.push(p);groups.set(root,group);});
  const area=(group:THREE.Vector2[])=>{const box=new THREE.Box2().setFromPoints(group),size=box.getSize(new THREE.Vector2());return size.x*size.y;};
  face=[...groups.values()].sort((a,b)=>area(b)-area(a))[0];
 }
 face.sort((a,b)=>a.x-b.x||a.y-b.y);
 const unique=face.filter((p,i)=>!i||p.distanceToSquared(face[i-1])>1e-14);
 const cross=(a:THREE.Vector2,b:THREE.Vector2,c:THREE.Vector2)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
 const half=(list:THREE.Vector2[])=>{const out:THREE.Vector2[]=[];for(const p of list){while(out.length>1&&cross(out[out.length-2],out[out.length-1],p)<=0)out.pop();out.push(p);}return out.slice(0,-1);};
 const outline=[...half(unique),...half([...unique].reverse())];
 const geometry=new THREE.ShapeGeometry(new THREE.Shape(outline));
 const basis=new THREE.Matrix4().makeBasis(right,up,front);
 geometry.applyMatrix4(basis);
 // Stay just in front of the original relief without changing the silhouette.
 geometry.computeBoundingSphere();
 const epsilon=Math.max(1e-5,geometry.boundingSphere!.radius*.0002);
 const position=front.clone().multiplyScalar(depth+epsilon);
 const center=new THREE.Box3().setFromBufferAttribute(geometry.getAttribute('position') as THREE.BufferAttribute).getCenter(new THREE.Vector3()).add(position);
 return {geometry,position,center};
}
