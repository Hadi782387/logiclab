import type {Graph,GType} from './circuit.ts';
import {simulate} from './circuit.ts';import {envOf} from './logic.ts';
export type SNode={id:string;type:GType;label:string;x:number;y:number;on:number};
export type SEdge={from:string;to:string;port:number};
export type Model={nodes:SNode[];edges:SEdge[];n:number};
export const W=1100,H=620,MAXIN=8,MAXNODES=60;
export const TYPES:GType[]=['INPUT','OUTPUT','NOT','AND','OR','NAND','NOR','XOR','XNOR'];
export const arity=(t:GType)=>t==='INPUT'||t==='CONST'?0:t==='NOT'||t==='OUTPUT'?1:2;
export const outPt=(n:SNode)=>({x:n.x+(n.type==='INPUT'?44:56),y:n.y+20});
export const inPt=(n:SNode,p:number)=>({x:n.x,y:n.y+(arity(n.type)===1?20:p?30:10)});
export const toGraph=(m:Model):Graph=>({nodes:m.nodes.map(({id,type,label})=>({id,type,label})),edges:m.edges});
export const envOfModel=(m:Model)=>Object.fromEntries(m.nodes.filter(n=>n.type==='INPUT').map(n=>[n.label,n.on])) as Record<string,number>;
export function reaches(edges:SEdge[],a:string,b:string){const seen=new Set<string>(),st=[a];
 while(st.length){const x=st.pop()!;if(x===b)return true;if(seen.has(x))continue;seen.add(x);edges.forEach(e=>{if(e.from===x)st.push(e.to)})}return false}
export function exprOf(g:Graph,id:string,top=true,d=0):string{
 const n=g.nodes.find(x=>x.id===id);if(!n||d>40)return '?';
 if(n.type==='INPUT')return n.label;
 const src=(p:number)=>{const e=g.edges.find(x=>x.to===id&&x.port===p);return e?exprOf(g,e.from,false,d+1):'?'};
 if(n.type==='OUTPUT')return src(0);
 if(n.type==='NOT')return 'NOT '+src(0);
 const s=`${src(0)} ${n.type} ${src(1)}`;return top?s:`(${s})`}
export function truthOf(m:Model){
 const ins=m.nodes.filter(n=>n.type==='INPUT').sort((a,b)=>a.label.localeCompare(b.label)),outs=m.nodes.filter(n=>n.type==='OUTPUT').sort((a,b)=>a.label.localeCompare(b.label));
 if(!ins.length||!outs.length)return null;
 const g=toGraph(m),vars=ins.map(i=>i.label),rows=[];
 for(let k=0;k<1<<vars.length;k++){const e=envOf(vars,k),r=simulate(g,e);rows.push({inp:vars.map(v=>e[v]),out:outs.map(o=>r.values[o.id]||0)})}
 return{vars,outs:outs.map(o=>o.label),rows}}
const N=(id:string,type:GType,label:string,x:number,y:number):SNode=>({id,type,label,x,y,on:0});
export const halfAdder=():Model=>({n:20,nodes:[N('a','INPUT','A',30,50),N('b','INPUT','B',30,150),N('g1','XOR','G1',220,50),N('g2','AND','G2',220,170),N('o1','OUTPUT','Y',430,60),N('o2','OUTPUT','Z',430,180)],
 edges:[{from:'a',to:'g1',port:0},{from:'b',to:'g1',port:1},{from:'a',to:'g2',port:0},{from:'b',to:'g2',port:1},{from:'g1',to:'o1',port:0},{from:'g2',to:'o2',port:0}]});
export const fullAdder=():Model=>({n:20,nodes:[N('a','INPUT','A',30,40),N('b','INPUT','B',30,130),N('c','INPUT','C',30,260),N('x1','XOR','G1',190,60),N('a1','AND','G2',190,170),N('x2','XOR','G3',360,110),N('a2','AND','G4',360,250),N('r','OR','G5',520,210),N('o1','OUTPUT','Y',680,110),N('o2','OUTPUT','Z',680,220)],
 edges:[{from:'a',to:'x1',port:0},{from:'b',to:'x1',port:1},{from:'a',to:'a1',port:0},{from:'b',to:'a1',port:1},{from:'x1',to:'x2',port:0},{from:'c',to:'x2',port:1},{from:'x1',to:'a2',port:0},{from:'c',to:'a2',port:1},{from:'a1',to:'r',port:0},{from:'a2',to:'r',port:1},{from:'x2',to:'o1',port:0},{from:'r',to:'o2',port:0}]});
export function sane(x:unknown):Model|null{
 const m=x as Model;if(!m||!Array.isArray(m.nodes)||!Array.isArray(m.edges)||m.nodes.length>MAXNODES||m.edges.length>200)return null;
 const ids=new Set<string>();
 for(const n of m.nodes){if(!n||typeof n.id!=='string'||!TYPES.includes(n.type)||typeof n.label!=='string'||!Number.isFinite(n.x)||!Number.isFinite(n.y)||ids.has(n.id))return null;ids.add(n.id)}
 const byId=new Map(m.nodes.map(n=>[n.id,n]));
 for(const e of m.edges){const t=byId.get(e.to),f=byId.get(e.from);if(!t||!f||f.type==='OUTPUT'||!(e.port>=0&&e.port<arity(t.type)))return null}
 return{nodes:m.nodes.map(n=>({id:n.id,type:n.type,label:n.label.slice(0,12),x:n.x,y:n.y,on:n.on?1:0})),edges:m.edges.map(e=>({from:e.from,to:e.to,port:e.port})),n:Number.isFinite(m.n)?m.n:m.nodes.length+1}}
