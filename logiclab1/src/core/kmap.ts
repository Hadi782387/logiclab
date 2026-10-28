export type KRes={n:number;vars:string[];ones:number[];zeros:number[];dcs:number[];sop:string;pos:string;chosen:string[];sopTerms:string[];posTerms:string[];primes:string[];verified:boolean};
const V=['A','B','C','D'];
export const covers=(p:string,m:number)=>{const b=m.toString(2).padStart(p.length,'0');return [...p].every((c,i)=>c==='-'||c===b[i])};
function qm(n:number,on:number[],dc:number[]){
 if(!on.length)return{primes:[] as string[],chosen:[] as string[]};
 const bits=(m:number)=>m.toString(2).padStart(n,'0');
 let cur=new Set([...on,...dc].map(bits));const primes:string[]=[];
 while(cur.size){const nxt=new Set<string>(),used=new Set<string>(),a=[...cur];
  for(let x=0;x<a.length;x++)for(let y=x+1;y<a.length;y++){let d=-1,ok=true;
   for(let k=0;k<n;k++)if(a[x][k]!==a[y][k]){if(d>=0||a[x][k]==='-'||a[y][k]==='-'){ok=false;break}d=k}
   if(ok&&d>=0){nxt.add(a[x].slice(0,d)+'-'+a[x].slice(d+1));used.add(a[x]);used.add(a[y])}}
  a.forEach(s=>{if(!used.has(s))primes.push(s)});cur=nxt}
 const chosen:string[]=[];
 for(const m of on){const c=primes.filter(p=>covers(p,m));if(c.length===1&&!chosen.includes(c[0]))chosen.push(c[0])}
 let left=on.filter(m=>!chosen.some(p=>covers(p,m)));
 while(left.length){let best=primes[0],bs=-1;for(const p of primes){const s=left.filter(m=>covers(p,m)).length;if(s>bs){bs=s;best=p}}chosen.push(best);left=left.filter(m=>!covers(best,m))}
 return{primes,chosen}}
export function parseTerms(s:string,n:number):{list:number[];error?:string}{
 const list:number[]=[];if(!s.trim())return{list};
 for(const t of s.split(/[,\s]+/).filter(Boolean)){
  if(!/^\d+$/.test(t))return{list:[],error:`"${t}" is not a valid number`};
  const v=Number(t);if(v>=1<<n)return{list:[],error:`${v} is out of range (0 to ${(1<<n)-1})`};
  if(!list.includes(v))list.push(v)}
 return{list:list.sort((a,b)=>a-b)}}
export function solveKmap(n:number,kind:'min'|'max',terms:number[],dcs:number[]):KRes{
 const vars=V.slice(0,n),all=[...Array(1<<n).keys()],dc=new Set(dcs);
 const ones=kind==='min'?terms:all.filter(m=>!terms.includes(m)&&!dc.has(m));
 const zeros=kind==='max'?terms:all.filter(m=>!terms.includes(m)&&!dc.has(m));
 const s=qm(n,ones,dcs),p=qm(n,zeros,dcs);
 const sopT=s.chosen.map(c=>[...c].map((b,i)=>b==='1'?vars[i]:b==='0'?vars[i]+"'":'').join('')||'1');
 const sop=!ones.length?'0':sopT.includes('1')?'1':sopT.join(' + ');
 const posT=p.chosen.map(c=>[...c].map((b,i)=>b==='1'?vars[i]+"'":b==='0'?vars[i]:'').filter(Boolean).join(' + '));
 const pos=!zeros.length?'1':posT.includes('')?'0':posT.length===1&&!posT[0].includes(' ')?posT[0]:posT.map(t=>`(${t})`).join('');
 const sopOk=ones.every(m=>s.chosen.some(c=>covers(c,m)))&&zeros.every(m=>!s.chosen.some(c=>covers(c,m)));
 const posOk=zeros.every(m=>p.chosen.some(c=>covers(c,m)))&&ones.every(m=>!p.chosen.some(c=>covers(c,m)));
 return{n,vars,ones,zeros,dcs,sop,pos,chosen:s.chosen,sopTerms:sopT,posTerms:posT,primes:s.primes,verified:sopOk&&posOk}}
const G=[[0],[0,1],[0,1,3,2]];
export function kmapLayout(n:number){const rb=n===4?2:1,cb=n-rb;
 return{rows:G[rb].map(r=>({r,label:r.toString(2).padStart(rb,'0')})),cols:G[cb].map(c=>({c,label:c.toString(2).padStart(cb,'0')})),cb,rowVars:V.slice(0,rb).join(''),colVars:V.slice(rb,n).join('')}}
