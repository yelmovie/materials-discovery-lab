export type IconName='home'|'back'|'sound'|'muted'|'settings'|'book'|'close'|'star'|'crystal'|'building'|'hand'|'next'|'prev'|'map'|'lock'|'unlock'|'check'|'locate';
export function Icon({name}:{name:IconName}){
 const paths={
 home:<><path d="m3 11 9-8 9 8"/><path d="M5 10v11h5v-7h4v7h5V10"/></>,
 back:<><path d="m10 5-7 7 7 7M3 12h18"/></>,
 sound:<><path d="m11 4-6 5H2v6h3l6 5V4Z"/><path d="M15 8a6 6 0 0 1 0 8m3-12a11 11 0 0 1 0 16"/></>,
 muted:<><path d="m11 4-6 5H2v6h3l6 5V4Z"/><path d="m16 9 6 6m0-6-6 6"/></>,
 settings:<><path d="m9 3-1 3-3 1-2 3 2 2-1 3 2 3 3-1 3 4 3-4 3 1 2-3-1-3 2-2-2-3-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/></>,
 book:<><path d="M12 5c-3-2-6-2-10-1v16c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1Z"/><path d="M12 5v16"/></>,
 close:<path d="m5 5 14 14M19 5 5 19"/>,
 star:<path d="m12 2 3 6.2 6.8 1-4.9 4.8 1.2 6.8-6.1-3.2-6.1 3.2 1.2-6.8-4.9-4.8 6.8-1Z" fill="currentColor"/>,
 crystal:<><path d="m12 1 7 7 2 9-9 6-9-6 2-9Z" fill="currentColor" fillOpacity=".3"/><path d="m12 1 3 10-3 12-3-12Zm-7 7 4 3h6l4-3M3 17l6-6m6 0 6 6"/></>,
 building:<><path d="m2 10 10-8 10 8M5 9v13h14V9M10 22v-7h4v7"/><path d="M7 10h2m6 0h2"/></>,
 hand:<><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12m0-1.5v-6a1.5 1.5 0 0 1 3 0V12m0-5.5a1.5 1.5 0 0 1 3 0V12m0-3.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1.2a7 7 0 0 1-5.6-2.8L3.5 15.6a1.6 1.6 0 0 1 2.4-2.1L8 15.5"/></>,
 next:<path d="m5 5 7 7-7 7m7-14 7 7-7 7"/>,
 prev:<path d="m19 5-7 7 7 7M12 5l-7 7 7 7"/>,
 map:<><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15m6-12v15"/></>,
 lock:<><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>,
 unlock:<><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/></>,
 check:<path d="m4 13 5 5L20 6"/>,
 locate:<><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></>,
 };
 return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
