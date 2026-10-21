import type {Ast,Op} from './parser.ts';
export const gate=(op:Op,a:number,b:number):0|1=>({AND:a&b,OR:a|b,XOR:a^b,NAND:1-(a&b),NOR:1-(a|b),XNOR:1-(a^b)}[op] as 0|1);
export function evalAst(a:Ast,env:Record<string,number>):0|1{
 switch(a.t){case 'var':return env[a.name]?1:0;case 'const':return a.v;case 'not':return evalAst(a.a,env)?0:1;
  default:return gate(a.op,evalAst(a.l,env),evalAst(a.r,env))}}
export function show(a:Ast,top=true):string{
 if(a.t==='var')return a.name;if(a.t==='const')return String(a.v);
 if(a.t==='not')return `NOT ${show(a.a,false)}`;
 const s=`${show(a.l,false)} ${a.op} ${show(a.r,false)}`;return top?s:`(${s})`}
export function subExprs(a:Ast,root=true,seen=new Map<string,Ast>()):Ast[]{
 if(a.t==='not')subExprs(a.a,false,seen);if(a.t==='bin'){subExprs(a.l,false,seen);subExprs(a.r,false,seen)}
 if(!root&&(a.t==='not'||a.t==='bin')&&!seen.has(show(a)))seen.set(show(a),a);return [...seen.values()]}
export const MAX_TT_VARS=10;
export type TT={vars:string[];mids:string[];rows:{inputs:number[];mids:number[];out:number}[]};
export const envOf=(vars:string[],m:number)=>Object.fromEntries(vars.map((v,i)=>[v,(m>>(vars.length-1-i))&1]));
export function truthTable(ast:Ast,vars:string[]):TT{
 if(vars.length>MAX_TT_VARS)throw new Error(`Full truth table limited to ${MAX_TT_VARS} variables (2^${vars.length} rows)`);
 const subs=subExprs(ast),rows=[];
 for(let m=0;m<1<<vars.length;m++){const e=envOf(vars,m);rows.push({inputs:vars.map(v=>e[v]),mids:subs.map(s=>evalAst(s,e)),out:evalAst(ast,e)})}
 return{vars,mids:subs.map(s=>show(s)),rows}}
export const toCsv=(t:TT,label:string)=>[[...t.vars,...t.mids,label].join(','),...t.rows.map(r=>[...r.inputs,...r.mids,r.out].join(','))].join('\n');
