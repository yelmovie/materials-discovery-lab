import * as THREE from 'three';
import {runCourse,runStations,showsChange,type RunStation} from '../../domain/runStage';
import {sampleColors} from '../../domain/model';
import {loadTexture} from './character';

/** The test walkway: a floor, a long counter behind it, and one tool per
 * required sample. Shapes are plain boxes and cylinders; pictures are only
 * textures. Marks that must be exact (the star, dashed start outlines, the
 * light and the water) are drawn by code, not painted. */
export const LANE={back:-.05,front:2.3,z:1.05,counterTop:.9,counterBack:-2.6,counterFront:-.25} as const;
export const PAD={width:1.4,height:.4,depth:1.5,squash:.45} as const;
export const PULL={length:.9,stretch:.55,z:-.5} as const;
const ART='/assets/run-stage/';

export interface StationView {
 station:RunStation;
 /** True when this sample visibly reacts; decided by the existing result function. */
 reacts:boolean;
 /** 0..1 progress of the hands-on motion (squash, stretch, beam, falling drop). */
 show(k:number):void;
 /** Where the name label floats. */
 label:THREE.Vector3;
 /** Pull samples only: a cord from the ring to the researcher's hand, or none. */
 rope?:(hand:THREE.Vector3|null)=>void;
}
export interface Patrol {sprite:THREE.Sprite;frames:THREE.Texture[];mirrored:THREE.Texture[];x:number}
export interface RunScene {
 scene:THREE.Scene;colliders:THREE.Group;views:Map<string,StationView>;patrols:Patrol[];
 /** Far wall picture. `rows` is the part of the picture (top..bottom, 0..1) that should fill the view above the counter. */
 backdrop:{mesh:THREE.Mesh;height:number;rows:[number,number]}|null;guide:THREE.Vector3;zoneSigns:THREE.Vector3[];
 dispose():void;
}

function starTexture(lit:boolean,blocked=false){
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=144;
 const g=canvas.getContext('2d')!;
 g.fillStyle=lit?'#fff8cc':blocked?'#b4bdb1':'#dfe5db';g.fillRect(0,0,128,144);
 if(lit){const glow=g.createRadialGradient(64,66,6,64,66,70);glow.addColorStop(0,'rgba(255,236,150,.95)');glow.addColorStop(1,'rgba(255,236,150,0)');g.fillStyle=glow;g.fillRect(0,0,128,144);}
 g.strokeStyle='#91a69a';g.lineWidth=6;g.strokeRect(3,3,122,138);
 g.beginPath();
 for(let i=0;i<10;i++){const r=i%2?17:40,a=-Math.PI/2+i*Math.PI/5;g[i?'lineTo':'moveTo'](64+Math.cos(a)*r,66+Math.sin(a)*r);}
 g.closePath();g.fillStyle=lit?'#ce9c33':blocked?'#9aa79b':'#a5b3a6';g.globalAlpha=blocked?.45:1;g.fill();
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
function plankTexture(){
 // Stand-in floor until the painted tile loads (or if it is missing).
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const g=canvas.getContext('2d')!;g.fillStyle='#d9b27c';g.fillRect(0,0,128,128);
 g.strokeStyle='#b98f58';g.lineWidth=3;for(const y of [0,32,64,96])g.strokeRect(-4,y,136,32);
 g.strokeStyle='#c59e68';g.lineWidth=2;for(const [x,y] of [[40,0],[96,32],[24,64],[76,96]]){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+32);g.stroke();}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
function dashedBox(width:number,height:number,depth:number){
 const lines=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(width,height,depth)),new THREE.LineDashedMaterial({color:0x4d6b60,dashSize:.09,gapSize:.07}));
 lines.computeLineDistances();return lines;
}

export async function buildScene(maxAnisotropy:number):Promise<RunScene> {
 const scene=new THREE.Scene(),colliders=new THREE.Group(),views=new Map<string,StationView>(),disposables:{dispose():void}[]=[];
 scene.background=new THREE.Color(0xf3e3c3);
 scene.add(new THREE.HemisphereLight(0xfff6e0,0x8a7a5c,1.05));
 const sun=new THREE.DirectionalLight(0xffffff,1.1);sun.position.set(-3,8,6);scene.add(sun);
 const keep=<T extends {dispose():void}>(item:T)=>{disposables.push(item);return item;};
 const optional=(file:string)=>loadTexture(ART+file).then(keep,()=>null);
 const sampleIds=[...new Set(runStations.map(s=>s.sampleId))];
 const [floorArt,wallArt,cabinetArt,torchArt,pipetteArt,postArt,plantArt,jarsArt,crateArt,guideArt,patrolRight,patrolLeft,...sampleArt]=await Promise.all([
  optional('floor-tile.webp'),optional('backdrop-wall.webp'),optional('cabinet-front.webp'),optional('prop-torch.webp'),optional('prop-pipette.webp'),optional('prop-post.webp'),
  optional('decor-plant.webp'),optional('decor-jars.webp'),optional('decor-crate.webp'),loadTexture('/assets/characters/dandani.webp').then(keep,()=>null),
  loadTexture('/assets/map-encounter/map-villain-right.webp').then(keep,()=>null),loadTexture('/assets/map-encounter/map-villain-left.webp').then(keep,()=>null),
  ...sampleIds.map(id=>optional(`material-${id}.webp`)),
 ]);
 const surfaces=new Map(sampleIds.map((id,i)=>[id,sampleArt[i]]));
 const sampleMaterial=(id:string)=>{
  const clear=id==='glass_clear'||id==='plastic_clear',map=surfaces.get(id)??null;
  // Clear samples really are see-through; that is their look, not a hint drawn on top.
  return keep(new THREE.MeshLambertMaterial({color:map&&!clear?0xffffff:sampleColors[id],map,transparent:clear,opacity:clear?.5:1,depthWrite:!clear}));
 };
 const box=(w:number,h:number,d:number,material:THREE.Material)=>new THREE.Mesh(keep(new THREE.BoxGeometry(w,h,d)),material);
 const flat=(color:number,options:THREE.MeshLambertMaterialParameters={})=>keep(new THREE.MeshLambertMaterial({color,...options}));
 // A painted prop standing on the counter; `foot` is where its base sits inside the picture (0 = bottom edge).
 const prop=(map:THREE.Texture,height:number,x:number,y:number,z:number,foot=0)=>{
  const sprite=new THREE.Sprite(keep(new THREE.SpriteMaterial({map,transparent:true,alphaTest:.4}))),image=map.image as {width:number;height:number};
  sprite.center.set(.5,foot);sprite.scale.set(height*image.width/image.height,height,1);sprite.position.set(x,y,z);scene.add(sprite);return sprite;
 };
 const glow=(color:number,opacity:number)=>keep(new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide}));

 // Floor, front rail and the long counter.
 // The floor and counter run past both ends, so the camera never sees where the room stops.
 const left=runCourse.startX-2.6,right=runCourse.endX+1.6,mid=(left+right)/2,length=right-left+16;
 const floorMap=floorArt??keep(plankTexture());
 const floorImage=floorMap.image as {width:number;height:number},plank=2.4;
 floorMap.wrapS=floorMap.wrapT=THREE.RepeatWrapping;floorMap.repeat.set(length/(plank*floorImage.width/floorImage.height),9/plank);floorMap.anisotropy=Math.min(4,maxAnisotropy);
 const floor=box(length,.5,9,keep(new THREE.MeshLambertMaterial({map:floorMap})));floor.position.set(mid,-.25,1.5);scene.add(floor);
 const rail=box(length,.16,.14,flat(0x7c6a4a));rail.position.set(mid,.08,LANE.front+.1);scene.add(rail);
 const counterDepth=LANE.counterFront-LANE.counterBack;
 // Painted cabinet with a pale stone top, so the wood sample does not blend into the bench.
 const cabinet=flat(0x5f8178);let counterFront:THREE.Material=cabinet;
 if(cabinetArt){const image=cabinetArt.image as {width:number;height:number};cabinetArt.wrapS=THREE.RepeatWrapping;cabinetArt.repeat.set(length/(LANE.counterTop*image.width/image.height),1);cabinetArt.anisotropy=Math.min(4,maxAnisotropy);counterFront=keep(new THREE.MeshLambertMaterial({map:cabinetArt}));}
 const counter=new THREE.Mesh(keep(new THREE.BoxGeometry(length,LANE.counterTop,counterDepth)),[cabinet,cabinet,cabinet,cabinet,counterFront,cabinet]);counter.position.set(mid,LANE.counterTop/2,(LANE.counterFront+LANE.counterBack)/2);scene.add(counter);
 const top=box(length,.06,counterDepth+.12,flat(0xefe7d6));top.position.set(mid,LANE.counterTop+.03,(LANE.counterFront+LANE.counterBack)/2);scene.add(top);

 // Invisible walls keep feet on the walkway; nothing here needs a physics engine.
 const solid=new THREE.MeshBasicMaterial();disposables.push(solid);
 const block=(w:number,h:number,d:number,x:number,y:number,z:number)=>{const m=box(w,h,d,solid);m.position.set(x,y,z);colliders.add(m);return m;};
 block(length,1,5.6,mid,-.5,-.2);
 block(length,8,.4,mid,4,LANE.back-.2);block(length,8,.4,mid,4,LANE.front+.2);
 block(.4,8,5.6,left+.2,4,-.2);block(.4,8,5.6,right-.2,4,-.2);

 const stand=flat(0x6f7d78),dark=flat(0x4f5b57),torchBody=flat(0xe0a53a);
 for(const station of runStations){
  const reacts=showsChange(station.experiment,station.sampleId),group=new THREE.Group(),x=station.x;group.position.x=x;scene.add(group);
  const material=sampleMaterial(station.sampleId);
  let show:(k:number)=>void,label:THREE.Vector3,rope:StationView['rope'];
  if(station.action==='stomp'){
   // A pressed sample only gets lower and comes back. It never launches the researcher.
   block(PAD.width,PAD.height,PAD.depth,x,PAD.height/2,LANE.z);
   const pad=box(PAD.width,PAD.height,PAD.depth,material);pad.position.set(0,PAD.height/2,LANE.z);group.add(pad);
   const outline=dashedBox(PAD.width+.04,PAD.height,PAD.depth+.04);outline.position.copy(pad.position);group.add(outline);disposables.push(outline.geometry,outline.material as THREE.Material);
   show=k=>{const scale=1-(reacts?PAD.squash*k:0);pad.scale.y=scale;pad.position.y=PAD.height*scale/2;};
   label=new THREE.Vector3(x,PAD.height+.15,LANE.z+PAD.depth/2+.1);
  }else if(station.action==='pull'){
   const y=LANE.counterTop+.2;
   if(postArt)prop(postArt,.62,x-.86,LANE.counterTop+.04,PULL.z-.02,.04);else{const post=box(.14,.5,.3,stand);post.position.set(-.82,LANE.counterTop+.25,PULL.z);group.add(post);}
   const geometry=keep(new THREE.BoxGeometry(PULL.length,.12,.34));geometry.translate(PULL.length/2,0,0);
   const strap=new THREE.Mesh(geometry,material);strap.position.set(-.75,y,PULL.z);group.add(strap);
   const handle=new THREE.Mesh(keep(new THREE.TorusGeometry(.13,.04,8,16)),dark);handle.position.set(-.75+PULL.length+.12,y,PULL.z);group.add(handle);
   const outline=dashedBox(PULL.length,.16,.4);outline.position.set(-.75+PULL.length/2,y,PULL.z);group.add(outline);disposables.push(outline.geometry,outline.material as THREE.Material);
   show=k=>{const stretch=reacts?PULL.stretch*k:0;strap.scale.x=1+stretch/PULL.length;strap.scale.y=strap.scale.z=1-(reacts?.3*k:0);handle.position.x=-.75+PULL.length+.12+stretch+(reacts||!k?0:Math.sin(performance.now()/28)*.008);};
   const cordGeometry=keep(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()])),cord=new THREE.Line(cordGeometry,keep(new THREE.LineBasicMaterial({color:0x4f5b57})));cord.visible=false;cord.frustumCulled=false;scene.add(cord);
   rope=hand=>{cord.visible=!!hand;if(!hand)return;const at=cordGeometry.attributes.position as THREE.BufferAttribute;at.setXYZ(0,x+handle.position.x+.13,y,PULL.z);at.setXYZ(1,hand.x,hand.y,hand.z);at.needsUpdate=true;};
   label=new THREE.Vector3(x-.3,LANE.counterTop+.8,PULL.z-.3);
  }else if(station.action==='light'){
   const torchZ=-.62,plateZ=-1.35,boardZ=-2.3,beamY=LANE.counterTop+.42;
   const lens=new THREE.Mesh(keep(new THREE.CircleGeometry(.12,14)),keep(new THREE.MeshBasicMaterial({color:0x8d9a94,side:THREE.DoubleSide})));lens.position.set(0,beamY,torchZ-.23);group.add(lens);
   if(torchArt)prop(torchArt,.72,x,LANE.counterTop+.04,torchZ+.05,.03);
   else{
    const foot=box(.3,.22,.3,stand);foot.position.set(0,LANE.counterTop+.11,torchZ);group.add(foot);
    const torch=new THREE.Mesh(keep(new THREE.CylinderGeometry(.1,.13,.44,14)),torchBody);torch.rotation.x=Math.PI/2;torch.position.set(0,beamY,torchZ);group.add(torch);
   }
   const plate=box(.95,.8,.08,material);plate.position.set(0,LANE.counterTop+.4,plateZ);group.add(plate);
   const dim=keep(starTexture(false)),lit=keep(starTexture(true)),shaded=keep(starTexture(false,true));
   const boardMaterial=keep(new THREE.MeshBasicMaterial({map:dim}));
   const board=new THREE.Mesh(keep(new THREE.PlaneGeometry(1,1.12)),boardMaterial);board.position.set(0,LANE.counterTop+.62,boardZ);group.add(board);
   const cone=(from:number,to:number,r0:number,r1:number)=>{const m=new THREE.Mesh(keep(new THREE.CylinderGeometry(r1,r0,from-to,16,1,true)),glow(0xffe37a,.34));m.rotation.x=-Math.PI/2;m.position.set(0,beamY,(from+to)/2);m.visible=false;m.renderOrder=3;group.add(m);return m;};
   const near=cone(torchZ-.23,plateZ+.04,.11,.3),far=cone(plateZ-.04,boardZ+.02,.3,.46);
   const flare=new THREE.Mesh(keep(new THREE.CircleGeometry(.32,18)),glow(0xfff2b0,.55));flare.position.set(0,beamY,plateZ+.05);flare.visible=false;flare.renderOrder=3;group.add(flare);
   show=k=>{const on=k>0;near.visible=on;(lens.material as THREE.MeshBasicMaterial).color.set(on?0xfff2a0:0x8d9a94);far.visible=on&&reacts;flare.visible=on&&!reacts;boardMaterial.map=!on?dim:reacts?lit:shaded;};
   label=new THREE.Vector3(x,LANE.counterTop+1.42,boardZ);
  }else{
   const z=-1.05,slabTop=LANE.counterTop+.26,tipY=LANE.counterTop+.95;
   const slab=box(1,.2,.8,material);slab.position.set(0,LANE.counterTop+.16,z);group.add(slab);
   const holder=flat(0x4e8f86),arm=box(.08,1.5,.08,holder);arm.position.set(0,LANE.counterTop+.75,z-.62);group.add(arm);
   const reach=box(.07,.07,.62,holder);reach.position.set(0,LANE.counterTop+1.46,z-.31);group.add(reach);
   // The squeezed part: a painted pipette when the picture is there, otherwise a plain tube and bulb.
   let squeeze:(pressed:boolean)=>void;
   if(pipetteArt){const pipette=prop(pipetteArt,.62,x,tipY,z),wide=pipette.scale.x;squeeze=pressed=>{pipette.scale.x=wide*(pressed?.86:1);};}
   else{
    const tube=new THREE.Mesh(keep(new THREE.CylinderGeometry(.045,.02,.3,10)),keep(new THREE.MeshLambertMaterial({color:0xd9f1f5,transparent:true,opacity:.75})));tube.position.set(0,tipY+.15,z);group.add(tube);
    const bulb=new THREE.Mesh(keep(new THREE.SphereGeometry(.1,12,10)),flat(0xd96f6a));bulb.position.set(0,tipY+.38,z);group.add(bulb);squeeze=pressed=>{bulb.scale.y=pressed?.75:1;};
   }
   const water=keep(new THREE.MeshLambertMaterial({color:0x58b7e8,transparent:true,opacity:.85}));
   const drop=new THREE.Mesh(keep(new THREE.SphereGeometry(.07,12,10)),water);drop.visible=false;group.add(drop);
   // Soaked-in water leaves a wide dark mark; water that stays out sits as a round bead.
   const patch=new THREE.Mesh(keep(new THREE.CircleGeometry(.3,24)),keep(new THREE.MeshBasicMaterial({color:0x4d3520,transparent:true,opacity:.5,depthWrite:false})));patch.rotation.x=-Math.PI/2;patch.position.set(0,slabTop+.005,z);patch.visible=false;group.add(patch);
   const bead=new THREE.Mesh(keep(new THREE.SphereGeometry(.11,14,10)),water);bead.scale.y=.55;bead.position.set(0,slabTop+.05,z);bead.visible=false;group.add(bead);
   show=k=>{
    const falling=k>0&&k<.45,landed=k>=.45,settle=Math.min(1,(k-.45)/.55);
    drop.visible=falling;if(falling)drop.position.set(0,tipY-(tipY-slabTop)*(k/.45)**2,z);
    squeeze(falling&&k<.15);
    patch.visible=landed&&reacts;if(patch.visible){patch.scale.setScalar(.25+.75*settle);(patch.material as THREE.MeshBasicMaterial).opacity=.2+.34*settle;}
    bead.visible=landed&&(!reacts||settle<.5);if(bead.visible)bead.scale.set(reacts?1+settle:1,reacts?.55*(1-settle*2):.55,reacts?1+settle:1);
   };
   label=new THREE.Vector3(x,LANE.counterTop+1.75,z);
  }
  show(0);views.set(station.id,{station,reacts,show,label,rope});
 }

 // Far wall: the painted lab wall, mirrored side by side so it has no seam. Without it, the property-lab painting stands in.
 let backdrop:RunScene['backdrop']=null;
 const wall=wallArt??await loadTexture('/assets/backgrounds/stage-2.webp').then(keep,()=>null);
 if(wall){
  // The stand-in painting is not made to be mirrored, so it is shown once, larger.
  const image=wall.image as {width:number;height:number},height=9,tile=height*image.width/image.height,tiles=wallArt?6:1;
  if(wallArt){wall.wrapS=THREE.MirroredRepeatWrapping;wall.repeat.set(tiles,1);}
  const mesh=new THREE.Mesh(keep(new THREE.PlaneGeometry(tile*tiles,height)),keep(new THREE.MeshBasicMaterial({map:wall,depthWrite:false})));
  mesh.position.set(mid,0,-9);mesh.renderOrder=-1;scene.add(mesh);
  backdrop={mesh,height,rows:wallArt?[.19,.775]:[.2,.47]};
 }
 // Small painted things along the empty stretches of the counter.
 const decor=[plantArt,jarsArt,crateArt].filter((map):map is THREE.Texture=>!!map);
 if(decor.length){
  const spots=[-1.6,1.3,4.1,6.6,13.75,21.4,runCourse.endX+1.2];
  spots.forEach((x,i)=>prop(decor[i%decor.length],.78,x,LANE.counterTop+.05,-1.75-(i%2)*.25,.04));
 }
 // The lab keeper waits behind the counter at the far end.
 const guide=new THREE.Vector3(runCourse.endX-.3,LANE.counterTop-.2,-1.5);
 if(guideArt){const sprite=new THREE.Sprite(keep(new THREE.SpriteMaterial({map:guideArt,transparent:true,alphaTest:.4})));const image=guideArt.image as {width:number;height:number};sprite.center.set(.5,0);sprite.scale.set(1.3*image.width/image.height,1.3,1);sprite.position.copy(guide);scene.add(sprite);}

 const patrols:Patrol[]=[];
 if(patrolRight&&patrolLeft)for(const x of runCourse.patrols){
  const cut=(texture:THREE.Texture)=>Array.from({length:6},(_,i)=>{const t=keep(texture.clone());t.repeat.set(1/6,1);t.offset.set(i/6,0);t.needsUpdate=true;return t;});
  const frames=cut(patrolRight),mirrored=cut(patrolLeft);
  const sprite=new THREE.Sprite(keep(new THREE.SpriteMaterial({map:frames[0],transparent:true,alphaTest:.4})));sprite.center.set(.5,.06);sprite.scale.set(1.05,1.05,1);sprite.position.set(x,0,LANE.z);scene.add(sprite);
  patrols.push({sprite,frames,mirrored,x});
 }
 const zoneSigns=[...new Set(runStations.map(s=>s.zone))].map(zone=>{const list=runStations.filter(s=>s.zone===zone);return new THREE.Vector3((list[0].x+list.at(-1)!.x)/2,3.15,-1.6);});
 return {scene,colliders,views,patrols,backdrop,guide,zoneSigns,dispose(){for(const item of disposables)item.dispose();}};
}
