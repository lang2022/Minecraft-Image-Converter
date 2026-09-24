import type { MosaicResult } from '../engine';

/**
 * BrickLink color IDs for every palette entry. Standard 1x1 plate (3024) is
 * the mosaic workhorse — one stud, one plate — so the wanted list maps each
 * color to that part. IDs follow BrickLink's color catalog.
 */
export const BRICKLINK_COLOR_IDS: Record<string, number> = {
  white: 1,
  'very-light-gray': 99,
  'light-gray': 86,
  'dark-gray': 85,
  black: 11,
  'bright-red': 5,
  'dark-red': 59,
  'bright-orange': 110,
  'dark-orange': 68,
  'bright-light-orange': 87,
  'bright-yellow': 3,
  'bright-light-yellow': 103,
  'bright-green': 36,
  'dark-green': 80,
  'bright-yellowish-green': 119,
  'sand-green': 151,
  'bright-blue': 7,
  'medium-blue': 42,
  'dark-blue': 63,
  'dark-azure': 109,
  'medium-azure': 113,
  'dark-turquoise': 39,
  'sand-blue': 55,
  'bright-violet': 112,
  'dark-purple': 89,
  'medium-lavender': 157,
  lavender: 154,
  magenta: 71,
  'bright-pink': 9,
  'dark-pink': 47,
  tan: 2,
  'dark-tan': 69,
  'reddish-brown': 88,
  'dark-brown': 120,
  nougat: 18,
  'medium-nougat': 150,
};

/** BrickLink plate part used for mosaics: one stud = one 1x1 plate. */
export const BRICKLINK_MOSAIC_PART = '3024';

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function serializeLegoBill(result: MosaicResult, header = 'Color,Studs'): string {
  const lines = [
    `# LEGO mosaic bill — ${result.width}x${result.height} (${result.totalCells} studs)`,
    header,
    ...result.colorCounts.map((color) => `${color.name},${color.count}`),
  ];
  return lines.join('\n');
}

/**
 * BrickLink wanted-list XML for the mosaic. Each color becomes one wanted
 * item: part 3024 (Plate 1x1) in the matching BrickLink color, quantity set
 * to the stud count. Upload via BrickLink Wanted → Upload → "Upload BrickLink
 * XML". Colors without a known BrickLink ID are skipped and reported.
 */
export function serializeLegoBrickLinkXml(result: MosaicResult): { xml: string; skipped: string[] } {
  const skipped: string[] = [];
  const items = result.colorCounts
    .map((color) => {
      const colorId = BRICKLINK_COLOR_IDS[color.id];
      if (!colorId) {
        skipped.push(color.name);
        return null;
      }
      return [
        '  <ITEM>',
        '    <ITEMTYPE>P</ITEMTYPE>',
        `    <ITEMID>${BRICKLINK_MOSAIC_PART}</ITEMID>`,
        `    <COLOR>${colorId}</COLOR>`,
        `    <MINQTY>${color.count}</MINQTY>`,
        '    <CONDITION>X</CONDITION>',
        `    <REMARKS>${escapeXml(color.name)} — ${result.width}x${result.height} mosaic</REMARKS>`,
        '  </ITEM>',
      ].join('\n');
    })
    .filter((item): item is string => item !== null);

  const xml = ['<INVENTORY>', ...items, '</INVENTORY>'].join('\n');
  return { xml, skipped };
}

/**
 * Baseplate guidance for the chosen mosaic size. LEGO baseplates are sold as
 * 16x16, 32x32 (10 in / 25 cm) and 48x48; larger mosaics tile 32x32 plates.
 */
export function baseplateAdvice(size: number): string {
  if (size <= 16) return 'Fits one 16×16 baseplate.';
  if (size <= 32) return 'Fits one 32×32 baseplate (10 in / 25 cm).';
  if (size <= 48) return 'Fits one 48×48 baseplate.';
  const tiles = Math.ceil(size / 32);
  return `Tile ${tiles * tiles} × 32×32 baseplates in a ${tiles}×${tiles} grid.`;
}