export const DIG='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export type Num={neg:boolean;ip:string;fp:string;int:bigint;fn:bigint;fd:bigint};
export function parseNum(raw:string,base:number):Num|{error:string}{
 let s=raw.trim().replace(/[\s_]/g,'');let neg=false;
 if(s[0]==='-'||s[0]==='+'){neg=s[0]==='-';s=s.slice(1)}
 const pre:Record<number,RegExp>={2:/^0b/i,8:/^0o/i,16:/^0x/i};if(pre[base])s=s.replace(pre[base],'');
 if(!s)return{error:'Enter a number'};
 const parts=s.split('.');if(parts.length>2)return{error:'Only one radix point is allowed'};
 const [ip,fp='']=parts;if(!ip&&!fp)return{error:'Enter a number'};
 if(ip.length>64||fp.length>32)return{error:'Number is too long (max 64 integer and 32 fractional digits)'};
 for(const c of ip+fp){const v=DIG.indexOf(c.toUpperCase());if(v<0||v>=base)return{error:`"${c}" is not a valid base-${base} digit`}}
 const B=BigInt(base);let int=0n;for(const c of ip)int=int*B+BigInt(DIG.indexOf(c.toUpperCase()));
 let fn=0n;for(const c of fp)fn=fn*B+BigInt(DIG.indexOf(c.toUpperCase()));
 const fd=B**BigInt(fp.length);
 return{neg:neg&&(int>0n||fn>0n),ip:ip.toUpperCase()||'0',fp:fp.toUpperCase(),int,fn,fd}}
export function toBase(p:Num,base:number,maxFrac=12){
 let t=(p.neg?'-':'')+p.int.toString(base).toUpperCase(),exact=true;
 if(p.fn>0n){const B=BigInt(base);let n=p.fn,f='';for(let i=0;i<maxFrac&&n>0n;i++){n*=B;f+=DIG[Number(n/p.fd)];n%=p.fd}exact=n===0n;t+='.'+f}
 return{text:t,exact}}
export const isInt=(p:Num)=>p.fn===0n;
export const bcd=(p:Num)=>p.int.toString().split('').map(d=>(+d).toString(2).padStart(4,'0')).join(' ');
export const excess3=(p:Num)=>p.int.toString().split('').map(d=>(+d+3).toString(2).padStart(4,'0')).join(' ');
export function gray(p:Num){const b=p.int.toString(2);return((p.int^(p.int>>1n)).toString(2)).padStart(b.length,'0')}
export function signed(v:bigint,w:number){
 const lim=1n<<BigInt(w-1),mod=1n<<BigInt(w),abs=v<0n?-v:v,pad=(x:bigint,n=w)=>x.toString(2).padStart(n,'0');
 const sm=abs<lim,oc=abs<lim,tc=v>=-lim&&v<lim;
 return{
  sm:sm?(v<0n?'1':'0')+pad(abs,w-1):null,
  oc:oc?pad(v<0n?(mod-1n-abs):abs):null,
  tc:tc?pad(v<0n?mod+v:v):null,
  range:`2's complement: ${-lim} to ${lim-1n} · 1's complement and sign-magnitude: ${-(lim-1n)} to ${lim-1n}`}}
export function toDecimalSteps(p:Num,base:number):string[]{
 const L:string[]=[],val=(c:string)=>DIG.indexOf(c);
 if(p.ip.length+p.fp.length>24)return['Number is too long to show every term.'];
 [...p.ip].forEach((c,i)=>{const e=p.ip.length-1-i;L.push(`${c} × ${base}^${e} = ${BigInt(val(c))*BigInt(base)**BigInt(e)}`)});
 [...p.fp].forEach((c,i)=>L.push(`${c} × ${base}^-${i+1} = ${val(c)}/${base**(i+1)}`));
 return L}
export function divisionSteps(p:Num,base:number):string[]{
 const L:string[]=[],B=BigInt(base);let n=p.int;
 if(n===0n)return['0 ÷ '+base+' = 0 remainder 0'];
 for(let i=0;n>0n&&i<80;i++){const q=n/B,r=n%B;L.push(`${n} ÷ ${base} = ${q}, remainder ${r}${r>9n?` (${DIG[Number(r)]})`:''}`);n=q}
 return L}
export function multiplySteps(p:Num,base:number,max=8):string[]{
 const L:string[]=[],B=BigInt(base);let n=p.fn;
 for(let i=0;i<max&&n>0n;i++){const x=n*B,d=x/p.fd;L.push(`${(Number(n)/Number(p.fd)).toFixed(8).replace(/0+$/,'')} × ${base} = ${(Number(x)/Number(p.fd)).toFixed(8).replace(/0+$/,'').replace(/\.$/,'')} → digit ${DIG[Number(d)]}`);n=x%p.fd}
 return L}
