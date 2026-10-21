import {parse} from './parser.ts';import type {Ast} from './parser.ts';
import {evalAst,envOf} from './logic.ts';
export type Min={expr:string;primes:string[];chosen:string[];minterms:number[];verified:boolean};
export function minimize(ast:Ast,vars:string[]):Min{
 const n=vars.length,total=1<<n,mins:number[]=[];
 for(let m=0;m<total;m++)if(evalAst(ast,envOf(vars,m)))mins.push(m);
 const fmt=(p:string)=>[...p].map((c,i)=>c==='1'?vars[i]:c==='0'?vars[i]+"'":'').join('');
 const done=(expr:string,primes:string[],chosen:string[]):Min=>{
  const s=parse(expr).ast;let ok=true;for(let m=0;m<total;m++){const e=envOf(vars,m);if(evalAst(s,e)!==evalAst(ast,e))ok=false}
  return{expr,primes:primes.map(fmt),chosen:chosen.map(fmt),minterms:mins,verified:ok}};
 if(!mins.length)return done('0',[],[]);if(mins.length===total)return done('1',[],[]);
 let cur=new Set(mins.map(m=>m.toString(2).padStart(n,'0')));const primes:string[]=[];
 while(cur.size){const nxt=new Set<string>(),used=new Set<string>(),a=[...cur];
  for(let x=0;x<a.length;x++)for(let y=x+1;y<a.length;y++){let d=-1,ok=true;
   for(let k=0;k<n;k++)if(a[x][k]!==a[y][k]){if(d>=0||a[x][k]==='-'||a[y][k]==='-'){ok=false;break}d=k}
   if(ok&&d>=0){nxt.add(a[x].slice(0,d)+'-'+a[x].slice(d+1));used.add(a[x]);used.add(a[y])}}
  a.forEach(s=>{if(!used.has(s))primes.push(s)});cur=nxt}
 const cov=(p:string,m:number)=>{const b=m.toString(2).padStart(n,'0');return [...p].every((c,i)=>c==='-'||c===b[i])};
 const chosen:string[]=[];
 for(const m of mins){const c=primes.filter(p=>cov(p,m));if(c.length===1&&!chosen.includes(c[0]))chosen.push(c[0])}
 let left=mins.filter(m=>!chosen.some(p=>cov(p,m)));
 while(left.length){let best=primes[0],bs=-1;for(const p of primes){const s=left.filter(m=>cov(p,m)).length;if(s>bs){bs=s;best=p}}chosen.push(best);left=left.filter(m=>!cov(best,m))}
 return done(chosen.map(fmt).join(' + '),primes,chosen)}
