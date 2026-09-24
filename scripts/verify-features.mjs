import fs from 'node:fs';
import { execSync } from 'node:child_process';

execSync('npx tsc --project tsconfig.verify.json', { stdio: 'inherit' });
const { convertImageDataToBlocks } = await import('../out-test/lib/conversion.js');
const { convertImageDataToMosaic } = await import('../out-test/lib/mosaic/engine.js');
const { serializeLegoBrickLinkXml } = await import('../out-test/lib/mosaic/renderers/lego.js');
const { legoPalette } = await import('../out-test/lib/mosaic/palettes/lego.js');
const paletteManifest = JSON.parse(fs.readFileSync('public/data/blocks-palette-v2.json', 'utf8'));

const failures = [];
const fake = (n, v) => ({ width: n, height: n, data: new Uint8ClampedArray(n * n * 4).fill(v) });

// 1. Exclude ALL categories -> empty palette
try {
  const cats = [...new Set(paletteManifest.blocks.map((b) => b.category))];
  convertImageDataToBlocks(fake(4, 128), {
    width: 2, height: 2, dithering: false,
    palette: paletteManifest, excludedCategories: cats,
  });
  console.log('empty-palette: no crash');
} catch (e) {
  console.log('empty-palette: CRASH ->', String(e && e.message || e).slice(0, 120));
  failures.push('empty-palette');
}

// 2. Normal conversion with one category excluded
try {
  const r = convertImageDataToBlocks(fake(8, 200), {
    width: 4, height: 4, dithering: true,
    palette: paletteManifest, excludedCategories: ['stone'],
  });
  const usesStone = r.pixels.some((p) => p.block.category === 'stone');
  console.log('exclude-stone: pixels=' + r.pixels.length + ' usesStone=' + usesStone);
  if (usesStone) failures.push('exclude-stone-leak');
} catch (e) {
  console.log('exclude-stone: CRASH ->', String(e && e.message || e).slice(0, 120));
  failures.push('exclude-stone');
}

// 3. BrickLink XML spot check
try {
  const m = convertImageDataToMosaic(fake(32, 180), { width: 4, height: 4, dithering: false, palette: legoPalette });
  const { xml, skipped } = serializeLegoBrickLinkXml(m);
  const items = (xml.match(/<ITEM>/g) || []).length;
  console.log('bricklink-xml: items=' + items + ' colors=' + m.colorCounts.length + ' skipped=' + skipped.length);
  if (items !== m.colorCounts.length) failures.push('bricklink-count');
} catch (e) {
  console.log('bricklink-xml: CRASH ->', String(e && e.message || e).slice(0, 120));
  failures.push('bricklink-xml');
}

console.log(failures.length ? 'FAIL: ' + failures.join(',') : 'ALL PASS');
process.exit(failures.length ? 1 : 0);
