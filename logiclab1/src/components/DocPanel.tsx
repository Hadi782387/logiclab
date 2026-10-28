import {useState} from 'react';
import {FileText,Printer,Download} from 'lucide-react';
import {save,svgString} from '../core/export.ts';
import {reportHtml,reportMd} from '../core/report.ts';import type {ReportData} from '../core/report.ts';
import {minimize} from '../core/minimizer.ts';import {parse} from '../core/parser.ts';
import {buildGraph,gateCount} from '../core/circuit.ts';
import {PAL} from '../theme.ts';
type Base=Omit<ReportData,'expr'|'title'|'student'|'roll'|'course'|'svg'|'min'>;
const read=()=>{try{return JSON.parse(localStorage.getItem('logiclab.doc')||'{}')}catch{return{}}};
function circuitSvg(dark:boolean){
 const el=document.getElementById('svg-circuit') as SVGSVGElement|null;if(!el)return '';
 const c=el.cloneNode(true) as SVGSVGElement;c.removeAttribute('width');c.removeAttribute('height');let s=svgString(c);
 if(dark)(Object.keys(PAL.dark) as (keyof typeof PAL.dark)[]).forEach(k=>{s=s.split(PAL.dark[k]).join(PAL.light[k])});return s}
export default function DocPanel({base,exprText,dark}:{base:Base;exprText:string;dark:boolean}){
 const [f,setF]=useState<{title?:string;student?:string;roll?:string;course?:string}>(read),[simp,setSimp]=useState(true),[msg,setMsg]=useState('');
 const set=(k:string,v:string)=>setF(p=>{const n={...p,[k]:v};try{localStorage.setItem('logiclab.doc',JSON.stringify(n))}catch{}return n});
 const build=():ReportData=>{let min:ReportData['min']=null;
  if(simp){const p=parse(exprText),x=minimize(p.ast,p.vars);min={expr:x.expr,primes:x.primes,chosen:x.chosen,verified:x.verified,gates:gateCount(buildGraph(parse(x.expr).ast,p.vars,p.label))}}
  return{...base,expr:exprText,title:f.title?.trim()||`Experiment: Logic circuit for ${base.label} = ${exprText}`,student:f.student||'',roll:f.roll||'',course:f.course||'',svg:circuitSvg(dark),min}};
 const go=(fn:()=>void)=>{try{fn()}catch(e){setMsg('Could not create the document: '+(e as Error).message)}};
 const print=()=>go(()=>{const h=reportHtml(build()),w=window.open('','_blank');if(!w){setMsg('Pop-up blocked. Allow pop-ups, or download the HTML and print it.');return}w.document.write(h);w.document.close();setTimeout(()=>w.print(),400);setMsg('')});
 return <section className="panel"><h3>Practical documentation</h3>
  <p className="muted">Generate a lab-file page: aim, apparatus with TTL IC counts, theory, circuit diagram, procedure, observation table, result and precautions.</p>
  <div className="fields"><label className="lbl">Experiment title<input value={f.title||''} onChange={e=>set('title',e.target.value)} placeholder="Auto-generated if empty"/></label>
   <label className="lbl">Your name<input value={f.student||''} onChange={e=>set('student',e.target.value)}/></label>
   <label className="lbl">Roll no. / ID<input value={f.roll||''} onChange={e=>set('roll',e.target.value)}/></label>
   <label className="lbl">Course / subject<input value={f.course||''} onChange={e=>set('course',e.target.value)}/></label></div>
  <label className="chk"><input type="checkbox" checked={simp} onChange={e=>setSimp(e.target.checked)}/> Include simplified (Quine–McCluskey) form</label>
  <div className="btns" style={{marginTop:12}}><button className="cta" onClick={print}><Printer size={15}/>Print / Save as PDF</button>
   <button onClick={()=>go(()=>save('lab_report.html',reportHtml(build()),'text/html'))}><FileText size={15}/>HTML</button>
   <button onClick={()=>go(()=>save('lab_report.md',reportMd(build()),'text/markdown'))}><Download size={15}/>Markdown</button></div>
  {msg&&<p className="err" role="alert">{msg}</p>}
  <p className="muted" style={{marginBottom:0}}>IC numbers are common 74-series parts for reference. Pin mapping is not generated. The report always uses a light, print-friendly colour scheme.</p></section>}
