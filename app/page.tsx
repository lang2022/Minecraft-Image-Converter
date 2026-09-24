import Link from 'next/link';
import { Blocks, Download, ImagePlus, ListChecks } from 'lucide-react';
import { getSiteUrl } from '@/lib/site-url';

const features = [
  {
    icon: ImagePlus,
    title: 'Convert in the browser',
    body: 'Drop in a JPG, PNG or WEBP. Downsampling and LAB color matching run in a Web Worker — the page never freezes, even at 128×128.',
  },
  {
    icon: Blocks,
    title: 'A palette you can argue with',
    body: '101 texture-scanned blocks across 8 families. Short on stone in survival? Exclude the family and it converts again automatically.',
  },
  {
    icon: ListChecks,
    title: 'Know the cost before you build',
    body: 'Every conversion ends in a per-block material list with tabular counts, so gathering for a 4,096-block mural starts from facts.',
  },
  {
    icon: Download,
    title: 'Leave with files, not screenshots',
    body: 'PNG previews, CSV bills, and real structure files — .schem for WorldEdit, .litematic for Litematica, .mcstructure for Bedrock.',
  },
];

const faqItems = [
  {
    q: 'Is this tool free?',
    a: 'Yes. The core generator is designed to run free in the browser.',
  },
  {
    q: 'Will images be uploaded?',
    a: 'No. The architecture keeps all image processing client-side.',
  },
  {
    q: 'What can I export?',
    a: 'PNG previews, CSV material lists, .schem, .litematic, and .mcstructure structure files.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Minecraft Pixel Art Generator & Image Converter',
      url: `${getSiteUrl()}/pixel-art-generator`,
      description:
        'Turn any image into Minecraft pixel art, blocks, schematics, map art and structure files — fully client-side.',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: [
        'Convert images to Minecraft pixel art',
        '16×16 to 128×128 grids',
        'Export PNG, CSV, .schem, .litematic, .mcstructure',
        '100% in-browser processing',
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqItems.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      })),
    },
  ],
};

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 py-10 lg:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div className="max-w-xl">
          <p className="eyebrow">Free · no upload · no account</p>
          <h1 className="mt-4 text-4xl font-bold text-neutral-100 sm:text-5xl">
            Turn any image into Minecraft pixel art
          </h1>
          <p className="mt-4 text-lg leading-7 text-neutral-400">
            Convert photos to block plans in your browser, then export .schem, .litematic or .mcstructure
            and build them in-game.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href="/pixel-art-generator"
              className="rounded-lg bg-[#57a82a] px-5 py-2.5 text-[15px] font-semibold text-[#0c120d] transition hover:bg-[#67bd36]"
            >
              Convert an image
            </Link>
            <Link
              href="#example"
              className="text-[15px] font-semibold text-[#7cbe4e] transition hover:text-[#a3d47e]"
            >
              See a 64×64 example ↓
            </Link>
          </div>
          <p className="count mt-6 text-[13px] text-neutral-500">
            64×64 · 4,096 blocks · 43 block types · 3 structure formats
          </p>
        </div>

        <figure className="card overflow-hidden p-4">
          <img
            src="/demo-landscape-64.png"
            alt="Landscape photo converted to a 64 by 64 Minecraft block plan, side by side"
            className="w-full rounded-md"
          />
          <figcaption className="mt-3 text-center text-[13px] text-neutral-500">
            Photo → block plan · converted live in the browser
          </figcaption>
        </figure>
      </section>

      <section id="features" className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <p className="eyebrow">What it does</p>
          <h2 className="mt-3 text-2xl font-bold text-neutral-100 sm:text-3xl">
            Four things, in the order you need them
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-7 text-neutral-400">
            Convert, constrain, cost, carry. Each step hands its output to the next — nothing here is decoration.
          </p>
          <Link
            href="/pixel-art-generator"
            className="mt-5 inline-block text-[15px] font-semibold text-[#7cbe4e] transition hover:text-[#a3d47e]"
          >
            Run the full sequence →
          </Link>
        </div>
        <ol className="divide-y divide-[#232723] border-y border-[#232723]">
          {features.map((feature, index) => (
            <li key={feature.title} className="flex gap-4 py-5">
              <span className="count mt-0.5 w-7 shrink-0 text-sm text-neutral-600">
                {String(index + 1).padStart(2, '0')}
              </span>
              <feature.icon size={20} strokeWidth={1.75} className="mt-0.5 shrink-0 text-[#57a82a]" aria-hidden="true" />
              <div>
                <h3 className="text-[17px] font-semibold text-neutral-100">{feature.title}</h3>
                <p className="mt-1.5 max-w-xl text-[15px] leading-7 text-neutral-400">{feature.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="example" className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <figure className="card overflow-hidden p-4 lg:order-1">
          <img
            src="/demo-landscape-64.png"
            alt="Landscape photo converted to a 64 by 64 Minecraft block plan, side by side"
            className="w-full rounded-md"
            loading="lazy"
          />
          <figcaption className="mt-3 text-center text-[13px] text-neutral-500">
            Photo → 64×64 block plan · 43 distinct blocks · converted in-browser
          </figcaption>
        </figure>
        <div className="lg:order-2">
          <p className="eyebrow">Why use it</p>
          <h2 className="mt-3 text-2xl font-bold text-neutral-100">A photo becomes a buildable block plan</h2>
          <div className="mt-4 space-y-4 text-[15px] leading-7 text-neutral-400">
            <p>
              The example on the right started as an ordinary landscape photo. The generator reduced it to a 64×64
              grid and matched every cell to the closest of 101 vanilla blocks in LAB color space — 43 distinct
              blocks, 4,096 placed, with dithering keeping the sky gradient smooth.
            </p>
            <p>
              What you download is not a picture of blocks but a plan for them: a per-block material list for
              survival gathering, plus real structure files — .schem for WorldEdit, .litematic for Litematica,
              .mcstructure for Bedrock. Paste it, or inspect it first in the built-in 3D viewer.
            </p>
            <p>
              Everything runs in your browser. No upload, no account, no watermark — your images never leave
              your device.
            </p>
          </div>
          <Link
            href="/pixel-art-generator"
            className="mt-5 inline-block rounded-lg bg-[#57a82a] px-5 py-2.5 text-[15px] font-semibold text-[#0c120d] transition hover:bg-[#67bd36]"
          >
            Try it with your photo
          </Link>
        </div>
      </section>

      <section className="mt-2">
        <p className="eyebrow">Beyond Minecraft</p>
        <h3 className="mt-3 text-2xl font-bold text-neutral-100">The same engine, other hobbies</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Link
            href="/lego-mosaic-generator"
            className="card group p-5 transition hover:border-[#4d3f14]"
          >
            <h4 className="font-semibold text-neutral-100 group-hover:text-[#fcd34d]">LEGO Mosaic Generator</h4>
            <p className="mt-2 text-sm leading-7 text-neutral-400">
              Turn any photo into a buildable brick mosaic with a studs preview, parts bill and baseplate plan.
            </p>
            <p className="mt-3 text-sm font-semibold text-[#fbbf24]">Open the LEGO tool →</p>
          </Link>
          <div className="card p-5 opacity-60 cursor-default" aria-disabled="true">
            <h4 className="font-semibold text-neutral-100">Cross Stitch Pattern Generator</h4>
            <p className="mt-2 text-sm leading-7 text-neutral-400">
              Photo to DMC thread chart with symbol grids and fabric size math.
            </p>
            <p className="mt-3 eyebrow">Coming soon</p>
          </div>
          <div className="card p-5 opacity-60 cursor-default" aria-disabled="true">
            <h4 className="font-semibold text-neutral-100">Fuse Bead Pattern Generator</h4>
            <p className="mt-2 text-sm leading-7 text-neutral-400">
              Perler and Hama bead layouts with pegboard plans and color counts.
            </p>
            <p className="mt-3 eyebrow">Coming soon</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="card p-6">
          <p className="eyebrow">How it works</p>
          <h3 className="mt-3 text-2xl font-bold text-neutral-100">Browser-first pipeline</h3>
          <ol className="mt-4 space-y-3 text-neutral-400">
            <li>1. Upload a JPG, PNG, or WEBP image.</li>
            <li>2. Process it in a Web Worker using color matching and palette mapping.</li>
            <li>3. Preview the output on a responsive canvas.</li>
            <li>4. Export PNG, material lists, and .schem / .litematic / .mcstructure files.</li>
          </ol>
        </article>

        <article id="faq" className="card p-6">
          <p className="eyebrow">FAQ</p>
          <div className="mt-4 space-y-4 text-neutral-400">
            {faqItems.map((faq) => (
              <div key={faq.q}>
                <h4 className="font-semibold text-neutral-100">{faq.q}</h4>
                <p>{faq.a}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}