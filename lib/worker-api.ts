import type { PaletteBlock } from './palette';
import { ciede2000 } from './color';

export type WorkerReadyPaletteBlock = PaletteBlock & {
  lab: [number, number, number];
};

export function findClosestBlock(
  inputLab: [number, number, number],
  palette: WorkerReadyPaletteBlock[],
) {
  let best = palette[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const block of palette) {
    const distance = ciede2000(inputLab, block.lab);
    if (distance < bestDistance) {
      best = block;
      bestDistance = distance;
    }
  }

  return { block: best, distance: bestDistance };
}
