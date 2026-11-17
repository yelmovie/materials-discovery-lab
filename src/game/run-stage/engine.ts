import * as THREE from 'three';
import {Octree} from 'three/addons/math/Octree.js';
import {Capsule} from 'three/addons/math/Capsule.js';
import {runCourse,runStations,checkpointFor,type RunStation} from '../../domain/runStage';
import {buildScene,LANE,PAD,PULL,type StationView} from './scene';
import {createCharacter,type Facing,type Pose} from './character';
import {createRunInput} from './input';

/** Walking, jumping and collision follow the three.js `games_fps` example:
 * a capsule against an octree, five sub-steps per frame, floor = normal.y > 0.15.
 * Only movement is simulated. What a sample shows is fixed by `showsChange`
 * (the existing result function), never by the collision maths. */
const GRAVITY=26,JUMP=8.4,ACCEL=40,AIR_ACCEL=12,DRAG=7.5,MAX_SPEED=ACCEL/DRAG,STEPS=5,RADIUS=.33,BODY=1.15;
const REACH=1.05,HOLD_SECONDS=.9,STOMP_SECONDS=.35;

export type RunHint='hold-longer'|'bump'|'step-off'|'respawn';
export interface RunStatus {near:string|null;canAct:boolean;onPad:boolean;busy:boolean}
export interface RunCallbacks {
 /** The hands-on motion is over and the sample waits for a description. */
 onTested(stationId:string):void;
 onStatus(status:RunStatus):void;
 onHint(hint:RunHint):void;
 /** The drawing context was lost; the caller switches to the classic screen. */
 onLost():void;
}
export interface RunStage {
 setPaused(paused:boolean):void;
 /** Recorded samples keep showing their result. */
 setRecorded(ids:string[]):void;
 /** Puts a sample back to "not tested yet" after a wrong description. */
 resetStation(id:string):void;
 celebrate():void;
 debug():{x:number;y:number;z:number;onFloor:boolean;near:string|null;fps:number;triangles:number};
 dispose():void;
}
type Phase='idle'|'acting'|'settling'|'shown';
interface Live {view:StationView;station:RunStation;phase:Phase;t:number;k:number;recorded:boolean;done:boolean}

export function webglAvailable(){
 try{const canvas=document.createElement('canvas');return !!(window.WebGLRenderingContext&&(canvas.getContext('webgl2')||canvas.getContext('webgl')));}catch{return false;}
}

export async function createRunStage(root:HTMLElement,canvas:HTMLCanvasElement,labels:Map<string,HTMLElement>,callbacks:RunCallbacks):Promise<RunStage> {
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'default'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
 let disposed=false,paused=false,frame=0,last=performance.now(),fps=60;
 const world=await buildScene(renderer.capabilities.getMaxAnisotropy()).catch(error=>{renderer.dispose();throw error;});
 const character=await createCharacter().catch(error=>{world.dispose();renderer.dispose();throw error;});
 const {scene}=world;scene.add(character.group);
 const octree=new Octree();octree.fromGraphNode(world.colliders);
 const camera=new THREE.PerspectiveCamera(36,1,.1,80);
 const start=new THREE.Vector3(runCourse.startX,0,LANE.z);
 const body=new Capsule(new THREE.Vector3(start.x,RADIUS,start.z),new THREE.Vector3(start.x,BODY,start.z),RADIUS);
 const velocity=new THREE.Vector3(),step=new THREE.Vector3();
 let onFloor=true,sinceFloor=0,facing:Facing='right',pose:Pose='idle',flinch=0,safe=0,cheer=0,padUnder:Live|null=null,padTime=0,active:Live|null=null,status:RunStatus={near:null,canAct:false,onPad:false,busy:false};
 const live=runStations.map(station=>({view:world.views.get(station.id)!,station,phase:'idle' as Phase,t:0,k:0,recorded:false,done:false}));
 const byId=new Map(live.map(item=>[item.station.id,item]));
 const patrols=world.patrols.map((patrol,i)=>({...patrol,z:LANE.z as number,direction:i%2?1:-1,rest:0,bumps:0,clock:i*.4}));
 const blocked=()=>paused||disposed||document.hidden||!!document.querySelector('dialog[open]');
 const input=createRunInput(root,{blocked,actionAvailable:()=>status.canAct});

 const feet=()=>body.start.y-RADIUS,grounded=()=>sinceFloor<.09;
 function place(x:number,y:number,z:number){body.start.set(x,y+RADIUS,z);body.end.set(x,y+BODY,z);}
 function respawn(){const x=checkpointFor(body.start.x);place(x,0,LANE.z);velocity.set(0,0,0);callbacks.onHint('respawn');}
 function collide(){
  const hit=octree.capsuleIntersect(body);onFloor=false;
  if(!hit)return;
  onFloor=hit.normal.y>.15;
  if(!onFloor)velocity.addScaledVector(hit.normal,-hit.normal.dot(velocity));
  // A small steady push keeps the feet in contact, so standing does not flicker into falling.
  else if(velocity.y<=0)velocity.y=-1.5;
  if(hit.depth>=1e-10)body.translate(hit.normal.multiplyScalar(hit.depth));
  // Ledge help: a jump that reaches a sample's side with the feet off the ground steps up onto it.
  if(!onFloor&&feet()>.12&&feet()<PAD.height+.02)for(const item of live){
   if(item.station.action!=='stomp')continue;
   const dx=item.station.x-body.start.x,dz=LANE.z-body.start.z;
   if(Math.abs(dx)<PAD.width/2+RADIUS+.06&&Math.abs(dz)<PAD.depth/2+RADIUS+.06){body.translate(step.set(Math.sign(dx)*.1,PAD.height+.03-feet(),0));if(velocity.y<0)velocity.y=0;break;}
  }
 }
 function simulate(dt:number){
  const moveX=active?0:input.moveX,moveZ=active?0:input.moveZ,length=Math.hypot(moveX,moveZ)||1,push=(onFloor?ACCEL:AIR_ACCEL)*dt;
  if(flinch<=0){velocity.x+=moveX/length*push;velocity.z+=moveZ/length*push;}
  // Unlike the example, the air slows the run-up as much as the floor does: jumps stay short,
  // so a child holding "right" lands on the sample instead of flying over it.
  const drag=Math.exp(-DRAG*dt)-1;velocity.x+=velocity.x*drag;velocity.z+=velocity.z*drag;
  const speed=Math.hypot(velocity.x,velocity.z);if(speed>MAX_SPEED&&flinch<=0){velocity.x*=MAX_SPEED/speed;velocity.z*=MAX_SPEED/speed;}
  if(!onFloor)velocity.y-=GRAVITY*dt;
  body.translate(step.copy(velocity).multiplyScalar(dt));
  collide();
  sinceFloor=onFloor?0:sinceFloor+dt;
  if(body.start.y<-6)respawn();
 }

 function setShown(item:Live){item.view.show(item.recorded&&(item.station.action==='light'||item.station.action==='drop')?1:0);}
 function finishTest(item:Live){
  input.releaseAssist();active=null;
  if(item.recorded){item.phase='idle';setShown(item);return;}
  item.phase='shown';callbacks.onTested(item.station.id);
 }
 function nearestBench(){
  let best:Live|null=null,gap=REACH;
  for(const item of live){if(item.station.action==='stomp')continue;const d=Math.abs(item.station.x-body.start.x);if(d<gap){gap=d;best=item;}}
  return best;
 }
 function updateStations(dt:number){
  // Pads: stand on the sample, then step off and look at its shape.
  let under:Live|null=null;
  const over=(item:Live)=>Math.abs(item.station.x-body.start.x)<PAD.width/2+.2&&Math.abs(LANE.z-body.start.z)<PAD.depth/2+.2;
  if(grounded()&&Math.abs(feet()-PAD.height)<.1)for(const item of live)if(item.station.action==='stomp'&&over(item))under=item;
  if(under!==padUnder){padUnder=under;padTime=0;}
  for(const item of live){
   if(item.station.action!=='stomp')continue;
   const pressed=padUnder===item;
   if(pressed){padTime+=dt;item.k=Math.min(1,item.k+dt*5);if(item.phase==='idle'&&padTime>=STOMP_SECONDS)item.phase='acting';if(item.phase==='acting'&&padTime>2.2&&padTime-dt<=2.2)callbacks.onHint('step-off');}
   // A hop straight up is still "on" the sample; it recovers once the researcher has stepped off.
   else if(grounded()||!over(item)){item.k=Math.max(0,item.k-dt*2.6);if(item.phase==='acting'&&item.k===0)finishTest(item);}
   item.view.show(item.k);
  }
  const near=nearestBench();
  if(!active&&near&&grounded()&&flinch<=0&&(near.phase==='idle'||near.phase==='shown')&&input.consumeAction()){
   active=near;near.phase='acting';near.t=0;near.k=0;velocity.set(0,0,0);facing=near.station.action==='pull'?'left':'up';
  }else input.consumeAction();
  if(active){
   const item=active,action=item.station.action;item.t+=dt;
   if(action==='pull'){
    if(item.phase==='acting'){
     if(input.actionHeld){item.k=Math.min(1,item.k+dt/HOLD_SECONDS);if(item.k===1){item.done=true;item.phase='settling';item.t=0;}}
     else{item.done=false;item.phase='settling';item.t=0;callbacks.onHint('hold-longer');}
    }else{
     // Let go: a stretched sample returns to its dashed outline.
     item.k=Math.max(0,item.k-dt*3.2);
     if(item.k===0&&item.t>.45){if(item.done)finishTest(item);else{item.phase='idle';active=null;input.releaseAssist();setShown(item);}}
    }
    const k=item.k,hand=item.station.x-.75+PULL.length+.55+(item.view.reacts?PULL.stretch*k:0);
    item.view.show(k);
    // While pulling, the researcher holds the ring and moves with it.
    const holding=item.phase==='acting';
    if(holding){const x=body.start.x+(hand-body.start.x)*Math.min(1,dt*14),z=body.start.z+(LANE.back+RADIUS+.05-body.start.z)*Math.min(1,dt*14);place(x,0,z);}
    item.view.rope?.(holding?step.set(body.start.x-.28,.82,body.start.z):null);
   }else{
    const seconds=action==='light'?.9:1.25;item.k=Math.min(1,item.t/seconds);item.view.show(item.k);
    // Step to the side so the researcher does not stand in front of the sample being watched.
    const beside=item.station.x-.85;place(body.start.x+(beside-body.start.x)*Math.min(1,dt*10),0,body.start.z);
    if(item.k===1)finishTest(item);
   }
  }
  const canAct=!active&&!!near&&grounded()&&(near.phase==='idle'||near.phase==='shown');
  const padNear=live.find(item=>item.station.action==='stomp'&&Math.abs(item.station.x-body.start.x)<PAD.width/2+.9);
  const next:RunStatus={near:(near??padNear)?.station.id??null,canAct,onPad:!!padUnder,busy:!!active};
  if(next.near!==status.near||next.canAct!==status.canAct||next.onPad!==status.onPad||next.busy!==status.busy){status=next;callbacks.onStatus(next);}
 }
 function updatePatrols(dt:number){
  for(const patrol of patrols){
   patrol.clock+=dt;
   if(patrol.rest>0)patrol.rest-=dt;
   else{patrol.z+=patrol.direction*1.15*dt;if(patrol.z>LANE.front-.45){patrol.z=LANE.front-.45;patrol.direction=-1;patrol.rest=.5;}if(patrol.z<LANE.back+.4){patrol.z=LANE.back+.4;patrol.direction=1;patrol.rest=patrol.bumps>=3?6:.9;if(patrol.bumps>=3)patrol.bumps=0;}}
   patrol.sprite.position.set(patrol.x,0,patrol.z);
   const material=patrol.sprite.material,map=(patrol.direction>0?patrol.frames:patrol.mirrored)[patrol.rest>0?0:Math.floor(patrol.clock*6)%4];
   if(material.map!==map){material.map=map;material.needsUpdate=true;}
   // Touching the patroller only makes the researcher flinch; nothing is lost.
   if(safe<=0&&!active&&feet()<.7&&Math.abs(patrol.x-body.start.x)<.6&&Math.abs(patrol.z-body.start.z)<.55){
    flinch=.45;safe=1.6;patrol.bumps++;velocity.set(body.start.x<patrol.x?-5.5:5.5,0,0);callbacks.onHint('bump');
   }
  }
 }
 const looking=new THREE.Vector3(),projected=new THREE.Vector3(),anchor=new THREE.Vector3();
 function updateCamera(){
  const aspect=camera.aspect,half=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
  // Keep about nine units of walkway in view on narrow screens.
  // Very wide, short screens move in so the researcher and samples stay large enough to read.
  const wide=Math.max(1,aspect/2.4),distance=Math.max(10.4/Math.min(wide,1.45),9/(2*half*aspect)),x=THREE.MathUtils.clamp(body.start.x+.6,runCourse.startX+1.5,runCourse.endX-1.5);
  looking.set(x,1.05-(Math.min(wide,1.45)-1)*.35,-.1);camera.position.set(x,looking.y+distance*.44,looking.z+distance*.9);camera.lookAt(looking);
  if(world.backdrop){
   // Size the far wall so the chosen band of the picture runs from the top of the view down to the counter's back edge.
   const {mesh,height,rows}=world.backdrop,depth=mesh.position.z;
   camera.updateMatrixWorld();
   const top=anchor.set(0,1,.5).unproject(camera).sub(camera.position),topY=camera.position.y+top.y*(depth-camera.position.z)/top.z;
   const edgeZ=LANE.counterBack,edgeY=LANE.counterTop,lowY=camera.position.y+(edgeY-camera.position.y)*(depth-camera.position.z)/(edgeZ-camera.position.z);
   const shown=Math.max(1,topY-lowY)/(rows[1]-rows[0]),scale=shown/height;
   mesh.scale.setScalar(scale);mesh.position.set(x*.8+runCourse.endX*.1,topY-shown*(.5-rows[0]),depth);
  }
 }
 function placeLabel(element:HTMLElement|undefined,at:THREE.Vector3){
  if(!element)return;
  projected.copy(at).project(camera);
  // Labels leave before they would be cut by the edge of the scene.
  const visible=projected.z<1&&Math.abs(projected.x)<.9&&Math.abs(projected.y)<1;
  element.style.visibility=visible?'visible':'hidden';
  if(visible)element.style.transform=`translate(${((projected.x+1)/2*canvas.clientWidth).toFixed(1)}px,${((1-projected.y)/2*canvas.clientHeight).toFixed(1)}px) translate(-50%,-100%)`;
 }
 function resize(){
  const width=canvas.clientWidth,height=canvas.clientHeight;if(!width||!height)return;
  renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
 }
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();

 function tick(now:number){
  if(disposed)return;
  frame=requestAnimationFrame(tick);
  const dt=Math.min(.05,(now-last)/1000);last=now;if(dt>0)fps+=(1/dt-fps)*.05;
  if(!document.hidden){
   if(!paused){
    flinch=Math.max(0,flinch-dt);safe=Math.max(0,safe-dt);cheer=Math.max(0,cheer-dt);
    if(!active&&grounded()&&flinch<=0&&velocity.y<=0&&input.consumeJump()){velocity.y=JUMP;onFloor=false;sinceFloor=1;}else input.consumeJump();
    for(let i=0;i<STEPS;i++)simulate(dt/STEPS);
    updateStations(dt);updatePatrols(dt);
    const moving=Math.hypot(velocity.x,velocity.z)>.6;
    if(!active&&moving)facing=Math.abs(velocity.x)>=Math.abs(velocity.z)?(velocity.x>0?'right':'left'):(velocity.z>0?'down':'up');
    pose=flinch>0?'flinch':active?.station.action==='pull'&&active.phase==='acting'?'pull':cheer>0?'cheer':!grounded()?'jump':moving&&!active?'walk':'idle';
   }
   // A squashed sample carries the researcher down with it, and back up.
   // The shadow lies on whatever is below: the floor, or the sample under a jump.
   const below=padUnder??live.find(item=>item.station.action==='stomp'&&Math.abs(item.station.x-body.start.x)<PAD.width/2&&Math.abs(LANE.z-body.start.z)<PAD.depth/2&&feet()>=PAD.height-.05)??null;
   const sink=below?.view.reacts?PAD.height*PAD.squash*below.k:0,ground=below?PAD.height-sink:0;
   character.group.position.set(body.start.x,ground,body.start.z);
   character.update(paused?0:dt,pose,facing,Math.max(0,feet()-(below?PAD.height:0)));
   updateCamera();
   for(const item of live)placeLabel(labels.get(item.station.id),item.view.label);
   world.zoneSigns.forEach((at,i)=>placeLabel(labels.get(`zone-${i}`),at));
   placeLabel(labels.get('guide'),anchor.copy(world.guide).setY(world.guide.y+1.5));
   renderer.render(scene,camera);
  }
 }
 const lost=(event:Event)=>{event.preventDefault();callbacks.onLost();};
 canvas.addEventListener('webglcontextlost',lost);
 callbacks.onStatus(status);
 frame=requestAnimationFrame(tick);

 return {
  setPaused(value){paused=value;if(value){input.clear();velocity.x=velocity.z=0;}last=performance.now();},
  setRecorded(ids){for(const item of live){const recorded=ids.includes(item.station.id);if(recorded===item.recorded)continue;item.recorded=recorded;if(item.phase==='shown'||item.phase==='idle'){item.phase='idle';setShown(item);}}},
  resetStation(id){const item=byId.get(id);if(!item||item===active)return;item.phase='idle';item.k=0;setShown(item);},
  celebrate(){cheer=1.6;},
  debug(){return {x:body.start.x,y:feet(),z:body.start.z,onFloor:grounded(),near:status.near,fps:Math.round(fps),triangles:renderer.info.render.triangles};},
  dispose(){
   if(disposed)return;disposed=true;cancelAnimationFrame(frame);observer.disconnect();input.destroy();canvas.removeEventListener('webglcontextlost',lost);
   character.dispose();world.dispose();renderer.dispose();renderer.forceContextLoss();
  },
 };
}
