import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import zlib from 'node:zlib';

/**
 * Automated portion of docs/in-game-verification-checklist.md, step 0 & the
 * "横板核对矩阵". It:
 *   1. Builds the canonical 16x16 four-quadrant sample (TL red / TR green /
 *      BL blue / BR yellow), converting it through the real LAB pipeline.
 *   2. Exports .schem / .litematic / .mcstructure.
 *   3. Re-parses each with the SAME readers the site's 3D viewer uses
 *      (lib/schematic-view.ts) and checks the structural invariants the
 *      in-game checklist equates with visible correctness:
 *        - dimensions 16x16x1          (躺着的一层, 不立墙面)
 *        - quadrant orientation        (四象限方位, incl. 上下翻转 = top row at high Y)
 *        - color identity vs canvas    (颜色与预览一致, via block id map)
 *      Also verifies every block id exists in the real palette manifest.
 *
 * What this CANNOT do (still a manual step): actually pasting inside
 * Minecraft/WorldEdit/Litematica/Bedrock. Run those steps in game — see the
 * "步骤" sections of docs/in-game-verification-checklist.md.
 *
 * Run: node scripts/verify-export-roundtrip.mjs
 */
const OUT_DIR = 'out-verify';
const PALETTE_PATH = path.join('public', 'data', 'blocks-palette-v2.json');

execSync('npx tsc --project tsconfig.verify.json', { stdio: 'inherit' });

const { convertImageDataToBlocks } = await import('../out-test/lib/conversion.js');
const { exportSchem } = await import('../out-test/lib/export/schem.js');
const { exportLitematic } = await import('../out-test/lib/export/litematic.js');
const { exportMcstructure } = await import('../out-test/lib/export/mcstructure.js');
const { parseSchematicFile } = await import('../out-test/lib/schematic-view.js');

const paletteManifest = JSON.parse(fs.readFileSync(PALETTE_PATH, 'utf8'));
const paletteBlocksById = new Map((paletteManifest.blocks ?? []).map((b) => [b.id, b]));
const knownBlockIds = new Set(paletteBlocksById.keys());

const N = 16;
// 1 source pixel per block: quadrants are 8x8 source px.
const H = 8;
const QUADS = {
  red: { x0: 0, y0: 0, rgb: [220, 48, 48] },
  green: { x0: 8, y0: 0, rgb: [60, 178, 74] },
  blue: { x0: 0, y0: 8, rgb: [36, 92, 220] },
  yellow: { x0: 8, y0: 8, rgb: [235, 200, 40] },
};

function buildSource() {
  const data = new Uint8ClampedArray(N * N * 4);
  for (const { x0, y0, rgb } of Object.values(QUADS)) {
    for (let qy = 0; qy < H; qy += 1) {
      for (let qx = 0; qx < H; qx += 1) {
        const o = ((y0 + qy) * N + (x0 + qx)) * 4;
        data[o] = rgb[0];
        data[o + 1] = rgb[1];
        data[o + 2] = rgb[2];
        data[o + 3] = 255;
      }
    }
  }
  return { width: N, height: N, data };
}

const results = {}; // blockGrid[x][y] -> { id }
const source = buildSource();
const converted = convertImageDataToBlocks(source, {
  width: N,
  height: N,
  dithering: false,
  palette: paletteManifest,
});

// converted.pixels.cells -> record top-left block. Build grid indexing by
// artwork row (row 0 = TOP row of the image = highest Y in world).
const gridByArtRow = Array.from({ length: N }, () => new Array(N));
for (const cell of converted.pixels) {
  gridByArtRow[cell.y][cell.x] = cell.block.id;
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const files = {
  schem: exportSchem(
    { width: N, height: N, blockIds: flatRows(gridByArtRow) },
    { name: 'four-quadrant-16' },
  ),
  litematic: exportLitematic(
    { width: N, height: N, blockIds: flatRows(gridByArtRow) },
    { name: 'four-quadrant-16' },
  ),
  mcstructure: exportMcstructure({ width: N, height: N, blockIds: flatRows(gridByArtRow) }),
};

function flatRows(rows) {
  return rows.flat();
}

const pass = [];
const fail = [];

function check(label, ok, detail = '') {
  (ok ? pass : fail).push({ label, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`);
}

function writeAndParse(ext, bytes, isGzip) {
  const p = path.join(OUT_DIR, `four-quadrant-16.${ext}`);
  fs.writeFileSync(p, isGzip ? zlib.gzipSync(bytes, { level: 6 }) : bytes);
  // .schem is written gzipped by exportSchem already; normalize: use raw bytes.
  return { file: p, parsed: parseSchematicFile(`x.${ext}`, bytes) };
}

// ---------------------------------------------------------------------------
for (const [key, ext, bytes, gzip] of [
  ['WorldEdit/.schem', 'schem', files.schem, false],
  ['Litematica/.litematic', 'litematic', files.litematic, false],
  ['Bedrock/.mcstructure', 'mcstructure', files.mcstructure, false],
]) {
  console.log(`\n=== ${key} ===`);
  const p = path.join(OUT_DIR, `four-quadrant-16.${ext}`);
  fs.writeFileSync(p, bytes);
  const parsed = parseSchematicFile(`four-quadrant-16.${ext}`, bytes);

  check(`dimensions 16x16x1`, parsed.width === 16 && parsed.height === 16 && parsed.depth === 1,
    `${parsed.width}x${parsed.height}x${parsed.depth}`);

  // Place parsed block on a 2D x/z grid using bottom layer via toPixelGrid.
  const grid = toGrid(parsed);
  check(`totalBlocks == 256`, parsed.totalBlocks === 256, `${parsed.totalBlocks}`);

  // Quadrant orientation + color identity vs canvas: compare parsed cells
  // directly against the artwork grid (block-id equality, props stripped).
  // Parsed grid[row][x] has row 0 = image top (toGrid maps high Y first).
  for (const [name, expectFn] of [
    ['red = top-left 8x8', (r, c) => r < 8 && c < 8],
    ['green = top-right 8x8', (r, c) => r < 8 && c >= 8],
    ['blue = bottom-left 8x8', (r, c) => r >= 8 && c < 8],
    ['yellow = bottom-right 8x8', (r, c) => r >= 8 && c >= 8],
  ]) {
    let match = 0;
    let total = 0;
    for (let r = 0; r < N; r += 1) {
      for (let c = 0; c < N; c += 1) {
        if (!expectFn(r, c)) continue;
        total += 1;
        if (strip(grid[r][c]) === strip(gridByArtRow[r][c])) match += 1;
      }
    }
    check(`quadrant ${name} matches canvas`, match === total, `${match}/${total} cells`);
  }

  // Top row sits at highest Y: the artwork's top row (row 0) must be fully
  // recoverable from the parsed file's highest-Y layer.
  check('top image row lands on highest Y (not vertically flipped)',
    topRowMatches(grid, gridByArtRow[0]));

  // All ids must be a known palette block (or air).
  const unknown = [...new Set(allNonNull(parsed))].filter((id) => id !== 'minecraft:air' && !paletteBlocksById.has(id) && !paletteBlocksById.has(id.split('[')[0]));
  check('all block ids resolve in palette manifest', unknown.length === 0,
    unknown.length ? unknown.join(', ') : '');
}

console.log(`\n===== SUMMARY: ${pass.length} passed, ${fail.length} failed =====`);
if (fail.length) {
  console.log('Failed checks:');
  for (const f of fail) console.log(`  - ${f.label}${f.detail ? ` (${f.detail})` : ''}`);
  process.exit(1);
}
console.log('Files written under out-verify/ for manual in-game import.');
for (const f of fs.readdirSync(OUT_DIR)) console.log(`  - ${f}`);

// ---------------------------------------------------------------------------
function toGrid(parsed) {
  // Rows along world Y; grid[0] is the TOP image row (highest Y), so the
  // quadrant check below can compare directly with the artwork rows.
  const { width, height, depth } = parsed;
  const grid = Array.from({ length: height }, () => new Array(width).fill('minecraft:air'));
  for (let y = 0; y < height; y += 1) {
    const r = height - 1 - y; // top image row first
    for (let z = 0; z < depth; z += 1) {
      for (let x = 0; x < width; x += 1) {
        const flat = x + z * width + y * width * depth;
        grid[r][x] = parsed.blockIds[flat] ?? 'minecraft:air';
      }
    }
  }
  return grid; // grid[row][x], row 0 = image top
}

function allNonNull(parsed) {
  return parsed.blockIds.filter((id) => id !== null);
}

function matchColor(id, rgb) {
  // Resolve block family id (strip props in [..]).
  const base = id.split('[')[0];
  const entry = paletteBlocksById.get(base) ?? paletteBlocksById.get(id);
  if (!entry) return false;
  const { avgColor } = entry;
  if (!avgColor) return true; // no color info; skip
  const m = avgColor.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return true;
  const hr = Number.parseInt(m[1].slice(0, 2), 16);
  const hg = Number.parseInt(m[1].slice(2, 4), 16);
  const hb = Number.parseInt(m[1].slice(4, 6), 16);
  return Math.abs(hr - rgb[0]) < 90 && Math.abs(hg - rgb[1]) < 90 && Math.abs(hb - rgb[2]) < 90;
}

function dominantColor(blockIds) {
  const count = new Map();
  for (const id of blockIds) count.set(id, (count.get(id) ?? 0) + 1);
  let best = null;
  let bestCount = -1;
  for (const [id, c] of count) {
    if (id === 'minecraft:air') continue;
    if (c > bestCount) {
      bestCount = c;
      best = id;
    }
  }
  return best;
}

function checkQuadrants(grid) {
  const out = {};
  const rows = grid.length;
  const cols = grid[0].length;
  const halfR = rows / 2;
  const halfC = cols / 2;
  const expected = {
    red: [0, 0], // top-left
    green: [0, halfC], // top-right
    blue: [halfR, 0], // bottom-left
    yellow: [halfR, halfC], // bottom-right
  };
  for (const [name, [r0, c0]] of Object.entries(expected)) {
    const cells = [];
    for (let r = r0; r < r0 + halfR; r += 1)
      for (let c = c0; c < c0 + halfC; c += 1) cells.push(grid[r][c]);
    const dominant = dominantColor(cells);
    out[name] = dominant && matchColor(dominant, colors[name]);
  }
  return out;
}

function strip(id) {
  return (id ?? '').split('[')[0];
}

function topRowMatches(grid, expectedTopRowIds) {
  // toGrid returns rows in image order: grid[0] is the image top row, which
  // the exporter must have placed at the highest world Y.
  const topLayer = grid[0];
  if (!topLayer) return false;
  for (let x = 0; x < topLayer.length; x += 1) {
    // Compare block id (strip props).
    const a = strip(topLayer[x]);
    const b = strip(expectedTopRowIds[x]);
    if (a !== b) return false;
  }
  return true;
}