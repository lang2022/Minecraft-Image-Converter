import { convertImageDataToMosaic } from '../lib/mosaic/engine';
import { legoPalette } from '../lib/mosaic/palettes/lego';
import type { MosaicJobRequest, MosaicJobResponse } from '../lib/mosaic-worker-protocol';

const palettes = {
  lego: legoPalette,
} as const;

self.onmessage = (event: MessageEvent<MosaicJobRequest>) => {
  const job = event.data;

  if (job.type !== 'convert-mosaic') return;

  try {
    const palette = palettes[job.paletteId];
    if (!palette) throw new Error(`Unknown palette: ${job.paletteId}`);

    const progress: MosaicJobResponse = { type: 'progress', value: 40, message: 'Matching colors…' };
    self.postMessage(progress);

    const result = convertImageDataToMosaic(job.imageData, {
      width: job.width,
      height: job.height,
      dithering: job.dithering,
      palette,
    });

    const response: MosaicJobResponse = {
      type: 'result',
      width: result.width,
      height: result.height,
      pixels: result.pixels.map((pixel) => ({ x: pixel.x, y: pixel.y, colorId: pixel.color.id })),
      colorCounts: result.colorCounts,
      totalCells: result.totalCells,
    };

    self.postMessage(response);
  } catch (error) {
    const response: MosaicJobResponse = {
      type: 'error',
      message: error instanceof Error ? error.message : 'Mosaic worker conversion failed',
    };
    self.postMessage(response);
  }
};
