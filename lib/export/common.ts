export type PixelGrid = {
  width: number;
  height: number;
  /** Row-major block ids, y = 0 is the TOP row of the artwork. */
  blockIds: string[];
};

export type GridPalette = {
  /** Palette entries ordered by usage count (most used first). */
  blocks: string[];
  indexById: Map<string, number>;
  counts: Array<{ id: string; count: number }>;
};

export function buildPalette(grid: PixelGrid): GridPalette {
  const counts = new Map<string, number>();

  for (const id of grid.blockIds) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const blocks = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);

  const indexById = new Map(blocks.map((id, index) => [id, index]));
  const orderedCounts = blocks.map((id) => ({ id, count: counts.get(id) ?? 0 }));

  return { blocks, indexById, counts: orderedCounts };
}

/**
 * Sponge/Litematica iterate blocks top-down in world space (y grows upward),
 * so the artwork's top row (y = 0) must land at worldY = height - 1.
 */
export function worldY(grid: PixelGrid, row: number) {
  return grid.height - 1 - row;
}

export function totalBlocks(grid: PixelGrid) {
  return grid.width * grid.height;
}
