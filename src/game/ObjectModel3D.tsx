import {useEffect,useRef} from 'react';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {materials,sampleColors,type Design} from '../domain/model';
import './object-model-3d.css';

/** 3D study model for S01·S02 (umbrella) and S09·S10 (box). Meshy-made learning model, split into named parts
 *  (scripts/meshy). It only changes how the object looks: records, checks and test results stay in the game state. */
export type Anchors=Record<string,[number,number]>;
interface Props {kind:'umbrella'|'box';selected:string;exploded:number;zoom:number;design?:Design;pressing?:boolean;reduced?:boolean;
 onAnchors:(a:Anchors)=>void;onSelect:(part:string)=>void;onReady:()=>void;onFail:()=>void}
const MODEL_VERSION='20261121';
const partList={umbrella:['canopy','frame','handle'],box:['body','lid','window','handle','bumper']} as const;
// Surface feel per material (colour comes from sampleColors, the same colours as the 2D swatches).
const finish:Record<string,{roughness:number;metalness:number}>={wood_raw:{roughness:.85,metalness:0},metal_plate:{roughness:.32,metalness:.7},glass_clear:{roughness:.08,metalness:0},plastic_clear:{roughness:.25,metalness:0},plastic_opaque:{roughness:.45,metalness:0},rubber_soft:{roughness:.95,metalness:0}};
// Average brightness of each part's own texture, so a recoloured part keeps its shading but not its old colour.
const lumaGain:Record<string,number>={body:2.1,lid:2.1,window:1.25,bumper:1.6};

interface Part {mesh:THREE.Mesh;material:THREE.MeshStandardMaterial;home:THREE.Vector3;homeScale:THREE.Vector3;box:THREE.Box3;tint:{value:number};gain:{value:number};rough:number;metal:number}

export default function ObjectModel3D(props:Props){
 const host=useRef<HTMLDivElement>(null);
 const live=useRef(props);live.current=props;
 const api=useRef<{update:()=>void}|null>(null);

 useEffect(()=>{
  const el=host.current!;let disposed=false,raf=0;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{live.current.onFail();return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
  el.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(28,1,.01,50);
  // A soft room reflection so metal and glossy plastic read as materials instead of turning dark.
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.04).texture;room.traverse(o=>{const m=o as THREE.Mesh;if(m.isMesh){m.geometry.dispose();(m.material as THREE.Material).dispose();}});pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xfffaf0,0x6f8a7a,.9));
  const sun=new THREE.DirectionalLight(0xffffff,1.6);sun.position.set(2.5,4,3);scene.add(sun);
  const fill=new THREE.DirectionalLight(0xdfefff,.7);fill.position.set(-3,1,-2);scene.add(fill);
  const pivot=new THREE.Group();scene.add(pivot);
  const parts:Record<string,Part>={};
  let radius=1,sizeY=1,sizeXZ=1,center=new THREE.Vector3(),yaw=0,pitch=.22,baseYaw=0;
  let explode=0,press=0,lastAnchors='';
  // Box faces: `front` points out of the window side, `right` is the viewer's right when looking at that side.
  const front=new THREE.Vector3(0,0,1),right=new THREE.Vector3(1,0,0),V=()=>new THREE.Vector3();
  function setAxes(){const w=parts.window?.box.getCenter(V()),c=parts.body?.box.getCenter(V());if(!w||!c)return;const d=w.sub(c);
   if(Math.abs(d.x)>Math.abs(d.z))front.set(Math.sign(d.x),0,0);else front.set(0,0,Math.sign(d.z)||1);right.crossVectors(new THREE.Vector3(0,1,0),front);}
  function edge(b:THREE.Box3,fs:number,rs:number,y:number){const c=b.getCenter(V()),h=b.getSize(V()).multiplyScalar(.5);
   return new THREE.Vector3(c.x,y,c.z).addScaledVector(front,fs*Math.abs(front.dot(h))).addScaledVector(right,rs*Math.abs(right.dot(h)));}
  const kind=live.current.kind;

  function size(){const w=el.clientWidth||1,h=el.clientHeight||1;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  function frame(){
   // Fit the real height and the turning width (not the bounding sphere), leaving room for parts spread apart.
   const p=live.current,tan=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
   const hy=(sizeY*Math.cos(pitch)+.7*sizeXZ*Math.abs(Math.sin(pitch)))/2*1.2+(kind==="umbrella"?.2:.24)*radius*explode,hz=sizeXZ/2*1.08;
   const dist=Math.max(hy/tan,hz/(tan*camera.aspect))/Math.max(.6,p.zoom),ty=center.y+(kind==='box'?.16*radius*explode:0);
   camera.position.set(0,ty+dist*Math.sin(pitch),dist*Math.cos(pitch));camera.lookAt(0,ty,0);
   pivot.rotation.y=baseYaw+yaw;
  }
  function anchorPoint(name:string):THREE.Vector3{
   const q=parts[name];if(!q)return center.clone();const b=q.box,c=b.getCenter(new THREE.Vector3());
   if(kind==='umbrella'){if(name==='canopy')return new THREE.Vector3(c.x+(b.max.x-c.x)*.55,b.min.y+(b.max.y-b.min.y)*.62,c.z+(b.max.z-c.z)*.35);if(name==='frame'){const cb=parts.canopy?.box;return new THREE.Vector3(c.x,cb?cb.min.y-(cb.max.y-cb.min.y)*.08:c.y,c.z);}return c;}
   if(name==='handle'||name==='lid')return new THREE.Vector3(c.x,b.max.y,c.z);
   if(name==='bumper')return edge(b,1,-1,b.min.y+(b.max.y-b.min.y)*.12);
   if(name==='body')return edge(b,1,.8,c.y);
   return c;
  }
  function placeParts(){
   const s=radius;
   for(const [name,q] of Object.entries(parts)){
    const off=new THREE.Vector3();
    if(kind==='umbrella'){if(name==='canopy')off.y=.2*s*explode;if(name==='handle')off.y=-.18*s*explode;}
    else{if(name==='lid')off.y=.22*s*explode;if(name==='handle')off.y=.42*s*explode;if(name==='window')off.addScaledVector(front,.28*s*explode);}
    q.mesh.position.copy(q.home).add(off);
    // Bumpers spread from the box centre and squash toward the floor when pressed. gltfpack stores a dequantising scale on the
    // node, so the part is scaled around a point by moving the node as well, never by overwriting its scale.
    if(name==='bumper'){const k=new THREE.Vector3(1+.12*explode,1+.12*explode,1+.12*explode);
     const c=q.box.getCenter(new THREE.Vector3());c.y=q.box.min.y;q.mesh.position.copy(q.home).sub(c).multiply(k).add(c);q.mesh.scale.copy(q.homeScale).multiply(k);}
   }
  }
  // Press tool for the corner test: it comes down on the top front-left corner. On soft rubber it sinks a little into the
  // bumper; on a hard material it stops at the surface (the bumper is one mesh, so no single corner is deformed).
  const presser=new THREE.Group();presser.visible=false;
  const plateMat=new THREE.MeshStandardMaterial({color:0xa7c5ba,roughness:.5}),rodMat=new THREE.MeshStandardMaterial({color:0x527b70,roughness:.6});
  const plate=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.18,28),plateMat),rod=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,2.4,14),rodMat);
  rod.position.y=1.29;presser.add(plate,rod);
  function placePresser(){
   const q=parts.bumper;if(kind!=='box'||!q){presser.visible=false;return;}
   presser.visible=press>.01;if(!presser.visible)return;
   const b=q.box,soft=live.current.design?.parts.bumper.sampleId==="rubber_soft",r=radius*.12;
   presser.scale.setScalar(r);presser.position.copy(edge(b,1,-1,b.max.y+r*.09+radius*.32*(1-press)-(soft?radius*.035:0)*press)).addScaledVector(front,-r*.7).addScaledVector(right,r*.7);
  }
  function applyLook(){
   const p=live.current;
   for(const [name,q] of Object.entries(parts)){
    const m=q.material;const on=p.selected===name;
    // In the design screens the part colour is the material, so the highlight stays faint there to keep the colour honest.
    m.emissive.set(on?0xffc94d:0x000000);m.emissiveIntensity=on?(p.design?.12:.24):0;
    const designPart=name==='lid'?'body':name;
    const id=p.design&&(designPart==='body'||designPart==='window'||designPart==='bumper')?p.design.parts[designPart].sampleId:null;
    if(!id){m.color.set(0xffffff);q.tint.value=0;m.roughness=q.rough;m.metalness=q.metal;m.transparent=false;m.opacity=1;m.needsUpdate=true;continue;}
    const see=!!materials.find(x=>x.id===id)?.transparent;
    const f=finish[id]??{roughness:.6,metalness:0};m.roughness=f.roughness;m.metalness=f.metalness;
    // A see-through window keeps the original glass picture (the star stays visible) with a light tint; an opaque one hides it.
    if(name==='window'&&see){q.tint.value=0;m.color.set(sampleColors[id]).lerp(new THREE.Color(0xffffff),.55);m.transparent=true;m.opacity=.92;}
    else{q.tint.value=1;q.gain.value=lumaGain[name]??1.5;m.color.set(sampleColors[id]);m.transparent=false;m.opacity=1;}
    m.needsUpdate=true;
   }
  }
  function report(){
   pivot.updateMatrixWorld(true);const out:Anchors={};
   for(const name of partList[kind]){const q=parts[name];if(!q)continue;const v=anchorPoint(name).add(q.mesh.position).sub(q.home).applyMatrix4(q.mesh.parent!.matrixWorld).project(camera);out[name]=[Math.round((v.x+1)*500)/10,Math.round((1-v.y)*500)/10];}
   const key=JSON.stringify(out);if(key!==lastAnchors){lastAnchors=key;live.current.onAnchors(out);}
  }
  let dirty=true;
  function tick(){
   raf=0;if(disposed)return;
   const p=live.current,instant=p.reduced;
   const te=p.exploded??0,tp=p.pressing?1:0;
   explode=instant?te:explode+(te-explode)*.22;press=instant?tp:press+(tp-press)*.25;
   const moving=Math.abs(te-explode)>.002||Math.abs(tp-press)>.002;
   if(!moving){explode=te;press=tp;}
   placeParts();placePresser();frame();renderer.render(scene,camera);report();
   if(moving||dirty){dirty=false;raf=requestAnimationFrame(tick);}
  }
  const invalidate=()=>{dirty=true;if(!raf)raf=requestAnimationFrame(tick);};
  api.current={update:()=>{applyLook();invalidate();}};

  // Drag turns the model; a short tap picks the part under the finger.
  let drag:{x:number;y:number;moved:boolean;yaw:number;pitch:number}|null=null;
  const ray=new THREE.Raycaster();
  const down=(e:PointerEvent)=>{if(e.button!==0)return;renderer.domElement.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,moved:false,yaw,pitch};};
  const move=(e:PointerEvent)=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>5)drag.moved=true;if(!drag.moved)return;
   yaw=drag.yaw+dx*.011;pitch=THREE.MathUtils.clamp(drag.pitch+dy*.008,-1.05,1.1);el.classList.add('turned');invalidate();};
  const up=(e:PointerEvent)=>{const d=drag;drag=null;if(!d||d.moved)return;
   const r=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);
   const hit=ray.intersectObjects(Object.values(parts).map(q=>q.mesh),false)[0];
   const name=hit&&Object.entries(parts).find(([,q])=>q.mesh===hit.object)?.[0];
   const pick=name==='lid'&&live.current.design?'body':name;
   if(pick&&(kind==='umbrella'||!live.current.design||['body','window','bumper'].includes(pick)))live.current.onSelect(pick);};
  const cancel=()=>{drag=null;};
  renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);
  renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',cancel);
  const resize=new ResizeObserver(()=>{size();invalidate();});resize.observe(el);size();

  const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
  loader.load(`/assets/models/${kind}.glb?v=${MODEL_VERSION}`,gltf=>{
   if(disposed)return;
   const root=gltf.scene;pivot.add(root);root.updateMatrixWorld(true);
   const all=new THREE.Box3().setFromObject(root),dims=all.getSize(new THREE.Vector3());center=all.getCenter(new THREE.Vector3());radius=dims.length()/2;sizeY=dims.y;sizeXZ=Math.hypot(dims.x,dims.z);
   root.position.set(-center.x,0,-center.z);root.updateMatrixWorld(true);center.set(0,center.y,0);
   for(const name of partList[kind]){
    const node=root.getObjectByName(name);let mesh:THREE.Mesh|undefined;node?.traverse(o=>{if(!mesh&&(o as THREE.Mesh).isMesh)mesh=o as THREE.Mesh;});
    if(!mesh)continue;
    const material=(mesh.material as THREE.MeshStandardMaterial).clone();mesh.material=material;
    const tint={value:0},gain={value:1};
    material.onBeforeCompile=sh=>{sh.uniforms.uTint=tint;sh.uniforms.uGain=gain;
     sh.fragmentShader='uniform float uTint;uniform float uGain;\n'+sh.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
 vec4 sampledDiffuseColor=texture2D(map,vMapUv);
 float luma=dot(sampledDiffuseColor.rgb,vec3(.299,.587,.114));
 sampledDiffuseColor.rgb=mix(sampledDiffuseColor.rgb,vec3(min(1.,luma*uGain)),uTint);
 diffuseColor*=sampledDiffuseColor;
#endif`);};
    material.customProgramCacheKey=()=>'tint-'+name;
    mesh.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(mesh);box.applyMatrix4(new THREE.Matrix4().copy(mesh.parent!.matrixWorld).invert());
    parts[name]={mesh,material,home:mesh.position.clone(),homeScale:mesh.scale.clone(),box,tint,gain,rough:material.roughness,metal:material.metalness};
   }
   setAxes();
   // Start from a three-quarter view: the box shows its window side, the umbrella shows its curved handle.
   if(kind==='box'&&parts.window){const w=parts.window.box.getCenter(new THREE.Vector3()).sub(parts.body?.box.getCenter(new THREE.Vector3())??new THREE.Vector3());baseYaw=-Math.atan2(w.x,w.z)-.55;}
   else if(parts.handle&&parts.frame){const h=parts.handle.box.getCenter(new THREE.Vector3()).sub(parts.frame.box.getCenter(new THREE.Vector3()));baseYaw=-Math.atan2(h.x,h.z)+Math.PI/2;pitch=-.32;}
   root.add(presser);applyLook();invalidate();live.current.onReady();
  },undefined,()=>{if(!disposed)live.current.onFail();});

  return()=>{disposed=true;cancelAnimationFrame(raf);resize.disconnect();api.current=null;
   renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointermove',move);
   renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('pointercancel',cancel);
   scene.traverse(o=>{const m=o as THREE.Mesh;if(!m.isMesh)return;m.geometry.dispose();for(const mat of ([] as THREE.Material[]).concat(m.material)){for(const v of Object.values(mat))if(v instanceof THREE.Texture)v.dispose();mat.dispose();}});
   scene.environment?.dispose();renderer.dispose();renderer.domElement.remove();};
 },[props.kind]);

 useEffect(()=>{api.current?.update();},[props.selected,props.exploded,props.zoom,props.design,props.pressing]);

 return <div ref={host} className="object-model-3d" aria-hidden="true"><span className="turn-hint">↻ 끌어서 돌려 봐요</span></div>;
}
