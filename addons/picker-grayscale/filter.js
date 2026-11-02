const PickerGrayscale = (() => {
  const settings = data => data?.version === 1
    ? {wheel: data.wheel === true, surface: data.surface === true}
    : {wheel: false, surface: false};

  function finish(ctx, {data}) {
    const {wheel, surface} = settings(data);
    if (!wheel && !surface) return;
    const {width, height} = ctx.canvas;
    const image = ctx.getImageData(0, 0, width, height), pixels = image.data;
    // The picker uses 320 logical units at 2× resolution. The empty gap at
    // radius 124 separates the surface (including edge markers) from the ring.
    const boundary = 248 * 248;
    for (let y = 0; y < height; y++) {
      const dy = y + .5 - 320;
      for (let x = 0; x < width; x++) {
        const dx = x + .5 - 320, ring = dx * dx + dy * dy >= boundary;
        if (!(ring ? wheel : surface)) continue;
        const i = (y * width + x) * 4;
        if (!pixels[i + 3]) continue;
        // All app grayscale paths share the same encoded-RGB conversion.
        const gray = globalThis.Shade.grayscaleByte(pixels[i], pixels[i + 1], pixels[i + 2]);
        pixels[i] = pixels[i + 1] = pixels[i + 2] = gray;
      }
    }
    ctx.putImageData(image, 0, 0);
  }
  return {settings, finish};
})();
