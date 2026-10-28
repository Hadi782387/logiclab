import {useEffect,useMemo,useRef,useState} from 'react';
import type {PointerEvent as RPE} from 'react';
import {Trash2,Eraser,Upload,ArrowRight,Copy,Check} from 'lucide-react';
import PageHead from './PageHead.tsx';import {useCopy} from './useCopy.ts';
import {SH,BUB} from './shapes.ts';
import {simulate,isGate} from '../core/circuit.ts';import type {GType} from '../core/circuit.ts';
import {save,svgString,pngBlob} from '../core/export.ts';
import {W,H,MAXIN,MAXNODES,arity,outPt,inPt,toGraph,envOfModel,reaches,exprOf,truthOf,halfAdder,fullAdder,sane} from '../core/simulator.ts';
import type {Model,SNode} from '../core/simulator.ts';
import {PAL} from '../theme.ts';
const PAL_TYPES:[GType,string][]=[['INPUT','Input'],['OUTPUT','Output'],['NOT','NOT'],['AND','AND'],['OR','OR'],['NAND','NAND'],['NOR','NOR'],['XOR','XOR'],['XNOR','XNOR']];
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
type Sel={k:'n'|'e';id:string}|null;
export default function Simulator({dark,load}:{dark:boolean;load:(s:string)=>void}){
 const C=PAL[dark?'dark':'light'],SEL=dark?'#8e9bff':'#4f5bf0',cp=useCopy();
 const [m,setM]=useState<Model>(()=>{try{const x=sane(JSON.parse(localStorage.getItem('logiclab.sim')||'null'));if(x)return x}catch{}return halfAdder()});
 const [sel,setSel]=useState<Sel>(null),[wire,setWire]=useState<{from:string;x:number;y:number}|null>(null),[msg,setMsg]=useState('');
 const svg=useRef<SVGSVGElement>(null),file=useRef<HTMLInputElement>(null),drag=useRef<{id:string;dx:number;dy:number;sx:number;sy:number;moved:boolean}|null>(null);
 useEffect(()=>{try{localStorage.setItem('logiclab.sim',JSON.stringify(m))}catch{}},[m]);
 const g=useMemo(()=>toGraph(m),[m]),env=useMemo(()=>envOfModel(m),[m]);
 const {values,error}=useMemo(()=>simulate(g,env),[g,env]);
 const tt=useMemo(()=>m.nodes.filter(n=>n.type==='INPUT').length>MAXIN||error?null:truthOf(m),[m,error]);
 const outs=m.nodes.filter(n=>n.type==='OUTPUT').sort((a,b)=>a.label.localeCompare(b.label)),byId=new Map(m.nodes.map(n=>[n.id,n]));
 const pt=(e:{clientX:number;clientY:number})=>{const s=svg.current!,q=new DOMPoint(e.clientX,e.clientY).matrixTransform(s.getScreenCTM()!.inverse());return{x:q.x,y:q.y}};
 const add=(t:GType)=>{
  if(m.nodes.length>=MAXNODES){setMsg(`Maximum ${MAXNODES} components.`);return}
  const ins=m.nodes.filter(n=>n.type==='INPUT'),os=m.nodes.filter(n=>n.type==='OUTPUT'),gs=m.nodes.filter(n=>isGate(n.type));let label='',x=0,y=0;
  if(t==='INPUT'){const l=[...'ABCDEFGH'].find(c=>!ins.some(n=>n.label===c));if(!l||ins.length>=MAXIN){setMsg(`Maximum ${MAXIN} inputs.`);return}label=l;x=30;y=30+(ins.length%8)*70}
  else if(t==='OUTPUT'){const l=[...'YZXWVUTS'].find(c=>!os.some(n=>n.label===c));if(!l){setMsg('Maximum 8 outputs.');return}label=l;x=W-170;y=30+(os.length%8)*70}
  else{label='G'+(m.n+1);x=200+(gs.length%5)*140;y=40+Math.floor(gs.length/5)*100+(gs.length%2)*24}
  setM({...m,n:m.n+1,nodes:[...m.nodes,{id:'n'+(m.n+1),type:t,label,x,y,on:0}]});setMsg('')};
 const connect=(from:string,to:string,port:number)=>{
  if(from===to)return;if(reaches(m.edges,to,from)){setMsg('That would create a feedback loop. Only combinational circuits are supported.');return}
  setM(p=>({...p,edges:[...p.edges.filter(e=>!(e.to===to&&e.port===port)),{from,to,port}]}));setMsg('')};
 const del=()=>{if(!sel)return;setM(p=>sel.k==='n'?{...p,nodes:p.nodes.filter(n=>n.id!==sel.id),edges:p.edges.filter(e=>e.from!==sel.id&&e.to!==sel.id)}:{...p,edges:p.edges.filter((_,i)=>String(i)!==sel.id)});setSel(null)};
 useEffect(()=>{const k=(e:KeyboardEvent)=>{if((e.key==='Delete'||e.key==='Backspace')&&sel&&!(e.target instanceof HTMLInputElement)){e.preventDefault();del()}};window.addEventListener('keydown',k);return()=>window.removeEventListener('keydown',k)});
 const down=(e:RPE,n:SNode)=>{e.stopPropagation();const q=pt(e);drag.current={id:n.id,dx:q.x-n.x,dy:q.y-n.y,sx:q.x,sy:q.y,moved:false};svg.current!.setPointerCapture(e.pointerId);setSel({k:'n',id:n.id})};
 const startWire=(e:RPE,n:SNode)=>{e.stopPropagation();const q=pt(e);setWire({from:n.id,x:q.x,y:q.y});setSel(null);svg.current!.setPointerCapture(e.pointerId)};
 const move=(e:RPE)=>{const q=pt(e);if(wire)setWire({...wire,x:q.x,y:q.y});const d=drag.current;if(!d)return;
  if(!d.moved&&Math.hypot(q.x-d.sx,q.y-d.sy)<4)return;d.moved=true;
  setM(p=>({...p,nodes:p.nodes.map(n=>n.id===d.id?{...n,x:clamp(q.x-d.dx,0,W-70),y:clamp(q.y-d.dy,0,H-50)}:n)}))};
 const up=(e:RPE)=>{const d=drag.current;drag.current=null;
  if(d&&!d.moved)setM(p=>({...p,nodes:p.nodes.map(n=>n.id===d.id&&n.type==='INPUT'?{...n,on:n.on?0:1}:n)}));
  if(wire){const t=(document.elementFromPoint(e.clientX,e.clientY) as Element|null)?.closest('[data-in]');if(t){const [to,p]=t.getAttribute('data-in')!.split(':');connect(wire.from,to,+p)}setWire(null)}
  try{svg.current?.releasePointerCapture(e.pointerId)}catch{}};
 const run=async(f:()=>Promise<void>|void)=>{try{await f();setMsg('Exported')}catch(e){setMsg('Export failed: '+(e as Error).message)}};
 const importFile=(f?:File)=>{if(!f)return;if(f.size>200000){setMsg('File is too large.');return}f.text().then(t=>{try{const x=sane(JSON.parse(t));if(!x)throw 0;setM(x);setSel(null);setMsg('Circuit loaded')}catch{setMsg('Not a valid LogicLab circuit file.')}})};
 const col=(id:string)=>values[id]?C.high:C.wire;
 const first=outs[0],e1=first?exprOf(g,first.id):'',full=first?`${first.label} = ${e1}`:'';
 return <><PageHead title="Circuit Simulator" sub="Build a circuit by hand. Drag components, wire them up and watch the signals change live."/>
  <section className="panel"><div className="tool" role="group" aria-label="Add component">{PAL_TYPES.map(([t,l])=><button key={t} onClick={()=>add(t)}>+ {l}</button>)}</div>
   <div className="btns" style={{marginTop:12}}>
    <button onClick={del} disabled={!sel}><Trash2 size={15}/>Delete</button>
    <button onClick={()=>{setM({nodes:[],edges:[],n:1});setSel(null);setMsg('')}}><Eraser size={15}/>Clear</button>
    <button onClick={()=>{setM(halfAdder());setSel(null);setMsg('')}}>Half adder</button><button onClick={()=>{setM(fullAdder());setSel(null);setMsg('')}}>Full adder</button>
    <button onClick={()=>run(()=>save('circuit.json',JSON.stringify(m),'application/json'))}>Save JSON</button>
    <button onClick={()=>file.current?.click()}><Upload size={15}/>Load</button>
    <button onClick={()=>run(()=>save('simulator.svg',svgString(svg.current!),'image/svg+xml'))}>SVG</button><button onClick={()=>run(async()=>save('simulator.png',await pngBlob(svg.current!)))}>PNG</button>
    <input ref={file} type="file" accept=".json,application/json" hidden onChange={e=>{importFile(e.target.files?.[0]);e.target.value=''}}/></div>
   <p className="muted" style={{margin:'12px 0 0'}}><b>Wire:</b> drag from the ● on a component's right edge to a ○ input. <b>Move:</b> drag a component. <b>Toggle:</b> tap an Input. <b>Remove:</b> select, then Delete. Your circuit is saved automatically in this browser.</p>
   {msg&&<p className="muted" role="status" style={{margin:'8px 0 0'}}>{msg}</p>}</section>
  <section className="panel"><div className="scroll sim"><svg ref={svg} viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="Circuit canvas" onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
   <defs><pattern id="sim-dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill={C.wire} opacity=".28"/></pattern></defs>
   <rect width={W} height={H} fill={C.bg}/><rect width={W} height={H} fill="url(#sim-dots)" onPointerDown={()=>setSel(null)}/>
   {m.edges.map((e,i)=>{const a=byId.get(e.from),b=byId.get(e.to);if(!a||!b)return null;const s=outPt(a),t=inPt(b,e.port),d=`M${s.x},${s.y}C${s.x+60},${s.y} ${t.x-60},${t.y} ${t.x},${t.y}`,on=sel?.k==='e'&&sel.id===String(i);
    return <g key={i}><path d={d} fill="none" stroke={on?SEL:col(e.from)} strokeWidth={on?4:values[e.from]?2.8:2}/><path d={d} fill="none" stroke="transparent" strokeWidth={14} style={{cursor:'pointer'}} onPointerDown={ev=>{ev.stopPropagation();setSel({k:'e',id:String(i)})}}/></g>})}
   {wire&&(()=>{const a=byId.get(wire.from)!,s=outPt(a);return <path d={`M${s.x},${s.y}C${s.x+60},${s.y} ${wire.x-60},${wire.y} ${wire.x},${wire.y}`} fill="none" stroke={SEL} strokeWidth={2.5} strokeDasharray="6 5" pointerEvents="none"/>})()}
   {m.nodes.map(n=>{const v=values[n.id]||0,isSel=sel?.k==='n'&&sel.id===n.id,k=arity(n.type),st=isSel?SEL:v?C.high:C.wire;
    const inPorts=Array.from({length:k},(_,p)=>{const q=inPt(n,p);return <g key={p}><circle cx={q.x-n.x} cy={q.y-n.y} r={5} fill={C.panel} stroke={wire?SEL:C.wire} strokeWidth={2}/><circle data-in={`${n.id}:${p}`} cx={q.x-n.x} cy={q.y-n.y} r={11} fill="transparent" onPointerDown={e=>e.stopPropagation()}/></g>});
    const outPort=n.type!=='OUTPUT'?(()=>{const q=outPt(n);return <g><circle cx={q.x-n.x} cy={q.y-n.y} r={5} fill={v?C.high:C.wire}/><circle cx={q.x-n.x} cy={q.y-n.y} r={11} fill="transparent" style={{cursor:'crosshair',touchAction:'none'}} onPointerDown={e=>startWire(e,n)}/></g>})():null;
    return <g key={n.id} transform={`translate(${n.x},${n.y})`} style={{touchAction:'none'}}>
     {n.type==='INPUT'?<g style={{cursor:'pointer'}} onPointerDown={e=>down(e,n)}><rect x={0} y={6} width={36} height={28} rx={8} fill={v?C.high:C.panel} stroke={st} strokeWidth={2}/><text x={18} y={24} textAnchor="middle" fontSize={12} fontWeight={700} fill={v?'#06281c':C.text}>{n.label}={v}</text><line x1={36} y1={20} x2={44} y2={20} stroke={st} strokeWidth={2}/></g>
     :n.type==='OUTPUT'?<g style={{cursor:'grab'}} onPointerDown={e=>down(e,n)}><circle cx={22} cy={20} r={15} fill={v?C.high:C.low} stroke={isSel?SEL:'none'} strokeWidth={2}/><text x={22} y={25} textAnchor="middle" fontSize={14} fontWeight={800} fill={v?'#06281c':C.text}>{v}</text><text x={44} y={25} fontSize={14} fill={C.text}>{n.label}</text><line x1={0} y1={20} x2={7} y2={20} stroke={st} strokeWidth={2}/></g>
     :<g style={{cursor:'grab'}} onPointerDown={e=>down(e,n)}><rect x={-4} y={-4} width={64} height={48} fill="transparent"/><path d={SH[n.type]} fill={C.panel} stroke={st} strokeWidth={2}/>
      {n.type==='XOR'||n.type==='XNOR'?<path d="M-7,0Q7,20 -7,40" fill="none" stroke={st} strokeWidth={2}/>:null}
      {BUB.includes(n.type)?<circle cx={52} cy={20} r={4} fill={C.panel} stroke={st} strokeWidth={2}/>:<line x1={48} y1={20} x2={56} y2={20} stroke={st} strokeWidth={2}/>}
      <text x={22} y={24} textAnchor="middle" fontSize={9} fill={C.text} pointerEvents="none">{n.type}</text></g>}
     {inPorts}{outPort}</g>})}
  </svg></div>
  {m.nodes.length===0&&<p className="muted">The canvas is empty. Add components with the buttons above, or load the Half adder example.</p>}
  {error&&m.nodes.length>0&&<p className="muted" role="status" style={{marginBottom:0}}>⚠ {error}</p>}</section>
  {first&&<section className="panel"><div className="bar"><h3>Boolean expressions</h3></div>
   {outs.map(o=><p className="mono" key={o.id} style={{margin:'4px 0'}}>{o.label} = {exprOf(g,o.id)}</p>)}
   <div className="btns" style={{marginTop:12}}><button onClick={()=>cp.copy('sx',outs.map(o=>`${o.label} = ${exprOf(g,o.id)}`).join('\n'))}>{cp.k==='sx'?<Check size={14}/>:<Copy size={14}/>}{cp.k==='sx'?'Copied':'Copy'}</button>
    <button disabled={e1.includes('?')} onClick={()=>load(full)}>Open {first.label} in Designer <ArrowRight size={14}/></button></div>
   {e1.includes('?')&&<p className="muted" style={{marginBottom:0}}>Connect every input of every gate to enable "Open in Designer".</p>}</section>}
  {tt&&<section className="panel"><h3>Truth table</h3><div className="scroll" style={{maxHeight:420}}><table><thead><tr>{tt.vars.map(v=><th key={v}>{v}</th>)}{tt.outs.map(o=><th key={o}>{o}</th>)}</tr></thead>
   <tbody>{tt.rows.map((r,i)=>{const hit=r.inp.every((b,k)=>b===(env[tt.vars[k]]?1:0));return <tr key={i} className={hit?'hit':''}>{[...r.inp,...r.out].map((b,k)=><td key={k} className={(b?'h':'l')+(k>=r.inp.length?' fin':'')}>{b}</td>)}</tr>})}</tbody></table></div>
   <p className="muted" style={{marginBottom:0}}>The highlighted row matches the current input switches.</p></section>}</>}
