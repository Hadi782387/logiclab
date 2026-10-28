import {useState} from 'react';
import {ArrowRight} from 'lucide-react';
import PageHead from './PageHead.tsx';
import {SH,BUB} from './shapes.ts';
import {GATES,gOut,UNIVERSAL} from '../core/gates.ts';import type {GateInfo} from '../core/gates.ts';
const FILTERS=['All','Basic','Universal','Derived'] as const;
function Card({g,load}:{g:GateInfo;load:(s:string)=>void}){
 const [a,setA]=useState(0),[b,setB]=useState(0),two=g.key!=='NOT',o=gOut(g.key,a,b),st={stroke:o?'var(--high)':'var(--muted)'};
 const ys=two?[10,30]:[20],vals=[a,b],set=[setA,setB];
 const rows=two?[[0,0],[0,1],[1,0],[1,1]]:[[0],[1]];
 return <article className="panel gcard"><div className="bar"><h3>{g.key} gate</h3><em className="tag on">{g.group}</em></div>
  <svg viewBox="-34 -4 140 48" role="img" aria-label={`${g.key} gate symbol`} className="gsym">
   {ys.map((y,i)=><g key={i} onClick={()=>set[i](v=>v?0:1)} style={{cursor:'pointer'}} role="button" aria-label={`Toggle input ${i?'B':'A'}`}>
    <line x1={-18} y1={y} x2={0} y2={y} style={{stroke:vals[i]?'var(--high)':'var(--muted)',strokeWidth:2}}/>
    <circle cx={-22} cy={y} r={8} style={{fill:vals[i]?'var(--high)':'var(--glass-strong)',stroke:'var(--muted)'}}/><text x={-22} y={y+3.5} textAnchor="middle" fontSize={10} fontWeight={700} style={{fill:vals[i]?'#06281c':'var(--text)'}}>{vals[i]}</text></g>)}
   <path d={SH[g.key]} style={{fill:'var(--glass-strong)',strokeWidth:2,...st}}/>
   {g.key==='XOR'||g.key==='XNOR'?<path d="M-7,0Q7,20 -7,40" style={{fill:'none',strokeWidth:2,...st}}/>:null}
   {BUB.includes(g.key)?<circle cx={52} cy={20} r={4} style={{fill:'var(--glass-strong)',strokeWidth:2,...st}}/>:<line x1={48} y1={20} x2={56} y2={20} style={{strokeWidth:2,...st}}/>}
   <line x1={BUB.includes(g.key)?56:56} y1={20} x2={80} y2={20} style={{strokeWidth:2,...st}}/>
   <circle cx={90} cy={20} r={9} style={{fill:o?'var(--high)':'var(--glass-strong)',stroke:'var(--muted)'}}/><text x={90} y={24} textAnchor="middle" fontSize={11} fontWeight={800} style={{fill:o?'#06281c':'var(--text)'}}>{o}</text></svg>
  <p className="muted" style={{margin:'0 0 8px'}}>{g.desc}</p>
  <p className="mono" style={{fontSize:15,margin:'0 0 10px'}}>{g.alg}</p>
  <div className="scroll"><table><thead><tr>{two?<><th>A</th><th>B</th></>:<th>A</th>}<th>Y</th></tr></thead><tbody>{rows.map((r,i)=>{const y=gOut(g.key,r[0],r[1]||0),hit=r[0]===a&&(!two||r[1]===b);
    return <tr key={i} className={hit?'hit':''}>{r.map((v,k)=><td key={k}>{v}</td>)}<td className={y?'h fin':'l fin'}>{y}</td></tr>})}</tbody></table></div>
  <p className="muted" style={{margin:'10px 0 0'}}><b>Use:</b> {g.use}</p>
  <p className="muted" style={{margin:'4px 0 0'}}><b>TTL IC:</b> {g.ic} ({g.per} gate{g.per>1?'s':''} per chip)</p>
  <button className="link" onClick={()=>load(two?`A ${g.key} B`:'NOT A')}>Try in Designer <ArrowRight size={14}/></button></article>}
export default function GatesLib({load}:{load:(s:string)=>void}){
 const [f,setF]=useState<typeof FILTERS[number]>('All');
 return <><PageHead title="Logic Gates Library" sub="Symbols, truth tables, Boolean forms and TTL ICs. Tap the inputs on any gate to try it live."/>
  <div className="seg" role="group" aria-label="Gate type" style={{alignSelf:'flex-start'}}>{FILTERS.map(k=><button key={k} className={f===k?'on':''} aria-pressed={f===k} onClick={()=>setF(k)}>{k}</button>)}</div>
  <section className="cards3">{GATES.filter(g=>f==='All'||g.group===f).map(g=><Card key={g.key} g={g} load={load}/>)}</section>
  <section className="panel"><h3>Universal gates</h3><p className="muted">NAND and NOR can each build every other gate, so a whole circuit can use a single IC type.</p>
   <div className="cards">{UNIVERSAL.map(u=><div key={u.title}><div className="sub" style={{margin:'0 0 6px'}}>{u.title}</div>
    {u.rows.map(([a,b])=><div className="urow" key={a}><span>{a}</span><code>{b}</code><button className="link" onClick={()=>load(b)} aria-label={`Try ${b} in Designer`}><ArrowRight size={14}/></button></div>)}</div>)}</div></section></>}
