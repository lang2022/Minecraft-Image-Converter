import { gzipSync } from 'fflate';
import { nbt, serializeNbt } from '../nbt/writer';
import { buildPalette, type PixelGrid } from './common';

/**
 * Sponge Schematic v2 (WorldEdit / FAWE): big-endian NBT, gzipped.
 * BlockData is varint-encoded palette indices ordered by world Y (bottom-up),
 * then Z, then X. Our artwork is 1 block deep, top row = highest Y.
 */
export function exportSchem(grid: PixelGrid, options?: { name?: string }): Uint8Array {
  const palette = buildPalette(grid);
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

  const blockData: number[] = [];
  for (const index of indices) {
    let value = index;
    while (true) {
      if ((value & ~0x7f) === 0) {
        blockData.push(value);
        break;
      }
      blockData.push((value & 0x7f) | 0x80);
      value >>>= 7;
    }
  }

  const root = nbt.compound({
    Version: nbt.int(2),
    DataVersion: nbt.int(3465),
    Width: nbt.short(width),
    Height: nbt.short(height),
    Length: nbt.short(length),
    Palette: nbt.compound(
      Object.fromEntries(palette.blocks.map((id, index) => [id, nbt.int(index)])),
    ),
    PaletteMax: nbt.int(palette.blocks.length),
    BlockData: nbt.byteArray(new Uint8Array(blockData)),
    Metadata: nbt.compound({
      Name: nbt.string(options?.name ?? 'Minecraft Image Converter'),
      Author: nbt.string('minecraft-image-converter'),
    }),
  });

  return gzipSync(serializeNbt(root, 'Schematic', 'big'), { level: 6 });
}
