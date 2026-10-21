import {useMemo,useState} from 'react';
import {parseTerms,solveKmap,kmapLayout,covers} from '../core/kmap.ts';
const col=(i:number)=>`hsl(${(i*53+250)%360} 70% 55%)`;
export default function KMap({load}:{load:(e:string)=>void}){
 const [n,setN]=useState(4),[kind,setKind]=useState<'min'|'max'>('min'),[t,setT]=useState('0,1,2,5,6,7,8,9,10,14'),[d,setD]=useState('');
 const r=useMemo(()=>{const a=parseTerms(t,n),b=parseTerms(d,n);const err=a.error||b.error||(a.list.some(x=>b.list.includes(x))?'A term cannot be both a '+(kind==='min'?'minterm':'maxterm')+' and a don\'t-care':undefined);
  return{err,res:err?null:solveKmap(n,kind,a.list,b.list)}},[n,kind,t,d]);
 const L=kmapLayout(n),res=r.res;
 const val=(m:number)=>res?res.dcs.includes(m)?'X':res.ones.includes(m)?'1':'0':'';
 const label=kind==='min'?'Minterms Σm':'Maxterms ΠM';
 return <>
  <section className="panel"><h2>K-Map Solver</h2>
   <p className="muted">Choose the map size, enter minterms or maxterms (and optional don't-cares) as comma-separated numbers. A is the most significant bit.</p>
   <div className="bar"><div className="seg" role="group" aria-label="Variables">{[2,3,4].map(k=><button key={k} className={n===k?'on':''} aria-pressed={n===k} onClick={()=>setN(k)}>2<sup>{k}</sup> ({k} vars)</button>)}</div>
    <div className="seg" role="group" aria-label="Term type">{(['min','max'] as const).map(k=><button key={k} className={kind===k?'on':''} aria-pressed={kind===k} onClick={()=>setKind(k)}>{k==='min'?'Minterms':'Maxterms'}</button>)}</div></div>
   <label className="lbl">{label} (0 to {(1<<n)-1})<input value={t} onChange={e=>setT(e.target.value)} spellCheck={false} placeholder="e.g. 1,3,5,7"/></label>
   <label className="lbl">Don't-cares (optional)<input value={d} onChange={e=>setD(e.target.value)} spellCheck={false} placeholder="e.g. 4,12"/></label>
   {r.err&&<p className="err" role="alert">{r.err}</p>}</section>
  {res&&<>
   <section className="panel"><h3>Karnaugh map</h3><div className="scroll"><table className="kgrid"><thead><tr><th>{L.rowVars}\{L.colVars}</th>{L.cols.map(c=><th key={c.c}>{c.label}</th>)}</tr></thead>
    <tbody>{L.rows.map(rw=><tr key={rw.r}><th>{rw.label}</th>{L.cols.map(c=>{const m=(rw.r<<L.cb)|c.c,v=val(m);
     return <td key={c.c} className={'kc '+(v==='1'?'h':v==='X'?'x':'l')}><small>{m}</small><b>{v}</b><span className="dots">{res.chosen.map((p,i)=>covers(p,m)?<i key={i} style={{background:col(i)}}/>:null)}</span></td>})}</tr>)}</tbody></table></div>
    <div className="legend">{res.chosen.map((p,i)=><span key={i}><i style={{background:col(i)}}/>{res.sopTerms[i]}</span>)}</div>
    <p className="muted">Colored dots show which SOP group covers each cell (groups may overlap and wrap around the edges). X = don't-care.</p></section>
   <section className="panel"><h3>Solution</h3>
    <p className="mono">SOP: Y = {res.sop}</p><p className="mono">POS: Y = {res.pos}</p>
    <p className="muted">Minterms Σm({res.ones.join(', ')||'none'}) · Maxterms ΠM({res.zeros.join(', ')||'none'}) · Don't-cares d({res.dcs.join(', ')||'none'}) · Prime implicants: {res.primes.map(p=>[...p].map((b,i)=>b==='1'?res.vars[i]:b==='0'?res.vars[i]+"'":'').join('')||'1').join(', ')||'none'}</p>
    <p>{res.verified?<span className="ok">Both forms checked against every cell of the map</span>:<span className="err">Verification failed — do not use</span>}</p>
    <div className="btns"><button onClick={()=>load('Y = '+res.sop)}>Open SOP in Designer</button><button onClick={()=>load('Y = '+res.pos)}>Open POS in Designer</button></div>
    <p className="muted">SOP is solved by grouping 1s (and X where helpful); POS by grouping 0s. Cover selection is essential primes + greedy, so it is not guaranteed globally minimal.</p></section></>}</>}
