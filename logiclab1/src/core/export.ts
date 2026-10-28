export function save(name:string,data:Blob|string,type='text/plain'){
 const b=typeof data==='string'?new Blob([data],{type}):data,u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;a.click();URL.revokeObjectURL(u)}
export function svgString(el:SVGSVGElement){const c=el.cloneNode(true) as SVGSVGElement;c.setAttribute('xmlns','http://www.w3.org/2000/svg');return new XMLSerializer().serializeToString(c)}
export async function pngBlob(el:SVGSVGElement):Promise<Blob>{
 const w=el.viewBox.baseVal.width,h=el.viewBox.baseVal.height,img=new Image();
 await new Promise<void>((r,j)=>{img.onload=()=>r();img.onerror=()=>j(new Error('Could not render SVG'));img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgString(el))});
 const c=document.createElement('canvas');c.width=w*2;c.height=h*2;const x=c.getContext('2d')!;x.scale(2,2);x.drawImage(img,0,0,w,h);
 return new Promise<Blob>((r,j)=>c.toBlob(b=>b?r(b):j(new Error('PNG failed'))))}
