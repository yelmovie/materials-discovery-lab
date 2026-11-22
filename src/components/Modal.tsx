import {useEffect,useRef,type ReactNode} from 'react';
import {Icon} from './Icon';
// closeButton=false: 위쪽 × 없이 창 안의 「닫기」 단추와 Esc로만 닫는다(2026-11-22 설정 창 통일).
export function Modal({title,children,onClose,className='',closeButton=true}:{title:string;children:ReactNode;onClose:()=>void;className?:string;closeButton?:boolean}){
 const ref=useRef<HTMLDialogElement>(null),close=useRef(onClose);close.current=onClose;
 useEffect(()=>{const d=ref.current;if(!d)return;const previous=document.activeElement as HTMLElement|null;d.showModal();d.querySelector<HTMLElement>('[data-initial-focus]')?.focus();return()=>{d.close();if(previous?.isConnected)previous.focus();};},[]);
 return <dialog ref={ref} className={`modal native-modal ${className}`} aria-label={title} onCancel={e=>{e.preventDefault();close.current();}}>{closeButton&&<button className="modal-close" aria-label="패널 닫기" onClick={onClose}><Icon name="close"/></button>}<div className="modal-content">{children}</div></dialog>;
}

