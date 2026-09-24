import fs from 'node:fs';

const p = 'app/pixel-art-generator/GeneratorWorkspace.tsx';
let t = fs.readFileSync(p, 'utf8');

const reps = [
  [`import { demoPaletteManifest, paletteCategories, type PaletteBlock } from '@/lib/palette';`,
   `import { demoPaletteManifest, paletteCategories, type PaletteBlock } from '@/lib/palette';
import { generatorStrings, type GeneratorLocale } from '@/lib/i18n/generator-strings';`],
  [`export function GeneratorWorkspace() {`,
   `export function GeneratorWorkspace({ locale = 'en' }: { locale?: GeneratorLocale } = {}) {
  const t = generatorStrings[locale];`],
  [`const [size, setSize] = useState(32);  const [busy, setBusy] = useState(false);`,
   `const [size, setSize] = useState(32);
  const [busy, setBusy] = useState(false);`],
  [`const [message, setMessage] = useState('Upload an image to begin the conversion preview.');`,
   `const [message, setMessage] = useState(t.msgInitial);`],
  [`const [sourceName, setSourceName] = useState<string>('demo image');`,
   `const [sourceName, setSourceName] = useState<string>(t.msgDemo);`],
  [`setMessage('Processing in worker...');`, `setMessage(t.msgProcessing);`],
  [`setMessage(\`Converted \${originalLabel} into \${result.width}×\${result.height} blocks.\`);`,
   `setMessage(t.msgConverted(originalLabel, result.width, result.height));`],
  [`setMessage(error instanceof Error ? error.message : 'Conversion failed.');`,
   `setMessage(error instanceof Error ? error.message : t.msgFailed);`],
  [`setMessage('Loading image...');`, `setMessage(t.msgLoading);`],
  [`if (!context) throw new Error('Canvas not available');`,
   `if (!context) throw new Error(t.msgCanvasUnavailable);`],
  [`setMessage('Image ready. Reprocessing with current controls...');`, `setMessage(t.msgImageReady);`],
  [`setSourceName('demo image');`, `setSourceName(t.msgDemo);`],
  [`setMessage('Upload an image to begin the conversion preview.');\n    const canvas = canvasRef.current;`,
   `setMessage(t.msgInitial);\n    const canvas = canvasRef.current;`],
  [`setMessage(\`Restored \${entry.fileName} (\${entry.width}×\${entry.height}) from history.\`);`,
   `setMessage(t.msgRestored(entry.fileName, entry.width, entry.height));`],
  [`anchor.download = \`\${fileName ?? 'minecraft-conversion'}.csv\`;`,
   `anchor.download = \`\${fileName ?? t.defaultFileName}.csv\`;`],
  [`anchor.download = \`\${fileName ?? 'minecraft-conversion'}.png\`;`,
   `anchor.download = \`\${fileName ?? t.defaultFileName}.png\`;`],
  [`<p className="eyebrow">Generator</p>`, `<p className="eyebrow">{t.eyebrow}</p>`],
  [`<h1 className="mt-2 text-3xl font-bold text-neutral-100">Free Minecraft Pixel Art Generator</h1>`,
   `<h1 className="mt-2 text-3xl font-bold text-neutral-100">{t.title}</h1>`],
  [`Upload an image, choose a target size, and preview the Minecraft-style output instantly.`,
   `{t.subtitle}`],
  [`<span className="font-semibold text-neutral-100">Upload or drop image</span>`,
   `<span className="font-semibold text-neutral-100">{t.uploadTitle}</span>`],
  [`<span>PNG, JPG, WEBP. Processing stays in your browser.</span>`, `<span>{t.uploadHint}</span>`],
  [`<h2 className="eyebrow">Size presets</h2>`, `<h2 className="eyebrow">{t.sizePresets}</h2>`],
  [`<h2 className="eyebrow">Options</h2>`, `<h2 className="eyebrow">{t.options}</h2>`],
  [`<span>Dithering</span>`, `<span>{t.dithering}</span>`],
  [`<h2 className="eyebrow">Palette</h2>`, `<h2 className="eyebrow">{t.palette}</h2>`],
  [`{demoPaletteManifest.blocks.length - excludedBlockCount} of {demoPaletteManifest.blocks.length} blocks in use`,
   `{t.paletteInUse(demoPaletteManifest.blocks.length - excludedBlockCount, demoPaletteManifest.blocks.length)}`],
  [`Uncheck a family to exclude it — e.g. survival players short on stone. Converts again automatically.`,
   `{t.paletteHint}`],
  [`{category.label} · {category.count}`, `{t.categories[category.id] ?? category.label} · {category.count}`],
  [`aria-label={\`Include \${category.label} blocks\`}`, `aria-label={t.includeCategory(t.categories[category.id] ?? category.label)}`],
  [`Reset to full palette`, `{t.resetPalette}`],
  [`Browse the full block atlas →`, `{t.atlasLink}`],
  [`<h2 className="eyebrow">Actions</h2>`, `<h2 className="eyebrow">{t.actions}</h2>`],
  [`Clear current project`, `{t.clear}`],
  [`Open the 3D viewer`, `{t.openViewer}`],
  [`<h2 className="eyebrow">Recent</h2>`, `<h2 className="eyebrow">{t.recent}</h2>`],
  [`{entry.width}×{entry.height} · {entry.materialList.length} block types`,
   `{entry.width}×{entry.height} · {entry.materialList.length} {t.blockTypes}`],
  [`aria-label={\`Remove \${entry.fileName} from history\`}`, `aria-label={t.removeHistory(entry.fileName)}`],
  [`<span>{fileName ?? 'No file loaded'}</span>`, `<span>{fileName ?? t.noFile}</span>`],
  [`<span className="shrink-0">Zoom {zoom}×</span>`, `<span className="shrink-0">{t.zoomLabel(zoom)}</span>`],
  [`aria-label="Preview zoom level"`, `aria-label={t.zoomAria}`],
  [`<span>{progress ? \`Processing \${progress}%\` : 'Ready'}</span>`, `<span>{progress ? t.processing(progress) : t.ready}</span>`],
  [`<h2 className="text-2xl font-bold text-neutral-100">Preview canvas placeholder</h2>`,
   `<h2 className="text-2xl font-bold text-neutral-100">{t.previewTitle}</h2>`],
  [`Download PNG`, `{t.downloadPng}`],
  [`Download CSV`, `{t.downloadCsv}`],
  [`<h3 className="text-lg font-semibold text-neutral-100">Material list</h3>`,
   `<h3 className="text-lg font-semibold text-neutral-100">{t.materialList}</h3>`],
  [`<p className="mt-1 text-sm text-neutral-500">{totalBlocks} total blocks in the latest conversion.</p>`,
   `<p className="mt-1 text-sm text-neutral-500">{t.totalBlocks(totalBlocks)}</p>`],
  [`<p className="text-sm text-neutral-500">Upload an image to generate a material list.</p>`,
   `<p className="text-sm text-neutral-500">{t.uploadToGenerate}</p>`],
  [`<h3 className="text-lg font-semibold text-neutral-100">Schematic exports</h3>`,
   `<h3 className="text-lg font-semibold text-neutral-100">{t.schematicExports}</h3>`],
  [`<p className="mt-1 text-sm text-neutral-500">Load these with WorldEdit / Litematica / Bedrock structure blocks.</p>`,
   `<p className="mt-1 text-sm text-neutral-500">{t.schematicHint}</p>`],
  [`{busyFormat === 'schem' ? 'Exporting…' : 'Download .schem'}`, `{busyFormat === 'schem' ? t.exporting : t.downloadSchem}`],
  [`{busyFormat === 'litematic' ? 'Exporting…' : 'Download .litematic'}`,
   `{busyFormat === 'litematic' ? t.exporting : t.downloadLitematic}`],
  [`{busyFormat === 'mcstructure' ? 'Exporting…' : 'Download .mcstructure (Bedrock)'}`,
   `{busyFormat === 'mcstructure' ? t.exporting : t.downloadMcstructure}`],
  [`Already exported?{' '}`, `{t.alreadyExported}{' '}`],
  [`Inspect the file in the 3D viewer`, `{t.inspectViewer}`],
  [`— no game required. Or{' '}`, `{t.noGame}{' '}`],
  [`build the same image as a LEGO mosaic`, `{t.buildLego}`],
  [`[
            ['Upload', 'Drag and drop an image, paste from clipboard, or browse files.'],
            ['Process', 'Run LAB matching and palette reduction in a Web Worker.'],
            ['Export', 'Save outputs for players, builders, and future schematic workflows.'],
          ].map(([title, body]) => (`,
   `{t.steps.map(([title, body]) => (`],
];

let missing = [];
for (const [old, next] of reps) {
  if (!t.includes(old)) {
    missing.push(old.slice(0, 80));
    continue;
  }
  t = t.split(old).join(next);
}
fs.writeFileSync(p, t);
console.log(missing.length ? 'MISSING:\n' + missing.join('\n') : 'all applied');