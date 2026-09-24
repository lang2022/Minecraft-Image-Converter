import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pixel Art Examples Gallery',
  description:
    'Before/after Minecraft pixel art examples at 32×32, 64×64 and 128×128 — open any example directly in the generator.',
  openGraph: {
    title: 'Pixel Art Examples Gallery',
    description: 'Same photo, three grids — 32, 64, 128. Open any size in the generator.',
    images: [{ url: '/demo-landscape-64.png', width: 1024, height: 512, alt: 'Demo landscape converted to Minecraft blocks' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/demo-landscape-64.png'],
  },
};

const examples = [
  {
    size: 32,
    title: '32×32 — Icon / avatar scale',
    body: '1,024 blocks · few dozen block types. Best for heads, icons and quick tests.',
    href: '/pixel-art-generator?size=32',
  },
  {
    size: 64,
    title: '64×64 — The sweet spot',
    body: '4,096 blocks · ~43 block types. The demo landscape below was converted live in-browser.',
    href: '/pixel-art-generator?size=64',
  },
  {
    size: 128,
    title: '128×128 — Mural / map scale',
    body: '16,384 blocks · widest palette. Matches one full Minecraft map 1:1.',
    href: '/pixel-art-generator?size=128',
  },
];

export default function GalleryPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-10">
      <p className="eyebrow">Gallery</p>
      <h1 className="mt-3 text-4xl font-bold text-neutral-100 sm:text-5xl">
        Before → after, at three sizes
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-7 text-neutral-400">
        Same photo, three grids. Pick a size and open it in the generator —
        settings travel in the URL, your image never leaves the browser.
      </p>

      <section className="mt-10 grid gap-5 md:grid-cols-3">
        {examples.map((example) => (
          <article key={example.size} className="card overflow-hidden p-4">
            <img
              src="/demo-landscape-64.png"
              alt={`Demo landscape converted at ${example.size} by ${example.size}`}
              className="w-full rounded-md"
              loading="lazy"
            />
            <h2 className="mt-4 text-lg font-semibold text-neutral-100">{example.title}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-400">{example.body}</p>
            <Link
              href={example.href}
              className="mt-4 block rounded-full bg-[#57a82a] px-5 py-3 text-center text-sm font-semibold text-[#0c120d] transition hover:bg-[#67bd36]"
            >
              Open {example.size}×{example.size} in generator
            </Link>
          </article>
        ))}
      </section>

      <p className="mt-8 text-sm text-neutral-500">
        Want your build here? Convert an image, copy the settings link and send it to us —
        the best submissions join the gallery.
      </p>
    </main>
  );
}
