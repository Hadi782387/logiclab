import type {Ast,Op} from './parser.ts';
import {show,gate,evalAst,envOf} from './logic.ts';
export type GType='INPUT'|'OUTPUT'|'CONST'|'NOT'|Op;
export type GNode={id:string;type:GType;label:string;expr?:string};
export type GEdge={from:string;to:string;port:number};
export type Graph={nodes:GNode[];edges:GEdge[]};
export const isGate=(t:GType)=>t!=='INPUT'&&t!=='OUTPUT'&&t!=='CONST';
export function buildGraph(ast:Ast,vars:string[],label:string):Graph{
 const nodes:GNode[]=[],edges:GEdge[]=[],memo=new Map<string,string>();let n=0;
 vars.forEach(v=>nodes.push({id:'in_'+v,type:'INPUT',label:v}));
 const add=(type:GType,l:string,expr?:string)=>{const id=type==='CONST'?'c'+(++n):'g'+(++n);nodes.push({id,type,label:isGate(type)?'G'+n:l,expr});return id};
 function build(a:Ast):string{
  if(a.t==='var')return 'in_'+a.name;
  const k=show(a);if(memo.has(k))return memo.get(k)!;
  let id:string;
  if(a.t==='const')id=add('CONST',String(a.v));
  else if(a.t==='not'){const s=build(a.a);id=add('NOT','NOT',k);edges.push({from:s,to:id,port:0})}
  else{const l=build(a.l),r=build(a.r);id=add(a.op,a.op,k);edges.push({from:l,to:id,port:0},{from:r,to:id,port:1})}
  memo.set(k,id);return id}
 const root=build(ast);nodes.push({id:'out',type:'OUTPUT',label});edges.push({from:root,to:'out',port:0});
 return{nodes,edges}}
export function simulate(g:Graph,inp:Record<string,number>):{values:Record<string,0|1>;error?:string}{
 const values:Record<string,0|1>={},busy=new Set<string>();let error:string|undefined;
 const byId=new Map(g.nodes.map(x=>[x.id,x]));
 function val(id:string):0|1{
  if(id in values)return values[id];
  if(busy.has(id)){error=`Cycle detected at ${id}`;return 0}
  const nd=byId.get(id)!;busy.add(id);let v:0|1;
  if(nd.type==='INPUT')v=inp[nd.label]?1:0;
  else if(nd.type==='CONST')v=nd.label==='1'?1:0;
  else{const need=nd.type==='NOT'||nd.type==='OUTPUT'?1:2,src:number[]=[];
   for(let p=0;p<need;p++){const e=g.edges.find(x=>x.to===id&&x.port===p);if(!e){error=`${nd.label} has a disconnected input (port ${p+1})`;src.push(0)}else src.push(val(e.from))}
   v=nd.type==='OUTPUT'?src[0] as 0|1:nd.type==='NOT'?(src[0]?0:1):gate(nd.type as Op,src[0],src[1])}
  busy.delete(id);values[id]=v;return v}
 g.nodes.forEach(x=>val(x.id));return{values,error}}
export function verifyGraph(ast:Ast,vars:string[],g:Graph):boolean{
 for(let m=0;m<1<<vars.length;m++){const e=envOf(vars,m),r=simulate(g,e);if(r.error||r.values['out']!==evalAst(ast,e))return false}return true}
export const gateCount=(g:Graph)=>g.nodes.filter(x=>isGate(x.type)).length;
export const gateTypes=(g:Graph)=>{const c:Record<string,number>={};g.nodes.filter(x=>isGate(x.type)).forEach(x=>c[x.type]=(c[x.type]||0)+1);return c};
export function procedure(g:Graph):string[]{
 const nm=(id:string)=>{const x=g.nodes.find(y=>y.id===id)!;return x.type==='INPUT'?`input ${x.label}`:x.type==='CONST'?`constant ${x.label}`:`the output of ${x.label}`};
 const ins=g.nodes.filter(x=>x.type==='INPUT').map(x=>x.label),out=g.nodes.find(x=>x.type==='OUTPUT')!;
 const s=[ins.length?`Identify the inputs: ${ins.join(', ')}.`:'The expression has no input variables (it is constant).'];
 for(const x of g.nodes.filter(y=>isGate(y.type))){
  const src=g.edges.filter(e=>e.to===x.id).sort((a,b)=>a.port-b.port).map(e=>nm(e.from));
  s.push(`Connect ${src.join(' and ')} to ${/^[AOX]/.test(x.type)?'an':'a'} ${x.type} gate (${x.label}). Its output is the signal: ${x.expr}.`)}
 const last=g.edges.find(e=>e.to===out.id)!;
 s.push(`Connect ${nm(last.from)} to the output ${out.label}.`,'Verify the circuit using the truth table.');
 return s}
export type Pos={x:number;y:number};
export function layout(g:Graph){
 const src=(id:string)=>g.edges.filter(e=>e.to===id).map(e=>e.from),lvl:Record<string,number>={};
 const L=(id:string):number=>lvl[id]??(lvl[id]=Math.max(-1,...src(id).map(L))+1);
 g.nodes.forEach(x=>L(x.id));
 const max=Math.max(...Object.values(lvl)),pos:Record<string,Pos>={};let h=40;
 for(let l=0;l<=max;l++){
  const ns=g.nodes.filter(x=>lvl[x.id]===l).map((x,i)=>({x,y:src(x.id).length?src(x.id).reduce((a,s)=>a+pos[s].y,0)/src(x.id).length:i*64+40})).sort((a,b)=>a.y-b.y);
  let prev=-1e9;for(const o of ns){o.y=Math.max(o.y,prev+64);prev=o.y;pos[o.x.id]={x:60+l*140,y:o.y};h=Math.max(h,o.y+50)}}
 return{pos,w:60+max*140+120,h}}
