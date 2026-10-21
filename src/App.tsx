import {useMemo,useState,useEffect,useCallback} from 'react';
import {Home,CircuitBoard,Sigma,BookOpen,Settings as Cog,Grid3x3,Sun,Moon,Monitor,ArrowRight} from 'lucide-react';
import {parse,ParseError} from './core/parser.ts';
import {truthTable,toCsv} from './core/logic.ts';
import {buildGraph,verifyGraph,procedure,gateCount,gateTypes} from './core/circuit.ts';
import {minimize} from './core/minimizer.ts';
import {save} from './core/export.ts';
import {useTheme} from './theme.ts';import type {Pref} from './theme.ts';
import KMap from './components/KMap.tsx';
import CircuitView from './components/CircuitView.tsx';
const EX=["A AND B","(A AND B) OR NOT C","(A AND B) OR (C AND D)","NOT(A AND B)","(A OR B) AND (C OR D)","(A XOR B) OR C","A'B + CD","Y = (A · B) + C'","Y = AB + AB'"];
type Page='home'|'designer'|'simplify'|'kmap'|'help'|'settings';
const THEMES:[Pref,string,typeof Sun,string][]=[['light','Light',Sun,'Bright pastel screen'],['dark','Dark',Moon,'Easy on the eyes at night'],['system','System',Monitor,'Follow your device setting']];
export default function App(){
 const [page,setPage]=useState<Page>('home'),[expr,setExpr]=useState("Y = (A AND B) OR NOT C"),th=useTheme();
 const [splash,setSplash]=useState(()=>{try{return !sessionStorage.getItem('logiclab.splash')}catch{return false}});
 const endSplash=useCallback(()=>{setSplash(false);try{sessionStorage.setItem('logiclab.splash','1')}catch{}},[]);
 const nav:[Page,string,typeof Home][]=[['home','Home',Home],['designer','Expression Designer',CircuitBoard],['simplify','Boolean Simplifier',Sigma],['kmap','K-Map Solver',Grid3x3],['help','Syntax Guide',BookOpen],['settings','Settings',Cog]];
 const go=(p:Page)=>{setPage(p);window.scrollTo({top:0})};
 return <div className="app">{splash&&<Splash onDone={endSplash}/>}<header className="topbar"><button className="brandbtn" onClick={()=>go('home')} aria-label="LogicLab home"><span className="logo"><CircuitBoard size={20}/></span><span className="brand">LogicLab<small>From Boolean Expression to Logic Circuit.</small></span></button>
  <div className="seg" role="group" aria-label="Screen theme">{THEMES.map(([k,l,I])=><button key={k} aria-pressed={th.pref===k} className={th.pref===k?'on':''} onClick={()=>th.set(k)} title={l}><I size={16}/><span>{l}</span></button>)}</div></header>
  <div className="shell"><nav aria-label="Main">{nav.map(([k,l,I])=><button key={k} className={page===k?'on':''} aria-current={page===k?'page':undefined} onClick={()=>go(k)}><I size={18}/><span>{l}</span></button>)}</nav>
  <main>{page==='home'?<Landing go={go} load={x=>{setExpr(x);go('designer')}}/>:page==='kmap'?<KMap load={x=>{setExpr(x);go('designer')}}/>:page==='settings'?<Prefs th={th}/>:page==='help'?<Help/>:<Workspace expr={expr} setExpr={setExpr} simplify={page==='simplify'} dark={th.dark}/>}</main></div>
  <footer>LogicLab · parser, circuits and minimizer run entirely in your browser · nothing is uploaded</footer></div>}
function Landing({go,load}:{go:(p:Page)=>void;load:(s:string)=>void}){
 const cards:[Page,string,string,typeof Home][]=[['designer','Expression Designer','Type a Boolean expression and get a verified circuit, truth table and build steps.',CircuitBoard],['simplify','Boolean Simplifier','Quine–McCluskey minimization with an equivalence check and gate-count comparison.',Sigma],['kmap','K-Map Solver','Enter minterms or maxterms for 2, 3 or 4 variables and get SOP and POS from a Karnaugh map.',Grid3x3],['help','Syntax Guide','Operators, precedence, symbols and the limits LogicLab enforces.',BookOpen]];
 return <>
  <section className="hero"><span className="eyebrow">Digital logic design lab</span><h1>From Boolean Expression<br/>to Logic Circuit.</h1>
   <p>Write an expression, see the gate-level circuit, test it with live inputs, and minimize it — every result is checked against the parsed expression.</p>
   <div className="btns big"><button className="cta" onClick={()=>go('designer')}>Open Designer <ArrowRight size={16}/></button><button onClick={()=>go('simplify')}>Try the Simplifier</button></div>
   <div className="stats"><div><b>6</b><span>gate operators</span></div><div><b>≤10</b><span>variables</span></div><div><b>QM</b><span>minimizer</span></div><div><b>100%</b><span>AST-verified</span></div></div></section>
  <section className="cards">{cards.map(([k,t,d,I])=><article className="panel card" key={k}><span className="logo"><I size={20}/></span><h3>{t}</h3><p className="muted">{d}</p><button onClick={()=>go(k)}>Open <ArrowRight size={14}/></button></article>)}</section>
  <section className="panel"><h3>Quick-start examples</h3><p className="muted">Click one to load it in the Designer.</p><div className="chips">{EX.map(x=><button key={x} onClick={()=>load(x)}>{x}</button>)}</div></section>
  <section className="panel"><h3>Roadmap</h3><p className="muted">Planned, not available yet: gates library, drag-and-drop simulator, saved projects, practical-documentation export.</p></section></>}
function Prefs({th}:{th:ReturnType<typeof useTheme>}){return <section className="panel"><h2>Settings</h2><h3>Screen preference</h3>
 <div className="grid3" role="radiogroup" aria-label="Screen theme">{THEMES.map(([k,l,I,d])=><button key={k} role="radio" aria-checked={th.pref===k} className={'opt'+(th.pref===k?' on':'')} onClick={()=>th.set(k)}><I size={22}/><b>{l}</b><span>{d}</span></button>)}</div>
 <p className="muted">Currently showing the {th.dark?'dark':'light'} screen. Your choice is saved in this browser. Exported SVG/PNG circuits use the colors of the screen you export from.</p></section>}
function Workspace({expr,setExpr,simplify,dark}:{expr:string;setExpr:(s:string)=>void;simplify:boolean;dark:boolean}){
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
   <CircuitView dark={dark} g={m.g} env={env} onToggle={l=>setEnv(e=>({...e,[l]:e[l]?0:1}))} name="circuit" title={simplify?'Original circuit':'Circuit (click an input to toggle it)'}/>
   <section className="panel"><h3>Circuit details</h3><p>{r.p.vars.length} inputs · {gateCount(m.g)} gates ({Object.entries(gateTypes(m.g)).map(([k,v])=>`${v}× ${k}`).join(', ')||'none'}) · output {r.p.label}</p></section>
   {mn&&<section className="panel"><h3>Quine–McCluskey result</h3>
    <p className="mono">{r.p.label} = {mn.x.expr}</p>
    <p className="muted">Minterms: {mn.x.minterms.join(', ')||'none'} · Prime implicants: {mn.x.primes.join(', ')||'none'} · Selected cover: {mn.x.chosen.join(', ')||'constant'}</p>
    <p>{mn.x.verified?<span className="ok">Equivalent to the original for every input combination</span>:<span className="err">NOT equivalent — do not use</span>}</p>
    <p className="muted">Original: {gateCount(m.g)} gates · Simplified: {gateCount(mn.g)} gates. Fewer gates does not always mean lower cost or delay: fan-in, chip family, loading and propagation delay also matter. Cover selection is essential primes + greedy, which is not guaranteed globally minimal.</p>
    <CircuitView dark={dark} g={mn.g} env={env} name="simplified" title="Simplified circuit"/></section>}
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

function Splash({onDone}:{onDone:()=>void}){
 useEffect(()=>{const t=setTimeout(onDone,1900),k=(e:KeyboardEvent)=>{if(e.key==='Escape'||e.key==='Enter')onDone()};window.addEventListener('keydown',k);return()=>{clearTimeout(t);window.removeEventListener('keydown',k)}},[onDone]);
 return <div className="splash" role="dialog" aria-label="LogicLab intro" onClick={onDone}><div className="sp-card"><span className="logo xl"><CircuitBoard size={40}/></span>
  <svg viewBox="0 0 160 40" width="160" height="40" aria-hidden="true"><path className="sp-wire" pathLength={1} d="M0,12H30M0,28H30M30,4H52A16,16 0 0 1 52,36H30Z M84,20H120"/></svg>
  <div className="sp-title">LogicLab</div><p>From Boolean Expression to Logic Circuit.</p><small>Tap or press Enter to skip</small></div></div>}
