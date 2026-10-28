import {useMemo,useState,useEffect,useCallback,useRef} from 'react';
import {Home,CircuitBoard,Sigma,BookOpen,Settings as Cog,Grid3x3,Menu,X,Sun,Moon,Monitor,ArrowRight,Copy,Check,Link2,ShieldCheck,Eraser,Cpu,Binary,Workflow} from 'lucide-react';
import {parse,ParseError} from './core/parser.ts';
import {truthTable,toCsv} from './core/logic.ts';
import {buildGraph,verifyGraph,procedure,gateCount,gateTypes} from './core/circuit.ts';
import {minimize} from './core/minimizer.ts';
import {save} from './core/export.ts';
import {useTheme} from './theme.ts';import type {Pref} from './theme.ts';
import KMap from './components/KMap.tsx';
import PageHead from './components/PageHead.tsx';
import {useCopy} from './components/useCopy.ts';
import GatesLib from './components/GatesLib.tsx';
import NumberConverter from './components/NumberConverter.tsx';
import Simulator from './components/Simulator.tsx';
import DocPanel from './components/DocPanel.tsx';
import CircuitView from './components/CircuitView.tsx';
const EX=["A AND B","(A AND B) OR NOT C","(A AND B) OR (C AND D)","NOT(A AND B)","(A OR B) AND (C OR D)","(A XOR B) OR C","A'B + CD","Y = (A · B) + C'","Y = AB + AB'"];
type Page='home'|'designer'|'simplify'|'kmap'|'sim'|'gates'|'convert'|'help'|'settings';
const THEMES:[Pref,string,typeof Sun,string][]=[['light','Light',Sun,'Bright pastel screen'],['dark','Dark',Moon,'Easy on the eyes at night'],['system','System',Monitor,'Follow your device setting']];
export default function App(){
 const DEF="Y = (A AND B) OR NOT C";
 const [page,setPage]=useState<Page>('home'),[expr,setExpr]=useState(()=>{try{const h=decodeURIComponent(location.hash.slice(1));return h.startsWith('e=')?h.slice(2):localStorage.getItem('logiclab.expr')||DEF}catch{return DEF}}),th=useTheme(),[open,setOpen]=useState(false);
 useEffect(()=>{try{localStorage.setItem('logiclab.expr',expr);history.replaceState(null,'','#e='+encodeURIComponent(expr))}catch{}},[expr]);
 const [splash,setSplash]=useState(()=>{try{return !sessionStorage.getItem('logiclab.splash')}catch{return false}});
 const endSplash=useCallback(()=>{setSplash(false);try{sessionStorage.setItem('logiclab.splash','1')}catch{}},[]);
 useEffect(()=>{if(!open)return;const k=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};window.addEventListener('keydown',k);return()=>window.removeEventListener('keydown',k)},[open]);
 const nav:[Page,string,typeof Home][]=[['home','Home',Home],['designer','Expression Designer',CircuitBoard],['simplify','Boolean Simplifier',Sigma],['kmap','K-Map Solver',Grid3x3],['sim','Circuit Simulator',Workflow],['gates','Logic Gates Library',Cpu],['convert','Number Converter',Binary],['help','Syntax Guide',BookOpen],['settings','Settings',Cog]];
 const go=(p:Page)=>{setPage(p);setOpen(false);window.scrollTo({top:0})};
 const toDesigner=(x:string)=>{setExpr(x);go('designer')};
 return <div className="app"><div className="orb" aria-hidden="true"/>{splash&&<Splash onDone={endSplash}/>}
  <header className="topbar"><button className="menu" aria-label="Open menu" aria-expanded={open} aria-controls="side" onClick={()=>setOpen(true)}><Menu size={20}/></button>
   <button className="brandbtn" onClick={()=>go('home')} aria-label="LogicLab home"><span className="logo"><CircuitBoard size={18}/></span><span className="brand">LogicLab<small>From Boolean Expression to Logic Circuit.</small></span></button>
   <div className="seg" role="group" aria-label="Theme">{THEMES.map(([k,l,I])=><button key={k} aria-pressed={th.pref===k} aria-label={l+' theme'} className={th.pref===k?'on':''} onClick={()=>th.set(k)} title={l}><I size={16}/><span>{l}</span></button>)}</div></header>
  {open&&<div className="scrim" onClick={()=>setOpen(false)}/>}
  <div className="shell"><nav id="side" className={'side'+(open?' open':'')} aria-label="Main"><div className="side-head"><span>Menu</span><button className="x" aria-label="Close menu" onClick={()=>setOpen(false)}><X size={18}/></button></div>
   {nav.map(([k,l,I])=><button key={k} data-tip={l} title={l} className={page===k?'on':''} aria-current={page===k?'page':undefined} onClick={()=>go(k)}><I size={18}/><span>{l}</span></button>)}</nav>
  <main key={page}>{page==='home'?<Landing go={go} load={toDesigner}/>:page==='kmap'?<KMap load={toDesigner}/>:page==='sim'?<Simulator dark={th.dark} load={toDesigner}/>:page==='gates'?<GatesLib load={toDesigner}/>:page==='convert'?<NumberConverter/>:page==='settings'?<Prefs th={th}/>:page==='help'?<Help/>:<Workspace expr={expr} setExpr={setExpr} simplify={page==='simplify'} dark={th.dark}/>}</main></div>
  <footer>LogicLab · parser, circuits and minimizer run entirely in your browser · nothing is uploaded</footer></div>}
const RM:[string,boolean][]=[['Expression Designer',true],['Boolean Simplifier',true],['K-Map Solver',true],['Logic Gates Library',true],['Drag-and-drop Circuit Simulator',true],['Number System Converter',true],['Practical documentation export',true],['Saved Projects (cloud)',false]];
function Landing({go,load}:{go:(p:Page)=>void;load:(s:string)=>void}){
 const cards:[Page,string,string,typeof Home][]=[['designer','Expression Designer','Type a Boolean expression and get a verified circuit, truth table and build steps.',CircuitBoard],['simplify','Boolean Simplifier','Quine–McCluskey minimization with an equivalence check and gate-count comparison.',Sigma],['kmap','K-Map Solver','Enter minterms or maxterms for 2, 3 or 4 variables and get SOP and POS from a Karnaugh map.',Grid3x3],['sim','Circuit Simulator','Drag gates onto a canvas, wire them up and test with live switches. Get the expression and truth table.',Workflow],['gates','Logic Gates Library','All seven gates with symbols, truth tables, Boolean forms and TTL ICs.',Cpu],['convert','Number Converter','Binary, octal, decimal, hex and any base, plus BCD, Gray and complements with steps.',Binary],['help','Syntax Guide','Operators, precedence, symbols and the limits LogicLab enforces.',BookOpen]];
 return <>
  <section className="hero"><span className="eyebrow">Digital logic design lab</span><h1>From Boolean Expression to Logic Circuit.</h1>
   <p>Write an expression, see the gate-level circuit, test it with live inputs, and minimize it. Every generated circuit is checked against the parsed expression.</p>
   <div className="btns cta-row"><button className="cta" onClick={()=>go('designer')}>Open Designer <ArrowRight size={16}/></button><button onClick={()=>go('simplify')}>Try the Simplifier</button></div>
   <div className="stats"><div><b>7</b><span>Logic gates</span></div><div><b>≤10</b><span>Variables</span></div><div><b>QM</b><span>Minimizer</span></div><div><b>100%</b><span>AST-verified</span></div></div></section>
  <section aria-label="Tools" className="cards">{cards.map(([k,t,d,I])=><article className="panel card" key={k}><span className="icon"><I size={20}/></span><h3>{t}</h3><p className="muted">{d}</p><button className="link" onClick={()=>go(k)}>Open <ArrowRight size={14}/></button></article>)}</section>
  <section className="panel"><h3>Quick-start examples</h3><p className="muted">Tap one to load it in the Designer.</p><div className="chips">{EX.map(x=><button key={x} onClick={()=>load(x)}>{x}</button>)}</div></section>
  <section className="panel"><h3>Roadmap</h3><ul className="rm">{RM.map(([n,a])=><li key={n}><span>{n}</span><em className={a?'tag on':'tag'}>{a?'Available':'Coming soon'}</em></li>)}</ul></section></>}
function Prefs({th}:{th:ReturnType<typeof useTheme>}){return <><PageHead title="Settings" sub="Choose how LogicLab looks on this device."/><section className="panel"><h3>Screen preference</h3>
 <div className="opts" role="radiogroup" aria-label="Screen theme">{THEMES.map(([k,l,I,d])=><button key={k} role="radio" aria-checked={th.pref===k} className={'opt'+(th.pref===k?' on':'')} onClick={()=>th.set(k)}><I size={22}/><b>{l}</b><span>{d}</span></button>)}</div>
 <p className="muted">Currently showing the {th.dark?'dark':'light'} screen. Your choice is saved in this browser. Exported SVG/PNG circuits use the colors of the screen you export from.</p></section></>}
const OPS:[string,string][]=[['AND',' AND '],['OR',' OR '],['NOT','NOT '],['XOR',' XOR '],['NAND',' NAND '],['NOR',' NOR '],['XNOR',' XNOR '],['(','('],[')',')'],["'","'"]];
type Fil='all'|'ones'|'zeros';
function Workspace({expr,setExpr,simplify,dark}:{expr:string;setExpr:(s:string)=>void;simplify:boolean;dark:boolean}){
 const [env,setEnv]=useState<Record<string,number>>({}),[fil,setFil]=useState<Fil>('all'),ref=useRef<HTMLInputElement>(null),cp=useCopy();
 const [hist,setHist]=useState<string[]>(()=>{try{return JSON.parse(localStorage.getItem('logiclab.hist')||'[]')}catch{return[]}});
 const r=useMemo(()=>{try{return{p:parse(expr),err:null}}catch(e){return{p:null,err:e as ParseError}}},[expr]);
 const m=useMemo(()=>{if(!r.p)return null;const g=buildGraph(r.p.ast,r.p.vars,r.p.label);return{g,tt:truthTable(r.p.ast,r.p.vars),ok:verifyGraph(r.p.ast,r.p.vars,g),proc:procedure(g)}},[r.p]);
 const mn=useMemo(()=>{if(!simplify||!r.p)return null;const x=minimize(r.p.ast,r.p.vars),g=buildGraph(parse(x.expr).ast,r.p.vars,r.p.label);return{x,g}},[simplify,r.p]);
 useEffect(()=>{if(!r.p)return;const t=setTimeout(()=>setHist(h=>{const e=expr.trim(),n=[e,...h.filter(x=>x!==e)].slice(0,6);try{localStorage.setItem('logiclab.hist',JSON.stringify(n))}catch{}return n}),1200);return()=>clearTimeout(t)},[expr,r.p]);
 const insert=(t:string)=>{const el=ref.current,a=el?.selectionStart??expr.length,b=el?.selectionEnd??expr.length;setExpr(expr.slice(0,a)+t+expr.slice(b));
  requestAnimationFrame(()=>{el?.focus();const c=a+t.length;el?.setSelectionRange(c,c)})};
 const ones=m?m.tt.rows.flatMap((x,i)=>x.out?[i]:[]):[],zeros=m?m.tt.rows.flatMap((x,i)=>x.out?[]:[i]):[];
 const csv=m&&r.p?toCsv(m.tt,r.p.label):'';
 const saved=m&&mn?Math.max(0,Math.round(100*(gateCount(m.g)-gateCount(mn.g))/Math.max(1,gateCount(m.g)))):0;
 return <>
  <PageHead title={simplify?'Boolean Simplifier':'Expression Designer'} sub={simplify?'Minimize an expression with Quine–McCluskey and compare the circuits.':'Turn a Boolean expression into a circuit, truth table and build steps.'}/>
  <section className="panel">
   <input ref={ref} aria-label="Boolean expression" value={expr} onChange={e=>setExpr(e.target.value)} spellCheck={false} autoCapitalize="characters" autoComplete="off"/>
   <div className="tool" role="group" aria-label="Insert operator">{OPS.map(([l,t])=><button key={l} onClick={()=>insert(t)}>{l}</button>)}
    <button onClick={()=>{setExpr('');ref.current?.focus()}} aria-label="Clear"><Eraser size={14}/></button>
    <button onClick={()=>cp.copy('link',location.href)} aria-label="Copy share link">{cp.k==='link'?<Check size={14}/>:<Link2 size={14}/>} {cp.k==='link'?'Link copied':'Share'}</button></div>
   {r.err&&<p className="err" role="alert">Syntax error at position {r.err.pos+1}: {r.err.message}</p>}
   <div className="sub">Examples</div><div className="chips" style={{marginTop:8}}>{EX.map(x=><button key={x} onClick={()=>setExpr(x)}>{x}</button>)}</div>
   {hist.length>0&&<><div className="sub">Recent</div><div className="chips" style={{marginTop:8}}>{hist.map(x=><button key={x} onClick={()=>setExpr(x)}>{x}</button>)}</div></>}</section>
  {r.p&&m&&<>
   <div className="meta"><span>Output <b>{r.p.label}</b> = <b>{expr.replace(/^\s*[A-Za-z]\s*=/,'').trim()}</b></span><span>Variables: <b>{r.p.vars.join(', ')||'none'}</b></span>
    {m.ok?<span className="pill"><ShieldCheck size={14}/>Verified · all {m.tt.rows.length} rows</span>:<span className="pill bad">Verification FAILED (development error)</span>}</div>
   <CircuitView dark={dark} g={m.g} env={env} onToggle={l=>setEnv(e=>({...e,[l]:e[l]?0:1}))} name="circuit" title={simplify?'Original circuit':'Circuit (click an input to toggle it)'}/>
   <section className="panel"><h3>Circuit details</h3><div className="tiles"><div className="tile"><span>Inputs</span><b>{r.p.vars.length}</b></div><div className="tile"><span>Gates</span><b>{gateCount(m.g)}</b></div><div className="tile"><span>Output {r.p.label} (live)</span><b>{(()=>{const row=m.tt.rows.find(x=>x.inputs.every((v,k)=>v===(env[m.tt.vars[k]]?1:0)));return row?row.out:0})()}</b></div></div>
    <p className="muted" style={{margin:0}}>{Object.entries(gateTypes(m.g)).map(([k,v])=>`${v}× ${k}`).join(', ')||'No gates'}</p></section>
   {mn&&<section className="panel"><h3>Quine–McCluskey result</h3>
    <div className="bar"><p className="mono" style={{margin:0}}>{r.p.label} = {mn.x.expr}</p><div className="btns"><button onClick={()=>cp.copy('min',`${r.p!.label} = ${mn.x.expr}`)}>{cp.k==='min'?<Check size={14}/>:<Copy size={14}/>}{cp.k==='min'?'Copied':'Copy'}</button></div></div>
    <div className="tiles"><div className="tile"><span>Original gates</span><b>{gateCount(m.g)}</b></div><div className="tile good"><span>Simplified gates</span><b>{gateCount(mn.g)}</b></div><div className="tile"><span>Gates saved</span><b>{saved}%</b></div></div>
    <p className="muted">Minterms: {mn.x.minterms.join(', ')||'none'} · Prime implicants: {mn.x.primes.join(', ')||'none'} · Selected cover: {mn.x.chosen.join(', ')||'constant'}</p>
    <p>{mn.x.verified?<span className="pill"><ShieldCheck size={14}/>Equivalent for every input combination</span>:<span className="pill bad">NOT equivalent — do not use</span>}</p>
    <p className="muted">Fewer gates does not always mean lower cost or delay: fan-in, chip family, loading and propagation delay also matter. Cover selection is essential primes + greedy, which is not guaranteed globally minimal.</p>
    <CircuitView dark={dark} g={mn.g} env={env} name="simplified" title="Simplified circuit"/></section>}
   {!simplify&&<section className="panel"><h3>Construction procedure</h3><ol>{m.proc.map((s,i)=><li key={i}>{s}</li>)}</ol><p className="muted">Logical construction only. No IC part numbers or pin mapping are generated.</p></section>}
   <section className="panel"><div className="bar"><h3>Truth table</h3><div className="btns"><div className="seg" role="group" aria-label="Filter rows">{(['all','ones','zeros'] as Fil[]).map(k=><button key={k} className={fil===k?'on':''} aria-pressed={fil===k} onClick={()=>setFil(k)}>{k==='all'?'All':k==='ones'?'Output 1':'Output 0'}</button>)}</div>
    <button onClick={()=>save('truth_table.csv',csv,'text/csv')}>CSV</button>
    <button onClick={()=>cp.copy('tt',csv.replace(/,/g,'\t'))}>{cp.k==='tt'?<Check size={14}/>:<Copy size={14}/>}{cp.k==='tt'?'Copied':'Copy'}</button></div></div>
    <div className="scroll" style={{maxHeight:480}}><table><thead><tr>{m.tt.vars.map(v=><th key={v}>{v}</th>)}{m.tt.mids.map(v=><th key={v} className="mid">{v}</th>)}<th>{r.p.label}</th></tr></thead>
    <tbody>{m.tt.rows.map((row,i)=>{if(fil==='ones'&&!row.out||fil==='zeros'&&row.out)return null;const hit=row.inputs.every((b,k)=>b===(env[m.tt.vars[k]]?1:0));
     return <tr key={i} className={hit?'hit':''}>{[...row.inputs,...row.mids,row.out].map((b,k,a)=><td key={k} className={(b?'h':'l')+(k===a.length-1?' fin':'')}>{b}</td>)}</tr>})}</tbody></table></div>
    <p className="muted" style={{marginBottom:0}}>Canonical form · Σm({ones.join(', ')||'none'}) · ΠM({zeros.join(', ')||'none'})</p></section>
   <DocPanel dark={dark} exprText={expr.replace(/^\s*[A-Za-z]\s*=/,'').trim()} base={{label:r.p.label,vars:r.p.vars,tt:m.tt,g:m.g,proc:m.proc,verified:m.ok}}/></>}</>}
function Help(){return <><PageHead title="Syntax guide" sub="How to write expressions, and the limits LogicLab enforces."/><section className="panel"><ul>
 <li>Variables are single letters (case-insensitive, shown uppercase). Letters written together, like <code>CD</code>, mean C AND D. Constants: 0, 1.</li>
 <li>AND: <code>AND · * &amp; ∧</code> or implicit (<code>AB</code>). OR: <code>OR + | ∨</code>. NOT: <code>NOT ! ~ ¬</code> or postfix <code>'</code>. XOR: <code>XOR ⊕ ^</code>. Also NAND, NOR, XNOR (words only).</li>
 <li>Precedence (high→low): parentheses, NOT, AND/NAND, XOR/XNOR, OR/NOR. AND, OR, XOR are left-associative.</li>
 <li>NAND, NOR, XNOR are not associative: chaining them with another operator of the same level is rejected as ambiguous; add parentheses.</li>
 <li>Optional output label: <code>Y = A AND B</code>. Limits: 200 characters, 30 nesting levels, 10 variables (1024 truth-table rows).</li></ul></section></>}
function Splash({onDone}:{onDone:()=>void}){
 useEffect(()=>{const t=setTimeout(onDone,1900),k=(e:KeyboardEvent)=>{if(e.key==='Escape'||e.key==='Enter')onDone()};window.addEventListener('keydown',k);return()=>{clearTimeout(t);window.removeEventListener('keydown',k)}},[onDone]);
 return <div className="splash" role="dialog" aria-label="LogicLab intro" onClick={onDone}><div className="sp-card"><span className="logo xl"><CircuitBoard size={40}/></span>
  <svg viewBox="0 0 160 40" width="160" height="40" aria-hidden="true"><path className="sp-wire" pathLength={1} d="M0,12H30M0,28H30M30,4H52A16,16 0 0 1 52,36H30Z M84,20H120"/></svg>
  <div className="sp-title">LogicLab</div><p>From Boolean Expression to Logic Circuit.</p><small>Tap or press Enter to skip</small></div></div>}
