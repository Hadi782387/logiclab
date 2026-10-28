import {gate} from './logic.ts';import type {Op} from './parser.ts';
export type GKey='AND'|'OR'|'NOT'|'NAND'|'NOR'|'XOR'|'XNOR';
export type GateInfo={key:GKey;group:'Basic'|'Universal'|'Derived';alg:string;ic:string;per:number;desc:string;use:string};
export const GATES:GateInfo[]=[
 {key:'AND',group:'Basic',alg:"Y = A·B",ic:'7408',per:4,desc:'Output is 1 only when every input is 1.',use:'Enable/masking logic, carry generation in adders.'},
 {key:'OR',group:'Basic',alg:'Y = A + B',ic:'7432',per:4,desc:'Output is 1 when at least one input is 1.',use:'Combining alarm or request signals, carry merge in adders.'},
 {key:'NOT',group:'Basic',alg:"Y = A'",ic:'7404',per:6,desc:'Inverts its single input: 0 becomes 1 and 1 becomes 0.',use:'Complementing signals, building NAND/NOR from AND/OR.'},
 {key:'NAND',group:'Universal',alg:"Y = (A·B)'",ic:'7400',per:4,desc:'AND followed by NOT. Output is 0 only when all inputs are 1.',use:'Any Boolean function can be built from NAND gates alone.'},
 {key:'NOR',group:'Universal',alg:"Y = (A + B)'",ic:'7402',per:4,desc:'OR followed by NOT. Output is 1 only when all inputs are 0.',use:'Any Boolean function can be built from NOR gates alone.'},
 {key:'XOR',group:'Derived',alg:"Y = A⊕B = A'B + AB'",ic:'7486',per:4,desc:'Output is 1 when the inputs are different (odd number of 1s).',use:'Half/full adder sum, parity generators, comparators.'},
 {key:'XNOR',group:'Derived',alg:"Y = (A⊕B)' = AB + A'B'",ic:'74266',per:4,desc:'Output is 1 when the inputs are equal.',use:'Equality comparators. 74266 is open-collector and needs a pull-up resistor.'}];
export const gOut=(k:GKey,a:number,b:number):0|1=>k==='NOT'?(a?0:1):gate(k as Op,a,b);
export const UNIVERSAL:{title:string;rows:[string,string][]}[]=[
 {title:'Using only NAND',rows:[['NOT A','A NAND A'],['A AND B','(A NAND B) NAND (A NAND B)'],['A OR B','(A NAND A) NAND (B NAND B)']]},
 {title:'Using only NOR',rows:[['NOT A','A NOR A'],['A OR B','(A NOR B) NOR (A NOR B)'],['A AND B','(A NOR A) NOR (B NOR B)']]}];
