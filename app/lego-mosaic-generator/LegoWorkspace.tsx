'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { MosaicResult } from '@/lib/mosaic/engine';
import { prepareMosaicPalette } from '@/lib/mosaic/engine';
import { legoPalette } from '@/lib/mosaic/palettes/lego';
import { baseplateAdvice, serializeLegoBill, serializeLegoBrickLinkXml } from '@/lib/mosaic/renderers/lego';
import { ExternalLink } from '@/components/ExternalLink';
import type { MosaicJobRequest, MosaicJobResponse } from '@/lib/mosaic-worker-protocol';

const sizePresets = [
  { label: '16×16', value: 16 },
  { label: '32×32', value: 32 },
  { label: '48×48', value: 48 },
  { label: '64×64', value: 64 },
];

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

function createMosaicWorker() {
  return new Worker(new URL('../../worker/mosaic-worker.ts', import.meta.url), {
    type: 'module',
  });
}

function runMosaicInWorker(
  worker: Worker,
  payload: MosaicJobRequest,
  onProgress: (value: number, message: string) => void,
): Promise<Extract<MosaicJobResponse, { type: 'result' }>> {
  return new Promise((resolve, reject) => {
    const handleMessage = (event: MessageEvent<MosaicJobResponse>) => {
      const response = event.data;
      if (response.type === 'progress') {
        onProgress(response.value, response.message);
        return;
      }
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

export function LegoWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const conversionIdRef = useRef(0);
  const [size, setSize] = useState(32);
  const [dithering, setDithering] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Upload a photo to build its LEGO mosaic preview.');
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<MosaicResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [sourceImageData, setSourceImageData] = useState<ImageData | null>(null);

  useEffect(() => {
    const worker = createMosaicWorker();
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const totalStuds = useMemo(() => result?.totalCells ?? 0, [result]);
  const distinctColors = result?.colorCounts.length ?? 0;

  const drawResult = (mosaic: MosaicResult) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cell = Math.max(6, Math.floor(640 / mosaic.width));
    canvas.width = mosaic.width * cell;
    canvas.height = mosaic.height * cell;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    for (const pixel of mosaic.pixels) {
      ctx.fillStyle = pixel.color.hex;
      ctx.fillRect(pixel.x * cell, pixel.y * cell, cell, cell);
      // Stud highlight: a subtle inner ring sells the LEGO look.
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1;
      ctx.strokeRect(pixel.x * cell + 1.5, pixel.y * cell + 1.5, cell - 3, cell - 3);
    }
  };

  const convert = async (file: File) => {
    setBusy(true);
    setError(null);
    setProgress(10);
    setMessage('Loading image…');
    setFileName(file.name);
    try {
      const image = await loadImageFromFile(file);
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas is not supported in this browser.');
      ctx.drawImage(image, 0, 0);
      const imageData = ctx.getImageData(0, 0, image.width, image.height);
      setSourceImageData(imageData);
      await runMosaic(imageData);
    } catch (err) {
      setResult(null);
      setSourceImageData(null);
      setError(err instanceof Error ? err.message : 'Failed to convert this image.');
      setBusy(false);
      setProgress(0);
    }
  };

  const runMosaic = async (imageData: ImageData) => {
    const conversionId = ++conversionIdRef.current;
    setBusy(true);
    setError(null);
    try {
      setProgress(25);
      setMessage('Matching colors in worker…');
      const worker = workerRef.current ?? createMosaicWorker();
      workerRef.current = worker;
      const response = await runMosaicInWorker(
        worker,
        { type: 'convert-mosaic', paletteId: 'lego', width: size, height: size, dithering, imageData },
        (value, workerMessage) => {
          if (conversionId !== conversionIdRef.current) return;
          setProgress(value);
          setMessage(workerMessage);
        },
      );
      if (conversionId !== conversionIdRef.current) return;

      const prepared = new Map(prepareMosaicPalette(legoPalette).map((color) => [color.id, color]));
      const fallback = { id: 'unknown', name: 'Unknown', hex: '#000000' } as const;
      const mosaic: MosaicResult = {
        width: response.width,
        height: response.height,
        pixels: response.pixels.map((pixel) => ({
          x: pixel.x,
          y: pixel.y,
          color: prepared.get(pixel.colorId) ?? {
            ...fallback,
            rgb: { r: 0, g: 0, b: 0 },
            lab: [0, 0, 0] as [number, number, number],
          },
          distance: 0,
        })),
        colorCounts: response.colorCounts,
        totalCells: response.totalCells,
      };
      setResult(mosaic);
      drawResult(mosaic);
      setProgress(100);
      setMessage(`${size}×${size} mosaic · ${mosaic.totalCells.toLocaleString()} studs · ${mosaic.colorCounts.length} colors`);
    } catch (err) {
      if (conversionId !== conversionIdRef.current) return;
      setResult(null);
      setError(err instanceof Error ? err.message : 'Failed to convert this image.');
    } finally {
      if (conversionId === conversionIdRef.current) {
        setBusy(false);
        setProgress(0);
      }
    }
  };

  useEffect(() => {
    if (!sourceImageData) return;
    const timer = setTimeout(() => void runMosaic(sourceImageData), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, dithering]);

  const downloadBill = () => {
    if (!result) return;
    const blob = new Blob([serializeLegoBill(result)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(fileName ?? 'lego-mosaic').replace(/\.[a-z0-9]+$/i, '')}-bill.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadBrickLinkXml = () => {
    if (!result) return;
    const { xml, skipped } = serializeLegoBrickLinkXml(result);
    const blob = new Blob([xml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(fileName ?? 'lego-mosaic').replace(/\.[a-z0-9]+$/i, '')}-bricklink.xml`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage(
      skipped.length
        ? `BrickLink XML exported — ${skipped.length} color(s) have no BrickLink ID and were skipped: ${skipped.join(', ')}.`
        : `BrickLink XML exported — ${result.colorCounts.length} wanted item(s), part 3024 Plate 1×1. Upload at BrickLink Wanted → Upload XML.`,
    );
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const anchor = document.createElement('a');
    anchor.href = canvas.toDataURL('image/png');
    anchor.download = `${(fileName ?? 'lego-mosaic').replace(/\.[a-z0-9]+$/i, '')}-mosaic.png`;
    anchor.click();
  };

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="order-2 space-y-6 lg:order-none">
        <div className="card p-5">
          <p className="eyebrow">LEGO Mosaic</p>
          <h1 className="mt-2 text-3xl font-bold text-neutral-100">LEGO Mosaic Generator</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-400">
            Turn any photo into a buildable LEGO mosaic with a color-accurate brick bill — free, in your browser.
          </p>
        </div>

        <div className="card p-5">
          <label
            className={`flex cursor-pointer flex-col gap-2 rounded-lg border border-dashed p-4 text-sm transition ${
              dragActive ? 'border-amber-400/60 bg-[#fbbf24]/10 text-neutral-100' : 'border-[#2a2e2a] bg-[#101210] text-neutral-400 hover:bg-transparent'
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
              if (file) void convert(file);
            }}
          >
            <span className="font-semibold text-neutral-100">Upload or drop image</span>
            <span>JPG, PNG or WEBP. Nothing leaves your device.</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.currentTarget.value = '';
                if (file) void convert(file);
              }}
            />
          </label>
        </div>

        <div className="card p-5">
          <h2 className="eyebrow">Mosaic size</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {sizePresets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setSize(preset.value)}
                className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                  size === preset.value
                    ? 'border-[#4d3f14] bg-[#fbbf24]/10 text-[#fde68a]'
                    : 'border-[#2a2e2a] bg-[#101210] text-neutral-300 hover:border-[#3a3f3a]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <label className="mt-4 flex items-center justify-between rounded-lg border border-[#2a2e2a] bg-[#101210] px-4 py-3 text-sm text-neutral-300">
            <span>Dithering</span>
            <input type="checkbox" checked={dithering} onChange={(event) => setDithering(event.target.checked)} />
          </label>
        </div>

        <div className="card p-5">
          <h2 className="eyebrow">Palette</h2>
          <div className="mt-4 rounded-lg border border-[#2a2e2a] bg-[#101210] p-4 text-sm text-neutral-400">
            <p className="font-semibold text-neutral-100">{legoPalette.length} solid brick colors</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {legoPalette.map((color) => (
                <span
                  key={color.id}
                  title={color.name}
                  className="h-5 w-5 rounded-md border border-[#2a2e2a]"
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="eyebrow">Next step</h2>
          <p className="mt-3 text-sm leading-6 text-neutral-400">
            Building in Minecraft instead? The same engine converts images into block art with structure file exports.
          </p>
          <Link
            href="/pixel-art-generator"
            className="mt-4 block rounded-full bg-[#57a82a] px-5 py-3 text-center text-sm font-semibold text-[#0c120d] transition hover:bg-[#7cbe4e]"
          >
            Open the Minecraft generator
          </Link>
        </div>
      </aside>

      <section className="order-1 space-y-4 lg:order-none">
        <div className="card p-6">
          <div className="mb-3 flex items-center justify-between eyebrow">
            <span>{fileName ?? 'No image loaded'}</span>
            <span>{progress ? `Processing ${progress}%` : busy ? 'Converting…' : result ? 'Ready' : 'Awaiting image'}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#fbbf24] transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-5 flex min-h-[420px] items-center justify-center rounded-lg border border-dashed border-[#2a2e2a] bg-grid bg-[size:28px_28px] p-6">
            {busy ? (
              <div className="space-y-4 text-center text-neutral-400">
                <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-[#fbbf24]/20" />
                <p>{message}</p>
              </div>
            ) : result ? (
              <canvas ref={canvasRef} className="max-w-full rounded-lg border border-[#2a2e2a]" />
            ) : (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-neutral-100">Mosaic preview</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-400">{message}</p>
                <button type="button" onClick={() => void (async () => { const r = await fetch('/demo-landscape-64.png'); const b = await r.blob(); await convert(new File([b], 'demo-landscape.png', { type: 'image/png' })); })()} className="mt-4 rounded-full bg-[#fbbf24] px-5 py-2.5 text-sm font-semibold text-[#0c120d] transition hover:bg-[#fde68a]">
                  Try a demo image
                </button>
              </div>
            )}
          </div>
          <p className="mt-4 text-sm text-neutral-500">{result ? baseplateAdvice(result.width) : message}</p>
          {error && (
            <p className="mt-3 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={downloadPng}
              disabled={!result}
              className="rounded-full border border-[#2a2e2a] bg-transparent px-5 py-3 text-sm font-semibold text-neutral-100 transition hover:border-[#3a3f3a] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Download PNG
            </button>
            <button
              type="button"
              onClick={downloadBill}
              disabled={!result}
              className="rounded-full border border-[#4d3f14] bg-[#fbbf24]/10 px-5 py-3 text-sm font-semibold text-[#fde68a] transition hover:bg-[#fbbf24]/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Download brick bill (CSV)
            </button>
            <button
              type="button"
              onClick={downloadBrickLinkXml}
              disabled={!result}
              className="rounded-full bg-[#fbbf24] px-5 py-3 text-sm font-semibold text-[#1c1503] transition hover:bg-[#fcd34d] disabled:cursor-not-allowed disabled:opacity-40"
              title="Wanted-list XML: part 3024 Plate 1×1 per color — upload at BrickLink Wanted → Upload XML"
            >
              Download BrickLink XML
            </button>
          </div>
          <p className="mt-3 text-xs leading-6 text-neutral-600">
            BrickLink XML lists every color as part 3024 (Plate 1×1) with exact quantities — upload it under{' '}
            <ExternalLink
              href="https://www.bricklink.com/v2/wanted/upload.page"
              className="text-xs font-semibold text-[#fcd34d] transition hover:text-[#fde68a]"
            >
              BrickLink Wanted → Upload
            </ExternalLink>{' '}
            to price and order the parts.
          </p>
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-semibold text-neutral-100">Brick bill</h3>
          <p className="mt-1 text-sm text-neutral-500">
            {totalStuds.toLocaleString()} studs · {distinctColors} distinct colors.
          </p>
          <div className="legend-scroll mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
            {result?.colorCounts.length ? (
              result.colorCounts.map((color) => (
                <div key={color.id} className="flex items-center gap-3 rounded-lg border border-[#2a2e2a] bg-[#101210] px-4 py-3 text-sm">
                  <span className="h-5 w-5 shrink-0 rounded-md border border-[#2a2e2a]" style={{ backgroundColor: color.hex }} />
                  <span className="text-neutral-300">{color.name}</span>
                  <span className="ml-auto font-semibold text-[#fcd34d]">{color.count.toLocaleString()}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-500">Convert an image to generate the bill.</p>
            )}
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ['1. Upload', 'Pick a photo with strong contrast — faces, logos and pixel sprites work best.'],
            ['2. Convert', 'The engine maps every stud to the closest of 36 solid LEGO colors in LAB space.'],
            ['3. Build', 'Lay bricks on the baseplate size shown below the preview and sort colors by the bill.'],
          ].map(([title, body]) => (
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