const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createCanvas}=require('@napi-rs/canvas'),M=require('../math.js');
const randomized=process.argv.includes('--random');
const data=require(randomized?'../demo/random-cases.json':'../demo/cases.json'),checks=[];
const standard=new Set(['multiply','color-burn','screen','overlay','difference','color','hard-light','saturation','brightness']);
for(const sheet of data.sheets) for(const test of sheet.tests) {
  if(!standard.has(test.mode)) continue;
  const ctx=createCanvas(1,1).getContext('2d');
  ctx.fillStyle=test.base;ctx.fillRect(0,0,1,1);
  ctx.globalCompositeOperation=test.mode==='brightness'?'luminosity':test.mode;
  ctx.globalAlpha=test.opacity;ctx.fillStyle=test.source;ctx.fillRect(0,0,1,1);
  const actual=[...ctx.getImageData(0,0,1,1).data].slice(0,3),expected=M.bytes(M.fromHex(test.result));
  const error=Math.max(...actual.map((v,i)=>Math.abs(v-expected[i])));
  checks.push({id:test.id,mode:test.mode,prediction:test.result,canvas:M.hex(actual.map(v=>v/255)),maxChannelDifference:error});
  // Partial opacity introduces 8-bit alpha/premultiplied intermediate
  // quantization in this raster implementation. Retain all measured differences.
  const tolerance=test.opacity===1?1:2;
  assert.ok(error<=tolerance,`${test.id} ${test.mode}: ${actual} vs ${expected}`);
}
fs.writeFileSync(path.join(__dirname,randomized?'../demo/random-canvas-validation.json':'../demo/canvas-validation.json'),JSON.stringify({implementation:'@napi-rs/canvas (Skia); independent standard-mode cross-check, not CSP',checks},null,2)+'\n');
console.log(`PASS: ${checks.length} independent Canvas comparisons; maximum difference ${Math.max(...checks.map(c=>c.maxChannelDifference))} RGB bytes (full opacity tolerance 1; partial opacity tolerance 2). All differences saved. Add/Subtract/Glow are not claimed to be Canvas blend modes.`);
