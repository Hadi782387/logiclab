export type Op='AND'|'OR'|'XOR'|'NAND'|'NOR'|'XNOR';
export type Ast={t:'var';name:string}|{t:'const';v:0|1}|{t:'not';a:Ast}|{t:'bin';op:Op;l:Ast;r:Ast};
export const LIMITS={maxVars:10,maxLen:200,maxDepth:30};
export class ParseError extends Error{pos:number;constructor(m:string,pos:number){super(m);this.pos=pos}}
type K='var'|'const'|Op|'NOT'|'('|')'|"'"|'='|'end';
type Tok={k:K;v?:string;p:number};
const KW:Record<string,K>={AND:'AND',OR:'OR',NOT:'NOT',XOR:'XOR',NAND:'NAND',NOR:'NOR',XNOR:'XNOR'};
const SYM:Record<string,K>={'·':'AND','*':'AND','&':'AND','∧':'AND','+':'OR','|':'OR','∨':'OR','⊕':'XOR','^':'XOR','!':'NOT','~':'NOT','¬':'NOT','(':'(',')':')',"'":"'",'=':'='};
function lex(s:string):Tok[]{
 const out:Tok[]=[];let i=0;
 while(i<s.length){const c=s[i];
  if(/\s/.test(c)){i++;continue}
  if(/[A-Za-z]/.test(c)){let j=i;while(j<s.length&&/[A-Za-z]/.test(s[j]))j++;
   const w=s.slice(i,j),u=w.toUpperCase();
   if(KW[u])out.push({k:KW[u],p:i});else for(let q=0;q<w.length;q++)out.push({k:'var',v:w[q].toUpperCase(),p:i+q});
   i=j;continue}
  if(c==='0'||c==='1'){out.push({k:'const',v:c,p:i});i++;continue}
  if(SYM[c]){out.push({k:SYM[c],p:i});i++;continue}
  throw new ParseError(`Unsupported symbol "${c}"`,i)}
 out.push({k:'end',p:s.length});return out}
export const depth=(a:Ast):number=>a.t==='not'?1+depth(a.a):a.t==='bin'?1+Math.max(depth(a.l),depth(a.r)):1;
export function varsOf(a:Ast,s=new Set<string>()):string[]{if(a.t==='var')s.add(a.name);else if(a.t==='not')varsOf(a.a,s);else if(a.t==='bin'){varsOf(a.l,s);varsOf(a.r,s)}return [...s].sort()}
export function parse(src:string):{ast:Ast;label:string;vars:string[]}{
 if(src.length>LIMITS.maxLen)throw new ParseError(`Expression is longer than ${LIMITS.maxLen} characters`,0);
 const t=lex(src);let i=0,label='Y';
 if(t[0].k==='end')throw new ParseError('Expression is empty',0);
 if(t[0].k==='var'&&t[1].k==='='){label=t[0].v!;i=2}
 const peek=()=>t[i];
 const LV:[Op,Op][]=[['OR','NOR'],['XOR','XNOR'],['AND','NAND']];
 const START:K[]=['var','const','(','NOT'];
 function level(n:number):Ast{
  if(n===3)return unary();
  let l=level(n+1),cnt=0,non=false;
  for(;;){const k=peek().k,isA=k===LV[n][0],isN=k===LV[n][1],imp=n===2&&START.includes(k);
   if(!isA&&!isN&&!imp)return l;
   if(non||(isN&&cnt>0))throw new ParseError(`Ambiguous: use parentheses when chaining ${LV[n][1]} with other ${LV[n][0]}/${LV[n][1]} operators`,peek().p);
   if(!imp)i++;
   const r=level(n+1);l={t:'bin',op:imp?'AND':(k as Op),l,r};cnt++;non=isN}}
 function unary():Ast{
  if(peek().k==='NOT'){i++;return{t:'not',a:unary()}}
  let a=primary();while(peek().k==="'"){i++;a={t:'not',a}}return a}
 function primary():Ast{const k=peek();
  if(k.k==='var'){i++;return{t:'var',name:k.v!}}
  if(k.k==='const'){i++;return{t:'const',v:k.v==='1'?1:0}}
  if(k.k==='('){i++;const e=level(0);if(peek().k!==')')throw new ParseError('Missing closing parenthesis ")"',peek().p);i++;return e}
  if(k.k==='end')throw new ParseError('Expression ends where an operand was expected',k.p);
  throw new ParseError(k.k===')'?'Empty parentheses or missing operand before ")"':`Operator ${k.k} is missing an operand`,k.p)}
 const ast=level(0);
 if(peek().k!=='end')throw new ParseError(peek().k===')'?'Unbalanced parenthesis: extra ")"':`Unexpected ${peek().k}`,peek().p);
 if(depth(ast)>LIMITS.maxDepth)throw new ParseError(`Expression nesting exceeds ${LIMITS.maxDepth} levels`,0);
 const vars=varsOf(ast);
 if(vars.length>LIMITS.maxVars)throw new ParseError(`Too many variables (${vars.length}); limit is ${LIMITS.maxVars}`,0);
 return{ast,label,vars}}
