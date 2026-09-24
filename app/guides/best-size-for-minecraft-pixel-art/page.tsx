import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink } from '@/components/ExternalLink';

export const metadata: Metadata = {
  title: 'Best Size for Minecraft Pixel Art (16 to 128)',
  description:
    'Compare 16×16, 32×32, 64×64 and 128×128 grids for Minecraft pixel art, and pick the right scale for your build.',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Best Size for Minecraft Pixel Art (16 to 128)',
  description:
    'Compare 16×16, 32×32, 64×64 and 128×128 grids for Minecraft pixel art, and pick the right scale for your build.',
};

const sizes = [
  {
    grid: '16×16',
    blocks: 256,
    use: 'Icons, logos, small signs, avatar art on banners or maps.',
    note: 'Fast to build but abstract. Great for testing an idea before scaling up.',
  },
  {
    grid: '32×32',
    blocks: 1024,
    use: 'Character sprites, small decorative panels, map art borders.',
    note: 'The sweet spot for single-player builds you want to finish in one session.',
  },
  {
    grid: '64×64',
    blocks: 4096,
    use: 'Detailed portraits, larger murals, wall sections between floors.',
    note: 'Noticeable detail jump. Expect to gather several stacks of the dominant blocks.',
  },
  {
    grid: '128×128',
    blocks: 16384,
    use: 'Map art (1:1 with an in-game map), floors, server landmarks.',
    note: 'Massive presence and detail. Best in creative mode or with a .schem paste.',
  },
];

export default function BestSizeGuidePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="text-sm text-neutral-500">
        <Link href="/guides" className="transition hover:text-neutral-100">
          Guides
        </Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-300">Best Size for Minecraft Pixel Art</span>
      </nav>

      <header className="mt-8">
        <h1 className="text-4xl font-bold text-neutral-100">Best Size for Minecraft Pixel Art</h1>
        <p className="mt-4 text-lg leading-7 text-neutral-400">
          The grid size decides how recognizable and how expensive your build is. Here is how the standard sizes compare.
        </p>
      </header>

      <div className="mt-10 space-y-4">
        {sizes.map((row) => (
          <article key={row.grid} className="card p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-bold text-neutral-100">{row.grid} grid</h2>
              <p className="text-sm text-neutral-500">{row.blocks.toLocaleString()} block cells</p>
            </div>
            <p className="mt-3 leading-6 text-neutral-400">{row.use}</p>
            <p className="mt-2 text-sm leading-6 text-neutral-500">{row.note}</p>
          </article>
        ))}
      </div>

      <section className="mt-12 card p-6">
        <h2 className="text-lg font-bold text-neutral-100">Unsure? Start at 32×32</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-400">
          32×32 converts fast, builds fast, and still shows real detail. If it looks right, scale up in the generator and
          convert again with the same settings.
        </p>
        <Link
          href="/pixel-art-generator"
          className="mt-4 inline-block rounded-full bg-[#57a82a] px-6 py-3 text-sm font-semibold text-[#0c120d] transition hover:bg-[#7cbe4e]"
        >
          Convert at 32×32
        </Link>
      </section>

      <section className="mt-6 card p-6">
        <h2 className="text-lg font-bold text-neutral-100">Further reading</h2>
        <ul className="mt-3 space-y-2.5 text-sm text-neutral-400">
          <li>
            <ExternalLink href="https://minecraft.wiki/w/Map">Map (Minecraft Wiki)</ExternalLink>
            <span className="text-neutral-600"> — why 128×128 is the full-map standard.</span>
          </li>
          <li>
            <Link href="/guides/minecraft-map-art-guide" className="font-semibold text-[#7cbe4e] transition hover:text-[#a3d47e]">
              Minecraft Map Art Guide
            </Link>
            <span className="text-neutral-600"> — plan multi-map billboards at 128-block tiles.</span>
          </li>
        </ul>
        <nav className="mt-6 flex flex-wrap gap-3 border-t border-[#232723] pt-5" aria-label="More guides">
          <Link href="/guides/how-to-make-minecraft-pixel-art" className="rounded-full border border-[#2a2e2a] px-5 py-2.5 text-sm font-semibold text-neutral-200 transition hover:border-[#3a3f3a] hover:text-neutral-100">
            ← Beginner workflow
          </Link>
          <Link href="/guides/minecraft-map-art-guide" className="rounded-full border border-[#2a2e2a] px-5 py-2.5 text-sm font-semibold text-neutral-200 transition hover:border-[#3a3f3a] hover:text-neutral-100">
            Map art guide →
          </Link>
        </nav>
      </section>
    </main>
  );
}