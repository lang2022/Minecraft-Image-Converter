import { convertImageDataToBlocks } from '../lib/conversion';
import { demoPaletteManifest } from '../lib/palette';
import type { ConversionJobRequest, ConversionJobResponse } from '../lib/worker-protocol';

self.onmessage = (event: MessageEvent<ConversionJobRequest>) => {
  const job = event.data;

  if (job.type !== 'convert-image') return;

  try {
    const result = convertImageDataToBlocks(job.imageData, {
      width: job.width,
      height: job.height,
      dithering: job.dithering,
      palette: demoPaletteManifest,
      includeUnobtainable: true,
      excludedCategories: job.excludedCategories ?? [],
    });

    const response: ConversionJobResponse = {
      type: 'result',
      width: result.width,
      height: result.height,
      pixels: result.pixels.map((pixel) => ({
        x: pixel.x,
        y: pixel.y,
        blockId: pixel.block.id,
        blockName: pixel.block.name,
        color: pixel.block.avgColor,
      })),
      materialList: result.materialList,
    };

    self.postMessage(response);
  } catch (error) {
    const response: ConversionJobResponse = {
      type: 'error',
      message: error instanceof Error ? error.message : 'Worker conversion failed',
    };
    self.postMessage(response);
  }
};
