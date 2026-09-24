import type { Metadata } from 'next';
import Link from 'next/link';
import { getAtlasMeta, demoPaletteManifest } from '@/lib/palette';

const atlas = getAtlasMeta(demoPaletteManifest);
const DISPLAY_CELL = 44;
const rowCount = Math.ceil(demoPaletteManifest.blocks.length / atlas.columns);
const usesTextures = atlas.mode === 'vanilla-textures' && Boolean(atlas.textureSrc);

function cellStyle(blockIndex: number) {
  const block = demoPaletteManifest.blocks[blockIndex];
  if (usesTextures) {
    const scale = DISPLAY_CELL / atlas.cellSize;
    return {
      backgroundColor: block.avgColor,
      backgroundImage: `url(${atlas.textureSrc})`,
      backgroundSize: `${atlas.columns * DISPLAY_CELL}px ${rowCount * DISPLAY_CELL}px`,
      backgroundPosition: `-${block.x * scale}px -${block.y * scale}px`,
      imageRendering: 'pixelated' as const,
    };
  }
  return { backgroundColor: block.avgColor };
}

export const metadata: Metadata = {
  title: 'Block Atlas Preview',
  description:
    'Browse the Minecraft block atlas used by the pixel art generator and inspect each palette entry at a glance.',
};

export default function PaletteAtlasPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-10 lg:px-10">
      <header className="max-w-3xl">
        <span className="inline-flex rounded-full border border-[#2c4419] bg-[#57a82a]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[#7cbe4e]">
          Atlas
        </span>
        <h1 className="mt-4 text-4xl font-bold text-neutral-100 sm:text-5xl">Block Atlas Preview</h1>
        <p className="mt-4 text-lg leading-7 text-neutral-400">
          This atlas is the visual layer behind the palette manifest. Each tile maps to one block entry — with the
          texture-driven atlas these are the actual in-game block textures, tinted where the game applies biome colors.
        </p>
      </header>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2a2e2a] pb-4 text-sm text-neutral-500">
            <div>
              <p className="uppercase tracking-[0.2em]">Atlas source</p>
              <p className="mt-1 text-neutral-300">{usesTextures ? atlas.textureSrc : atlas.src}</p>
            </div>
            <div className="text-right">
              <p className="uppercase tracking-[0.2em]">Mode</p>
              <p className="mt-1 text-neutral-300">{atlas.mode}</p>
            </div>
          </div>
          <div className="mt-5 overflow-auto rounded-lg border border-[#2a2e2a] bg-[#101210] p-4">
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${atlas.columns}, minmax(0, 1fr))`,
              }}
            >
              {demoPaletteManifest.blocks.map((block, index) => (
                <button
                  key={block.id}
                  type="button"
                  className="group relative aspect-square overflow-hidden rounded-md border border-[#2a2e2a] transition hover:scale-[1.06] hover:border-[#2c4419]"
                  title={`${block.name} (${block.id})`}
                  style={cellStyle(index)}
                >
                  <span className="sr-only">{block.name}</span>
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-[10px] text-neutral-100 opacity-0 transition group-hover:opacity-100">
                    {block.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </article>

        <aside className="space-y-5">
          <section className="card p-5">
            <h2 className="text-lg font-bold text-neutral-100">How to use this layer</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-400">
              <li>The atlas layout defines where each block appears in the sprite sheet.</li>
              <li>The manifest also carries LAB values so matching works without decoding textures.</li>
              <li>…The conversion engine only references block IDs — the atlas is a pure visual layer.</li>
              <li>Biome-tinted blocks (grass, water) are pre-multiplied to their in-game appearance.</li>
            </ul>
          </section>

          <section className="card p-5">
            <h2 className="text-lg font-bold text-neutral-100">Manifest metadata</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4 rounded-lg border border-[#2a2e2a] bg-[#101210] px-4 py-3">
                <dt className="text-neutral-500">Version</dt>
                <dd className="text-neutral-300">{demoPaletteManifest.version}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-[#2a2e2a] bg-[#101210] px-4 py-3">
                <dt className="text-neutral-500">Minecraft</dt>
                <dd className="text-neutral-300">{demoPaletteManifest.mcVersion}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-[#2a2e2a] bg-[#101210] px-4 py-3">
                <dt className="text-neutral-500">Blocks</dt>
                <dd className="text-neutral-300">{demoPaletteManifest.blocks.length}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-[#2a2e2a] bg-[#101210] px-4 py-3">
                <dt className="text-neutral-500">Cell size</dt>
                <dd className="text-neutral-300">{atlas.cellSize}px</dd>
              </div>
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="text-lg font-bold text-neutral-100">Regenerating</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-400">
              Point the palette script at any resource pack or client jar to rebuild both atlases and the manifest.
            </p>
            <pre className="mt-3 overflow-auto rounded-xl border border-[#2a2e2a] bg-[#0e100e] p-3 text-xs text-neutral-400">
              node scripts/generate-palette.mjs --scan &lt;client.jar | pack.zip | dir&gt;
            </pre>
          </section>
        </aside>
      </section>

      <section className="mt-12 card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-neutral-100">Back to the generator</h2>
            <p className="mt-1 text-sm leading-6 text-neutral-400">
              The preview canvas now blits these exact textures — what you see is what the schematic contains.
            </p>
          </div>
          <Link
            href="/pixel-art-generator"
            className="rounded-full bg-[#57a82a] px-6 py-3 text-sm font-semibold text-[#0c120d] transition hover:bg-[#7cbe4e]"
          >
            Open generator
          </Link>
        </div>
      </section>
    </main>
  );
}