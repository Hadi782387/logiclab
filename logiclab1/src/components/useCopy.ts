import {useState} from 'react';
export function useCopy(){
 const [k,setK]=useState('');
 return{k,copy:(id:string,t:string)=>{navigator.clipboard?.writeText(t).then(()=>{setK(id);setTimeout(()=>setK(''),1400)}).catch(()=>{})}}}
