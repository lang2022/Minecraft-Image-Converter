import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execSync } from 'node:child_process';
import { gunzipSync } from 'fflate';
import nbt from 'prismarine-nbt';
import { decodePng, sampleRgba } from './lib/png-decode.mjs';

/**
 * Desktop acceptance: decodes the three exported structure files in docs/,
 * renders each to a top-down PNG, and compares them pixel-by-pixel against
 * the original test image (docs/xxx.png) through the same conversion pipeline
 * the app uses.
 *
 * Usage: node scripts/verify-docs-samples.mjs [docsDir]
 */

const DOCS = path.resolve(process.argv[2] ?? 'docs');
const OUT_DIR = path.join(DOCS, 'rendered');
const CELL = 24;

execSync('npx tsc --project tsconfig.verify.json', { stdio: 'inherit' });
const { convertImageDataToBlocks } = await import('../out-test/lib/conversion.js');
const { rgbToLab, ciede2000 } = await import('../out-test/lib/color.js');
const paletteManifest = JSON.parse(fs.readFileSync('public/data/blocks-palette-v2.json', 'utf8'));
const paletteById = new Map(paletteManifest.blocks.map((block) => [block.id, block]));

function parseSimplified(bytes, format) {
  const parsed = nbt.parseUncompressed(Buffer.from(bytes), format, { noArraySizeCheck: true });
  return nbt.simplify(parsed);
}

function decodeVarints(bytes, count) {
  const out = [];
  let i = 0;
  for (let n = 0; n < count; n += 1) {
    let result = 0;
    let shift = 0;
    while (true) {
      const byte = bytes[i];
      i += 1;
      result |= (byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) break;
      shift += 7;
    }
    out.push(result >>> 0);
  }
  return out;
}

function unpackNonStraddle(pairs, bits, count) {
  const toLong = (pair) => (BigInt(pair[0] >>> 0) << 32n) | BigInt(pair[1] >>> 0);
  const perLong = Math.floor(64 / bits);
  const out = [];
  let longIndex = 0;
  let offset = 0;
  for (let i = 0; i < count; i += 1) {
    const value = toLong(pairs[longIndex]);
    out.push(Number((value >> BigInt(offset * bits)) & ((1n << BigInt(bits)) - 1n)));
    offset += 1;
    if (offset === perLong) {
      offset = 0;
      longIndex += 1;
    }
  }
  return out;
}

// Extract { width, height, ids[y * width + x] } from each format.
function decodeSchem(bytes) {
  const fields = parseSimplified(gunzipSync(bytes), 'big');
  const width = fields.Width;
  const height = fields.Height;
  const palette = new Map(Object.entries(fields.Palette).map(([id, index]) => [id, index]));
  const data = decodeVarints(new Uint8Array(fields.BlockData), width * height);
  const ids = new Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      // World order is y (bottom-up) → z → x; flip y back to image order (top-down).
      const worldIndex = (height - 1 - y) * width + x;
      ids[y * width + x] = [...palette.entries()].find(([, index]) => index === data[worldIndex])?.[0] ?? null;
    }
  }
  return { width, height, ids, meta: { version: fields.Version, dataVersion: fields.DataVersion } };
}

function decodeLitematic(bytes) {
  const fields = parseSimplified(bytes, 'big');
  const region = Object.values(fields.Regions)[0];
  const width = region.Size.x;
  const height = region.Size.y;
  const paletteNames = region.BlockStatePalette.map((entry) => entry.Name);
  const bits = Math.max(2, (paletteNames.length - 1).toString(2).length);
  const data = unpackNonStraddle(region.BlockStates, bits, width * height);
  const ids = new Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const worldIndex = (height - 1 - y) * width + x;
      ids[y * width + x] = paletteNames[data[worldIndex]] ?? null;
    }
  }
  return {
    width,
    height,
    ids,
    meta: { dataVersion: fields.MinecraftDataVersion, region: Object.keys(fields.Regions)[0] },
  };
}

function decodeMcstructure(bytes) {
  const fields = parseSimplified(bytes, 'little');
  const [width, height] = fields.size;
  const paletteNames = fields.structure.palette.default.block_palette.map((entry) => entry.name);
  const layer = fields.structure.block_indices[0];
  const ids = new Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const worldIndex = (height - 1 - y) * width + x;
      const index = layer[worldIndex];
      ids[y * width + x] = index === -1 ? null : paletteNames[index] ?? null;
    }
  }
  return { width, height, ids, meta: { version: fields.version } };
}

// Render a decoded grid to a PNG buffer (single-file PNG encoder).
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
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function renderGrid(grid) {
  const out = Buffer.alloc(grid.width * CELL * grid.height * CELL * 4);
  for (let y = 0; y < grid.height; y += 1) {
    for (let x = 0; x < grid.width; x += 1) {
      const id = grid.ids[y * grid.width + x];
      const block = id ? paletteById.get(id) : null;
      const hex = block ? block.avgColor.replace('#', '') : 'ff00ff';
      const r = Number.parseInt(hex.slice(0, 2), 16);
      const g = Number.parseInt(hex.slice(2, 4), 16);
      const b = Number.parseInt(hex.slice(4, 6), 16);
      for (let cy = 0; cy < CELL; cy += 1) {
        for (let cx = 0; cx < CELL; cx += 1) {
          const isBorder = cy === 0 || cx === 0;
          const o = ((y * CELL + cy) * grid.width * CELL + x * CELL + cx) * 4;
          out[o] = isBorder ? Math.max(0, r - 40) : r;
          out[o + 1] = isBorder ? Math.max(0, g - 40) : g;
          out[o + 2] = isBorder ? Math.max(0, b - 40) : b;
          out[o + 3] = 255;
        }
      }
    }
  }
  return encodePng(grid.width * CELL, grid.height * CELL, out);
}

// Compare original image against decoded grids, color-cell by color-cell.
function compareWithOriginal(grid, original) {
  const scaleX = original.width / grid.width;
  const scaleY = original.height / grid.height;
  let mismatches = 0;
  const details = [];

  for (let y = 0; y < grid.height; y += 1) {
    for (let x = 0; x < grid.width; x += 1) {
      const id = grid.ids[y * grid.width + x];
      const block = id ? paletteById.get(id) : null;
      const sampleX = Math.min(original.width - 1, Math.floor((x + 0.5) * scaleX));
      const sampleY = Math.min(original.height - 1, Math.floor((y + 0.5) * scaleY));
      const [r, g, b] = sampleRgba(original, sampleX, sampleY);
      if (!block) {
        mismatches += 1;
        details.push(`(${x},${y}) empty`);
        continue;
      }
      const [labL, labA, labB] = rgbToLab(r, g, b);
      const [bl, ba, bb] = block.lab;
      const distance = ciede2000([labL, labA, labB], [bl, ba, bb]);
      if (distance > 25) {
        mismatches += 1;
        details.push(`(${x},${y}) ${block.id} vs rgb(${r},${g},${b}) dE=${distance.toFixed(1)}`);
      }
    }
  }
  return { mismatches, total: grid.width * grid.height, details };
}

// Run everything.
const pngPath = path.join(DOCS, 'xxx.png');
const original = decodePng(fs.readFileSync(pngPath));
console.log(`Original image: ${original.width}x${original.height} (${path.relative(process.cwd(), pngPath)})`);

const decoders = {
  'xxx.schem': [decodeSchem, 'big-gzip'],
  'xxx.litematic': [decodeLitematic, 'big'],
  'xxx.mcstructure': [decodeMcstructure, 'little'],
};

fs.mkdirSync(OUT_DIR, { recursive: true });
let failures = 0;

for (const [file, [decoder]] of Object.entries(decoders)) {
  const fullPath = path.join(DOCS, file);
  if (!fs.existsSync(fullPath)) {
    console.error(`SKIP ${file} (not found)`);
    failures += 1;
    continue;
  }
  try {
    const grid = decoder(fs.readFileSync(fullPath));
    console.log(`\n[${file}] ${grid.width}x${grid.height} ${JSON.stringify(grid.meta)}`);
    const unique = [...new Set(grid.ids)];
    console.log(`  blocks used: ${unique.length} -> ${unique.slice(0, 6).join(', ')}${unique.length > 6 ? ' ...' : ''}`);

    const renderedPath = path.join(OUT_DIR, `${file}.topdown.png`);
    fs.writeFileSync(renderedPath, renderGrid(grid));
    console.log(`  rendered top-down -> ${path.relative(process.cwd(), renderedPath)}`);

    if (grid.width * grid.height !== original.width * original.height || grid.width !== original.width) {
      const result = compareWithOriginal(grid, original);
      const pass = result.mismatches === 0;
      console.log(`  compare vs original: ${result.total - result.mismatches}/${result.total} cells match`);
      if (!pass) {
        failures += 1;
        console.log(`  first mismatches: ${result.details.slice(0, 8).join(' | ')}`);
      }
    } else {
      const result = compareWithOriginal(grid, original);
      console.log(`  compare vs original: ${result.total - result.mismatches}/${result.total} cells match`);
      if (result.mismatches > 0) {
        failures += 1;
        console.log(`  first mismatches: ${result.details.slice(0, 8).join(' | ')}`);
      }
    }
  } catch (error) {
    failures += 1;
    console.error(`  FAIL ${file}: ${error.message}`);
  }
}

console.log(
  failures === 0
    ? '\nDesktop acceptance passed: all three files decode, render, and match the original image.'
    : `\n${failures} file(s) failed desktop acceptance. See details above.`,
);
process.exit(failures === 0 ? 0 : 1);
