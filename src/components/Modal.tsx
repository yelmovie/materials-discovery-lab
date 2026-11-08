import {useEffect,useRef,type ReactNode} from 'react';
import {Icon} from './Icon';
export function Modal({title,children,onClose,className=''}:{title:string;children:ReactNode;onClose:()=>void;className?:string}){
 const ref=useRef<HTMLDialogElement>(null),close=useRef(onClose);close.current=onClose;
 useEffect(()=>{const d=ref.current;if(!d)return;const previous=document.activeElement as HTMLElement|null;d.showModal();d.querySelector<HTMLElement>('[data-initial-focus]')?.focus();return()=>{d.close();if(previous?.isConnected)previous.focus();};},[]);
 return <dialog ref={ref} className={`modal native-modal ${className}`} aria-label={title} onCancel={e=>{e.preventDefault();close.current();}}><button className="modal-close" aria-label="패널 닫기" onClick={onClose}><Icon name="close"/></button><div className="modal-content">{children}</div></dialog>;
}

