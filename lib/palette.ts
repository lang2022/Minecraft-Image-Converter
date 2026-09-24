import paletteGenerated from './palette.generated.json';
import { rgbToLab } from './color';
import catalog from './blocks-catalog.json';

export type BlockCatalogEntry = {
  id: string;
  name: string;
  hex: string;
  category: string;
  obtainable?: boolean;
  texture?: string;
  tint?: string;
};

export type AtlasMeta = {
  src: string;
  textureSrc?: string;
  columns: number;
  cellSize: number;
  mode: 'average-color' | 'vanilla-textures' | 'custom';
  generator?: string;
};

export type PaletteBlock = {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  avgColor: string;
  lab: [number, number, number];
  category: string;
  obtainable: boolean;
};

export type PaletteManifest = {
  version: string;
  mcVersion: string;
  atlas: string | AtlasMeta;
  blocks: PaletteBlock[];
};

export const blockCatalog = catalog as BlockCatalogEntry[];

const ATLAS_COLUMNS = 16;
const CELL_SIZE = 16;

function withLab(blocks: PaletteBlock[]): PaletteBlock[] {
  return blocks.map((block) => {
    const { r, g, b } = hexToRgb(block.avgColor);
    return { ...block, lab: rgbToLab(r, g, b) };
  });
}

function hexToRgb(hex: string) {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

const generated = paletteGenerated as PaletteManifest;

/**
 * Single source of truth: public/data/blocks-palette-v2.json, produced by
 * `npm run generate:palette`. Regenerate it after touching blocks-catalog.json
 * or scanning a resource pack; this import always mirrors the published data.
 */
export const demoPaletteManifest: PaletteManifest = {
  ...generated,
  blocks: withLab(generated.blocks),
};

/** Stable category list with display labels and block counts for the palette filter UI. */
export const paletteCategories: Array<{ id: string; label: string; count: number }> = (() => {
  const labels: Record<string, string> = {
    concrete: 'Concrete',
    wool: 'Wool',
    terracotta: 'Terracotta',
    wood: 'Wood',
    stone: 'Stone',
    natural: 'Natural',
    mineral: 'Mineral',
    special: 'Special',
  };
  const counts = new Map<string, number>();
  for (const block of generated.blocks) {
    counts.set(block.category, (counts.get(block.category) ?? 0) + 1);
  }
  return [...counts.entries()].map(([id, count]) => ({ id, label: labels[id] ?? id, count }));
})();

export function getAtlasMeta(manifest: PaletteManifest): AtlasMeta {
  if (typeof manifest.atlas === 'string') {
    return { src: manifest.atlas, columns: ATLAS_COLUMNS, cellSize: CELL_SIZE, mode: 'custom' };
  }
  return manifest.atlas;
}
