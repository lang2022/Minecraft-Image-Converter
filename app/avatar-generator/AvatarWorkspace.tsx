'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { drawAvatar, isSupportedSkinSize, type AvatarMode } from '@/lib/avatar';

const sizePresets = [128, 256, 512];

function loadSkin(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this image file.'));
    };
    image.src = url;
  });
}

export function AvatarWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const skinRef = useRef<HTMLImageElement | null>(null);

  const [mode, setMode] = useState<AvatarMode>('isometric');
  const [hat, setHat] = useState(true);
  const [size, setSize] = useState(256);
  const [skinName, setSkinName] = useState<string | null>(null);
  const [message, setMessage] = useState('Upload a Minecraft skin PNG to generate the avatar.');
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const render = () => {
    const canvas = canvasRef.current;
    const skin = skinRef.current;
    if (!canvas || !skin) return;
    drawAvatar(canvas, skin, { mode, size, hat });
  };

  useEffect(() => {
    if (ready) render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, hat, size, ready]);

  const handleFile = async (file: File) => {
    setError(null);
    try {
      const skin = await loadSkin(file);
      if (!isSupportedSkinSize(skin.width, skin.height)) {
        throw new Error(
          `Unsupported skin size ${skin.width}×${skin.height}. Expected 64×64, 64×32 or HD multiples (128, 256, 512, 1024).`,
        );
      }
      skinRef.current = skin;
      setSkinName(file.name);
      setReady(true);
      setMessage(`${skin.width}×${skin.height} skin loaded.`);
      requestAnimationFrame(render);
    } catch (err) {
      setReady(false);
      setSkinName(null);
      setError(err instanceof Error ? err.message : 'Failed to load skin.');
    }
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const anchor = document.createElement('a');
    anchor.href = canvas.toDataURL('image/png');
    anchor.download = `${(skinName ?? 'minecraft-avatar').replace(/\.[a-z0-9]+$/i, '')}-${mode}${size}.png`;
    anchor.click();
  };

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="order-2 space-y-6 card p-5">
        <div>
          <p className="eyebrow">Avatar</p>
          <h1 className="mt-2 text-3xl font-bold text-neutral-100">Minecraft Avatar Generator</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-400">
            Turn any player skin into a crisp isometric head or flat face avatar — rendered locally, exported as
            transparent PNG.
          </p>
        </div>

        <label
          className={`flex cursor-pointer flex-col gap-2 rounded-lg border border-dashed p-4 text-sm transition ${
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
          <span className="font-semibold text-neutral-100">Upload or drop skin</span>
          <span>64×64, 64×32 and HD skins (128–1024) supported.</span>
          <input
            type="file"
            accept="image/png"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.currentTarget.value = '';
              if (file) void handleFile(file);
            }}
          />
        </label>

        <section className="space-y-3">
          <h2 className="eyebrow">Style</h2>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ['isometric', 'Isometric'],
                ['face', 'Flat face'],
              ] as Array<[AvatarMode, string]>
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                  mode === value
                    ? 'border-[#2c4419] bg-[#57a82a]/10 text-[#a3d47e]'
                    : 'border-[#2a2e2a] bg-[#101210] text-neutral-300 hover:border-[#3a3f3a]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="flex items-center justify-between rounded-lg border border-[#2a2e2a] bg-[#101210] px-4 py-3 text-sm text-neutral-300">
            <span>Hat layer</span>
            <input type="checkbox" checked={hat} onChange={(event) => setHat(event.target.checked)} />
          </label>
        </section>

        <section className="space-y-3">
          <h2 className="eyebrow">Export size</h2>
          <div className="grid grid-cols-3 gap-3">
            {sizePresets.map((preset) => (
              <button
                key={preset}
                onClick={() => setSize(preset)}
                className={`rounded-lg border px-2 py-3 text-sm font-semibold transition ${
                  size === preset
                    ? 'border-[#2c4419] bg-[#57a82a]/10 text-[#a3d47e]'
                    : 'border-[#2a2e2a] bg-[#101210] text-neutral-300 hover:border-[#3a3f3a]'
                }`}
              >
                {preset}px
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="eyebrow">Actions</h2>
          <button
            type="button"
            onClick={downloadPng}
            disabled={!ready}
            className="w-full rounded-full border border-[#2c4419] bg-[#57a82a]/10 px-5 py-3 text-sm font-semibold text-[#a3d47e] transition hover:bg-[#57a82a]/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Download PNG
          </button>
          <Link
            href="/pixel-art-generator"
            className="block rounded-full border border-[#2a2e2a] bg-transparent px-5 py-3 text-center text-sm font-semibold text-neutral-100 transition hover:border-[#3a3f3a]"
          >
            Convert an image instead
          </Link>
        </section>
      </aside>

      <section className="order-1 space-y-4 lg:order-none">
        <div className="card p-6">
          <div className="mb-3 flex items-center justify-between eyebrow">
            <span>{skinName ?? 'No skin loaded'}</span>
            <span>{message}</span>
          </div>
          <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-dashed border-[#2a2e2a] bg-grid bg-[size:28px_28px] p-6">
            <div className="flex flex-col items-center gap-4">
              <canvas
                ref={canvasRef}
                className={ready ? 'rounded-lg border border-[#2a2e2a]' : 'hidden'}
                style={{ imageRendering: 'pixelated', width: Math.min(320, size), height: Math.min(320, size) }}
              />
              {!ready && (
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg border border-[#2c4419] bg-[#57a82a]/10 text-[#57a82a]">
                    <User size={28} strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-100">Avatar preview placeholder</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-400">{message}</p>
                  <p className="mt-3 text-xs leading-5 text-neutral-500">No skin handy? Generate an avatar from any <Link href="/pixel-art-generator" className="font-semibold text-[#7cbe4e] hover:text-[#a3d47e]">demo conversion</Link> first.</p>
                </div>
              )}
            </div>
          </div>
          {error && (
            <p className="mt-3 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>
          )}
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ['100% local', 'Skins are rendered in your browser and never uploaded.'],
            ['HD ready', '128px to 1024px skins render at full resolution.'],
            ['Transparent PNG', 'Export any size with the hat layer on or off.'],
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