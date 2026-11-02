function drawHarmonyGuide(ctx, {ball, shape}) {
  const config = Harmony.valid(ball); if (!config?.visible) return;
  const positions = Harmony.offsets(config), point = (offset, radius) => {
    const angle = globalThis.Shade.wheelAngle(ball.base[0]+offset);
    return [160+Math.cos(angle)*radius, 160+Math.sin(angle)*radius];
  };
  ctx.save();
  // Leave the existing saturation/lightness surface and its markers unobscured.
  ctx.beginPath(); ctx.rect(0, 0, 320, 320);
  if (shape === 'square') ctx.rect(79, 79, 162, 162);
  else {ctx.moveTo(94, 57); ctx.lineTo(254, 160); ctx.lineTo(94, 263); ctx.closePath();}
  ctx.clip('evenodd');
  ctx.lineWidth = 1.5; ctx.strokeStyle = config.enabled ? '#dcfff3cc' : '#dcfff380'; ctx.setLineDash([4, 3]);
  ctx.beginPath(); positions.forEach((offset, i) => { const p = point(offset, 126); i ? ctx.lineTo(...p) : ctx.moveTo(...p); });
  if (positions.length > 2) ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
  for (const [i, offset] of positions.entries()) {
    ctx.beginPath(); ctx.moveTo(...point(offset, 127)); ctx.lineTo(...point(offset, 154));
    ctx.strokeStyle = '#101a24'; ctx.lineWidth = 4; ctx.stroke(); ctx.strokeStyle = '#e8fff6'; ctx.lineWidth = 1.3; ctx.stroke();
    const p = point(offset, 119); ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e8fff6'; ctx.fillText(i === 0 ? 'B' : String(i), ...p);
  }
  ctx.restore();
}
