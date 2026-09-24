import { nbt, serializeNbt } from '../nbt/writer';
import { buildPalette, totalBlocks, type PixelGrid } from './common';

/**
 * Litematica packs palette indices into longs without straddling
 * long boundaries (vanilla 1.16+ style): each long holds floor(64 / bits)
 * entries, first entry in the lowest bits, padding bits stay zero.
 */
export function packIndicesNonStraddle(indices: number[], bits: number): bigint[] {
  const perLong = Math.floor(64 / bits);
  const longCount = Math.ceil(indices.length / perLong);
  const longs: bigint[] = new Array(longCount).fill(0n);
  let current = 0n;
  let offset = 0;
  let longIndex = 0;

  for (const value of indices) {
    current |= BigInt(value) << BigInt(offset * bits);
    offset += 1;
    if (offset === perLong) {
      longs[longIndex] = current;
      longIndex += 1;
      current = 0n;
      offset = 0;
    }
  }

  if (offset > 0) {
    longs[longIndex] = current;
  }

  return longs;
}

function bitsForPaletteSize(size: number) {
  return Math.max(2, (size - 1).toString(2).length);
}

export function exportLitematic(grid: PixelGrid, options?: { name?: string; author?: string }): Uint8Array {
  const palette = buildPalette(grid);
  const bits = bitsForPaletteSize(palette.blocks.length);
  const width = grid.width;
  const height = grid.height;
  const length = 1;
  const indices: number[] = [];

  for (let y = 0; y < height; y += 1) {
    const row = height - 1 - y;
    for (let z = 0; z < length; z += 1) {
      for (let x = 0; x < width; x += 1) {
        const id = grid.blockIds[row * width + x];
        indices.push(palette.indexById.get(id) ?? 0);
      }
    }
  }

  const now = BigInt(Date.now());
  const regionName = 'pixel-art';

  const root = nbt.compound({
    Version: nbt.int(5),
    SubVersion: nbt.string('1.0.0'),
    MinecraftDataVersion: nbt.int(3465),
    Metadata: nbt.compound({
      Author: nbt.string(options?.author ?? 'minecraft-image-converter'),
      Description: nbt.string(options?.name ?? 'Minecraft Image Converter pixel art'),
      EnclosingSize: nbt.compound({
        x: nbt.int(width),
        y: nbt.int(height),
        z: nbt.int(length),
      }),
      Name: nbt.string(options?.name ?? 'Minecraft Image Converter pixel art'),
      RegionCount: nbt.int(1),
      TotalBlocks: nbt.int(totalBlocks(grid)),
      TotalVolume: nbt.int(width * height * length),
      TimeCreated: nbt.long(now),
      TimeModified: nbt.long(now),
    }),
    Regions: nbt.compound({
      [regionName]: nbt.compound({
        BlockStatePalette: nbt.list(
          'compound',
          palette.blocks.map((id) => nbt.compound({ Name: nbt.string(id) })),
        ),
        BlockStates: nbt.longArray(packIndicesNonStraddle(indices, bits)),
        Position: nbt.compound({ x: nbt.int(0), y: nbt.int(0), z: nbt.int(0) }),
        Size: nbt.compound({
          x: nbt.int(width),
          y: nbt.int(height),
          z: nbt.int(length),
        }),
      }),
    }),
  });

  return serializeNbt(root, '', 'big');
}
