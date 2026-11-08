import {createContext,useContext,useReducer,useEffect,useRef,type ReactNode} from 'react';
import {freshSave,demoSave,reduceSave,type Action,type Save} from '../domain/model';
import {loadSave,persistIfUnchanged,SAVE_KEY} from '../services/storage';
interface Session {student:Save;demo:Save|null;blocked:boolean;notice:string}
type SessionAction=Action|{type:'demo';enabled:boolean}|{type:'reset'}|{type:'saveError'}|{type:'saveConflict'};
export function sessionReducer(s:Session,a:SessionAction):Session {
 if(a.type==='demo')return {...s,demo:a.enabled?demoSave(s.student.settings):null};
 if(a.type==='reset')return {...s,student:{...freshSave(),settings:s.student.settings},demo:null,blocked:false,notice:''};
 if(a.type==='saveConflict')return {...s,blocked:true,notice:'다른 창에서 저장 기록이 바뀌었어. 충돌을 막으려고 이 창의 자동 저장을 멈췄어. 다른 창의 기록을 이어가려면 이 창을 새로고침해 줘.'};
 if(a.type==='saveError')return {...s,notice:'자동 저장에 실패했어. 이 창에서는 계속할 수 있지만, 닫으면 최근 진행이 사라질 수 있어.'};
 if(a.type==='settings')return {...s,student:reduceSave(s.student,a),demo:s.demo?reduceSave(s.demo,a,true):null};
 return s.demo?{...s,demo:reduceSave(s.demo,a,true)}:{...s,student:reduceSave(s.student,a)};
}
interface Game {save:Save;student:Save;demo:boolean;notice:string;dispatch:(a:SessionAction)=>void}
const Context=createContext<Game|null>(null);
export function GameProvider({children}:{children:ReactNode}){
 const expected=useRef<string|null>(null);
 const [session,dispatch]=useReducer(sessionReducer,undefined,()=>{let result;try{result=loadSave(localStorage);expected.current=localStorage.getItem(SAVE_KEY);}catch{result={save:freshSave(),blocked:true,notice:'자동 저장을 사용할 수 없어. 이 창에서만 진행할 수 있어.'};}return {student:result.save,demo:null,notice:result.notice,blocked:result.blocked};});
 const failed=useRef(false);
 useEffect(()=>{if(session.blocked)return;const result=persistIfUnchanged(localStorage,session.student,expected.current);if(result==='saved'){expected.current=JSON.stringify(session.student);}else if(result==='conflict'){dispatch({type:'saveConflict'});}else if(!failed.current){failed.current=true;dispatch({type:'saveError'});}},[session.student,session.blocked]);
 useEffect(()=>{const onStorage=(event:StorageEvent)=>{if((event.key===SAVE_KEY||event.key===null)&&event.storageArea===localStorage&&event.newValue!==expected.current)dispatch({type:'saveConflict'});};window.addEventListener('storage',onStorage);return()=>window.removeEventListener('storage',onStorage);},[]);
 function send(a:SessionAction){if(a.type==='reset'){try{localStorage.removeItem(SAVE_KEY);expected.current=null;}catch{/* Memory-only play remains available. */}failed.current=false;}dispatch(a);}
 return <Context.Provider value={{save:session.demo??session.student,student:session.student,demo:!!session.demo,notice:session.notice,dispatch:send}}>{children}</Context.Provider>;
}
export function useGame(){const v=useContext(Context);if(!v)throw new Error('GameProvider missing');return v;}
