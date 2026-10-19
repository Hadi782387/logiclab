import {useMemo,useState} from 'react';
import {parse,ParseError} from './core/parser.ts';
import {truthTable,toCsv} from './core/logic.ts';
import {buildGraph,verifyGraph,procedure,gateCount,gateTypes} from './core/circuit.ts';
import {minimize} from './core/minimizer.ts';
import {save} from './core/export.ts';
import CircuitView from './components/CircuitView.tsx';
const EX=["A AND B","(A AND B) OR NOT C","(A AND B) OR (C AND D)","NOT(A AND B)","(A OR B) AND (C OR D)","(A XOR B) OR C","A'B + CD","Y = (A · B) + C'","Y = AB + AB'"];
type Page='designer'|'simplify'|'help';
export default function App(){
 const [page,setPage]=useState<Page>('designer'),[expr,setExpr]=useState("Y = (A AND B) OR NOT C");
 const nav:[Page,string][]=[['designer','Expression Designer'],['simplify','Boolean Simplifier'],['help','Syntax Guide']];
 return <div className="shell"><nav><div className="brand">LogicLab<small>From Boolean Expression to Logic Circuit.</small></div>
  {nav.map(([k,l])=><button key={k} className={page===k?'on':''} onClick={()=>setPage(k)}>{l}</button>)}</nav>
  <main>{page==='help'?<Help/>:<Workspace expr={expr} setExpr={setExpr} simplify={page==='simplify'}/>}</main></div>}
function Workspace({expr,setExpr,simplify}:{expr:string;setExpr:(s:string)=>void;simplify:boolean}){
 const [env,setEnv]=useState<Record<string,number>>({});
 const r=useMemo(()=>{try{return{p:parse(expr),err:null}}catch(e){return{p:null,err:e as ParseError}}},[expr]);
 const m=useMemo(()=>{if(!r.p)return null;const g=buildGraph(r.p.ast,r.p.vars,r.p.label);return{g,tt:truthTable(r.p.ast,r.p.vars),ok:verifyGraph(r.p.ast,r.p.vars,g),proc:procedure(g)}},[r.p]);
 const mn=useMemo(()=>{if(!simplify||!r.p)return null;const x=minimize(r.p.ast,r.p.vars),g=buildGraph(parse(x.expr).ast,r.p.vars,r.p.label);return{x,g}},[simplify,r.p]);
 return <>
  <section className="panel"><h2>{simplify?'Boolean Simplifier':'Expression Designer'}</h2>
   <input aria-label="Boolean expression" value={expr} onChange={e=>setExpr(e.target.value)} spellCheck={false}/>
   {r.err&&<p className="err" role="alert">Syntax error at position {r.err.pos+1}: {r.err.message}</p>}
   <div className="chips">{EX.map(x=><button key={x} onClick={()=>setExpr(x)}>{x}</button>)}</div></section>
  {r.p&&m&&<>
   <p className="muted">Output <b>{r.p.label}</b> = {expr.replace(/^\s*[A-Za-z]\s*=/,'')} · Variables: {r.p.vars.join(', ')||'none'} · {m.ok?<span className="ok">Circuit verified against AST for all {m.tt.rows.length} rows</span>:<span className="err">Verification FAILED (development error)</span>}</p>
   <CircuitView g={m.g} env={env} onToggle={l=>setEnv(e=>({...e,[l]:e[l]?0:1}))} name="circuit" title={simplify?'Original circuit':'Circuit (click an input to toggle it)'}/>
   <section className="panel"><h3>Circuit details</h3><p>{r.p.vars.length} inputs · {gateCount(m.g)} gates ({Object.entries(gateTypes(m.g)).map(([k,v])=>`${v}× ${k}`).join(', ')||'none'}) · {gateCount(m.g)} intermediate/output-driving signals · output {r.p.label}</p></section>
   {mn&&<section className="panel"><h3>Quine–McCluskey result</h3>
    <p className="mono">{r.p.label} = {mn.x.expr}</p>
    <p className="muted">Minterms: {mn.x.minterms.join(', ')||'none'} · Prime implicants: {mn.x.primes.join(', ')||'none'} · Selected cover: {mn.x.chosen.join(', ')||'constant'}</p>
    <p>{mn.x.verified?<span className="ok">Equivalent to the original for every input combination</span>:<span className="err">NOT equivalent — do not use</span>}</p>
    <p className="muted">Original: {gateCount(m.g)} gates · Simplified: {gateCount(mn.g)} gates. Fewer gates does not always mean lower cost or delay: fan-in, chip family, loading and propagation delay also matter. Cover selection is essential primes + greedy, which is not guaranteed globally minimal.</p>
    <CircuitView g={mn.g} env={env} name="simplified" title="Simplified circuit"/></section>}
   {!simplify&&<section className="panel"><h3>Construction procedure</h3><ol>{m.proc.map((s,i)=><li key={i}>{s}</li>)}</ol><p className="muted">Logical construction only. No IC part numbers or pin mapping are generated.</p></section>}
   <section className="panel"><div className="bar"><h3>Truth table</h3><div className="btns"><button onClick={()=>save('truth_table.csv',toCsv(m.tt,r.p!.label),'text/csv')}>CSV</button>
    <button onClick={()=>navigator.clipboard?.writeText(toCsv(m.tt,r.p!.label).replace(/,/g,'\t'))}>Copy</button></div></div>
    <div className="scroll"><table><thead><tr>{m.tt.vars.map(v=><th key={v}>{v}</th>)}{m.tt.mids.map(v=><th key={v} className="mid">{v}</th>)}<th>{r.p.label}</th></tr></thead>
    <tbody>{m.tt.rows.map((row,i)=>{const hit=row.inputs.every((b,k)=>b===(env[m.tt.vars[k]]?1:0));
     return <tr key={i} className={hit?'hit':''}>{[...row.inputs,...row.mids,row.out].map((b,k,a)=><td key={k} className={b?'h':'l'+(k===a.length-1?' fin':'')}>{b}</td>)}</tr>})}</tbody></table></div></section></>}</>}
function Help(){return <section className="panel"><h2>Syntax guide</h2><ul>
 <li>Variables are single letters (case-insensitive, shown uppercase). Letters written together, like <code>CD</code>, mean C AND D. Constants: 0, 1.</li>
 <li>AND: <code>AND · * &amp; ∧</code> or implicit (<code>AB</code>). OR: <code>OR + | ∨</code>. NOT: <code>NOT ! ~ ¬</code> or postfix <code>'</code>. XOR: <code>XOR ⊕ ^</code>. Also NAND, NOR, XNOR (words only).</li>
 <li>Precedence (high→low): parentheses, NOT, AND/NAND, XOR/XNOR, OR/NOR. AND, OR, XOR are left-associative.</li>
 <li>NAND, NOR, XNOR are not associative: chaining them with another operator of the same level is rejected as ambiguous; add parentheses.</li>
 <li>Optional output label: <code>Y = A AND B</code>. Limits: 200 characters, 30 nesting levels, 10 variables (1024 truth-table rows).</li></ul></section>}
