const assert=require('node:assert/strict');
const M=require('../math.js');
const base=M.fromHex('#747474'),source=M.fromHex('#0000FF');
const observed={multiply:'#000074','color-burn':'#000074',screen:'#7474FF',add:'#7474FF',overlay:'#0000E8',difference:'#74748B',color:'#6464FF',subtract:'#747400','hard-light':'#0000FF',saturation:'#747474',brightness:'#1C1C1C'};
for(const [mode,hex] of Object.entries(observed)) {
  if(mode==='color') continue;
  assert.equal(M.hex(M.blend(mode,base,source)),hex,mode+' screenshot fixture');
}
// Preserve the measured discrepancy; do not tune the standard formula to it.
assert.equal(M.hex(M.blend('color',base,source)),'#6363FF');
assert.equal(observed.color,'#6464FF');
for(const [mode] of M.modes) {
  for(const b of [base,[0,0,0],[1,1,1],[.1,.8,.3]]) for(const s of [source,[0,0,0],[1,1,1],[.7,.2,.9]]) {
    assert.deepEqual(M.blend(mode,b,s,0),b,mode+' zero opacity');
    for(const a of [.2,.5,1]) for(const v of M.blend(mode,b,s,a)) assert.ok(Number.isFinite(v)&&v>=0&&v<=1,mode+' bounded output');
  }
}
assert.equal(M.hex(M.blend('color-burn',[1,1,1],[0,0,0])),'#FFFFFF');
assert.equal(M.hex(M.blend('color-burn',[0,0,0],[0,0,0])),'#000000');
assert.equal(M.hex(M.blend('add',[.8,.8,.8],[.8,.8,.8],.5)),'#E6E6E6');
assert.equal(M.hex(M.blend('add-glow-candidate',[.8,.8,.8],[.8,.8,.8],.5)),'#FFFFFF');
assert.equal(M.hex(M.blend('saturation',base,source)), '#747474');
assert.throws(()=>M.blend('multiply',[NaN,0,0],source));
assert.throws(()=>M.blend('unknown',base,source));
console.log('PASS: 10 exact screenshot fixtures; Color discrepancy explicitly recorded (prediction #6363FF vs screenshot #6464FF). Opacity/range checks, burn endpoints and provisional glow contrast passed. CSP calibration remains pending.');
