import {useEffect,useState} from 'react';
export type Pref='light'|'dark'|'system';
const KEY='logiclab.theme';
export const PAL={light:{bg:'#e9ebff',wire:'#8b8fb5',high:'#16a97a',low:'#c9cbe6',text:'#2d2a4a',panel:'#ffffff'},dark:{bg:'#1a1a2e',wire:'#8a8fc0',high:'#3ddc97',low:'#3b3d63',text:'#eceaff',panel:'#2a2a45'}};
const read=():Pref=>{try{const v=localStorage.getItem(KEY);return v==='light'||v==='dark'||v==='system'?v:'system'}catch{return 'system'}};
export function useTheme(){
 const [pref,setPref]=useState<Pref>(read);
 const [sys,setSys]=useState(()=>typeof matchMedia!=='undefined'&&matchMedia('(prefers-color-scheme: dark)').matches);
 useEffect(()=>{const m=matchMedia('(prefers-color-scheme: dark)'),f=()=>setSys(m.matches);m.addEventListener('change',f);return()=>m.removeEventListener('change',f)},[]);
 const dark=pref==='dark'||(pref==='system'&&sys);
 useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light'},[dark]);
 const set=(p:Pref)=>{setPref(p);try{localStorage.setItem(KEY,p)}catch{}};
 return{pref,dark,set}}
