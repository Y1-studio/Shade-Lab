const ColorHistory = (() => {
  const key='studio-layout', E=globalThis.Shade;
  function colors(project){
    const data=project.addons?.[key];
    const source=data?.version===1&&Array.isArray(data.colors)?data.colors:[...(project.samples||[])].reverse();
    const seen=new Set();
    return source.filter(c=>Array.isArray(c)&&c.length===3&&c.every(Number.isFinite)).filter(c=>{
      const hex=E.toHex(c);if(seen.has(hex))return false;seen.add(hex);return true;
    }).slice(0,50).map(c=>[...c]);
  }
  function record(project,color){
    if(!Array.isArray(color)||color.length!==3||!color.every(Number.isFinite))return;
    const data=project.addons?.[key];if(data&&data.version!==1)return;
    const hex=E.toHex(color),list=colors(project).filter(c=>E.toHex(c)!==hex);
    project.addons??={};project.addons[key]={...data,version:1,colors:[[...color],...list].slice(0,50)};
  }
  return {colors,record};
})();
