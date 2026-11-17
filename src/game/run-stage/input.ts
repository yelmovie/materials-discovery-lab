import {bindDirectionPad,mapKeyDirection,MAP_VECTORS,type MapPadDirection} from '../../map-controls.js';

/** One input state for the course: the on-screen pad and buttons come first,
 * arrow keys / WASD / Space / E (or Enter) do the same things. */
export interface RunInput {
 /** -1..1, right is positive. */
 readonly moveX:number;
 /** -1..1, toward the camera is positive (pad "down"). */
 readonly moveZ:number;
 readonly actionHeld:boolean;
 consumeJump():boolean;
 consumeAction():boolean;
 /** Ends a keyboard-activated press that stands in for holding the button. */
 releaseAssist():void;
 clear():void;
 destroy():void;
}
interface Options {
 /** True while a prompt or dialog is open, the tab is hidden, or the course is paused. */
 blocked:()=>boolean;
 /** True when a test tool is within reach, so Space tests instead of jumping. */
 actionAvailable:()=>boolean;
}
const typing='input,textarea,select,[contenteditable]:not([contenteditable="false"])';

export function createRunInput(root:HTMLElement,{blocked,actionAvailable}:Options):RunInput {
 const doc=root.ownerDocument,win=doc.defaultView!,abort=new AbortController(),signal=abort.signal;
 const keys=new Map<string,MapPadDirection>(),actionKeys=new Set<string>();
 let pad:MapPadDirection|null=null,jump=false,actionPressed=false,pointerAction=false,assist=false;
 const padRoot=root.querySelector<HTMLElement>('.run-pad');
 const padControls=padRoot?bindDirectionPad(padRoot,'[data-run-direction]',b=>b.dataset.runDirection as MapPadDirection,{blocked,press:d=>{pad=d;},release:()=>{pad=null;},cancel:()=>{pad=null;}}):null;
 const jumpButton=root.querySelector<HTMLElement>('.run-jump'),actionButton=root.querySelector<HTMLElement>('.run-action');
 function clear(){keys.clear();actionKeys.clear();pad=null;jump=false;actionPressed=false;pointerAction=false;assist=false;padControls?.clear();}
 const startAction=()=>{if(blocked())return;actionPressed=true;};
 jumpButton?.addEventListener('pointerdown',e=>{if(e.button>0||blocked())return;e.preventDefault();jump=true;},{signal});
 jumpButton?.addEventListener('click',e=>{if(e.detail===0&&!blocked())jump=true;},{signal});
 actionButton?.addEventListener('pointerdown',e=>{if(e.button>0||blocked()||(actionButton as HTMLButtonElement).disabled)return;e.preventDefault();try{actionButton.setPointerCapture(e.pointerId);}catch{/* capture is optional */}pointerAction=true;startAction();},{signal});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])actionButton?.addEventListener(type,()=>{pointerAction=false;},{signal});
 // Keyboard activation of the focused test button: one press runs a whole test.
 actionButton?.addEventListener('click',e=>{if(e.detail===0&&!blocked()){assist=true;startAction();}},{signal});
 const gameKey=(e:KeyboardEvent)=>{
  if(e.isComposing||e.ctrlKey||e.altKey||e.metaKey)return null;
  const target=e.target as Element|null;
  if(target?.closest?.(typing))return null;
  // Other buttons (answers, switch to the classic screen) keep their own Enter/Space.
  const control=target?.closest?.('button,a,summary');
  if(control&&!control.closest('.run-controls'))return null;
  if(doc.querySelector('dialog[open]'))return null;
  return e.code;
 };
 doc.addEventListener('keydown',e=>{
  const code=gameKey(e);if(!code)return;
  const direction=mapKeyDirection(e);
  if(direction){e.preventDefault();if(!blocked()&&!e.repeat)keys.set(code,direction);return;}
  if(code==='Space'||code==='KeyE'||code==='Enter'){
   e.preventDefault();if(blocked()||e.repeat)return;
   if(code!=='Space'||actionAvailable()){actionKeys.add(code);startAction();}else jump=true;
  }
 },{signal});
 doc.addEventListener('keyup',e=>{
  keys.delete(e.code);actionKeys.delete(e.code);
  // Stop the browser's own "click on Space release" for the game buttons.
  if(e.code==='Space'&&(e.target as Element|null)?.closest?.('.run-controls'))e.preventDefault();
 },{signal});
 win.addEventListener('blur',clear,{signal});
 doc.addEventListener('visibilitychange',clear,{signal});
 return {
  get moveX(){if(blocked())return 0;let x=pad?MAP_VECTORS[pad].x:0;for(const d of keys.values())x+=MAP_VECTORS[d].x;return Math.max(-1,Math.min(1,x));},
  get moveZ(){if(blocked())return 0;let z=pad?MAP_VECTORS[pad].y:0;for(const d of keys.values())z+=MAP_VECTORS[d].y;return Math.max(-1,Math.min(1,z));},
  get actionHeld(){return !blocked()&&(pointerAction||assist||actionKeys.size>0);},
  consumeJump(){const v=jump&&!blocked();jump=false;return v;},
  consumeAction(){const v=actionPressed&&!blocked();actionPressed=false;return v;},
  releaseAssist(){assist=false;},
  clear,
  destroy(){clear();padControls?.destroy();abort.abort();},
 };
}
