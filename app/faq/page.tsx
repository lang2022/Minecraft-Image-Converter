import type { Metadata } from 'next';
import Link from 'next/link';
import { AdSlot } from '@/components/AdSlot';
import { ExternalLink } from '@/components/ExternalLink';

const faqs = [
  {
    q: 'Is the Minecraft pixel art generator free?',
    a: 'Yes. The generator and all current export formats are free to use, with no account required.',
  },
  {
    q: 'Are my images uploaded to a server?',
    a: 'No. Image decoding, color matching and preview rendering all run in your browser. Your image never leaves your device.',
  },
  {
    q: 'Which image formats can I convert?',
    a: 'PNG, JPG/JPEG and WEBP files. You can upload, drag-and-drop, or paste an image straight from the clipboard.',
  },
  {
    q: 'What sizes can I export?',
    a: '16×16, 32×32, 64×64 and 128×128 presets. 128×128 matches a full in-game map at 1:1 scale, which is ideal for map art.',
  },
  {
    q: 'What export formats are supported?',
    a: 'PNG previews, CSV material lists, and Minecraft structure files: .schem (WorldEdit/FAWE), .litematic (Litematica) and .mcstructure (Bedrock structure blocks).',
  },
  {
    q: 'How do I load a .schem file in game?',
    a: 'Place the file in your WorldEdit schematics folder, then use //schem load <name> and //paste. FAWE and vanilla WorldEdit both support the Sponge v2 format we generate.',
  },
  {
    q: 'Can I preview a .litematic or .schem file without loading it in game?',
    a: 'Yes — the online 3D viewer opens .litematic, .schem and .mcstructure files right in your browser, no mods or game required.',
  },
  {
    q: 'Does the .mcstructure export work on Bedrock?',
    a: 'Yes. Put the file in the structures folder of your world, then load it with a structure block in Load mode.',
  },
  {
    q: 'Why does my conversion look different from the original image?',
    a: 'Minecraft has a limited block palette. The converter maps every pixel to the closest block color in LAB space, so very saturated or gradient-heavy sources may lose subtle tones. Try a larger grid or enable dithering.',
  },
  {
    q: 'What is dithering and when should I use it?',
    a: 'Dithering spreads color error to neighboring pixels (Floyd-Steinberg), which preserves gradients in flat-color block art. Turn it off for clean logos with few colors, on for photos and paintings.',
  },
  {
    q: 'Can I use the output commercially?',
    a: 'The converted block designs are yours. Minecraft textures and blocks are subject to Mojang\u2019s usage guidelines, so review those if you plan commercial projects.',
  },
];

export const metadata: Metadata = {
  title: 'FAQ — Minecraft Pixel Art Generator',
  description:
    'Answers about the free Minecraft pixel art generator: privacy, supported formats, exports, sizes and block palettes.',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: { '@type': 'Answer', text: faq.a },
  })),
};

export default function FaqPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="max-w-2xl">
        <span className="inline-flex rounded-full border border-[#2c4419] bg-[#57a82a]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[#7cbe4e]">
          FAQ
        </span>
        <h1 className="mt-4 text-4xl font-bold text-neutral-100 sm:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-lg leading-7 text-neutral-400">
          Everything about privacy, formats, exports and block palettes.
        </p>
      </header>

      <section className="mt-10 space-y-4">
        {faqs.map((faq) => (
          <details key={faq.q} className="group card p-5 open:bg-white/10">
            <summary className="flex cursor-pointer list-none items-center text-lg font-semibold text-neutral-100 marker:hidden">
              <svg
                aria-hidden="true"
                className="mr-2 inline-block h-4 w-4 shrink-0 text-[#7cbe4e] transition group-open:rotate-180"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M4 6l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {faq.q}
            </summary>
            <p className="mt-3 pl-6 leading-7 text-neutral-400">{faq.a}</p>
          </details>
        ))}
      </section>

      <section className="mt-6 card p-6">
        <h2 className="text-lg font-bold text-neutral-100">Official resources</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-400">
          Our exports follow published specs — here are the official docs for the tools that open them.
        </p>
        <ul className="mt-4 space-y-2.5 text-sm text-neutral-400">
          <li>
            <ExternalLink href="https://www.minecraft.net/en-us/usage-guidelines">
              Minecraft Usage Guidelines (Mojang)
            </ExternalLink>
            <span className="text-neutral-400"> — commercial use rules for blocks and textures.</span>
          </li>
          <li>
            <ExternalLink href="https://worldedit.enginehub.org/en/latest/usage/schematics/">
              WorldEdit schematics documentation
            </ExternalLink>
            <span className="text-neutral-400"> — how //schem load and //paste work.</span>
          </li>
          <li>
            <ExternalLink href="https://github.com/maruohon/litematica">
              Litematica on GitHub
            </ExternalLink>
            <span className="text-neutral-400"> — the mod that opens .litematic files.</span>
          </li>
          <li>
            <ExternalLink href="https://github.com/SpongePowered/Schematic-Specification">
              Sponge Schematic Specification v2
            </ExternalLink>
            <span className="text-neutral-400"> — the .schem format our exporter writes.</span>
          </li>
        </ul>
      </section>

      <section className="mt-6 card p-6">
        <h2 className="text-lg font-bold text-neutral-100">Still have questions?</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-400">Try the tool — most answers become obvious in one conversion.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/pixel-art-generator"
            className="inline-block rounded-full bg-[#57a82a] px-6 py-3 text-sm font-semibold text-[#0c120d] transition hover:bg-[#7cbe4e]"
          >
            Open the generator
          </Link>
          <Link
            href="/litematic-viewer"
            className="inline-block rounded-full border border-[#2a2e2a] bg-transparent px-6 py-3 text-sm font-semibold text-neutral-100 transition hover:border-[#3a3f3a]"
          >
            Inspect a file in 3D
          </Link>
        </div>
      </section>

      <AdSlot format="leaderboard" slotId="faq-bottom" />
    </main>
  );
}