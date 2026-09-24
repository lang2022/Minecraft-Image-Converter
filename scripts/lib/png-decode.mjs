import zlib from 'node:zlib';

/**
 * Minimal PNG decoder for Minecraft block textures and small test images.
 * Supports 8-bit gray, gray+alpha, RGB, RGBA and indexed (PLTE/tRNS) PNGs.
 */
export function decodePng(buffer) {
  const signature = buffer.subarray(0, 8);
  if (signature.toString('hex') !== '89504e470d0a1a0a') {
    throw new Error('Not a PNG');
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 8;
  let colorType = 6;
  let palette = null;
  let paletteAlpha = null;
  const idat = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const data = buffer.subarray(offset + 8, offset + 8 + length);

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      if (data[12] !== 0) throw new Error('Interlaced PNG not supported');
      if (bitDepth !== 8) throw new Error('Unsupported bit depth');
    } else if (type === 'PLTE') {
      palette = data;
    } else if (type === 'tRNS') {
      paletteAlpha = data;
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }

  if (colorType === 3) {
    if (!palette) throw new Error('Indexed PNG missing PLTE chunk');
    const raw = zlib.inflateSync(Buffer.concat(idat));
    const pixels = Buffer.alloc(width * height * 4);
    const prev = Buffer.alloc(width);
    let pos = 0;

    for (let y = 0; y < height; y += 1) {
      const filter = raw[pos];
      pos += 1;
      const row = Buffer.alloc(width);
      for (let i = 0; i < width; i += 1) {
        const a = i > 0 ? row[i - 1] : 0;
        const b = prev[i];
        const c = i > 0 ? prev[i - 1] : 0;
        let value = raw[pos + i];
        switch (filter) {
          case 1: value += a; break;
          case 2: value += b; break;
          case 3: value += (a + b) >> 1; break;
          case 4: {
            const p = a + b - c;
            const pa = Math.abs(p - a);
            const pb = Math.abs(p - b);
            const pc = Math.abs(p - c);
            value += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
            break;
          }
        }
        row[i] = value & 0xff;
      }
      pos += width;
      prev.set(row);

      for (let x = 0; x < width; x += 1) {
        const index = row[x];
        const o = (y * width + x) * 4;
        pixels[o] = palette[index * 3];
        pixels[o + 1] = palette[index * 3 + 1];
        pixels[o + 2] = palette[index * 3 + 2];
        pixels[o + 3] = paletteAlpha && index < paletteAlpha.length ? paletteAlpha[index] : 255;
      }
    }

    return { width, height, channels: 4, pixels };
  }

  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : colorType === 4 ? 2 : 0;
  if (channels === 0) throw new Error(`Unsupported color type ${colorType}`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const pixels = Buffer.alloc(width * height * channels);

  let pos = 0;
  const prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[pos];
    pos += 1;
    const row = raw.subarray(pos, pos + stride);
    pos += stride;
    const out = pixels.subarray(y * stride, (y + 1) * stride);

    for (let i = 0; i < stride; i += 1) {
      const a = i >= channels ? out[i - channels] : 0;
      const b = prev[i];
      const c = i >= channels ? prev[i - channels] : 0;
      let value = row[i];
      switch (filter) {
        case 1: value += a; break;
        case 2: value += b; break;
        case 3: value += (a + b) >> 1; break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          value += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          break;
        }
      }
      out[i] = value & 0xff;
    }
    prev.set(out);
  }

  return { width, height, channels, pixels };
}

/** Returns [r, g, b, a] of the pixel at (x, y). */
export function sampleRgba(png, x, y) {
  const o = (y * png.width + x) * png.channels;
  switch (png.channels) {
    case 1: return [png.pixels[o], png.pixels[o], png.pixels[o], 255];
    case 2: return [png.pixels[o], png.pixels[o], png.pixels[o], png.pixels[o + 1]];
    case 3: return [png.pixels[o], png.pixels[o + 1], png.pixels[o + 2], 255];
    default: return [png.pixels[o], png.pixels[o + 1], png.pixels[o + 2], png.pixels[o + 3]];
  }
}
