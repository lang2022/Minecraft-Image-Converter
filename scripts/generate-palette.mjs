import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execSync } from 'node:child_process';

/**
 * Generates the runtime palette manifest and block sprite atlas.
 *
 * Usage:
 *   node scripts/generate-palette.mjs
 *   node scripts/generate-palette.mjs --scan <resource-pack-root | client.jar | pack.zip>
 *
 * Scan inputs: an extracted resource pack directory, a version client .jar,
 * or a downloaded resource pack .zip — all resolved to
 * assets/minecraft/textures/block/*.png internally.
 */

const args = process.argv.slice(2);
const scanIndex = args.indexOf('--scan');
const scanInput = scanIndex !== -1 ? path.resolve(args[scanIndex + 1]) : null;

const CATALOG_PATH = path.resolve('lib/blocks-catalog.json');
const OUT_DATA = path.resolve('public/data/blocks-palette-v2.json');
const OUT_LIB_DATA = path.resolve('lib/palette.generated.json');
const OUT_ATLAS = path.resolve('public/atlas/blocks-atlas-v2.png');
const OUT_TEXTURE_ATLAS = path.resolve('public/atlas/blocks-textures-v2.png');

const COLUMNS = 16;
const CELL = 16;

const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

// The scan input may be a directory, a version .jar, or a resource pack .zip.
let scanDir = null;
let zipEntries = null;

if (scanInput) {
  const stat = fs.statSync(scanInput);
  if (stat.isDirectory()) {
    scanDir = scanInput;
  } else {
    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip(scanInput);
    zipEntries = zip.getEntries();
  }
}

function textureFileFor(entry) {
  const short = entry.texture ?? entry.id.replace('minecraft:', '');
  return path.join(scanDir ?? '', 'assets', 'minecraft', 'textures', 'block', `${short}.png`);
}

void textureFileFor;

function readTexture(entry) {
  const short = entry.texture ?? entry.id.replace('minecraft:', '');
  if (zipEntries) {
    const normalized = `assets/minecraft/textures/block/${short}.png`;
    const candidate = zipEntries.find((entry) => entry.entryName.replace(/\\/g, '/') === normalized);
    return candidate ? candidate.getData() : null;
  }
  const file = path.join(scanDir ?? '', 'assets', 'minecraft', 'textures', 'block', `${short}.png`);
  return fs.existsSync(file) ? fs.readFileSync(file) : null;
}

function decodePng(buffer) {
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

  // Return normalized RGBA data for all supported formats.
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

function averageTexture(data, tintHex) {
  const png = decodePng(data);
  // Animated textures ship as vertical strips; average frame 0 only.
  const frameHeight = png.height > png.width ? png.width : png.height;
  const tint = tintHex ? hexToRgb(tintHex) : null;
  let r = 0;
  let g = 0;
  let b = 0;
  let weight = 0;

  for (let i = 0; i < png.width * frameHeight; i += 1) {
    const o = i * png.channels;
    const alpha = png.channels === 4 ? png.pixels[o + 3] : 255;
    if (alpha < 32) continue;
    let pr = png.pixels[o];
    let pg = png.pixels[o + 1];
    let pb = png.pixels[o + 2];
    if (tint) {
      pr = Math.round((pr * tint.r) / 255);
      pg = Math.round((pg * tint.g) / 255);
      pb = Math.round((pb * tint.b) / 255);
    }
    r += pr * alpha;
    g += pg * alpha;
    b += pb * alpha;
    weight += alpha;
  }

  if (weight === 0) return null;
  const to255 = (sum) => Math.round(sum / weight);
  return `#${[to255(r), to255(g), to255(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

if (scanDir || zipEntries) {
  let scanned = 0;
  const failed = [];
  for (const entry of catalog) {
    const data = readTexture(entry);
    if (!data) {
      failed.push(`${entry.id} (texture missing)`);
      continue;
    }
    try {
      const avg = averageTexture(data, entry.tint);
      if (!avg) {
        failed.push(`${entry.id} (fully transparent)`);
        continue;
      }
      entry.hex = avg;
      scanned += 1;
    } catch (error) {
      failed.push(`${entry.id} (${error.message})`);
    }
  }
  console.log(`Scanned textures: overridden ${scanned}/${catalog.length} colors from ${scanInput}`);
  if (failed.length) {
    console.log(`Skipped ${failed.length}: ${failed.join(', ')}`);
  }
}

execSync('npx tsc --project tsconfig.verify.json', { stdio: 'inherit' });
const { rgbToLab } = await import('../out-test/lib/color.js');

const blocks = catalog.map((entry, index) => {
  const value = Number.parseInt(entry.hex.replace('#', ''), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  const [L, A, B] = rgbToLab(r, g, b);
  return {
    id: entry.id,
    name: entry.name,
    x: (index % COLUMNS) * CELL,
    y: Math.floor(index / COLUMNS) * CELL,
    w: CELL,
    h: CELL,
    avgColor: entry.hex,
    lab: [Number(L.toFixed(2)), Number(A.toFixed(2)), Number(B.toFixed(2))],
    category: entry.category,
    obtainable: entry.obtainable ?? true,
  };
});

fs.mkdirSync(path.dirname(OUT_DATA), { recursive: true });
const manifestJson = JSON.stringify(
  {
    version: 'v2',
    mcVersion: '1.20+',
    atlas: {
      src: '/atlas/blocks-atlas-v2.png',
      textureSrc: '/atlas/blocks-textures-v2.png',
      columns: COLUMNS,
      cellSize: CELL,
      mode: 'vanilla-textures',
      generator: '/scripts/generate-palette.mjs',
    },
    blocks,
  },
  null,
  2,
);
fs.writeFileSync(OUT_DATA, manifestJson);
fs.writeFileSync(OUT_LIB_DATA, manifestJson);
console.log(`Wrote ${blocks.length} blocks -> ${path.relative(process.cwd(), OUT_DATA)} (+ lib copy)`);

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function buildPng(width, height, rgbaRows, colorType = 2) {
  const channels = colorType === 6 ? 4 : 3;
  const raw = Buffer.alloc(height * (1 + width * channels));
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (1 + width * channels);
    raw[rowStart] = 0;
    for (let x = 0; x < width; x += 1) {
      const o = rowStart + 1 + x * channels;
      raw[o] = rgbaRows[y][x][0];
      raw[o + 1] = rgbaRows[y][x][1];
      raw[o + 2] = rgbaRows[y][x][2];
      if (channels === 4) raw[o + 3] = rgbaRows[y][x][3];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = colorType;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function hexToRgb(hex) {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function hexMultiply(hexTexture, hexTint) {
  const t = Number.parseInt(hexTexture.replace('#', ''), 16);
  const c = Number.parseInt(hexTint.replace('#', ''), 16);
  const mul = (shift) => Math.round(((t >> shift) & 255) * (((c >> shift) & 255) / 255));
  return `#${[mul(16), mul(8), mul(0)].map((v) => Math.min(255, v).toString(16).padStart(2, '0')).join('')}`;
}

// 1) Runtime manifest (colors + LAB).
const rows = Math.ceil(blocks.length / COLUMNS);
const atlasWidth = COLUMNS * CELL;
const atlasHeight = rows * CELL;
const atlasRows = Array.from({ length: atlasHeight }, (_, y) =>
  Array.from({ length: atlasWidth }, (_, x) => {
    const block = blocks[Math.min(blocks.length - 1, Math.floor(y / CELL) * COLUMNS + Math.floor(x / CELL))];
    const value = Number.parseInt(block.avgColor.replace('#', ''), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  }),
);

fs.mkdirSync(path.dirname(OUT_ATLAS), { recursive: true });
fs.writeFileSync(OUT_ATLAS, buildPng(atlasWidth, atlasHeight, atlasRows));
console.log(`Wrote atlas ${atlasWidth}x${atlasHeight} -> ${path.relative(process.cwd(), OUT_ATLAS)}`);

// 2) True-texture atlas: each cell holds the block's actual 16x16 texture
//    (biome-tinted blocks are multiplied by their runtime tint so the atlas
//    shows the in-game appearance).
const textureCanvas = Array.from({ length: atlasHeight }, () =>
  Array.from({ length: atlasWidth }, () => [0, 0, 0, 0]),
);
let textured = 0;
for (let index = 0; index < blocks.length; index += 1) {
  const entry = catalog[index];
  const cellX = (index % COLUMNS) * CELL;
  const cellY = Math.floor(index / COLUMNS) * CELL;
  const data = readTexture(entry);
  if (!data) continue;
  try {
    const png = decodePng(data);
    const tint = entry.tint ? hexToRgb(entry.tint) : null;
    for (let y = 0; y < Math.min(CELL, png.height); y += 1) {
      for (let x = 0; x < Math.min(CELL, png.width); x += 1) {
        const o = (y * png.width + x) * png.channels;
        const alpha = png.channels === 4 ? png.pixels[o + 3] : 255;
        let r = png.pixels[o];
        let g = png.pixels[o + 1];
        let b = png.pixels[o + 2];
        if (tint) {
          r = Math.round((r * tint.r) / 255);
          g = Math.round((g * tint.g) / 255);
          b = Math.round((b * tint.b) / 255);
        }
        textureCanvas[cellY + y][cellX + x] = [r, g, b, alpha];
      }
    }
    textured += 1;
  } catch (error) {
    console.warn(`Texture atlas: skipped ${entry.id} (${error.message})`);
  }
}

fs.writeFileSync(OUT_TEXTURE_ATLAS, buildPng(atlasWidth, atlasHeight, textureCanvas, 6));
console.log(`Wrote texture atlas with ${textured}/${blocks.length} tiles -> ${path.relative(process.cwd(), OUT_TEXTURE_ATLAS)}`);
