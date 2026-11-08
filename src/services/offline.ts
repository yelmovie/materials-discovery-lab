let registered=false;

/** Optional classroom resilience. Learning records remain owned by storage.ts. */
export function registerOffline(){
 if(registered||!('serviceWorker' in navigator))return;
 registered=true;
 let status:HTMLDivElement|null=null,timer:ReturnType<typeof setTimeout>|undefined;
 function announce(message:string,persistent=false){
  if(!status){status=document.createElement('div');status.className='offline-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');Object.assign(status.style,{position:'fixed',bottom:'20px',left:'50%',transform:'translateX(-50%)',zIndex:'1000',maxWidth:'min(680px,calc(100vw - 32px))',padding:'12px 18px',borderRadius:'14px',background:'#193c53',color:'#fffdf4',boxShadow:'0 5px 24px #112a3433',fontSize:'18px',lineHeight:'1.5',textAlign:'center',pointerEvents:'none'});document.body.append(status);}
  clearTimeout(timer);status.textContent=message;status.hidden=false;
  if(!persistent)timer=setTimeout(()=>{if(status)status.hidden=true;},7000);
 }
 window.addEventListener('offline',()=>announce(navigator.serviceWorker.controller?'인터넷 연결이 끊겼어요. 준비된 실험은 계속할 수 있어요.':'인터넷 연결이 끊겼어요. 처음 준비하지 못한 실험은 연결 후 열어 주세요.',true));
 window.addEventListener('online',()=>announce('인터넷에 다시 연결됐어요. 연구를 이어 가요.'));
 if(!navigator.onLine)announce('인터넷 연결이 끊겨 있어요. 준비된 실험을 이어 가요.',true);
 const readyMessage=()=>announce('오프라인 준비를 마쳤어요. 연결이 끊겨도 연구를 이어 갈 수 있어요.');
 const updateMessage=()=>announce('새 버전이 준비됐어요. 모든 게임 창을 닫고 다시 열면 적용돼요.');
 navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`,{scope:import.meta.env.BASE_URL,updateViaCache:'none'}).then(registration=>{
  if(registration.waiting)updateMessage();
  function watch(worker:ServiceWorker|null){
   if(!worker)return;
   worker.addEventListener('statechange',()=>{
    if(worker.state==='installed'){if(navigator.serviceWorker.controller)updateMessage();else readyMessage();}
    if(worker.state==='redundant')announce('오프라인 준비를 마치지 못했어요. 연결된 동안은 계속할 수 있어요.');
   });
  }
  watch(registration.installing);registration.addEventListener('updatefound',()=>watch(registration.installing));
 }).catch(()=>announce('오프라인 준비를 마치지 못했어요. 연결된 동안은 계속할 수 있어요.'));
}
