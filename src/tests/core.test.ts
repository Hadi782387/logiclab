import {describe,it,expect} from 'vitest';
import {parse,ParseError} from '../core/parser.ts';import {truthTable,evalAst} from '../core/logic.ts';
import {buildGraph,simulate,verifyGraph} from '../core/circuit.ts';import {minimize} from '../core/minimizer.ts';
const out=(s:string)=>{const p=parse(s);return truthTable(p.ast,p.vars).rows.map(r=>r.out).join('')};
describe('parser/eval',()=>{
 it('gates',()=>{expect(out('A AND B')).toBe('0001');expect(out('A OR B')).toBe('0111');expect(out('A NAND B')).toBe('1110');expect(out('A NOR B')).toBe('1000');expect(out('A XOR B')).toBe('0110');expect(out('A XNOR B')).toBe('1001');expect(out('NOT A')).toBe('10')});
 it('precedence',()=>{expect(out('A+BC')).toBe(out('A OR (B AND C)'));expect(out('A XOR B AND C')).toBe(out('A XOR (B AND C)'))});
 it('complement & implicit AND',()=>{expect(out("A'B + CD")).toBe(out('(NOT A AND B) OR (C AND D)'))});
 it('label',()=>{expect(parse('Y = A AND B').label).toBe('Y')});
 it('errors',()=>{for(const s of ['','A AND','(A AND B','A AND B)','A $ B','()','A NAND B NAND C'])expect(()=>parse(s)).toThrow(ParseError)});
});
describe('circuit',()=>{
 it('graph matches AST',()=>{for(const s of ['(A AND B) OR NOT C','(A XOR B) NOR (C NAND D)',"A'B + CD"]){const p=parse(s);expect(verifyGraph(p.ast,p.vars,buildGraph(p.ast,p.vars,'Y'))).toBe(true)}});
 it('disconnected input & cycle',()=>{const p=parse('A AND B'),g=buildGraph(p.ast,p.vars,'Y');
  expect(simulate({...g,edges:g.edges.slice(1)},{}).error).toMatch(/disconnected/);
  expect(simulate({nodes:[{id:'a',type:'NOT',label:'a'},{id:'out',type:'OUTPUT',label:'Y'}],edges:[{from:'a',to:'a',port:0},{from:'a',to:'out',port:0}]},{}).error).toMatch(/Cycle/)});
});
describe('minimizer',()=>{
 it("AB+AB' = A",()=>{const p=parse("AB+AB'");const m=minimize(p.ast,p.vars);expect(m.expr).toBe('A');expect(m.verified).toBe(true)});
 it('equivalent on samples',()=>{for(const s of ['(A OR B) AND (C OR D)','A XOR B XOR C','NOT(A AND B)']){const p=parse(s),m=minimize(p.ast,p.vars);expect(m.verified).toBe(true);const e={A:1,B:0,C:1,D:0};expect(evalAst(parse(m.expr).ast,e)).toBe(evalAst(p.ast,e))}});
});
