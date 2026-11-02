// Shared calculations for the application, teaching examples and calibration.
// Inputs are straight, encoded RGB triples in [0,1], with an opaque base.
const BlendMath = (() => {
  const clamp = x => Math.max(0, Math.min(1, x));
  const lum = c => .3*c[0] + .59*c[1] + .11*c[2];
  const sat = c => Math.max(...c) - Math.min(...c);
  function clipColor(c) {
    const l=lum(c), n=Math.min(...c), x=Math.max(...c);
    if(n<0) c=c.map(v=>l+(v-l)*l/(l-n));
    if(x>1) c=c.map(v=>l+(v-l)*(1-l)/(x-l));
    return c.map(clamp);
  }
  const setLum = (c,l) => clipColor(c.map(v=>v+l-lum(c)));
  function setSat(c,s) {
    const indices=[0,1,2].sort((a,b)=>c[a]-c[b]), [lo,mid,hi]=indices;
    const out=[0,0,0], range=c[hi]-c[lo];
    if(range>0) {out[mid]=(c[mid]-c[lo])*s/range;out[hi]=s;}
    return out;
  }
  const hardLight=(b,s)=>s<=.5?2*b*s:1-2*(1-b)*(1-s);
  const burn=(b,s)=>b===1?1:s===0?0:1-Math.min(1,(1-b)/s);
  const modes=[
    ['multiply','Multiply'], ['color-burn','Color burn'], ['screen','Screen'],
    ['add','Add'], ['overlay','Overlay'], ['difference','Difference'],
    ['color','Color'], ['subtract','Subtract'], ['hard-light','Hard light'],
    ['saturation','Saturation'], ['brightness','Brightness'],
    ['add-glow-candidate','Add (Glow) candidate']
  ];
  function blend(mode,b,s,opacity=1) {
    for(const c of [b,s]) if(!Array.isArray(c)||c.length!==3||c.some(v=>!Number.isFinite(v)||v<0||v>1)) throw Error('RGB inputs must be three numbers in [0,1].');
    if(!Number.isFinite(opacity)||opacity<0||opacity>1) throw Error('Opacity must be in [0,1].');
    if(mode==='add-glow-candidate') return b.map((v,i)=>clamp(v+opacity*s[i]));
    let f;
    if(mode==='color') f=setLum(s,lum(b));
    else if(mode==='saturation') f=setLum(setSat(b,sat(s)),lum(b));
    else if(mode==='brightness') f=setLum(b,lum(s));
    else {
      const fn={multiply:(b,s)=>b*s,'color-burn':burn,screen:(b,s)=>1-(1-b)*(1-s),add:(b,s)=>clamp(b+s),overlay:(b,s)=>hardLight(s,b),difference:(b,s)=>Math.abs(b-s),subtract:(b,s)=>Math.max(0,b-s),'hard-light':hardLight}[mode];
      if(!fn) throw Error('Unknown blend mode: '+mode);
      f=b.map((v,i)=>fn(v,s[i]));
    }
    return b.map((v,i)=>clamp((1-opacity)*v+opacity*f[i]));
  }
  const fromHex=h=>{if(!/^#[0-9a-f]{6}$/i.test(h))throw Error('Use a six-digit hex color.');return [1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);};
  const bytes=c=>c.map(v=>Math.round(clamp(v)*255));
  const hex=c=>'#'+bytes(c).map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
  return {modes,blend,lum,sat,setLum,setSat,clipColor,fromHex,bytes,hex};
})();
if(typeof module!=='undefined'&&module.exports) module.exports=BlendMath;
