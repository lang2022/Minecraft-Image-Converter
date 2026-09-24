import type { Metadata } from 'next';
import Link from 'next/link';
import { AdSlot } from '@/components/AdSlot';
import { ExternalLink } from '@/components/ExternalLink';

export const metadata: Metadata = {
  title: 'Minecraft Map Art Guide: 128×128 and Multi-Map Billboards',
  description:
    'How in-game map art works, why 128×128 pixel grids map 1:1 to maps, and how to plan multi-map billboards.',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Minecraft Map Art Guide: 128×128 and Multi-Map Billboards',
  description:
    'How in-game map art works, why 128×128 pixel grids map 1:1 to maps, and how to plan multi-map billboards.',
};

const sections = [
  {
    title: 'Why 128×128 is the map art standard',
    body: 'A single in-game map at 1:1 scale captures a 128×128 block area. When you build pixel art at exactly 128×128 blocks, every block becomes one map pixel — which means your design transfers to map pixels with zero resampling loss.',
  },
  {
    title: 'Planning a multi-map billboard',
    body: 'For a wide mural, divide the artwork into 128×128 tiles. Place the block construction in one continuous area, then frame each tile with separate maps in item frames. Align the maps edge-to-edge so the seams stay invisible.',
  },
  {
    title: 'Choosing blocks for map art',
    body: 'Map colors are quantized in-game, so small color shifts between similar blocks collapse to the same map pixel. Prefer high-contrast families (wool, concrete, terracotta) and use the generator to preview the output before committing hundreds of blocks.',
  },
  {
    title: 'From image to map in practice',
    body: 'Convert your source at 128×128, export the .schem or follow the material list, build in the world, and walk to the area with an empty map in hand. The map renders the finished mural automatically as you enter range.',
  },
];

export default function MapArtGuidePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="text-sm text-neutral-500">
        <Link href="/guides" className="transition hover:text-neutral-100">
          Guides
        </Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-300">Minecraft Map Art Guide</span>
      </nav>

      <header className="mt-8">
        <h1 className="text-4xl font-bold text-neutral-100">Minecraft Map Art Guide</h1>
        <p className="mt-4 text-lg leading-7 text-neutral-400">
          Map art turns your world into a canvas. Understand the size rules first, and multi-map murals become easy.
        </p>
      </header>

      <div className="mt-10 space-y-10">
        {sections.map((section, index) => (
          <section key={section.title}>
            <h2 className="text-2xl font-bold text-neutral-100">
              <span className="mr-2 font-mono text-[#7cbe4e]">{index + 1}.</span>
              {section.title}
            </h2>
            <p className="mt-3 leading-7 text-neutral-400">{section.body}</p>
          </section>
        ))}
      </div>

      <section className="mt-12 card p-6">
        <h2 className="text-lg font-bold text-neutral-100">Plan your map art</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-400">
          Convert any image to a 128×128 map-ready design and download the block list.
        </p>
        <Link
          href="/pixel-art-generator"
          className="mt-4 inline-block rounded-full bg-[#57a82a] px-6 py-3 text-sm font-semibold text-[#0c120d] transition hover:bg-[#7cbe4e]"
        >
          Make a 128×128 conversion
        </Link>
      </section>

      <section className="mt-6 card p-6">
        <h2 className="text-lg font-bold text-neutral-100">Further reading</h2>
        <ul className="mt-3 space-y-2.5 text-sm text-neutral-400">
          <li>
            <ExternalLink href="https://minecraft.wiki/w/Map">Map (Minecraft Wiki)</ExternalLink>
            <span className="text-neutral-600"> — how maps render, zoom levels and locking.</span>
          </li>
          <li>
            <ExternalLink href="https://worldedit.enginehub.org/en/latest/usage/schematics/">
              WorldEdit schematics guide
            </ExternalLink>
            <span className="text-neutral-600"> — paste your 128×128 layout in seconds.</span>
          </li>
        </ul>
        <nav className="mt-6 flex flex-wrap gap-3 border-t border-[#232723] pt-5" aria-label="More guides">
          <Link href="/guides/best-size-for-minecraft-pixel-art" className="rounded-full border border-[#2a2e2a] px-5 py-2.5 text-sm font-semibold text-neutral-200 transition hover:border-[#3a3f3a] hover:text-neutral-100">
            ← Best size guide
          </Link>
          <Link href="/guides" className="rounded-full border border-[#2a2e2a] px-5 py-2.5 text-sm font-semibold text-neutral-200 transition hover:border-[#3a3f3a] hover:text-neutral-100">
            All guides
          </Link>
        </nav>
      </section>

      <AdSlot format="leaderboard" slotId="map-art-guide-bottom" />
    </main>
  );
}