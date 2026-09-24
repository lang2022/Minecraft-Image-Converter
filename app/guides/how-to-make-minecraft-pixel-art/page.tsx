import type { Metadata } from 'next';
import Link from 'next/link';
import { AdSlot } from '@/components/AdSlot';
import { ExternalLink } from '@/components/ExternalLink';

export const metadata: Metadata = {
  title: 'How to Make Minecraft Pixel Art (Beginner Guide)',
  description:
    'Learn how to make Minecraft pixel art from any image: choose a converter, pick block-friendly colors, and build step by step.',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How to Make Minecraft Pixel Art (Beginner Guide)',
  description:
    'Learn how to make Minecraft pixel art from any image: choose a converter, pick block-friendly colors, and build step by step.',
};

const steps = [
  {
    title: 'Start with the right source image',
    body: 'Square-ish, high contrast images convert best. Avoid very thin lines and heavy gradients, because block placement snaps to a grid. If the source is noisy, resize and simplify it before converting.',
  },
  {
    title: 'Convert with a purpose-built tool',
    body: 'Open the free pixel art generator, upload your image, and pick a grid size. The tool runs entirely in your browser and maps every sampled pixel to the closest Minecraft block color in LAB space, so results match what you actually see in-game.',
  },
  {
    title: 'Treat the palette as a design constraint',
    body: 'Minecraft blocks cluster around woods, stones, wools, concretes and terracotta. Designs based on those families read instantly. Replace unmatched colors deliberately (e.g. swap a muddy brown for oak planks to keep a build coherent).',
  },
  {
    title: 'Check the material list before you build',
    body: 'A conversion produces a count-per-block list. Use it to gather materials or reserve chest slots. For a 64×64 mural you will usually need a few stacks of the top 5-10 blocks, not dozens of rare ones.',
  },
  {
    title: 'Place blocks floor over floor',
    body: 'In creative, place the bottom row first and move up. In survival, scaffold with temporary blocks. If you exported a .schem, load it with WorldEdit and paste it directly into your plot.',
  },
];

export default function HowToMakePixelArtPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="text-sm text-neutral-500">
        <Link href="/guides" className="transition hover:text-neutral-100">
          Guides
        </Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-300">How to Make Minecraft Pixel Art</span>
      </nav>

      <header className="mt-8">
        <h1 className="text-4xl font-bold text-neutral-100">How to Make Minecraft Pixel Art</h1>
        <p className="mt-4 text-lg leading-7 text-neutral-400">
          Making pixel art in Minecraft is a two-step process: turn your image into a block grid, then place the blocks.
          Here is the workflow we recommend, whether you are building a 16×16 icon or a server-wide mural.
        </p>
      </header>

      <ol className="mt-10 space-y-10">
        {steps.map((step, index) => (
          <li key={step.title}>
            <h2 className="text-2xl font-bold text-neutral-100">
              <span className="mr-2 font-mono text-[#7cbe4e]">{index + 1}.</span>
              {step.title}
            </h2>
            <p className="mt-3 leading-7 text-neutral-400">{step.body}</p>
          </li>
        ))}
      </ol>

      <section className="mt-12 card p-6">
        <h2 className="text-lg font-bold text-neutral-100">Try it now</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-400">
          Convert your first image in under a minute — no upload, everything stays local.
        </p>
        <Link
          href="/pixel-art-generator"
          className="mt-4 inline-block rounded-full bg-[#57a82a] px-6 py-3 text-sm font-semibold text-[#0c120d] transition hover:bg-[#7cbe4e]"
        >
          Open the generator
        </Link>
      </section>

      <section className="mt-6 card p-6">
        <h2 className="text-lg font-bold text-neutral-100">Further reading</h2>
        <ul className="mt-3 space-y-2.5 text-sm text-neutral-400">
          <li>
            <ExternalLink href="https://worldedit.enginehub.org/en/latest/usage/schematics/">
              WorldEdit schematics guide
            </ExternalLink>
            <span className="text-neutral-600"> — paste finished designs with //schem load and //paste.</span>
          </li>
          <li>
            <ExternalLink href="https://github.com/maruohon/litematica">Litematica on GitHub</ExternalLink>
            <span className="text-neutral-600"> — preview schematics as in-game holograms.</span>
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

      <AdSlot format="leaderboard" slotId="howto-guide-bottom" />
    </main>
  );
}