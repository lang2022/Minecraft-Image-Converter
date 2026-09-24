'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { createFlatPreviewGrid, serializeMaterialList } from '@/lib/conversion';
import {
  loadConversionHistory,
  removeConversionFromHistory,
  saveConversionToHistory,
  type ConversionHistoryEntry,
} from '@/lib/conversion-history';
import { demoPaletteManifest, paletteCategories, type PaletteBlock } from '@/lib/palette';
import { generatorStrings, type GeneratorLocale } from '@/lib/i18n/generator-strings';
import { atlasSrcFor, drawPreviewGrid, loadTextureAtlas } from '@/lib/preview';
import { ExternalLink } from '@/components/ExternalLink';
import { createPaletteWorker, runConversionInWorker } from './WorkerClient';
import { useSchematicExport, type SchematicFormat } from './useSchematicExport';

const sizePresets = [
  { label: '16×16', value: 16 },
  { label: '32×32', value: 32 },
  { label: '64×64', value: 64 },
  { label: '128×128', value: 128 },
];

// One swatch per category-ordered block: a compact visual summary of the
// palette instead of a 101-card wall that pushes the actions off-screen.
const paletteSwatches = demoPaletteManifest.blocks;

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = reject;
    image.src = url;
  });
}

function ensureWorker(workerRef: React.RefObject<Worker | null>) {
  if (!workerRef.current) {
    workerRef.current = createPaletteWorker();
  }

  return workerRef.current;
}

export function GeneratorWorkspace({ locale = 'en' }: { locale?: GeneratorLocale } = {}) {
  const t = generatorStrings[locale];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const conversionIdRef = useRef(0);

  const [size, setSize] = useState(32);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dithering, setDithering] = useState(false);
  const [excludedCategories, setExcludedCategories] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [previewBaseWidth, setPreviewBaseWidth] = useState(0);
  const [output, setOutput] = useState<string[]>([]);
  const [materials, setMaterials] = useState<Array<{ id: string; name: string; count: number }>>([]);
  const [message, setMessage] = useState(t.msgInitial);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [sourceImageData, setSourceImageData] = useState<ImageData | null>(null);
  const [sourceName, setSourceName] = useState<string>(t.msgDemo);
  const [schematicGrid, setSchematicGrid] = useState<{ width: number; height: number; blockIds: string[] } | null>(null);
  const [textureAtlas, setTextureAtlas] = useState<HTMLImageElement | null>(null);
  const [history, setHistory] = useState<ConversionHistoryEntry[]>([]);
  const { downloadSchematic, busyFormat } = useSchematicExport();

  const totalBlocks = useMemo(() => output.length * (output[0]?.split(' ').length ?? 0), [output]);

  const excludedBlockCount = useMemo(
    () =>
      demoPaletteManifest.blocks.filter((block) => excludedCategories.includes(block.category)).length,
    [excludedCategories],
  );

  useEffect(() => {
    const src = atlasSrcFor(demoPaletteManifest);
    if (!src) return;
    let cancelled = false;
    loadTextureAtlas(src)
      .then((image) => {
        if (!cancelled) setTextureAtlas(image);
      })
      .catch(() => {
        // Fall back to flat average colors silently.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setHistory(loadConversionHistory());
    try {
      const params = new URLSearchParams(window.location.search);
      const sizeParam = Number(params.get('size'));
      if ([16, 32, 64, 128].includes(sizeParam)) setSize(sizeParam);
      const ditherParam = params.get('dither');
      if (ditherParam === '1' || ditherParam === '0') setDithering(ditherParam === '1');
      const excludedParam = params.get('excluded');
      if (excludedParam) {
        const valid = paletteCategories.map((c) => c.id);
        setExcludedCategories(excludedParam.split(',').filter((id) => valid.includes(id)));
      }
    } catch {
      // Ignore malformed share URLs and fall back to defaults.
    }
  }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams();
      params.set('size', String(size));
      params.set('dither', dithering ? '1' : '0');
      if (excludedCategories.length) params.set('excluded', excludedCategories.join(','));
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    } catch {
      // history API unavailable (e.g. SSR) — non-fatal.
    }
  }, [size, dithering, excludedCategories]);

  const drawPreview = (result: {
    width: number;
    height: number;
    pixels: Array<{ x: number; y: number; block: PaletteBlock }>;
  }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cellSize = Math.max(8, Math.floor(640 / result.width));
    setPreviewBaseWidth(result.width * cellSize);
    drawPreviewGrid(canvas, {
      width: result.width,
      height: result.height,
      pixels: result.pixels,
      textureAtlas,
      cellSize,
    });
  };

  const processImageData = async (imageData: ImageData, originalLabel: string) => {
    const conversionId = ++conversionIdRef.current;
    setBusy(true);
    setProgress(10);
    setMessage(t.msgProcessing);

    try {
      setProgress(25);
      const worker = ensureWorker(workerRef);
      const result = await runConversionInWorker(worker, {
        type: 'convert-image',
        width: size,
        height: size,
        dithering,
        imageData,
        excludedCategories,
      });

      if (conversionId !== conversionIdRef.current) return;

      const reconstructed = {
        width: result.width,
        height: result.height,
        pixels: result.pixels.map((pixel) => ({
          x: pixel.x,
          y: pixel.y,
          block: demoPaletteManifest.blocks.find((block) => block.id === pixel.blockId) ?? demoPaletteManifest.blocks[0],
          distance: 0,
        })),
        materialList: result.materialList,
      };

      setProgress(75);
      const previewText = createFlatPreviewGrid({
        width: reconstructed.width,
        height: reconstructed.height,
        pixels: reconstructed.pixels,
        materialList: reconstructed.materialList,
      });
      const blockIds = result.pixels.map((pixel) => pixel.blockId);
      setOutput(previewText);
      setMaterials(result.materialList);
      setSchematicGrid({
        width: result.width,
        height: result.height,
        blockIds,
      });
      setMessage(t.msgConverted(originalLabel, result.width, result.height));
      drawPreview(reconstructed);
      setProgress(100);
      setHistory(
        saveConversionToHistory({
          fileName: originalLabel,
          size,
          dithering,
          excludedCategories,
          width: result.width,
          height: result.height,
          blockIds,
          materialList: result.materialList,
        }),
      );
    } catch (error) {
      if (conversionId !== conversionIdRef.current) return;
      setMessage(error instanceof Error ? error.message : t.msgFailed);
      setOutput([]);
      setMaterials([]);
    } finally {
      if (conversionId === conversionIdRef.current) {
        setBusy(false);
        setProgress(0);
      }
    }
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setSourceName(file.name);
    setMessage(t.msgLoading);
    setBusy(true);
    setProgress(5);

    try {
      const image = await loadImageFromFile(file);
      setProgress(15);
      const canvas = hiddenCanvasRef.current ?? document.createElement('canvas');
      hiddenCanvasRef.current = canvas;
      canvas.width = image.width;
      canvas.height = image.height;

      const context = canvas.getContext('2d');
      if (!context) throw new Error(t.msgCanvasUnavailable);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      setSourceImageData(imageData);
      setMessage(t.msgImageReady);
      setProgress(35);
      await processImageData(imageData, file.name);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.msgFailed);
      setOutput([]);
      setMaterials([]);
      setSourceImageData(null);
      setBusy(false);
      setProgress(0);
    }
  };

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const item = Array.from(event.clipboardData?.items ?? []).find((entry) => entry.type.startsWith('image/'));
      const file = item?.getAsFile();
      if (file) void handleFile(file);
    };

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  useEffect(() => {
    if (!sourceImageData) return;
    const timer = setTimeout(() => void processImageData(sourceImageData, sourceName), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, dithering, excludedCategories]);

  const toggleCategory = (categoryId: string) => {
    setExcludedCategories((current) =>
      current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId],
    );
  };

  const restoreFromHistory = (entry: ConversionHistoryEntry) => {
    conversionIdRef.current += 1;
    const pixels = entry.blockIds.map((blockId, index) => ({
      x: index % entry.width,
      y: Math.floor(index / entry.width),
      block: demoPaletteManifest.blocks.find((block) => block.id === blockId) ?? demoPaletteManifest.blocks[0],
      distance: 0,
    }));
    const previewText = createFlatPreviewGrid({
      width: entry.width,
      height: entry.height,
      pixels,
      materialList: entry.materialList,
    });
    setSize(entry.width);
    setDithering(entry.dithering);
    setExcludedCategories(entry.excludedCategories ?? []);
    setFileName(entry.fileName);
    setSourceName(entry.fileName);
    setSourceImageData(null);
    setOutput(previewText);
    setMaterials(entry.materialList);
    setSchematicGrid({ width: entry.width, height: entry.height, blockIds: entry.blockIds });
    setMessage(t.msgRestored(entry.fileName, entry.width, entry.height));
    drawPreview({ width: entry.width, height: entry.height, pixels });
  };

  const downloadCsv = () => {
    const csv = serializeMaterialList({
      width: output.length,
      height: output[0]?.split(' ').length ?? 0,
      pixels: [],
      materialList: materials,
    });
    const blob = new Blob([`${t.csvHeader}\n${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${fileName ?? t.defaultFileName}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const anchor = document.createElement('a');
    anchor.href = canvas.toDataURL('image/png');
    anchor.download = `${fileName ?? t.defaultFileName}.png`;
    anchor.click();
  };

  const tryDemo = async () => {
    try {
      setMessage(t.msgLoading);
      const res = await fetch('/demo-landscape-64.png');
      const blob = await res.blob();
      await handleFile(new File([blob], 'demo-landscape.png', { type: blob.type || 'image/png' }));
    } catch {
      setMessage(t.msgFailed);
    }
  };

  const clearProject = () => {    conversionIdRef.current += 1;
    setSourceImageData(null);
    setSourceName(t.msgDemo);
    setFileName(null);
    setOutput([]);
    setMaterials([]);
    setSchematicGrid(null);
    setProgress(0);
    setBusy(false);
    setDragActive(false);
    setMessage(t.msgInitial);
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      context?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSchematicExport = (format: SchematicFormat) => {
    if (!schematicGrid) return;
    const baseName = (fileName ?? 'minecraft-pixel-art').replace(/\.[a-z0-9]+$/i, '') || 'minecraft-pixel-art';
    void downloadSchematic(format, schematicGrid, baseName);
  };

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="order-2 space-y-6 lg:order-none">
        <div className="card p-5">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-bold text-neutral-100">{t.title}</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-400">
            {t.subtitle}
          </p>
        </div>

        <div className="card p-5">
          <label
            className={`flex cursor-pointer flex-col gap-3 rounded-lg border border-dashed p-4 text-sm transition ${
              dragActive ? 'border-[#2c4419] bg-[#57a82a]/10 text-neutral-100' : 'border-[#2a2e2a] bg-[#101210] text-neutral-400 hover:bg-transparent'
            }`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            const file = event.dataTransfer.files?.[0];
            if (file) void handleFile(file);
          }}
        >
          <span className="font-semibold text-neutral-100">{t.uploadTitle}</span>
          <span>{t.uploadHint}</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.currentTarget.value = '';
              if (file) void handleFile(file);
            }}
          />
        </label>
        </div>

        <div className="card p-5">
          <h2 className="eyebrow">{t.sizePresets}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {sizePresets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setSize(preset.value)}
                className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                  size === preset.value
                    ? 'border-[#2c4419] bg-[#57a82a]/10 text-[#a3d47e]'
                    : 'border-[#2a2e2a] bg-[#101210] text-neutral-300 hover:border-[#3a3f3a]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="eyebrow">{t.options}</h2>
          <label className="mt-4 flex items-center justify-between rounded-lg border border-[#2a2e2a] bg-[#101210] px-4 py-3 text-sm text-neutral-300">
            <span>{t.dithering}</span>
            <input type="checkbox" checked={dithering} onChange={(event) => setDithering(event.target.checked)} />
          </label>
        </div>

        <div className="card p-5">
          <h2 className="eyebrow">{t.palette}</h2>
          <div className="mt-4 rounded-lg border border-[#2a2e2a] bg-[#101210] p-4 text-sm text-neutral-400">
            <p className="font-semibold text-neutral-100">
              {t.paletteInUse(demoPaletteManifest.blocks.length - excludedBlockCount, demoPaletteManifest.blocks.length)}
            </p>
            <p className="mt-2 leading-6">
              {t.paletteHint}
            </p>
            <p className="mt-2 text-[13px] leading-5 text-neutral-300">
              {t.paletteVersion}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {paletteCategories.map((category) => {
                const excluded = excludedCategories.includes(category.id);
                // Guard: excluding the last enabled family would leave an
                // empty palette and crash matching — lock it instead.
                const locked = !excluded && excludedCategories.length >= paletteCategories.length - 1;
                return (
                  <label
                    key={category.id}
                    title={locked ? t.keepOneCategory : undefined}
                    className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-[13px] transition ${
                      excluded
                        ? 'cursor-pointer border-[#2a2e2a] text-neutral-600'
                        : locked
                          ? 'cursor-not-allowed border-[#2a2e2a] bg-[#151715] text-neutral-300 opacity-60'
                          : 'cursor-pointer border-[#2a2e2a] bg-[#151715] text-neutral-300 hover:border-[#3a3f3a]'
                    }`}
                  >
                    <span className={excluded ? 'line-through' : undefined}>
                      {t.categories[category.id] ?? category.label} · {category.count}
                    </span>
                    <input
                      type="checkbox"
                      checked={!excluded}
                      disabled={locked}
                      onChange={() => toggleCategory(category.id)}
                      aria-label={t.includeCategory(t.categories[category.id] ?? category.label)}
                    />
                  </label>
                );
              })}
            </div>
            {excludedCategories.length > 0 && (
              <button
                type="button"
                onClick={() => setExcludedCategories([])}
                className="mt-3 text-[13px] font-semibold text-[#7cbe4e] transition hover:text-[#a3d47e]"
              >
                {t.resetPalette}
              </button>
            )}
            <Link
              href="/palette-atlas"
              className="mt-4 inline-block text-sm font-semibold text-[#7cbe4e] transition hover:text-[#a3d47e]"
            >
              {t.atlasLink}
            </Link>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="eyebrow">{t.actions}</h2>
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                try {
                  void navigator.clipboard.writeText(window.location.href);
                  setMessage(locale === 'ja' ? '設定リンクをコピーしました' : 'Settings link copied — share it anywhere.');
                } catch {
                  // Clipboard unavailable — non-fatal.
                }
              }}
              className="rounded-full border border-[#2c4419] bg-[#57a82a]/10 px-5 py-3 text-sm font-semibold text-[#a3d47e] transition hover:bg-[#57a82a]/15"
            >
              {locale === 'ja' ? '設定リンクをコピー' : 'Copy settings link'}
            </button>
            <button
              type="button"
              onClick={clearProject}
              className="rounded-full border border-[#2a2e2a] bg-transparent px-5 py-3 text-sm font-semibold text-neutral-100 transition hover:border-[#3a3f3a]"
            >
              {t.clear}
            </button>
            <Link
              href="/litematic-viewer"
              className="rounded-full border border-[#2a2e2a] bg-transparent px-5 py-3 text-center text-sm font-semibold text-neutral-100 transition hover:border-[#3a3f3a]"
            >
              {t.openViewer}
            </Link>
          </div>
        </div>

        {history.length > 0 && (
          <div className="card p-5">
            <h2 className="eyebrow">{t.recent}</h2>
            <ul className="mt-4 space-y-2">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center gap-2 rounded-lg border border-[#2a2e2a] bg-[#101210] px-3 py-2 text-sm"
                >
                  <button
                    type="button"
                    onClick={() => restoreFromHistory(entry)}
                    className="min-w-0 flex-1 truncate text-left text-neutral-300 transition hover:text-neutral-100"
                    title={`${entry.fileName} · ${entry.width}×${entry.height}${entry.dithering ? ' · dithered' : ''}`}
                  >
                    <span className="block truncate">{entry.fileName}</span>
                    <span className="block text-xs text-neutral-400">
                      {entry.width}×{entry.height} · {entry.materialList.length} {t.blockTypes}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistory(removeConversionFromHistory(entry.id))}
                    className="shrink-0 rounded-full px-2 py-1 text-xs text-neutral-600 transition hover:text-red-300"
                    aria-label={t.removeHistory(entry.fileName)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      <section className="order-1 space-y-4 lg:order-none">
        <div className="card p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 eyebrow">
            <span>{fileName ?? t.noFile}</span>
            <label className="flex min-w-44 flex-1 items-center gap-2 normal-case tracking-normal sm:max-w-56">
              <span className="shrink-0">{t.zoomLabel(zoom)}</span>
              <input
                type="range"
                min={1}
                max={8}
                step={0.5}
                value={zoom}
                disabled={!output.length}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full accent-[#57a82a]"
                aria-label={t.zoomAria}
              />
            </label>
            <span>{progress ? t.processing(progress) : t.ready}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#57a82a] transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-5 flex min-h-[420px] items-center justify-center overflow-auto rounded-lg border border-dashed border-[#2a2e2a] bg-grid bg-[size:28px_28px] p-6">
            {busy ? (
              <div className="space-y-4 text-center text-neutral-400">
                <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-[#57a82a]/20" />
                <p>{message}</p>
              </div>
            ) : output.length ? (
              <div className="m-auto space-y-4 text-center">
                <canvas
                  ref={canvasRef}
                  className="mx-auto rounded-lg border border-[#2a2e2a]"
                  style={{
                    imageRendering: 'pixelated',
                    width: previewBaseWidth ? `${previewBaseWidth * zoom}px` : undefined,
                    maxWidth: zoom > 1 ? 'none' : '100%',
                  }}
                />
                <p className="text-center text-sm text-neutral-400">{message}</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg border border-[#2c4419] bg-[#57a82a]/10 text-2xl">
                  🧱
                </div>
                <h2 className="text-2xl font-bold text-neutral-100">{t.previewTitle}</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-400">{message}</p>
                <button type="button" onClick={() => void tryDemo()} className="mt-4 rounded-full bg-[#57a82a] px-5 py-2.5 text-sm font-semibold text-[#0c120d] transition hover:bg-[#67bd36]">
                  {locale === 'ja' ? 'デモ画像で試す' : 'Try a demo image'}
                </button>
              </div>
            )}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={downloadPng}
              disabled={!output.length}
              className="rounded-full border border-[#2a2e2a] bg-transparent px-5 py-3 text-sm font-semibold text-neutral-100 transition hover:border-[#3a3f3a] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t.downloadPng}
            </button>
            <button
              type="button"
              onClick={downloadCsv}
              disabled={!materials.length}
              className="rounded-full border border-[#2a2e2a] bg-transparent px-5 py-3 text-sm font-semibold text-neutral-100 transition hover:border-[#3a3f3a] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t.downloadCsv}
            </button>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="card p-5">
            <h3 className="text-lg font-semibold text-neutral-100">{t.materialList}</h3>
            <p className="mt-1 text-sm text-neutral-400">{t.totalBlocks(totalBlocks)}</p>
            <div className="legend-scroll mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
              {materials.length ? (
                materials.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-[#2a2e2a] bg-[#101210] px-4 py-3 text-sm">
                    <span className="text-neutral-300">{item.name}</span>
                    <span className="font-semibold text-[#7cbe4e]">{item.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-neutral-400">{t.uploadToGenerate}</p>
              )}
            </div>
          </article>

          <article className="card p-5">
            <h3 className="text-lg font-semibold text-neutral-100">{t.schematicExports}</h3>
            <p className="mt-1 text-sm text-neutral-400">{t.schematicHint}</p>
            <p className="mt-1 text-xs leading-5 text-neutral-400">{t.schematicLayout}</p>
            <ul className="mt-2 space-y-1 text-xs leading-5 text-neutral-400">
              <li><span className="font-semibold text-neutral-400">.schem</span> — Java WorldEdit / Sponge (~30B per block).</li>
              <li><span className="font-semibold text-neutral-400">.litematic</span> — Litematica mod (Java).</li>
              <li><span className="font-semibold text-neutral-400">.mcstructure</span> — Bedrock structure block.</li>
            </ul>
            <p className="mt-2 text-xs leading-6 text-neutral-400">
              Written to spec —{' '}
              <ExternalLink href="https://github.com/SpongePowered/Schematic-Specification" className="text-xs font-semibold text-[#7cbe4e] transition hover:text-[#a3d47e]">
                Sponge Schematic Spec v2
              </ExternalLink>
              {' · '}
              <ExternalLink href="https://github.com/maruohon/litematica" className="text-xs font-semibold text-[#7cbe4e] transition hover:text-[#a3d47e]">
                Litematica docs
              </ExternalLink>
              {' · '}
              <ExternalLink href="https://worldedit.enginehub.org/en/latest/usage/schematics/" className="text-xs font-semibold text-[#7cbe4e] transition hover:text-[#a3d47e]">
                WorldEdit schematics guide
              </ExternalLink>
            </p>
            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={() => handleSchematicExport('schem')}
                disabled={!schematicGrid || busyFormat === 'schem'}
                className="rounded-full border border-[#2a2e2a] bg-[#101210] px-5 py-3 text-sm font-semibold text-neutral-100 transition hover:border-[#3a3f3a] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busyFormat === 'schem' ? t.exporting : t.downloadSchem}
              </button>
              <button
                type="button"
                onClick={() => handleSchematicExport('litematic')}
                disabled={!schematicGrid || busyFormat === 'litematic'}
                className="rounded-full border border-[#2a2e2a] bg-[#101210] px-5 py-3 text-sm font-semibold text-neutral-100 transition hover:border-[#3a3f3a] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busyFormat === 'litematic' ? t.exporting : t.downloadLitematic}
              </button>
              <button
                type="button"
                onClick={() => handleSchematicExport('mcstructure')}
                disabled={!schematicGrid || busyFormat === 'mcstructure'}
                className="rounded-full border border-[#2a2e2a] bg-[#101210] px-5 py-3 text-sm font-semibold text-neutral-100 transition hover:border-[#3a3f3a] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busyFormat === 'mcstructure' ? t.exporting : t.downloadMcstructure}
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-neutral-400">
              {t.alreadyExported}{' '}
              <Link href="/litematic-viewer" className="font-semibold text-[#7cbe4e] transition hover:text-[#a3d47e]">
                {t.inspectViewer}
              </Link>{' '}
              {t.noGame}{' '}
              <Link href="/lego-mosaic-generator" className="font-semibold text-[#fcd34d] transition hover:text-[#fde68a]">
                {t.buildLego}
              </Link>
              .
            </p>
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {t.steps.map(([title, body]) => (
            <article key={title} className="card p-5">
              <h3 className="text-lg font-semibold text-neutral-100">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-400">{body}</p>
            </article>
          ))}
        </section>
      </section>
    </div>
  );
}