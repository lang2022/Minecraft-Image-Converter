'use client';

import type { PaletteManifest } from './palette';

export type PreviewPixel = {
  x: number;
  y: number;
  block: { avgColor: string; x: number; y: number; w: number; h: number };
};

/**
 * Draws the converted grid onto a canvas. When the true-texture atlas is
 * loaded it blits each block's actual 16x16 texture (imageSmoothing off so
 * pixels stay crisp); otherwise it falls back to flat average colors.
 */
export function drawPreviewGrid(
  canvas: HTMLCanvasElement,
  options: {
    width: number;
    height: number;
    pixels: PreviewPixel[];
    textureAtlas: HTMLImageElement | null;
    cellSize: number;
    background?: string;
  },
) {
  const { width, height, pixels, textureAtlas, cellSize, background = '#09111f' } = options;
  canvas.width = width * cellSize;
  canvas.height = height * cellSize;

  const context = canvas.getContext('2d');
  if (!context) return;

  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (const pixel of pixels) {
    const px = pixel.x * cellSize;
    const py = pixel.y * cellSize;
    const block = pixel.block;

    if (textureAtlas && textureAtlas.complete && textureAtlas.naturalWidth > 0) {
      context.drawImage(textureAtlas, block.x, block.y, block.w, block.h, px, py, cellSize, cellSize);
    } else {
      context.fillStyle = block.avgColor;
      context.fillRect(px, py, cellSize, cellSize);
      if (cellSize >= 6) {
        const edge = Math.max(1, Math.round(cellSize * 0.14));
        context.fillStyle = 'rgba(255,255,255,0.16)';
        context.fillRect(px, py, cellSize, edge);
        context.fillRect(px, py, edge, cellSize);
        context.fillStyle = 'rgba(0,0,0,0.22)';
        context.fillRect(px, py + cellSize - edge, cellSize, edge);
        context.fillRect(px + cellSize - edge, py, edge, cellSize);
      }
    }
  }
}

export function loadTextureAtlas(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export function atlasSrcFor(manifest: PaletteManifest): string | null {
  if (typeof manifest.atlas === 'string') return null;
  return manifest.atlas.textureSrc ?? null;
}
