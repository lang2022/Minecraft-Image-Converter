import { execSync } from 'node:child_process';
import { gunzipSync } from 'fflate';
import nbt from 'prismarine-nbt';

execSync('npx tsc --project tsconfig.verify.json', { stdio: 'inherit' });

const { exportSchem, exportLitematic, exportMcstructure } = await import('../out-test/lib/export/index.js');

const width = 4;
const height = 3;
const blockIds = [];
for (let row = 0; row < height; row += 1) {
  for (let x = 0; x < width; x += 1) {
    blockIds.push((x + row) % 2 === 0 ? 'minecraft:stone' : 'minecraft:oak_planks');
  }
}
const grid = { width, height, blockIds };
const volume = width * height;

let failures = 0;
function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures += 1;
    console.error(`  FAIL ${name}${detail ? ` ${detail}` : ''}`);
  }
}

function toLong(pair) {
  return (BigInt(pair[0] >>> 0) << 32n) | BigInt(pair[1] >>> 0);
}

function unpackNonStraddle(pairs, bits, count) {
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

/** Expected palette indices in world order: y = 0 (bottom) first, then z, then x. */
function expectedIndices(palette) {
  const out = [];
  for (let y = 0; y < height; y += 1) {
    const row = height - 1 - y;
    for (let z = 0; z < 1; z += 1) {
      for (let x = 0; x < width; x += 1) {
        out.push(palette.get(blockIds[row * width + x]) ?? -1);
      }
    }
  }
  return out;
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function parseSimplified(bytes, format) {
  const parsed = nbt.parseUncompressed(Buffer.from(bytes), format, { noArraySizeCheck: true });
  return { root: parsed, fields: nbt.simplify(parsed) };
}

console.log('\n[1] .schem (Sponge v2, gzip + big-endian NBT)');
{
  const gzipped = exportSchem(grid, { name: 'verify' });
  const raw = gunzipSync(gzipped);
  const { root, fields } = parseSimplified(raw, 'big');
  check('root name is Schematic', root.name === 'Schematic', `got "${root.name}"`);
  check('Version == 2', fields.Version === 2);
  check('dimensions match grid', fields.Width === width && fields.Height === height && fields.Length === 1);
  check('PaletteMax == 2', fields.PaletteMax === 2, `got ${fields.PaletteMax}`);
  const palette = new Map(Object.entries(fields.Palette).map(([id, index]) => [id, index]));
  const decoded = decodeVarints(new Uint8Array(fields.BlockData), volume);
  check('decoded varint sequence matches expected world order', arraysEqual(decoded, expectedIndices(palette)), JSON.stringify(decoded));
}

console.log('\n[2] .litematic (big-endian NBT, non-straddle long packing)');
{
  const raw = exportLitematic(grid, { name: 'verify' });
  const { root, fields } = parseSimplified(raw, 'big');
  check('root name is empty (anonymous)', root.name === '', `got "${root.name}"`);
  check('TotalVolume matches grid', fields.Metadata.TotalVolume === volume, `got ${fields.Metadata.TotalVolume}`);
  const region = fields.Regions['pixel-art'];
  check('region Size matches grid', region.Size.x === width && region.Size.y === height && region.Size.z === 1);
  const paletteNames = region.BlockStatePalette.map((entry) => entry.Name);
  const palette = new Map(paletteNames.map((id, index) => [id, index]));
  const pairs = region.BlockStates;
  const bits = Math.max(2, (paletteNames.length - 1).toString(2).length);
  const perLong = Math.floor(64 / bits);
  check('long count matches non-straddle packing', pairs.length === Math.ceil(volume / perLong), `got ${pairs.length}`);
  const decoded = unpackNonStraddle(pairs, bits, volume);
  check('unpacked indices match expected world order', arraysEqual(decoded, expectedIndices(palette)), JSON.stringify(decoded));
}

console.log('\n[3] .mcstructure (little-endian NBT)');
{
  const raw = exportMcstructure(grid);
  const { root, fields } = parseSimplified(raw, 'little');
  check('root name is empty (anonymous)', root.name === '', `got "${root.name}"`);
  check('size matches grid', JSON.stringify(fields.size) === JSON.stringify([width, height, 1]));
  const layers = fields.structure.block_indices;
  check('two block index layers', layers.length === 2, `got ${layers.length}`);
  const uniqueIds = Array.from(new Set(blockIds));
  const palette = new Map(uniqueIds.map((id, index) => [id, index]));
  check('layer 0 matches expected world order', arraysEqual(layers[0], expectedIndices(palette)), JSON.stringify(layers[0]));
  check('layer 1 is all -1 (no water)', layers[1].length === volume && layers[1].every((value) => value === -1));
  const blockPaletteNames = fields.structure.palette.default.block_palette.map((entry) => entry.name);
  check('block palette covers all used blocks', blockPaletteNames.length === uniqueIds.length);
}

console.log(failures === 0 ? '\nAll export roundtrip checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
