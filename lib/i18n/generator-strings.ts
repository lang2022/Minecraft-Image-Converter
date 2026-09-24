export type GeneratorLocale = 'en' | 'ja';

/* NOTE: Japanese copy below is written in native phrasing (no English
   calques), but has not yet been reviewed by a native speaker. Keep the
   NEEDS-NATIVE-REVIEW gate before treating /ja as production SEO. */

export type GeneratorStrings = {
  eyebrow: string;
  title: string;
  subtitle: string;
  uploadTitle: string;
  uploadHint: string;
  sizePresets: string;
  options: string;
  dithering: string;
  palette: string;
  paletteInUse: (inUse: number, total: number) => string;
  paletteHint: string;
  resetPalette: string;
  atlasLink: string;
  actions: string;
  clear: string;
  openViewer: string;
  recent: string;
  blockTypes: string;
  removeHistory: (name: string) => string;
  noFile: string;
  ready: string;
  processing: (value: number) => string;
  zoomLabel: (value: number) => string;
  zoomAria: string;
  previewTitle: string;
  downloadPng: string;
  downloadCsv: string;
  materialList: string;
  totalBlocks: (count: number) => string;
  uploadToGenerate: string;
  schematicExports: string;
  schematicHint: string;
  exporting: string;
  csvHeader: string;
  downloadSchem: string;
  downloadLitematic: string;
  downloadMcstructure: string;
  alreadyExported: string;
  inspectViewer: string;
  noGame: string;
  orText: string;
  buildLego: string;
  steps: Array<[string, string]>;
  msgInitial: string;
  msgProcessing: string;
  msgLoading: string;
  msgImageReady: string;
  msgConverted: (label: string, w: number, h: number) => string;
  msgFailed: string;
  msgCanvasUnavailable: string;
  msgRestored: (file: string, w: number, h: number) => string;
  msgDemo: string;
  defaultFileName: string;
  includeCategory: (label: string) => string;
  keepOneCategory: string;
  categories: Record<string, string>;
};

const en: GeneratorStrings = {
  eyebrow: 'Generator',
  title: 'Free Minecraft Pixel Art Generator',
  subtitle: 'Upload an image, choose a target size, and preview the Minecraft-style output instantly.',
  uploadTitle: 'Upload or drop image',
  uploadHint: 'PNG, JPG, WEBP. Processing stays in your browser.',
  sizePresets: 'Size presets',
  options: 'Options',
  dithering: 'Dithering',
  palette: 'Palette',
  paletteInUse: (inUse, total) => `${inUse} of ${total} blocks in use`,
  paletteHint: 'Uncheck a family to exclude it — e.g. survival players short on stone. Converts again automatically.',
  resetPalette: 'Reset to full palette',
  atlasLink: 'Browse the full block atlas →',
  actions: 'Actions',
  clear: 'Clear current project',
  openViewer: 'Open the 3D viewer',
  recent: 'Recent',
  blockTypes: 'block types',
  removeHistory: (name) => `Remove ${name} from history`,
  noFile: 'No file loaded',
  ready: 'Ready',
  processing: (v) => `Processing ${v}%`,
  zoomLabel: (v) => `Zoom ${v}×`,
  zoomAria: 'Preview zoom level',
  previewTitle: 'Preview canvas placeholder',
  downloadPng: 'Download PNG',
  downloadCsv: 'Download CSV',
  materialList: 'Material list',
  totalBlocks: (c) => `${c} total blocks in the latest conversion.`,
  uploadToGenerate: 'Upload an image to generate a material list.',
  schematicExports: 'Schematic exports',
  schematicHint: 'Load these with WorldEdit / Litematica / Bedrock structure blocks.',
  exporting: 'Exporting…',
  csvHeader: 'name,count',
  downloadSchem: 'Download .schem',
  downloadLitematic: 'Download .litematic',
  downloadMcstructure: 'Download .mcstructure (Bedrock)',
  alreadyExported: 'Already exported?',
  inspectViewer: 'Inspect the file in the 3D viewer',
  noGame: '— no game required. Or',
  orText: 'Or',
  buildLego: 'build the same image as a LEGO mosaic',
  steps: [
    ['Upload', 'Drag and drop an image, paste from clipboard, or browse files.'],
    ['Process', 'Run LAB matching and palette reduction in a Web Worker.'],
    ['Export', 'Save outputs for players, builders, and future schematic workflows.'],
  ],
  msgInitial: 'Upload an image to begin the conversion preview.',
  msgProcessing: 'Processing in worker...',
  msgLoading: 'Loading image...',
  msgImageReady: 'Image ready. Reprocessing with current controls...',
  msgConverted: (label, w, h) => `Converted ${label} into ${w}×${h} blocks.`,
  msgFailed: 'Conversion failed.',
  msgCanvasUnavailable: 'Canvas not available',
  msgRestored: (file, w, h) => `Restored ${file} (${w}×${h}) from history.`,
  msgDemo: 'demo image',
  defaultFileName: 'minecraft-conversion',
  includeCategory: (label) => `Include ${label} blocks`,
  keepOneCategory: 'At least one block family must stay enabled',
  categories: {
    concrete: 'Concrete',
    wool: 'Wool',
    terracotta: 'Terracotta',
    wood: 'Wood',
    stone: 'Stone',
    natural: 'Natural',
    mineral: 'Mineral',
    special: 'Special',
  },
};

const ja: GeneratorStrings = {
  eyebrow: 'ドット絵変換',
  title: 'マイクラ ドット絵ジェネレーター',
  subtitle: '画像を入れるだけで、マイクラ風のドット絵をその場でプレビュー。サイズを選んで変換しよう。',
  uploadTitle: '画像をドラッグ＆ドロップ',
  uploadHint: 'PNG・JPG・WEBP対応。画像がサーバーに送られることはありません。',
  sizePresets: '出力サイズ',
  options: '設定',
  dithering: 'ディザをかける',
  palette: '使うブロック',
  paletteInUse: (inUse, total) => `使用中：${inUse}／${total}種類`,
  paletteHint: '持っていない素材の系列は外しておけば、そのブロックを使わない設計図になります。外すと自動で変換し直します。',
  resetPalette: 'すべて元に戻す',
  atlasLink: 'ブロック図鑑を見る →',
  actions: '操作',
  clear: '最初からやり直す',
  openViewer: '3Dビューアを開く',
  recent: '変換履歴',
  blockTypes: '種類',
  removeHistory: (name) => `${name}を履歴から消す`,
  noFile: '画像がありません',
  ready: 'OK',
  processing: (v) => `変換中 ${v}%`,
  zoomLabel: (v) => `拡大 ${v}倍`,
  zoomAria: 'プレビューの拡大倍率',
  previewTitle: 'プレビュー',
  downloadPng: 'PNGで保存',
  downloadCsv: 'CSVで保存',
  materialList: '必要な素材',
  totalBlocks: (c) => `合計${c}ブロック使います`,
  uploadToGenerate: '画像を変換すると、ここに素材の一覧が出ます。',
  schematicExports: '設計図の出力',
  schematicHint: 'WorldEdit・Litematica・統合版のストラクチャーブロックで読み込めます。',
  exporting: '出力中…',
  csvHeader: 'name,count',
  downloadSchem: '.schemで保存',
  downloadLitematic: '.litematicで保存',
  downloadMcstructure: '.mcstructureで保存（統合版）',
  alreadyExported: '出力できましたか？',
  inspectViewer: '3Dビューアで確認',
  noGame: '——ゲームを開かなくて大丈夫。そのまま',
  orText: 'または',
  buildLego: '同じ画像でレゴのモザイクを作る',
  steps: [
    ['画像を入れる', 'ドラッグ＆ドロップ、コピペ、ファイル選択のどれでもOKです。'],
    ['変換する', '色の近いブロックを自動で選んで、ドット絵に組み直します。'],
    ['保存して作る', 'PNG・素材一覧・設計図ファイルで持ち出せます。'],
  ],
  msgInitial: '画像をアップロードすると、ここにドット絵のプレビューが出ます。',
  msgProcessing: '変換中…',
  msgLoading: '画像を読み込み中…',
  msgImageReady: '画像を読み込みました。設定に合わせて変換し直します…',
  msgConverted: (label, w, h) => `${label}を${w}×${h}ブロックに変換しました。`,
  msgFailed: '変換できませんでした。別の画像で試してみてください。',
  msgCanvasUnavailable: 'このブラウザではCanvasが使えません',
  msgRestored: (file, w, h) => `${file}（${w}×${h}）を履歴から戻しました。`,
  msgDemo: 'デモ画像',
  defaultFileName: 'minecraft-dot-art',
  includeCategory: (label) => `${label}を使う`,
  keepOneCategory: '1つ以上の系列を残してください',
  categories: {
    concrete: 'コンクリート',
    wool: '羊毛',
    terracotta: 'テラコッタ',
    wood: '木材',
    stone: '石材',
    natural: '自然',
    mineral: '鉱物',
    special: '特殊',
  },
};

export const generatorStrings: Record<GeneratorLocale, GeneratorStrings> = { en, ja };
