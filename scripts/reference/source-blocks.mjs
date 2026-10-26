import {canonicalSource} from "../../lib/reference/source.mjs";
import {createHash} from 'node:crypto';
const hash=text=>createHash('sha256').update(text).digest('hex');
const names=['Benjamin Netanyahu','Netanyahu','Yair Lapid','Naftali Bennett','Yair Golan','Avigdor Liberman','Liberman','Benny Gantz','Yariv Levin','Aharon Barak','Yitzhak Rabin','Rabbi Daniel Bogard','Daniel Bogard'];
const unique=a=>[...new Set(a)].sort();
export function invariants(text){return {numbers:unique(text.match(/\b\d+(?:[,.]\d+)*(?:%|\b)/g)??[]),links:unique(text.match(/https?:\/\/[^\s)"<>]+/g)??[]),names:names.filter(n=>text.includes(n)),negated:/\b(?:not|never|neither|cannot|no|doesn't|isn't|don't|won't)\b/i.test(text)}}
/** Only existing, trusted source creates widget descriptors. Model output never creates components. */
export function sourceBlocks(raw,meta){
 raw=canonicalSource(raw);
 const body=raw.replace(/^export const meta\s*=\s*\{[\s\S]*?\};\s*/,''),blocks=[{kind:'title',text:meta.title},{kind:'summary',text:meta.dek??''},...body.split(/\r?\n\s*\r?\n/).filter(x=>x.trim()).flatMap(text=>{const widget=/^<(Chart|Positions|WhatIf)\s+([^>]*?)\s*\/>$/.exec(text.trim());if(widget){const attrs=Object.fromEntries([...widget[2].matchAll(/([a-zA-Z]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));return{kind:'widget',text:text.trim(),widget:{name:widget[1],attrs}}}const quote=/^<Quote\s+([^>]+)>([\s\S]*)<\/Quote>$/.exec(text.trim());if(quote){const attrs=[...quote[1].matchAll(/([a-zA-Z]+)="([^"]*)"/g)].map(m=>m[2]);return [{kind:'attribution',text:attrs.join('. ')},{kind:'quote',text:quote[2]}]}text=text.replace(/<\/?Note[^>]*>/g,'');return{kind:/^#{1,6}\s/.test(text)?'heading':'text',text:text.replace(/^#{1,6}\s/,'').trim()}})];
 return blocks.map((b,index)=>({...b,id:`block-${index}-${hash(b.text).slice(0,12)}`,...invariants(b.text)}));
}
