import * as THREE from 'three';

/** The researcher as a standing picture: existing four-direction walk frames,
 * an optional action strip (jump, pull, cheer), and a round blob shadow. */
export type Facing='left'|'right'|'up'|'down';
export type Pose='idle'|'walk'|'jump'|'pull'|'cheer'|'flinch';
export interface RunCharacter {
 group:THREE.Group;
 /** `height` is the feet height above the ground the shadow lies on. */
 update(dt:number,pose:Pose,facing:Facing,height:number):void;
 dispose():void;
}
const HEIGHT=1.55,WALK_FPS=8;
const walkUrl=(facing:Facing,frame:number)=>`/assets/generated/walk/researcher/${facing}-${frame}.webp`;
export const ACTION_STRIP='/assets/run-stage/researcher-actions.webp';
// Six equal cells, all facing right: jump up, landing, pull, pull harder, cheer, cheer high.
const ACTION_FRAMES:Partial<Record<Pose,number[]>>={jump:[0,1],pull:[2,3],cheer:[4,5]};

export async function loadTexture(url:string){
 const texture=await new THREE.TextureLoader().loadAsync(url);
 texture.colorSpace=THREE.SRGBColorSpace;
 return texture;
}
function shadowTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
 const g=canvas.getContext('2d')!,fill=g.createRadialGradient(32,32,4,32,32,30);
 fill.addColorStop(0,'rgba(40,30,20,.5)');fill.addColorStop(1,'rgba(40,30,20,0)');
 g.fillStyle=fill;g.fillRect(0,0,64,64);
 return new THREE.CanvasTexture(canvas);
}

export async function createCharacter():Promise<RunCharacter> {
 const facings:Facing[]=['left','right','up','down'];
 const walk=Object.fromEntries(await Promise.all(facings.map(async f=>[f,await Promise.all([1,2,3,4].map(i=>loadTexture(walkUrl(f,i))))] as const))) as Record<Facing,THREE.Texture[]>;
 // The strip is art only; without it the walk frames stand in for every pose.
 const strip=await loadTexture(ACTION_STRIP).catch(()=>null);
 // Sprites ignore negative scale, so the left-facing set mirrors the texture instead.
 const cut=(i:number,mirror:boolean)=>{const t=strip!.clone();t.repeat.set(mirror?-1/6:1/6,1);t.offset.set(mirror?(i+1)/6:i/6,0);t.needsUpdate=true;return t;};
 const stripFrames=strip?Array.from({length:6},(_,i)=>cut(i,false)):[],stripMirrored=strip?Array.from({length:6},(_,i)=>cut(i,true)):[];
 // Cut-out with depth, so the researcher is hidden by things in front and hides things behind.
 const material=new THREE.SpriteMaterial({map:walk.right[0],transparent:true,alphaTest:.4});
 const sprite=new THREE.Sprite(material);sprite.center.set(.5,0);
 const walkImage=walk.right[0].image as {width:number;height:number};
 const walkAspect=walkImage.width/walkImage.height;
 const stripAspect=strip?((strip.image as {width:number;height:number}).width/6)/(strip.image as {width:number;height:number}).height:1;
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.48,20),new THREE.MeshBasicMaterial({map:shadowTexture(),transparent:true,depthWrite:false}));
 shadow.rotation.x=-Math.PI/2;shadow.renderOrder=1;
 const group=new THREE.Group();group.add(shadow,sprite);
 let clock=0;
 return {
  group,
  update(dt,pose,facing,height){
   clock+=dt;
   const actions=stripFrames.length?ACTION_FRAMES[pose]:undefined;
   let map:THREE.Texture,aspect=walkAspect,scale=HEIGHT;
   if(actions){
    const index=pose==='jump'?(height>.12?0:1):Math.floor(clock*(pose==='cheer'?4:5))%actions.length;
    map=(facing==='left'?stripMirrored:stripFrames)[actions[index]];aspect=stripAspect;scale=HEIGHT*1.1;
   }else{
    const frames=walk[pose==='pull'?'left':facing];
    map=frames[pose==='walk'?Math.floor(clock*WALK_FPS)%4:pose==='jump'?1:0];
   }
   if(material.map!==map){material.map=map;material.needsUpdate=true;}
   // Code-made squash and stretch reads as effort even with plain walk frames.
   const stretch=pose==='jump'?1.05:pose==='flinch'?.9:pose==='cheer'&&!actions?1+.05*Math.sin(clock*12):1;
   sprite.scale.set(scale*aspect/(stretch>1?stretch:1),scale*stretch,1);
   sprite.position.y=height+(pose==='cheer'&&!actions?Math.abs(Math.sin(clock*6))*.18:0);
   material.rotation=pose==='flinch'?Math.sin(clock*40)*.12:pose==='pull'&&!actions?.14:0;
   const fade=Math.max(.35,1-height*.5);
   shadow.scale.setScalar(fade);(shadow.material as THREE.MeshBasicMaterial).opacity=fade;
   shadow.position.y=.02;
  },
  dispose(){for(const list of Object.values(walk))for(const t of list)t.dispose();for(const t of [...stripFrames,...stripMirrored])t.dispose();strip?.dispose();material.dispose();shadow.geometry.dispose();(shadow.material as THREE.MeshBasicMaterial).map?.dispose();(shadow.material as THREE.Material).dispose();},
 };
}
