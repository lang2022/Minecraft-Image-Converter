'use client';

import type { ConversionJobRequest, ConversionJobResponse } from '@/lib/worker-protocol';

export function createPaletteWorker() {
  return new Worker(new URL('../../worker/palette-worker.ts', import.meta.url), {
    type: 'module',
  });
}

export function runConversionInWorker(
  worker: Worker,
  payload: ConversionJobRequest,
): Promise<Extract<ConversionJobResponse, { type: 'result' }>> {
  return new Promise((resolve, reject) => {
    const handleMessage = (event: MessageEvent<ConversionJobResponse>) => {
      const response = event.data;

      if (response.type === 'result') {
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
        resolve(response);
      }

      if (response.type === 'error') {
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
        reject(new Error(response.message));
      }
    };

    const handleError = (event: ErrorEvent) => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      reject(new Error(event.message));
    };

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);
    worker.postMessage(payload);
  });
}
