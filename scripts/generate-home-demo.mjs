import fs from 'node:fs';
import zlib from 'node:zlib';
import { execSync } from 'node:child_process';

/**
 * Generates public/demo-landscape-64.png: a synthetic 256px landscape photo
 * converted through the real pipeline to 64x64 blocks, rendered side by
 * side (source | block output) for the homepage "Why use" section.
 *
 * Run: node scripts/generate-home-demo.mjs
 */

execSync('npx tsc --project tsconfig.verify.json', { stdio: 'inherit' });
const { convertImageDataToBlocks } = await import('../out-test/lib/conversion.js');
const paletteManifest = JSON.parse(fs.readFileSync('public/data/blocks-palette-v2.json', 'utf8'));

const SRC = 256;
const GRID = 64;

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
function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}
function mix(c1, c2, t) {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}
function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >> 13)) | 0;
  h = (h * 1274126177) | 0;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}

// Synthetic "photo": sky gradient + sun + mountain ridges + lake + meadow.
const sky = [[122, 178, 227], [214, 233, 246]];
const sun = [255, 236, 170];
const rock = [[110, 105, 100], [70, 66, 63]];
const snow = [240, 242, 245];
const lake = [[64, 130, 180], [40, 95, 140]];
const grass = [[96, 160, 80], [60, 120, 60]];

const srcPx = Buffer.alloc(SRC * SRC * 4);
for (let y = 0; y < SRC; y += 1) {
  for (let x = 0; x < SRC; x += 1) {
    const horizon = 150 + 26 * Math.sin(x * 0.045) + 10 * Math.sin(x * 0.013 + 2);
    let c;
    if (y < horizon - 46) {
      c = mix(sky[0], sky[1], y / (horizon - 46));
      const d = Math.hypot(x - 178, y - 52);
      if (d < 26) c = mix(sun, c, Math.min(1, d / 26) * 0.85);
    } else if (y < horizon) {
      const t = (y - (horizon - 46)) / 46;
      c = mix(t < 0.35 ? snow : rock[0], rock[1], t * 0.7 + hash(x >> 2, y >> 2) * 0.15);
    } else if (y < horizon + 34) {
      const t = (y - horizon) / 34;
      c = mix(lake[0], lake[1], t + (hash(x >> 1, y >> 1) - 0.5) * 0.12);
    } else {
      const t = (y - horizon - 34) / (SRC - horizon - 34);
      c = mix(grass[0], grass[1], t + (hash(x >> 2, y >> 2) - 0.5) * 0.2);
    }
    const o = (y * SRC + x) * 4;
    srcPx[o] = Math.max(0, Math.min(255, c[0]));
    srcPx[o + 1] = Math.max(0, Math.min(255, c[1]));
    srcPx[o + 2] = Math.max(0, Math.min(255, c[2]));
    srcPx[o + 3] = 255;
  }
}

const imageData = { width: SRC, height: SRC, data: new Uint8ClampedArray(srcPx) };
const result = convertImageDataToBlocks(imageData, {
  width: GRID, height: GRID, dithering: true, palette: paletteManifest,
});
const distinct = new Set(result.pixels.map((p) => p.block.id)).size;
console.log(`converted: ${GRID}x${GRID}, distinct blocks: ${distinct}`);
console.log('top blocks:', result.materialList.slice(0, 5).map((m) => `${m.name} x${m.count}`).join(', '));

// Render side by side: source (256px) | gap | blocks (64x64 @ 8px cells = 512px).
const CELL = 8;
const GAP = 16;
const W = SRC + GAP + GRID * CELL;
const H = Math.max(SRC, GRID * CELL);
const out = Buffer.alloc(W * H * 4, 16);
for (let i = 3; i < out.length; i += 4) out[i] = 255;
const blit = (dx, dy, r, g, b) => {
  if (dx < 0 || dy < 0 || dx >= W || dy >= H) return;
  const o = (dy * W + dx) * 4;
  out[o] = r; out[o + 1] = g; out[o + 2] = b;
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
    for (let dx = 0; dx < CELL; dx += 1)
      blit(SRC + GAP + p.x * CELL + dx, oy + p.y * CELL + dy, r, g, b);
}

fs.writeFileSync('public/demo-landscape-64.png', encodePng(W, H, out));
console.log(`wrote public/demo-landscape-64.png (${W}x${H})`);
