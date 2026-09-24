import { gunzipSync } from 'fflate';
import { parseNbt, compoundOf, intOf, stringOf, listOf, type NbtValue } from './nbt/reader';
import type { PixelGrid } from './export/common';

export type SchematicFormat = 'litematic' | 'schem' | 'mcstructure';

export type ParsedSchematic = {
  format: SchematicFormat;
  name: string;
  width: number;
  height: number;
  depth: number;
  totalBlocks: number;
  dataVersion: number | null;
  /** Flat [x + z * width + y * width * depth] order, y = 0 is the bottom layer. */
  blockIds: Array<string | null>;
  paletteUsed: string[];
};

function bitsForPaletteSize(size: number) {
  return Math.max(2, (size - 1).toString(2).length);
}

/** Vanilla 1.16+ packing: entries never straddle long boundaries. */
export function unpackIndicesNonStraddle(longs: bigint[], bits: number, count: number): number[] {
  const perLong = Math.floor(64 / bits);
  const out: number[] = new Array(count);
  const mask = (1n << BigInt(bits)) - 1n;
  let index = 0;
  for (const long of longs) {
    for (let slot = 0; slot < perLong && index < count; slot += 1) {
      out[index++] = Number((long >> BigInt(slot * bits)) & mask);
    }
  }
  return out;
}

function paletteIdFromCompound(entry: NbtValue): { name: string; props: Record<string, string> } {
  const fields = compoundOf(entry);
  // Litematica/.schem use "Name"; Bedrock .mcstructure uses "name".
  const name = stringOf(fields.Name) || stringOf(fields.name);
  const props: Record<string, string> = {};
  if (fields.Properties && fields.Properties.type === 'compound') {
    for (const [key, prop] of Object.entries(fields.Properties.fields)) {
      props[key] = stringOf(prop);
    }
  }
  return { name, props };
}

function yzxToFlat(x: number, y: number, z: number, width: number, depth: number) {
  return x + z * width + y * width * depth;
}

function buildResult(
  format: SchematicFormat,
  name: string,
  width: number,
  height: number,
  depth: number,
  ids: Array<string | null>,
  dataVersion: number | null,
): ParsedSchematic {
  const paletteUsed = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  const totalBlocks = ids.filter(Boolean).length;
  return { format, name, width, height, depth, totalBlocks, dataVersion, blockIds: ids, paletteUsed };
}

export function parseLitematic(bytes: Uint8Array): ParsedSchematic {
  const root = compoundOf(parseNbt(bytes));
  const metadata = compoundOf(root.Metadata);
  const regions = compoundOf(root.Regions);

  let maxDepth = 1;
  const merged: Array<string | null> = [];
  let width = 0;
  let height = 0;

  for (const regionEntry of Object.values(regions)) {
    const region = compoundOf(regionEntry);
    const size = compoundOf(region.Size);
    const regionWidth = Math.abs(intOf(size.x, 1));
    const regionHeight = Math.abs(intOf(size.y, 1));
    const regionDepth = Math.abs(intOf(size.z, 1));
    width = Math.max(width, regionWidth);
    height = Math.max(height, regionHeight);
    maxDepth = Math.max(maxDepth, regionDepth);

    const paletteEntries = listOf(region.BlockStatePalette).map(paletteIdFromCompound);
    const paletteIds = paletteEntries.map((entry) => entry.name);
    const bits = bitsForPaletteSize(paletteIds.length);
    const volume = regionWidth * regionHeight * regionDepth;
    const longs = region.BlockStates?.type === 'longArray' ? region.BlockStates.value : [];
    const indices = unpackIndicesNonStraddle(longs, bits, volume);

    for (let y = 0; y < regionHeight; y += 1) {
      for (let z = 0; z < regionDepth; z += 1) {
        for (let x = 0; x < regionWidth; x += 1) {
          const index = indices[x + z * regionWidth + y * regionWidth * regionDepth];
          merged[yzxToFlat(x, y, z, width, maxDepth)] = paletteIds[index] ?? null;
        }
      }
    }
  }

  return buildResult(
    'litematic',
    stringOf(metadata.Name, 'litematic'),
    width,
    height,
    maxDepth,
    merged,
    intOf(root.MinecraftDataVersion) || null,
  );
}

export function parseSpongeSchem(bytes: Uint8Array): ParsedSchematic {
  let raw = bytes;
  try {
    raw = gunzipSync(bytes);
  } catch {
    // Some tools store .schem uncompressed; parse as-is.
  }
  const root = compoundOf(parseNbt(raw));
  const width = intOf(root.Width, 1);
  const height = intOf(root.Height, 1);
  const depth = intOf(root.Length, 1);
  const paletteMap = new Map<number, string>();
  if (root.Palette && root.Palette.type === 'compound') {
    for (const [id, value] of Object.entries(root.Palette.fields)) {
      paletteMap.set(intOf(value), id.split('[')[0]);
    }
  }
  const volume = width * height * depth;
  const blockData = root.BlockData;
  if (!blockData || blockData.type !== 'byteArray') throw new Error('.schem missing BlockData');
  const indices: number[] = [];
  {
    let i = 0;
    for (let n = 0; n < volume; n += 1) {
      let result = 0;
      let shift = 0;
      while (true) {
        const byte = blockData.value[i++];
        result |= (byte & 0x7f) << shift;
        if ((byte & 0x80) === 0) break;
        shift += 7;
      }
      indices.push(result >>> 0);
    }
  }

  const ids: Array<string | null> = new Array(volume).fill(null);
  for (let y = 0; y < height; y += 1) {
    for (let z = 0; z < depth; z += 1) {
      for (let x = 0; x < width; x += 1) {
        const worldIndex = x + z * width + y * width * depth;
        ids[yzxToFlat(x, y, z, width, depth)] = paletteMap.get(indices[worldIndex]) ?? null;
      }
    }
  }

  return buildResult('schem', stringOf(root.Name, 'schematic'), width, height, depth, ids, intOf(root.DataVersion) || null);
}

export function parseMcstructure(bytes: Uint8Array): ParsedSchematic {
  const root = compoundOf(parseNbt(bytes, { littleEndian: true }));
  const sizeField = root.size;
  let width = 1;
  let height = 1;
  let depth = 1;
  if (sizeField && sizeField.type === 'list') {
    width = intOf(sizeField.items[0], 1);
    height = intOf(sizeField.items[1], 1);
    depth = intOf(sizeField.items[2], 1);
  }
  const structure = compoundOf(root.structure);
  const palette = compoundOf(compoundOf(structure.palette).default);
  const blockPalette = listOf(palette.block_palette).map(paletteIdFromCompound);
  const blockPaletteIds = blockPalette.map((entry) => entry.name);
  const layers = listOf(structure.block_indices);
  if (!layers.length) throw new Error('.mcstructure missing block_indices');
  const layer0 = layers[0];
  const indices = layer0.type === 'list' ? layer0.items.map((item) => intOf(item, -1)) : [];

  const volume = width * height * depth;
  const ids: Array<string | null> = new Array(volume).fill(null);
  for (let y = 0; y < height; y += 1) {
    for (let z = 0; z < depth; z += 1) {
      for (let x = 0; x < width; x += 1) {
        const worldIndex = x + z * width + y * width * depth;
        const index = indices[worldIndex];
        ids[yzxToFlat(x, y, z, width, depth)] = index >= 0 ? blockPaletteIds[index] ?? null : null;
      }
    }
  }

  return buildResult('mcstructure', 'structure', width, height, depth, ids, null);
}

export function parseSchematicFile(fileName: string, bytes: Uint8Array): ParsedSchematic {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.litematic')) return parseLitematic(bytes);
  if (lower.endsWith('.schem')) return parseSpongeSchem(bytes);
  if (lower.endsWith('.mcstructure')) return parseMcstructure(bytes);
  throw new Error('Unsupported file type — expected .litematic, .schem or .mcstructure');
}

/** Converts a parsed schematic to the same grid type the export pipeline uses. */
export function toPixelGrid(parsed: ParsedSchematic): PixelGrid {
  // Take the bottom layer (pixel art is 1 deep); a 16x16x1 file maps 1:1.
  const { width, depth } = parsed;
  const blockIds: string[] = [];
  for (let z = 0; z < depth; z += 1) {
    for (let x = 0; x < width; x += 1) {
      const id = parsed.blockIds[yzxToFlat(x, 0, z, width, depth)] ?? 'minecraft:air';
      blockIds.push(id);
    }
  }
  return { width, height: depth, blockIds };
}
