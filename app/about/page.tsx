import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink } from '@/components/ExternalLink';

export const metadata: Metadata = {
  title: 'About',
  description:
    'About Minecraft Image Converter: free in-browser tools for Minecraft pixel art, schematics, map art, avatars and LEGO mosaics — how they work and the principles behind them.',
};

const tools = [
  {
    href: '/pixel-art-generator',
    title: 'Pixel Art Generator',
    body: 'Turn any image into a block design with real-time preview, category palette filters, material lists and structure file exports.',
  },
  {
    href: '/litematic-viewer',
    title: 'Online Litematic Viewer',
    body: 'Open .litematic, .schem and .mcstructure files in a 3D view without launching the game.',
  },
  {
    href: '/avatar-generator',
    title: 'Avatar Generator',
    body: 'Render player skins into isometric heads or flat face avatars as transparent PNGs.',
  },
  {
    href: '/lego-mosaic-generator',
    title: 'LEGO Mosaic Generator',
    body: 'Turn any photo into a buildable brick mosaic with a studs preview, parts bill and BrickLink wanted-list XML.',
  },
  {
    href: '/palette-atlas',
    title: 'Block Atlas',
    body: 'Browse the full block palette and the texture atlas that powers the converter.',
  },
];

const principles = [
  {
    title: 'Local by default',
    body: 'Images, skins and structure files are parsed and rendered in your browser. Nothing is uploaded to a server, and there is no account system.',
  },
  {
    title: 'Engineered, not improvised',
    body: 'Conversions run in a Web Worker using CIEDE2000 color matching in LAB space against a texture-scanned 101-block palette. Structure files are written to spec and verified with automated round-trip tests.',
  },
  {
    title: 'Free and honest',
    body: 'Every tool is free to use. The site explains what it does and what it cannot do — no dark patterns, no forced sign-ups.',
  },
];

export default function AboutPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10 lg:px-8">
      <header className="max-w-2xl">
        <span className="inline-flex rounded-full border border-[#2c4419] bg-[#57a82a]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[#7cbe4e]">
          About
        </span>
        <h1 className="mt-4 text-4xl font-bold text-neutral-100 sm:text-5xl">About this site</h1>
        <p className="mt-4 text-lg leading-7 text-neutral-400">
          Minecraft Image Converter is a collection of free, browser-based tools for turning images into Minecraft
          block art — and for inspecting the files such art produces.
        </p>
      </header>

      <section className="mt-10 card p-6">
        <h2 className="text-xl font-bold text-neutral-100">The tools</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="rounded-lg border border-[#2a2e2a] bg-[#101210] p-4 transition hover:border-[#2c4419] hover:bg-transparent"
            >
              <h3 className="font-semibold text-neutral-100">{tool.title}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-400">{tool.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 card p-6">
        <h2 className="text-xl font-bold text-neutral-100">How it works</h2>
        <ol className="mt-4 space-y-3 text-sm leading-6 text-neutral-400">
          <li>
            <strong className="text-neutral-100">1. Color matching.</strong> Your image is downscaled to the target grid,
            then every pixel is matched to the closest block color using the CIEDE2000 difference formula in LAB
            space — the same perceptual model used for print color work.
          </li>
          <li>
            <strong className="text-neutral-100">2. Palette.</strong> The palette holds 101 vanilla blocks with average
            colors scanned from real 1.20 textures, including biome-tinted blocks. Whole categories (wool, stone,
            wood and more) can be switched off to match the materials you actually own. You can inspect it on the{' '}
            <Link href="/palette-atlas" className="text-[#7cbe4e] hover:text-[#a3d47e]">
              block atlas
            </Link>{' '}
            page.
          </li>
          <li>
            <strong className="text-neutral-100">3. Exports.</strong> Beyond PNG and CSV material lists, the generator
            writes real structure files — Sponge .schem for WorldEdit/FAWE, .litematic for Litematica and
            .mcstructure for Bedrock structure blocks — following each format&apos;s published spec.
          </li>
        </ol>
      </section>

      <section className="mt-6 card p-6">
        <h2 className="text-xl font-bold text-neutral-100">Principles</h2>
        <div className="mt-4 space-y-4">
          {principles.map((principle) => (
            <div key={principle.title}>
              <h3 className="font-semibold text-neutral-100">{principle.title}</h3>
              <p className="mt-1 text-sm leading-6 text-neutral-400">{principle.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 card p-6">
        <h2 className="text-xl font-bold text-neutral-100">Trademark note</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-400">
          Minecraft is a trademark of Mojang Synergies AB. This site is not an official Minecraft product and is not
          approved by or associated with Mojang or Microsoft. Block textures shown here are referenced for
          compatibility; we encourage you to buy and play{' '}
          <ExternalLink href="https://www.minecraft.net">the actual game</ExternalLink>. Commercial projects should
          also review the{' '}
          <ExternalLink href="https://www.minecraft.net/en-us/usage-guidelines">
            Minecraft Usage Guidelines
          </ExternalLink>
          .
        </p>
      </section>

      <section className="mt-6 card p-6">
        <h2 className="text-xl font-bold text-neutral-100">Get started</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-400">
          The fastest way to understand the pipeline is to run one conversion — it takes about a minute.
        </p>
        <Link
          href="/pixel-art-generator"
          className="mt-4 inline-block rounded-full bg-[#57a82a] px-6 py-3 text-sm font-semibold text-[#0c120d] transition hover:bg-[#7cbe4e]"
        >
          Open the generator
        </Link>
      </section>
    </main>
  );
}