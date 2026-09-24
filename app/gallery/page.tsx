import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pixel Art Examples Gallery',
  description:
    'Before/after Minecraft pixel art examples — flat logo, portrait and landscape, each converted live to 64×64 blocks. Open any example directly in the generator.',
  openGraph: {
    title: 'Pixel Art Examples Gallery',
    description: 'Logo, portrait, landscape — three conversions, three palettes. Open any example in the generator.',
    images: [{ url: '/demo-landscape-64.png', width: 1024, height: 512, alt: 'Demo landscape converted to Minecraft blocks' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/demo-landscape-64.png'],
  },
};

const examples = [
  {
    image: '/demo-logo-64.png',
    alt: 'Flat geometric logo converted to 3 Minecraft block types at 64 by 64',
    size: 64,
    title: '64×64 — Flat logo, few colors',
    body: '4,096 blocks · just 3 block types. Dithering off keeps clean edges — ideal for logos and icons.',
    href: '/pixel-art-generator?size=64&dither=0',
  },
  {
    image: '/demo-face-64.png',
    alt: 'Portrait converted to 34 Minecraft block types at 64 by 64',
    size: 64,
    title: '64×64 — Portrait with gradients',
    body: '4,096 blocks · 34 block types. Dithering on preserves skin shading — try faces and photos this way.',
    href: '/pixel-art-generator?size=64&dither=1',
  },
  {
    image: '/demo-landscape-64.png',
    alt: 'Landscape photo converted to Minecraft blocks at 64 by 64',
    size: 64,
    title: '64×64 — Landscape photo',
    body: '4,096 blocks · converted live in-browser. The classic test: sky, rock, water and grass in one image.',
    href: '/pixel-art-generator?size=64',
  },
];

export default function GalleryPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-10">
      <p className="eyebrow">Gallery</p>
      <h1 className="mt-3 text-4xl font-bold text-neutral-100 sm:text-5xl">
        Before → after, three image types
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-7 text-neutral-300">
        Logo, portrait, landscape — each converted live in-browser through the
        real palette. Pick a card and open it in the generator —
        settings travel in the URL, your image never leaves the browser.
      </p>

      <section className="mt-10 grid gap-5 md:grid-cols-3">
        {examples.map((example) => (
          <article key={example.size} className="card overflow-hidden p-4">
            <img
              src={example.image}
              alt={example.alt}
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

      <p className="mt-8 text-sm text-neutral-400">
        Want your build here? Convert an image, copy the settings link and send it to us —
        the best submissions join the gallery.
      </p>
    </main>
  );
}
