import {useRef,useState} from 'react';
import {layout,simulate,isGate} from '../core/circuit.ts';import type {Graph} from '../core/circuit.ts';
import {save,svgString,pngBlob} from '../core/export.ts';
const C={bg:'#0b1220',wire:'#7b8aa3',high:'#34d399',low:'#475569',text:'#e6edf7',panel:'#111a2e'};
const AND='M0,0H24A24,20 0 0 1 24,40H0Z',OR='M0,0Q30,0 48,20Q30,40 0,40Q14,20 0,0Z';
const SH:Record<string,string>={AND,NAND:AND,OR,NOR:OR,XOR:OR,XNOR:OR,NOT:'M0,0L48,20L0,40Z'};
const BUB=['NAND','NOR','XNOR','NOT'];
export default function CircuitView({g,env,onToggle,name,title}:{g:Graph;env:Record<string,number>;onToggle?:(l:string)=>void;name:string;title:string}){
 const ref=useRef<SVGSVGElement>(null),[zoom,setZoom]=useState(1),[msg,setMsg]=useState('');
 const {pos,w,h}=layout(g),{values,error}=simulate(g,env),col=(id:string)=>values[id]?C.high:C.wire;
 const fan:Record<string,number>={};g.edges.forEach(e=>fan[e.from]=(fan[e.from]||0)+1);
 const outX=(id:string)=>{const t=g.nodes.find(n=>n.id===id)!.type;return pos[id].x+(t==='INPUT'||t==='CONST'?10:56)};
 const inY=(id:string,port:number)=>{const t=g.nodes.find(n=>n.id===id)!.type;return pos[id].y+(t==='OUTPUT'||t==='NOT'?0:port?10:-10)};
 const run=async(f:()=>Promise<void>|void)=>{try{await f();setMsg('Exported')}catch(e){setMsg('Export failed: '+(e as Error).message)}};
 return <section className="panel"><div className="bar"><h3>{title}</h3><div className="btns">
  <button onClick={()=>setZoom(z=>Math.min(3,z+.25))} aria-label="Zoom in">+</button><button onClick={()=>setZoom(z=>Math.max(.4,z-.25))} aria-label="Zoom out">−</button>
  <button onClick={()=>setZoom(1)}>Reset</button><button onClick={()=>setZoom(Math.min(1,(ref.current?.parentElement?.clientWidth||w)/w))}>Fit</button>
  <button onClick={()=>run(()=>save(name+'.svg',svgString(ref.current!),'image/svg+xml'))}>SVG</button>
  <button onClick={()=>run(async()=>save(name+'.png',await pngBlob(ref.current!)))}>PNG</button></div></div>
  {error&&<p className="err">{error}</p>}{msg&&<p className="muted" role="status">{msg}</p>}
  <div className="scroll"><svg ref={ref} viewBox={`0 0 ${w} ${h}`} width={w*zoom} height={h*zoom} role="img" aria-label={title}>
   <rect width={w} height={h} fill={C.bg}/>
   {g.edges.map((e,i)=>{const sx=outX(e.from),sy=pos[e.from].y,d=pos[e.to],dy=inY(e.to,e.port),cx=d.x-14;
    return <path key={i} d={`M${sx},${sy}H${cx}V${dy}H${d.x}`} fill="none" stroke={col(e.from)} strokeWidth={2}/>})}
   {Object.keys(fan).filter(k=>fan[k]>1).map(k=><circle key={k} cx={outX(k)} cy={pos[k].y} r={3.5} fill={col(k)}/>)}
   {g.nodes.map(n=>{const p=pos[n.id],v=values[n.id]||0;
    if(n.type==='INPUT'||n.type==='CONST')return <g key={n.id} onClick={()=>n.type==='INPUT'&&onToggle?.(n.label)} style={{cursor:n.type==='INPUT'?'pointer':'default'}}>
     <text x={p.x-14} y={p.y+5} textAnchor="end" fill={C.text} fontSize={14}>{n.type==='INPUT'?n.label:'const'}</text>
     <circle cx={p.x} cy={p.y} r={10} fill={v?C.high:C.low}/><text x={p.x} y={p.y+4} textAnchor="middle" fontSize={12} fill={C.bg} fontWeight={700}>{v}</text></g>;
    if(n.type==='OUTPUT')return <g key={n.id}><circle cx={p.x+10} cy={p.y} r={10} fill={v?C.high:C.low}/><text x={p.x+10} y={p.y+4} textAnchor="middle" fontSize={12} fill={C.bg} fontWeight={700}>{v}</text>
     <text x={p.x+26} y={p.y+5} fill={C.text} fontSize={14}>{n.label}</text></g>;
    if(!isGate(n.type))return null;
    const st=v?C.high:C.wire;
    return <g key={n.id} transform={`translate(${p.x},${p.y-20})`}><path d={SH[n.type]} fill={C.panel} stroke={st} strokeWidth={2}/>
     {n.type==='XOR'||n.type==='XNOR'?<path d="M-7,0Q7,20 -7,40" fill="none" stroke={st} strokeWidth={2}/>:null}
     {BUB.includes(n.type)?<circle cx={52} cy={20} r={4} fill={C.panel} stroke={st} strokeWidth={2}/>:<line x1={48} y1={20} x2={56} y2={20} stroke={st} strokeWidth={2}/>}
     <text x={22} y={24} textAnchor="middle" fontSize={9} fill={C.text}>{n.label}</text></g>})}
  </svg></div></section>}
