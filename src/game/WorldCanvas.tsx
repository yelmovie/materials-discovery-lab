import {useEffect,useRef} from 'react';
import Phaser from 'phaser';
import {MAP_WIDTH,MAP_HEIGHT,worldDestinations,worldLights,roadNodes,routeBetween,walkRoad,doorAt,pathLength,pointAlong,type MapDirection,type MapPoint} from '../domain/worldMap';
export const destinations=worldDestinations;
interface Props {target:number|null;nextStage:number;recovered:number;reduced:boolean;direction?:MapDirection|null;paused?:boolean;overview?:boolean;hand?:boolean;reveal?:number|null;onMoveStart?:()=>void;onLeave?:()=>void;onFollow?:()=>void;onSelect:(i:number)=>void;onArrive:(i:number)=>void;onCamera?:(x:number,y:number,zoom:number)=>void;onPan?:()=>void;onRevealEnd?:()=>void}
// Zoom past "cover" so the map always fills the screen and shows a close, walkable area like the sibling games.
const ZOOM_OVER_COVER=1.45,DRAG_THRESHOLD=10,WALK_SPEED=250,ROUTE_SPEED=340,FOLLOW_GAP=52;
const DUSK=.42,DUSK_SCALE=.25,REVEAL_LIGHT=1200,REVEAL_TRAVEL=1500,REVEAL_END=3000;
const VECTORS:Record<MapDirection,MapPoint>={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
// Frames come from scripts/prepare-walk-sprites.mjs: <direction>-<1..4>.webp on one shared canvas per character.
const WALKERS={researcher:{height:96},companion:{height:78}} as const;
const WALK_DIRECTIONS:MapDirection[]=['down','left','right','up'];
const walkKey=(name:keyof typeof WALKERS,direction:MapDirection,frame:number)=>`${name}-${direction}-${frame}`;
const facingFor=(dx:number,dy:number,current:MapDirection):MapDirection=>Math.hypot(dx,dy)<.3?current:Math.abs(dx)>Math.abs(dy)*.8?(dx<0?'left':'right'):dy<0?'up':'down';
const buildingCenter=(i:number)=>({x:worldDestinations[i].x,y:worldDestinations[i].y-(i===5?140:120)});
// Survives remounts: coming back from a workshop puts the researcher where they left, not at the plaza.
let lastSpot:MapPoint|null=null;

export default function WorldCanvas(props:Props){
 const host=useRef<HTMLDivElement>(null),live=useRef(props);live.current=props;
 useEffect(()=>{if(!host.current)return;
  class WorldScene extends Phaser.Scene {
   avatar!:Phaser.GameObjects.Image;friend!:Phaser.GameObjects.Image;shadow!:Phaser.GameObjects.Ellipse;friendShadow!:Phaser.GameObjects.Ellipse;
   overlay!:Phaser.GameObjects.Graphics;orb!:Phaser.GameObjects.Image;duskImage!:Phaser.GameObjects.Image;dusk!:Phaser.Textures.CanvasTexture;duskBase=document.createElement('canvas');duskKey='';duskSpot='';
   pos:MapPoint={...roadNodes.spawn};friendPos:MapPoint={...roadNodes.spawn};trail:MapPoint[]=[];path:MapPoint[]=[];
   lastTarget:number|null=null;doorLatch=-1;announced=-1;manualOn=false;keys=new Set<string>();elapsed=0;dustAt=0;facing:MapDirection='down';friendFacing:MapDirection='down';
   drag:{x:number;y:number;center:MapPoint;moved:boolean}|null=null;center:MapPoint={...roadNodes.spawn};cameraReady=false;lastCamera='';
   glows:{image:Phaser.GameObjects.Image;stage:number;phase:number}[]=[];motes:{dot:Phaser.GameObjects.Arc;x:number;y:number;phase:number}[]=[];
   reveal:{stage:number;time:number;route:MapPoint[];length:number}|null=null;
   preload(){
    this.load.image('island','/assets/generated/workshop-island.webp');
    this.load.image('researcher','/assets/generated/researcher.webp');
    this.load.image('companion','/assets/generated/companion.webp');
    this.load.image('fallback-researcher','/assets/characters/tori.webp');
    this.load.image('fallback-companion','/assets/characters/moru.webp');
    for(const name of Object.keys(WALKERS) as (keyof typeof WALKERS)[])for(const direction of WALK_DIRECTIONS)for(let frame=1;frame<=4;frame++)this.load.image(walkKey(name,direction,frame),`/assets/generated/walk/${name}/${direction}-${frame}.webp`);
   }
   create(){
    const p=live.current;
    if(this.textures.exists('island'))this.add.image(MAP_WIDTH/2,MAP_HEIGHT/2,'island').setDisplaySize(MAP_WIDTH,MAP_HEIGHT);
    this.createDusk();this.createLights();
    this.overlay=this.add.graphics().setDepth(3.5);
    worldDestinations.forEach((destination,i)=>{
     const area=buildingCenter(i);
     this.add.zone(area.x,area.y,200,190).setInteractive().on('pointerup',()=>{if(!this.isPaused()&&this.drag&&!this.drag.moved)live.current.onSelect(i);});
    });
    const start=p.reveal!=null?worldDestinations[p.reveal]:lastSpot??roadNodes.spawn;
    this.pos={x:start.x,y:start.y};this.friendPos=walkRoad(this.pos,{x:-.8,y:.6},FOLLOW_GAP);this.doorLatch=doorAt(this.pos);this.center={x:this.pos.x,y:this.pos.y-50};
    this.shadow=this.add.ellipse(this.pos.x,this.pos.y,46,15,0x143328,.32).setDepth(4);
    this.friendShadow=this.add.ellipse(this.friendPos.x,this.friendPos.y,38,12,0x143328,.28).setDepth(4);
    this.avatar=this.add.image(this.pos.x,this.pos.y,this.textures.exists('researcher')?'researcher':'fallback-researcher').setOrigin(.5,1).setDisplaySize(64,96).setDepth(5);
    this.friend=this.add.image(this.friendPos.x,this.friendPos.y,this.textures.exists('companion')?'companion':'fallback-companion').setOrigin(.5,1).setDisplaySize(52,78).setDepth(5);
    if(!p.reduced)for(let i=0;i<30;i++){const x=Phaser.Math.Between(60,MAP_WIDTH-60),y=Phaser.Math.Between(60,MAP_HEIGHT-60);this.motes.push({dot:this.add.circle(x,y,Phaser.Math.Between(2,3),0xfff3b8,.5).setDepth(4.5),x,y,phase:Math.random()*6.28});}
    const camera=this.cameras.main;
    // Size the camera explicitly: Phaser skips cameras whose size drifted from the previous game size.
    this.scale.on('resize',(size:Phaser.Structs.Size)=>camera.setSize(size.width,size.height));
    // Report after drawing so DOM labels match the exact frame on screen (worldView is the rendered top-left corner).
    const report=()=>{const view=camera.worldView,key=`${view.x.toFixed(1)},${view.y.toFixed(1)},${camera.zoom.toFixed(4)}`;if(key!==this.lastCamera){this.lastCamera=key;live.current.onCamera?.(view.x,view.y,camera.zoom);}};
    this.game.events.on(Phaser.Core.Events.POST_RENDER,report);this.events.once('shutdown',()=>this.game.events.off(Phaser.Core.Events.POST_RENDER,report));
    // Drag pans the camera (hand cursor); a short tap still walks to the nearest road.
    this.input.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{if(this.isPaused())return;this.drag={x:pointer.x,y:pointer.y,center:{...this.center},moved:false};});
    this.input.on('pointermove',(pointer:Phaser.Input.Pointer)=>{
     if(!this.drag||!pointer.isDown||live.current.overview)return;const dx=pointer.x-this.drag.x,dy=pointer.y-this.drag.y;
     if(!this.drag.moved&&Math.hypot(dx,dy)<DRAG_THRESHOLD)return;
     if(!this.drag.moved){this.drag.moved=true;host.current?.classList.add('dragging');live.current.onPan?.();}
     this.center={x:this.drag.center.x-dx/camera.zoom,y:this.drag.center.y-dy/camera.zoom};
    });
    this.input.on('pointerup',(pointer:Phaser.Input.Pointer,objects:Phaser.GameObjects.GameObject[])=>{
     const drag=this.drag;host.current?.classList.remove('dragging');
     if(drag&&!drag.moved&&!objects.length&&!this.isPaused()){
      live.current.onMoveStart?.();live.current.onFollow?.();this.path=routeBetween(this.pos,{x:pointer.worldX,y:pointer.worldY});
      if(live.current.reduced)this.teleport();
     }
     this.time.delayedCall(0,()=>{this.drag=null;});
    });
    const keyboard=this.input.keyboard;
    keyboard?.on('keydown',(event:KeyboardEvent)=>{if(this.isPaused()||this.typing())return;if(this.directionFor(event.code)){event.preventDefault();this.keys.add(event.code);}});
    keyboard?.on('keyup',(event:KeyboardEvent)=>this.keys.delete(event.code));
    const clear=()=>this.keys.clear();window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);this.events.once('shutdown',()=>{window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',clear);});
    if(p.reveal!=null){if(p.reduced)p.onRevealEnd?.();else this.startReveal(p.reveal);}
   }
   createDusk(){
    const width=MAP_WIDTH*DUSK_SCALE,height=MAP_HEIGHT*DUSK_SCALE;
    this.duskBase.width=width;this.duskBase.height=height;
    this.dusk=this.textures.createCanvas('dusk',width,height)!;this.dusk.setFilter(Phaser.Textures.FilterMode.LINEAR);
    this.duskImage=this.add.image(0,0,'dusk').setOrigin(0).setScale(1/DUSK_SCALE).setDepth(3);
   }
   createLights(){
    const glow=this.textures.createCanvas('glow',128,128)!,context=glow.context,gradient=context.createRadialGradient(64,64,4,64,64,64);
    gradient.addColorStop(0,'rgba(255,238,170,.95)');gradient.addColorStop(.35,'rgba(255,205,110,.42)');gradient.addColorStop(1,'rgba(255,190,80,0)');
    context.fillStyle=gradient;context.fillRect(0,0,128,128);glow.setFilter(Phaser.Textures.FilterMode.LINEAR);glow.refresh();
    this.glows=worldLights.map((light,i)=>({image:this.add.image(light.x,light.y,'glow').setScale(light.r/64).setBlendMode(Phaser.BlendModes.ADD).setDepth(3.2).setVisible(false),stage:light.stage,phase:i*1.7}));
    this.orb=this.add.image(0,0,'glow').setScale(.9).setBlendMode(Phaser.BlendModes.ADD).setDepth(6).setVisible(false);
   }
   paintDusk(){
    const p=live.current,grow=this.reveal?Math.min(1,this.reveal.time/REVEAL_LIGHT):1,level=Math.min(5,p.recovered)-(this.reveal?1-grow:0),dark=DUSK*(1-level/5);
    this.duskImage.setVisible(dark>.005);if(dark<=.005)return;
    const key=`${dark.toFixed(3)}|${grow.toFixed(2)}|${p.nextStage}`,spot=`${Math.round(this.pos.x/3)},${Math.round(this.pos.y/3)}`;
    if(key===this.duskKey&&spot===this.duskSpot)return;
    if(key!==this.duskKey){
     const base=this.duskBase.getContext('2d')!;
     base.setTransform(DUSK_SCALE,0,0,DUSK_SCALE,0,0);base.globalCompositeOperation='source-over';base.clearRect(0,0,MAP_WIDTH,MAP_HEIGHT);
     base.fillStyle=`rgba(9,31,42,${dark})`;base.fillRect(0,0,MAP_WIDTH,MAP_HEIGHT);base.globalCompositeOperation='destination-out';
     for(let i=0;i<Math.min(5,p.recovered);i++)this.clearLight(base,buildingCenter(i),Math.max(40,340*(this.reveal?.stage===i?grow:1)),1);
     if(p.nextStage<5)this.clearLight(base,buildingCenter(p.nextStage),210,.72);
     this.clearLight(base,buildingCenter(5),130+p.recovered*30,.6);
    }
    this.duskKey=key;this.duskSpot=spot;
    const context=this.dusk.context;
    context.setTransform(1,0,0,1,0,0);context.globalCompositeOperation='source-over';context.clearRect(0,0,this.duskBase.width,this.duskBase.height);context.drawImage(this.duskBase,0,0);
    context.setTransform(DUSK_SCALE,0,0,DUSK_SCALE,0,0);context.globalCompositeOperation='destination-out';this.clearLight(context,{x:this.pos.x,y:this.pos.y-30},200,1);context.globalCompositeOperation='source-over';
    this.dusk.refresh();
   }
   clearLight(context:CanvasRenderingContext2D,{x,y}:MapPoint,radius:number,strength:number){
    const light=context.createRadialGradient(x,y,radius*.2,x,y,radius);
    light.addColorStop(0,`rgba(0,0,0,${strength})`);light.addColorStop(.55,`rgba(0,0,0,${strength*.85})`);light.addColorStop(1,'rgba(0,0,0,0)');
    context.fillStyle=light;context.fillRect(x-radius,y-radius,radius*2,radius*2);
   }
   startReveal(stage:number){
    const door=worldDestinations[stage],route=[{x:door.x,y:door.y},...routeBetween(door,worldDestinations[5])];
    this.reveal={stage,time:0,route,length:pathLength(route)};this.center=buildingCenter(stage);this.ripple(door.x,door.y-40);
   }
   stepReveal(delta:number){
    const reveal=this.reveal;if(!reveal)return;const before=reveal.time;reveal.time+=delta;
    const t=Phaser.Math.Clamp((reveal.time-REVEAL_LIGHT*.6)/REVEAL_TRAVEL,0,1),eased=t*t*(3-2*t),point=pointAlong(reveal.route,reveal.length*eased);
    this.orb.setVisible(t>0&&t<1).setPosition(point.x,point.y-14).setScale(.75+Math.sin(reveal.time/90)*.08);
    if(t>0&&Math.floor(reveal.time/110)!==Math.floor(before/110))this.dust(point.x,point.y-10,0xffe59a,1.6);
    if(before<REVEAL_LIGHT*.6+REVEAL_TRAVEL&&reveal.time>=REVEAL_LIGHT*.6+REVEAL_TRAVEL)this.ripple(768,420);
    if(reveal.time>=REVEAL_END){this.reveal=null;this.orb.setVisible(false);this.duskKey='';live.current.onRevealEnd?.();}
   }
   revealFocus():MapPoint|null{
    const reveal=this.reveal;if(!reveal)return null;
    if(reveal.time<REVEAL_LIGHT*.6)return buildingCenter(reveal.stage);
    const t=Math.min(1,(reveal.time-REVEAL_LIGHT*.6)/REVEAL_TRAVEL);return pointAlong(reveal.route,reveal.length*t*t*(3-2*t));
   }
   ripple(x:number,y:number){
    const ring=this.add.circle(x,y,46).setStrokeStyle(4,0xfff1a8,1).setDepth(4.6);
    this.tweens.add({targets:ring,scale:3,alpha:0,duration:900,ease:'Sine.easeOut',onComplete:()=>ring.destroy()});
   }
   dust(x:number,y:number,color=0xe9d9a8,grow=1){
    const puff=this.add.circle(x,y,5,color,.55).setDepth(4.4);
    this.tweens.add({targets:puff,scale:2.4*grow,alpha:0,y:y-6,duration:420,ease:'Sine.easeOut',onComplete:()=>puff.destroy()});
   }
   isPaused(){return !!live.current.paused||!!this.reveal||document.hidden||!!host.current?.closest('[inert]');}
   typing(){return !!document.activeElement?.matches('input,select,textarea,[contenteditable=true]');}
   directionFor(code:string):MapDirection|undefined{return ({ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'} as Record<string,MapDirection>)[code];}
   heldVector(direction:MapDirection|null|undefined):MapPoint|null{
    const held=[direction,...[...this.keys].map(code=>this.directionFor(code))].filter(Boolean) as MapDirection[];
    const x=held.reduce((sum,d)=>sum+VECTORS[d].x,0),y=held.reduce((sum,d)=>sum+VECTORS[d].y,0),length=Math.hypot(x,y);
    return length?{x:x/length,y:y/length}:null;
   }
   teleport(){const end=this.path[this.path.length-1];if(end)this.pos={...end};this.path=[];this.trail=[];}
   moveTo(next:MapPoint){
    this.facing=facingFor(next.x-this.pos.x,next.y-this.pos.y,this.facing);
    this.pos=next;lastSpot=next;
    const head=this.trail[0];if(!head||Math.hypot(head.x-next.x,head.y-next.y)>5){this.trail.unshift(next);this.trail.length=Math.min(this.trail.length,40);}
   }
   walk(delta:number){
    const p=live.current,dt=Math.min(delta,50)/1000,held=this.heldVector(p.direction),from=this.pos;
    if(held){
     if(!this.manualOn){this.manualOn=true;this.path=[];p.onMoveStart?.();p.onFollow?.();}
     this.moveTo(walkRoad(this.pos,held,WALK_SPEED*dt));
    }else{
     this.manualOn=false;
     if(this.path.length){
      const next=this.path[0],distance=Math.hypot(next.x-this.pos.x,next.y-this.pos.y),step=ROUTE_SPEED*dt;
      if(distance<=step){this.moveTo({...next});this.path.shift();}
      else this.moveTo({x:this.pos.x+(next.x-this.pos.x)/distance*step,y:this.pos.y+(next.y-this.pos.y)/distance*step});
     }
    }
    return Math.hypot(this.pos.x-from.x,this.pos.y-from.y)>.3;
   }
   watchDoors(){
    const p=live.current,door=doorAt(this.pos);
    if(door===this.doorLatch)return;
    const left=door<0;this.doorLatch=door;
    if(left){this.announced=-1;p.onLeave?.();}else{this.announced=door;p.onArrive(door);}
   }
   watchTarget(){
    const p=live.current;if(p.target===this.lastTarget)return;
    this.lastTarget=p.target;if(p.target===null)return;
    const door=worldDestinations[p.target];
    if(this.doorLatch===p.target){this.path=[];if(this.announced!==p.target){this.announced=p.target;p.onArrive(p.target);}return;}
    this.path=routeBetween(this.pos,door);if(p.reduced)this.teleport();
   }
   // A frame swap keeps feet on the road: every frame shares a canvas and a bottom-centre origin.
   pose(image:Phaser.GameObjects.Image,name:keyof typeof WALKERS,direction:MapDirection,frame:number,breath=0){
    const key=walkKey(name,direction,frame);if(!this.textures.exists(key))return;
    if(image.texture.key!==key)image.setTexture(key);
    const scale=WALKERS[name].height/image.frame.height;image.setScale(scale,scale*(1+breath/WALKERS[name].height));
   }
   drawCharacters(time:number,walking:boolean){
    const p=live.current,animate=!p.reduced,step=this.elapsed/125,frame=walking&&animate?Math.floor(step)%4+1:2,lift=walking&&animate?Math.abs(Math.sin(step*Math.PI/2))*2:0;
    this.avatar.setPosition(this.pos.x,this.pos.y-lift);this.pose(this.avatar,'researcher',this.facing,frame,animate&&!walking?Math.sin(time/520)*1.2:0);
    this.shadow.setPosition(this.pos.x,this.pos.y-2);
    const gap=this.trail.length>1?pointAlong(this.trail,FOLLOW_GAP):this.friendPos,dx=gap.x-this.friendPos.x,dy=gap.y-this.friendPos.y,follow=p.reduced?1:.2;
    const friendWalking=Math.hypot(dx,dy)>1;this.friendFacing=facingFor(dx,dy,this.friendFacing);this.friendPos={x:this.friendPos.x+dx*follow,y:this.friendPos.y+dy*follow};
    this.friend.setPosition(this.friendPos.x,this.friendPos.y);this.pose(this.friend,'companion',this.friendFacing,friendWalking&&animate?(Math.floor(step)+2)%4+1:2);
    this.friendShadow.setPosition(this.friendPos.x,this.friendPos.y-2);
    this.avatar.setDepth(5+this.pos.y/10000);this.friend.setDepth(5+this.friendPos.y/10000);
    if(walking&&animate&&time>this.dustAt){this.dustAt=time+260;this.dust(this.pos.x+Phaser.Math.Between(-9,9),this.pos.y-2);}
   }
   drawOverlay(time:number){
    const p=live.current,g=this.overlay,goal=p.target??p.nextStage;g.clear();
    if(p.overview){const edge=4/this.cameras.main.zoom;g.lineStyle(edge,0xf6e3ad,.95);g.strokeRect(0,0,MAP_WIDTH,MAP_HEIGHT);}
    if(goal<=5&&!this.reveal){
     const door=worldDestinations[goal],pulse=p.reduced?.5:Math.sin(time/320)*.5+.5;
     g.fillStyle(0xffe68a,.3);g.fillEllipse(door.x,door.y+2,54,22);g.lineStyle(3,0xfff1a8,.92);g.strokeEllipse(door.x,door.y+2,62+pulse*16,26+pulse*7);
    }
    if(!this.path.length)return;
    const line=[this.pos,...this.path],total=pathLength(line),spacing=26,offset=p.reduced?0:(time/30)%spacing;
    for(let distance=offset+18;distance<total-8;distance+=spacing){const dot=pointAlong(line,distance);g.fillStyle(0x24463a,.34);g.fillCircle(dot.x,dot.y+2,6);g.fillStyle(0xfff5bd,.96);g.fillCircle(dot.x,dot.y,4);}
    if(p.target===null){const end=line[line.length-1];g.lineStyle(3,0xfff5bd,.92);g.strokeEllipse(end.x,end.y,34,15);}
   }
   drawLights(time:number){
    const p=live.current,grow=this.reveal?Math.min(1,this.reveal.time/REVEAL_LIGHT):1;
    for(const light of this.glows){
     const flicker=p.reduced?1:.84+Math.sin(time/640+light.phase)*.16;
     if(light.stage===5){light.image.setVisible(true).setAlpha((.16+p.recovered*.06)*flicker);continue;}
     const on=light.stage<p.recovered;light.image.setVisible(on);if(on)light.image.setAlpha(flicker*.55*(this.reveal?.stage===light.stage?grow:1));
    }
    for(const mote of this.motes)mote.dot.setPosition(mote.x+Math.sin(time/1900+mote.phase)*26,mote.y+Math.cos(time/2500+mote.phase)*18).setAlpha(.28+Math.sin(time/900+mote.phase)*.22);
   }
   updateCamera(delta:number){
    const camera=this.cameras.main,p=live.current;
    // Some resize sequences (boot behind a dialog, route swaps) can leave the camera at an old size; re-sync every frame.
    if(camera.width!==this.scale.width||camera.height!==this.scale.height)camera.setSize(this.scale.width,this.scale.height);
    const width=camera.width,height=camera.height,cover=Math.max(width/MAP_WIDTH,height/MAP_HEIGHT),short=height<560,top=short?0:96,bottom=short?0:118;
    const zoomGoal=p.overview?Math.min(width/MAP_WIDTH,(height-top-bottom)/MAP_HEIGHT):cover*(height>width?1.15:ZOOM_OVER_COVER);
    const ease=!this.cameraReady||p.reduced?1:Math.min(1,delta/200);this.cameraReady=true;
    const zoom=Math.abs(zoomGoal-camera.zoom)<.0015?zoomGoal:camera.zoom+(zoomGoal-camera.zoom)*ease;
    const focus=this.revealFocus();
    const want=p.overview?{x:MAP_WIDTH/2,y:MAP_HEIGHT/2+(bottom-top)/2/zoom}:focus??(p.hand||this.drag?.moved?this.center:{x:this.pos.x,y:this.pos.y-50});
    if(want!==this.center)this.center={x:this.center.x+(want.x-this.center.x)*ease,y:this.center.y+(want.y-this.center.y)*ease};
    if(!p.overview){
     const halfWidth=width/2/zoom,halfHeight=height/2/zoom;
     this.center={x:halfWidth*2>=MAP_WIDTH?MAP_WIDTH/2:Phaser.Math.Clamp(this.center.x,halfWidth,MAP_WIDTH-halfWidth),y:halfHeight*2>=MAP_HEIGHT?MAP_HEIGHT/2:Phaser.Math.Clamp(this.center.y,halfHeight,MAP_HEIGHT-halfHeight)};
    }
    camera.setZoom(zoom);camera.centerOn(this.center.x,this.center.y);
   }
   update(time:number,delta:number){
    if(!this.avatar)return;
    const paused=this.isPaused();let walking=false;
    if(this.reveal)this.stepReveal(delta);
    else if(paused){this.keys.clear();}
    else{this.watchTarget();walking=this.walk(delta);if(walking)this.elapsed+=delta;this.watchDoors();}
    this.paintDusk();this.drawLights(time);this.drawOverlay(time);this.drawCharacters(time,walking);this.updateCamera(delta);
   }
  }
  // Own canvas + Scale.NONE: Phaser pools canvases, and a lab game torn down before boot could keep restyling a recycled one.
  const size=()=>({width:Math.max(1,Math.round(host.current?.clientWidth||MAP_WIDTH)),height:Math.max(1,Math.round(host.current?.clientHeight||MAP_HEIGHT))});
  const game=new Phaser.Game({type:Phaser.CANVAS,canvas:document.createElement('canvas'),parent:host.current,...size(),transparent:true,pixelArt:true,roundPixels:true,scene:WorldScene,scale:{mode:Phaser.Scale.NONE},banner:false,audio:{noAudio:true}});
  const observer=new ResizeObserver(()=>{const next=size();if(next.width!==game.scale.width||next.height!==game.scale.height)game.scale.resize(next.width,next.height);});observer.observe(host.current);
  return()=>{observer.disconnect();game.destroy(true);};
 },[]);
 return <div ref={host} className="world-canvas" role="img" aria-label="연구원과 모루가 함께 걷는 숲속 공방 지도. 방향판이나 방향키를 누르고 있으면 길을 따라 걷고, 땅이나 건물 이름을 누르면 그곳까지 걸어가요. 손으로 끌면 둘러볼 수 있어요."/>;
}
