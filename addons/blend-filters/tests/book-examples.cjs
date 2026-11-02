const assert=require('node:assert/strict'),M=require('../math.js');
const data=require('../demo/book-example-results.json'),palette=require('../demo/book-palette.json');
assert.equal(palette.palette.length,6);assert.equal(data.examples.length,12);
for(const e of data.examples){
 assert.ok(e.explanation.length>20);assert.equal(e.colors.length,6);
 assert.deepEqual(e.colors.map(c=>c.id),palette.palette.map(c=>c.id));
 for(const c of e.colors)assert.equal(c.result,M.hex(M.blend(e.mode,M.fromHex(c.hex),M.fromHex(e.source),e.opacity)));
}
console.log('PASS: every filter has an explanation; all 72 before/after colors match the shared math; all six illustration colors are retained.');
