// Detached paint editing through the host's existing color picker.
const FilterPaint=(()=>{
  let binding=null;
  const target={label:'Applied filter paint',transient:true,preserveSelection:true,
    available:()=>!!binding,
    read:()=>{const row=binding.row(),color=FilterEngine.E.rgbHsl(row.sourceRgb,row.paintHue??0);return color;},
    write:(_ball,color)=>binding.write(color),
    capture:()=>binding.capture(),restore:saved=>binding?.restore(saved)};
  return {target,connect:value=>binding=value};
})();
