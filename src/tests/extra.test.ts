import {describe,it,expect} from 'vitest';
import {parseNum,toBase,bcd,excess3,gray,signed,divisionSteps} from '../core/numbers.ts';
import {halfAdder,fullAdder,toGraph,truthOf,exprOf,sane,reaches} from '../core/simulator.ts';
import {parse} from '../core/parser.ts';import {truthTable} from '../core/logic.ts';
import {GATES,gOut} from '../core/gates.ts';
const P=(s:string,b:number)=>{const p=parseNum(s,b);if('error' in p)throw new Error(p.error);return p};
describe('numbers',()=>{
 it('converts integers',()=>{const p=P('255',10);expect(toBase(p,2).text).toBe('11111111');expect(toBase(p,16).text).toBe('FF');expect(toBase(p,8).text).toBe('377');expect(toBase(P('0xff',16),10).text).toBe('255')});
 it('fractions',()=>{expect(toBase(P('10.625',10),2).text).toBe('1010.101');expect(toBase(P('0.1',10),2).exact).toBe(false);expect(toBase(P('-1.1',2),10).text).toBe('-1.5')});
 it('errors',()=>{expect('error' in parseNum('12',2)).toBe(true);expect('error' in parseNum('',10)).toBe(true);expect('error' in parseNum('1.2.3',10)).toBe(true)});
 it('codes',()=>{const p=P('29',10);expect(bcd(p)).toBe('0010 1001');expect(excess3(p)).toBe('0101 1100');expect(gray(P('13',10))).toBe('1011')});
 it('signed',()=>{expect(signed(-5n,8).tc).toBe('11111011');expect(signed(-5n,8).oc).toBe('11111010');expect(signed(-5n,8).sm).toBe('10000101');expect(signed(-128n,8).tc).toBe('10000000');expect(signed(-128n,8).oc).toBeNull();expect(signed(200n,8).tc).toBeNull()});
 it('steps',()=>{expect(divisionSteps(P('10',10),2).length).toBe(4)});
});
describe('simulator',()=>{
 it('half adder',()=>{const t=truthOf(halfAdder())!;expect(t.outs).toEqual(['Y','Z']);expect(t.rows.map(r=>r.out.join('')).join(',')).toBe('00,10,10,01')});
 it('full adder',()=>{const t=truthOf(fullAdder())!;expect(t.rows.map(r=>r.out.join('')).join(',')).toBe('00,10,10,01,10,01,01,11')});
 it('expr round-trips through parser',()=>{const m=fullAdder(),g=toGraph(m);for(const o of m.nodes.filter(n=>n.type==='OUTPUT')){const e=exprOf(g,o.id),p=parse(e);expect(truthTable(p.ast,p.vars).rows.length).toBe(8)}});
 it('validation & cycles',()=>{expect(sane(halfAdder())).not.toBeNull();expect(sane({nodes:[{id:'x',type:'BAD'}],edges:[]})).toBeNull();expect(reaches(halfAdder().edges,'a','o1')).toBe(true);expect(reaches(halfAdder().edges,'o1','a')).toBe(false)});
});
describe('gates',()=>{it('truth values',()=>{const s=(k:any)=>[[0,0],[0,1],[1,0],[1,1]].map(([a,b])=>gOut(k,a,b)).join('');expect(s('NAND')).toBe('1110');expect(s('XNOR')).toBe('1001');expect(GATES.length).toBe(7)})});
