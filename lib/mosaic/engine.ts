import { rgbToLab, ciede2000, hexToRgb } from '../color';

/**
 * Mosaic engine: the grid-conversion core shared by every "image → grid
 * pattern" niche (LEGO, cross stitch, fuse beads). A niche only supplies a
 * palette and its own renderer; matching, sampling and dithering live here.
 */

export type MosaicColor = {
  id: string;
  name: string;
  hex: string;
  category?: string;
};

export type PreparedMosaicColor = MosaicColor & {
  lab: [number, number, number];
  rgb: { r: number; g: number; b: number };
};

export type MosaicOptions = {
  width: number;
  height: number;
  dithering: boolean;
  palette: MosaicColor[];
};

export type MosaicPixel = {
  x: number;
  y: number;
  color: PreparedMosaicColor;
  distance: number;
};

export type MosaicResult = {
  width: number;
  height: number;
  pixels: MosaicPixel[];
  colorCounts: Array<{ id: string; name: string; hex: string; count: number }>;
  totalCells: number;
};

export function prepareMosaicPalette(colors: MosaicColor[]): PreparedMosaicColor[] {
  return colors.map((color) => {
    const rgb = hexToRgb(color.hex);
    return { ...color, rgb, lab: rgbToLab(rgb.r, rgb.g, rgb.b) };
  });
}

function clamp(value: number) {
  return Math.max(0, Math.min(255, value));
}

function findClosestColor(lab: [number, number, number], palette: PreparedMosaicColor[]) {
  let best = palette[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const color of palette) {
    const distance = ciede2000(lab, color.lab);
    if (distance < bestDistance) {
      best = color;
      bestDistance = distance;
    }
  }

  return { color: best, distance: bestDistance };
}

export function convertImageDataToMosaic(imageData: ImageData, options: MosaicOptions): MosaicResult {
  const { width, height } = options;
  const palette = prepareMosaicPalette(options.palette);
  const pixels: MosaicPixel[] = [];
  const counts = new Map<string, { id: string; name: string; hex: string; count: number }>();

  // Nearest-neighbor sample of the source into the target grid. The samples
  // are mutable because dithering rewrites the values in place.
  const sampled = new Array(width * height).fill(null).map((_, index) => {
    const x = index % width;
    const y = Math.floor(index / width);
    const srcX = Math.floor((x / width) * imageData.width);
    const srcY = Math.floor((y / height) * imageData.height);
    const sourceIndex = (srcY * imageData.width + srcX) * 4;
    return {
      r: clamp(imageData.data[sourceIndex] ?? 0),
      g: clamp(imageData.data[sourceIndex + 1] ?? 0),
      b: clamp(imageData.data[sourceIndex + 2] ?? 0),
    };
  });

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sample = sampled[y * width + x];
      const lab = rgbToLab(sample.r, sample.g, sample.b);
      const { color, distance } = findClosestColor(lab, palette);

      pixels.push({ x, y, color, distance });

      const existing = counts.get(color.id);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(color.id, { id: color.id, name: color.name, hex: color.hex, count: 1 });
      }

      if (options.dithering) {
        const errorR = sample.r - color.rgb.r;
        const errorG = sample.g - color.rgb.g;
        const errorB = sample.b - color.rgb.b;

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
    colorCounts: Array.from(counts.values()).sort((a, b) => b.count - a.count),
    totalCells: width * height,
  };
}