import {useMemo,useState} from 'react';
import {Copy,Check} from 'lucide-react';
import PageHead from './PageHead.tsx';import {useCopy} from './useCopy.ts';
import {parseNum,toBase,isInt,bcd,excess3,gray,signed,toDecimalSteps,divisionSteps,multiplySteps} from '../core/numbers.ts';
const COMMON:[number,string][]=[[2,'Binary'],[8,'Octal'],[10,'Decimal'],[16,'Hex']];
const BASES=Array.from({length:35},(_,i)=>i+2);
export default function NumberConverter(){
 const [v,setV]=useState('1011.101'),[base,setBase]=useState(2),[w,setW]=useState(8),[tgt,setTgt]=useState(2),cp=useCopy();
 const p=useMemo(()=>parseNum(v,base),[v,base]);
 const Row=({id,label,val}:{id:string;label:string;val:string})=><div className="orow"><span>{label}</span><code>{val}</code><button className="icon-btn" aria-label={`Copy ${label}`} onClick={()=>cp.copy(id,val)}>{cp.k===id?<Check size={15}/>:<Copy size={15}/>}</button></div>;
 const ok=!('error' in p),n=ok?p as Exclude<typeof p,{error:string}>:null;
 const dec=n?parseFloat(toBase(n,10,15).text):0,int=n&&isInt(n);
 const sg=n&&int?signed(n.neg?-n.int:n.int,w):null;
 const swap=(b:number)=>{if(!n||b===base)return;setV(toBase(n,b,16).text);setBase(b)};
 return <><PageHead title="Number System Converter" sub="Binary, octal, decimal, hexadecimal or any base from 2 to 36, with digital-electronics codes and working steps."/>
  <section className="panel"><div className="bar" style={{marginBottom:0}}><div className="seg" role="group" aria-label="Input base">{COMMON.map(([b,l])=><button key={b} className={base===b?'on':''} aria-pressed={base===b} onClick={()=>setBase(b)}>{l}</button>)}</div>
   <label className="inl">Other base <select value={base} onChange={e=>setBase(+e.target.value)} aria-label="Input base">{BASES.map(b=><option key={b} value={b}>{b}</option>)}</select></label></div>
   <label className="lbl">Value in base {base}<input value={v} onChange={e=>setV(e.target.value)} spellCheck={false} autoCapitalize="characters" autoComplete="off" placeholder="e.g. 1011.101"/></label>
   {'error' in p&&<p className="err" role="alert">{p.error}</p>}
   <p className="muted" style={{marginBottom:0}}>Accepts a sign, a radix point and prefixes like 0x, 0b, 0o. Fractions are shown to 12 digits.</p></section>
  {n&&<>
   <section className="panel"><h3>Conversions</h3>{COMMON.map(([b,l])=>{const r=toBase(n,b);return <Row key={b} id={'b'+b} label={`${l} (base ${b})`} val={r.text+(r.exact?'':' …')}/>})}
    {![2,8,10,16].includes(base)&&<Row id="cur" label={`Base ${base} (input)`} val={toBase(n,base).text}/>}
    <div className="chips">{COMMON.filter(([b])=>b!==base).map(([b,l])=><button key={b} onClick={()=>swap(b)}>Use as {l} input</button>)}</div>
    {!toBase(n,2).exact&&<p className="muted">Marked … : the fraction does not terminate in that base, so it is cut off.</p>}</section>
   <section className="panel"><div className="bar"><h3>Codes and signed forms</h3><label className="inl">Bit width <select value={w} onChange={e=>setW(+e.target.value)} aria-label="Bit width">{[4,8,12,16,32].map(b=><option key={b} value={b}>{b}</option>)}</select></label></div>
    {int?<>
     {!n.neg&&<><Row id="bcd" label="BCD (8421)" val={bcd(n)}/><Row id="xs3" label="Excess-3" val={excess3(n)}/><Row id="gray" label="Gray code" val={gray(n)}/></>}
     {n.neg&&<p className="muted">BCD, Excess-3 and Gray code are shown for non-negative integers.</p>}
     <Row id="sm" label={`Sign-magnitude (${w}-bit)`} val={sg!.sm??'out of range'}/><Row id="oc" label={`1's complement (${w}-bit)`} val={sg!.oc??'out of range'}/><Row id="tc" label={`2's complement (${w}-bit)`} val={sg!.tc??'out of range'}/>
     <p className="muted" style={{marginBottom:0}}>{sg!.range}</p></>:<p className="muted" style={{margin:0}}>Codes and complements need a whole number. Remove the fractional part to see them.</p>}</section>
   <section className="panel"><h3>Working</h3>
    {base!==10&&<><div className="sub" style={{margin:'0 0 6px'}}>Base {base} → decimal (positional weights)</div><ul className="steps">{toDecimalSteps(n,base).map((s,i)=><li key={i}>{s}</li>)}</ul><p className="mono">Sum = {isFinite(dec)?dec:'…'}</p></>}
    <div className="bar" style={{marginTop:14}}><div className="sub" style={{margin:0}}>Decimal → base</div><label className="inl"><select value={tgt} onChange={e=>setTgt(+e.target.value)} aria-label="Target base">{BASES.map(b=><option key={b} value={b}>{b}</option>)}</select></label></div>
    {(()=>{const D=toBase(n,10,15),dn=parseNum(D.text.replace('-',''),10);if('error' in dn)return null;const ds=divisionSteps(dn,tgt),ms=n.fn>0n&&D.exact?multiplySteps(dn,tgt):[];
     return <><p className="muted" style={{margin:'0 0 6px'}}>Integer part: divide repeatedly by {tgt}; read the remainders from bottom to top.</p><ul className="steps">{ds.map((s,i)=><li key={i}>{s}</li>)}</ul><p className="mono">= {toBase(dn,tgt).text.split('.')[0]}</p>
      {ms.length>0&&<><p className="muted" style={{margin:'10px 0 6px'}}>Fractional part: multiply by {tgt}; read the digits from top to bottom.</p><ul className="steps">{ms.map((s,i)=><li key={i}>{s}</li>)}</ul></>}</>})()}</section></>}</>}
