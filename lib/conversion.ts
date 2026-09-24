import { rgbToLab } from './color';
import type { PaletteManifest, PaletteBlock } from './palette';
import { findClosestBlock, type WorkerReadyPaletteBlock } from './worker-api';

export type ConversionOptions = {
  width: number;
  height: number;
  dithering: boolean;
  palette: PaletteManifest;
  includeUnobtainable?: boolean;
  excludedCategories?: string[];
};

export type ConvertedPixel = {
  x: number;
  y: number;
  block: PaletteBlock;
  distance: number;
};

export type ConversionResult = {
  width: number;
  height: number;
  pixels: ConvertedPixel[];
  materialList: Array<{ id: string; name: string; count: number }>;
};

function clamp(value: number) {
  return Math.max(0, Math.min(255, value));
}

function pickPalette(options: ConversionOptions): WorkerReadyPaletteBlock[] {
  const excluded = new Set(options.excludedCategories ?? []);
  return options.palette.blocks
    .filter((block) => (options.includeUnobtainable ?? true) || block.obtainable)
    .filter((block) => !excluded.has(block.category))
    .map((block) => ({ ...block, lab: block.lab }));
}

function parseHexColor(hex: string) {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

export function convertImageDataToBlocks(
  imageData: ImageData,
  options: ConversionOptions,
): ConversionResult {
  const width = options.width;
  const height = options.height;
  const palette = pickPalette(options);
  const pixels: ConvertedPixel[] = [];
  const materialCounts = new Map<string, { id: string; name: string; count: number }>();

  const sampled = new Array(width * height).fill(null).map((_, index) => {
    const x = index % width;
    const y = Math.floor(index / width);
    const srcX = Math.floor((x / width) * imageData.width);
    const srcY = Math.floor((y / height) * imageData.height);
    const sourceIndex = (srcY * imageData.width + srcX) * 4;
    return {
      x,
      y,
      r: clamp(imageData.data[sourceIndex] ?? 0),
      g: clamp(imageData.data[sourceIndex + 1] ?? 0),
      b: clamp(imageData.data[sourceIndex + 2] ?? 0),
    };
  });

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sampleIndex = y * width + x;
      const sample = sampled[sampleIndex];
      const lab = rgbToLab(sample.r, sample.g, sample.b);
      const { block, distance } = findClosestBlock(lab, palette);

      pixels.push({ x, y, block, distance });

      const existing = materialCounts.get(block.id);
      if (existing) {
        existing.count += 1;
      } else {
        materialCounts.set(block.id, { id: block.id, name: block.name, count: 1 });
      }

      if (options.dithering) {
        const blockRgb = parseHexColor(block.avgColor);
        const errorR = sample.r - blockRgb.r;
        const errorG = sample.g - blockRgb.g;
        const errorB = sample.b - blockRgb.b;

        const distribute = (targetX: number, targetY: number, factor: number) => {
          if (targetX < 0 || targetY < 0 || targetX >= width || targetY >= height) return;
          const target = sampled[targetY * width + targetX];
          target.r = clamp(target.r + errorR * factor);
          target.g = clamp(target.g + errorG * factor);
          target.b = clamp(target.b + errorB * factor);
        };

        distribute(x + 1, y, 7 / 16);
        distribute(x - 1, y + 1, 3 / 16);
        distribute(x, y + 1, 5 / 16);
        distribute(x + 1, y + 1, 1 / 16);
      }
    }
  }

  return {
    width,
    height,
    pixels,
    materialList: Array.from(materialCounts.values()).sort((a, b) => b.count - a.count),
  };
}

export function createFlatPreviewGrid(result: ConversionResult) {
  const rows: string[] = [];

  for (let y = 0; y < result.height; y += 1) {
    const row = result.pixels
      .filter((pixel) => pixel.y === y)
      .map((pixel) => pixel.block.name.slice(0, 1).toUpperCase())
      .join(' ');
    rows.push(row);
  }

  return rows;
}

export function serializeMaterialList(result: ConversionResult) {
  return result.materialList.map((item) => `${item.name},${item.count}`).join('\n');
}
