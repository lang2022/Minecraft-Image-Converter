import { nbt, serializeNbt } from '../nbt/writer';
import type { PixelGrid } from './common';

/**
 * Bedrock .mcstructure: little-endian NBT.
 * block_indices is a list of two layers; layer 0 holds palette indices,
 * layer 1 holds water-logging indices (-1 = none).
 * Indices iterate x, then z, then y from the structure origin upward,
 * so the artwork's top row (row 0) lands at the highest Y.
 */
export function exportMcstructure(grid: PixelGrid): Uint8Array {
  const width = grid.width;
  const height = grid.height;
  const length = 1;

  const uniqueIds = Array.from(new Set(grid.blockIds));
  const indexById = new Map(uniqueIds.map((id, index) => [id, index]));

  const layer0: number[] = [];
  const layer1: number[] = [];

  for (let y = 0; y < height; y += 1) {
    const row = height - 1 - y;
    for (let z = 0; z < length; z += 1) {
      for (let x = 0; x < width; x += 1) {
        const id = grid.blockIds[row * width + x];
        layer0.push(indexById.get(id) ?? 0);
        layer1.push(-1);
      }
    }
  }

  const structure = nbt.compound({
    format_version: nbt.int(1),
    size: nbt.list('int', [nbt.int(width), nbt.int(height), nbt.int(length)]),
    structure_world_origin: nbt.list('int', [nbt.int(0), nbt.int(0), nbt.int(0)]),
    structure: nbt.compound({
      block_indices: nbt.list('list', [
        nbt.list('int', layer0.map((value) => nbt.int(value))),
        nbt.list('int', layer1.map((value) => nbt.int(value))),
      ]),
      entities: nbt.list('compound', []),
      palette: nbt.compound({
        default: nbt.compound({
          block_palette: nbt.list(
            'compound',
            uniqueIds.map((id) =>
              nbt.compound({
                name: nbt.string(id),
                states: nbt.compound({}),
                version: nbt.int(18163713),
              }),
            ),
          ),
          block_position_data: nbt.compound({}),
        }),
      }),
    }),
  });

  return serializeNbt(structure, '', 'little');
}
