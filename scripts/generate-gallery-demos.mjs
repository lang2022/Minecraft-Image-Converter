import fs from 'node:fs';
import zlib from 'node:zlib';
import { execSync } from 'node:child_process';

/**
 * Generates public/demo-logo-64.png and public/demo-face-64.png, two more
 * "before -> after" demos for the Gallery beside the existing landscape one.
 * Both run a synthetic 256px source through the real conversion pipeline to
 * 64x64 blocks, rendered side by side (source | block output) to match the
 * format of scripts/generate-home-demo.mjs.
 *
 * Run: node scripts/generate-gallery-demos.mjs
 */

execSync('npx tsc --project tsconfig.verify.json', { stdio: 'inherit' });
const { convertImageDataToBlocks } = await import('../out-test/lib/conversion.js');
const paletteManifest = JSON.parse(fs.readFileSync('public/data/blocks-palette-v2.json', 'utf8'));

const SRC = 256;
const GRID = 64;
const CELL = 8;
const GAP = 16;

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
function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc(height * (1 + stride));
  for (let y = 0; y < height; y += 1) {
    raw[y * (1 + stride)] = 0;
    rgba.copy(raw, y * (1 + stride) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
function hexRgb(hex) {
  const v = Number.parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >> 13)) | 0;
  h = (h * 1274126177) | 0;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}
function clamp(v) {
  return Math.max(0, Math.min(255, v));
}

function renderSideBySide(name, srcPx, result) {
  const W = SRC + GAP + GRID * CELL;
  const H = Math.max(SRC, GRID * CELL);
  const out = Buffer.alloc(W * H * 4);
  for (let i = 3; i < out.length; i += 4) out[i] = 255;
  const blit = (dx, dy, r, g, b) => {
    if (dx < 0 || dy < 0 || dx >= W || dy >= H) return;
    const o = (dy * W + dx) * 4;
    out[o] = r;
    out[o + 1] = g;
    out[o + 2] = b;
  };
  for (let y = 0; y < SRC; y += 1)
    for (let x = 0; x < SRC; x += 1) {
      const o = (y * SRC + x) * 4;
      blit(x, y, srcPx[o], srcPx[o + 1], srcPx[o + 2]);
    }
  const oy = Math.floor((H - GRID * CELL) / 2);
  for (const p of result.pixels) {
    const [r, g, b] = hexRgb(p.block.avgColor);
    for (let dy = 0; dy < CELL; dy += 1)
      for (let dx = 0; dx < CELL; dx += 1) blit(SRC + GAP + p.x * CELL + dx, oy + p.y * CELL + dy, r, g, b);
  }
  const distinct = new Set(result.pixels.map((p) => p.block.id)).size;
  fs.writeFileSync(`public/${name}.png`, encodePng(W, H, out));
  console.log(`wrote public/${name}.png (${W}x${H}), distinct blocks: ${distinct}`);
}

function convert(srcPx, dithering) {
  const imageData = { width: SRC, height: SRC, data: new Uint8ClampedArray(srcPx) };
  return convertImageDataToBlocks(imageData, {
    width: GRID, height: GRID, dithering, palette: paletteManifest,
  });
}

// --- Logo: flat, few colors, clean edges. Best with dithering OFF. ---------
const logoPx = Buffer.alloc(SRC * SRC * 4);
{
  const bg = [18, 24, 18];
  const blockA = [255, 255, 255];
  const blockB = [221, 60, 54];
  const accent = [252, 211, 77];
  for (let y = 0; y < SRC; y += 1) {
    for (let x = 0; x < SRC; x += 1) {
      // Centered square "M" made of blocky strokes with a corner accent.
      const u = (x - SRC / 2) / (SRC * 0.32);
      const v = (y - SRC / 2) / (SRC * 0.32);
      let col = bg;
      const inSquare = Math.abs(u) < 1 && Math.abs(v) < 1;
      if (inSquare) {
        const stroke = 0.3;
        const legL = u < -stroke / 2;
        const legR = u > stroke / 2;
        const bar = Math.abs(v) < stroke / 2;
        const outer = Math.abs(u) > 1 - stroke || Math.abs(v) > 1 - stroke;
        if (outer) {
          col = blockA;
        } else if (legL && bar) {
          col = Math.abs(u) < stroke / 2 && Math.abs(v) < 0.62 ? blockB : blockA;
        } else if (legR && bar) {
          col = Math.abs(u) < stroke / 2 && Math.abs(v) < 0.62 ? blockA : blockA;
        } else if (bar) {
          col = blockA;
        } else {
          // Interior: add a small accent tile, else transparent-ish bg.
          col = Math.abs(u) < 0.12 && Math.abs(v) < 0.5 ? accent : bg;
        }
      }
      const o = (y * SRC + x) * 4;
      logoPx[o] = clamp(col[0]);
      logoPx[o + 1] = clamp(col[1]);
      logoPx[o + 2] = clamp(col[2]);
      logoPx[o + 3] = 255;
    }
  }
}
renderSideBySide('demo-logo-64', logoPx, convert(logoPx, false));

// --- Face: skin gradient, hair, eyes, mouth. Best with dithering ON. -------
const facePx = Buffer.alloc(SRC * SRC * 4);
{
  const bg = [92, 108, 132];
  const hair = [34, 30, 28];
  const skinHi = [236, 200, 174];
  const skinLo = [206, 162, 136];
  const eye = [40, 36, 34];
  const mouth = [176, 96, 82];
  const cx = SRC / 2;
  const cy = SRC / 2 + 6;
  const rx = SRC * 0.3;
  const ry = SRC * 0.36;
  for (let y = 0; y < SRC; y += 1) {
    for (let x = 0; x < SRC; x += 1) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      let col = bg;
      if (dx * dx + dy * dy <= 1) {
        const shade = clamp(Math.round(0.5 + dy * 0.5));
        const t = shade;
        // Hair band on the upper region of the head.
        if (dy < -0.34) {
          col = mix2(skinHi, hair, clamp(1 - (dy + 0.34) / 0.2)) ;
        } else {
          col = mix2(skinHi, skinLo, t);
        }
        // Eyes: two dark dashes.
        const eyeDx = 0.24;
        if (Math.abs(dx - eyeDx) < 0.06 && Math.abs(dy + 0.04) < 0.06) col = eye;
        if (Math.abs(dx + eyeDx) < 0.06 && Math.abs(dy + 0.04) < 0.06) col = eye;
        // Mouth: subtle smile.
        if (Math.abs(dy + 0.26) < 0.04 && Math.abs(dx) < 0.16) col = mix2(mouth, eye, 0.25);
      }
      const o = (y * SRC + x) * 4;
      facePx[o] = clamp(col[0]);
      facePx[o + 1] = clamp(col[1]);
      facePx[o + 2] = clamp(col[2]);
      facePx[o + 3] = 255;
    }
  }
}
function mix2(a, b, t) {
  return [
    clamp(Math.round(a[0] + (b[0] - a[0]) * t)),
    clamp(Math.round(a[1] + (b[1] - a[1]) * t)),
    clamp(Math.round(a[2] + (b[2] - a[2]) * t)),
  ];
}
renderSideBySide('demo-face-64', facePx, convert(facePx, true));