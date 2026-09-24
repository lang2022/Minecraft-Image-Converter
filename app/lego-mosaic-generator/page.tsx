import type { Metadata } from 'next';
import { LegoWorkspace } from './LegoWorkspace';
import { getSiteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
  title: 'LEGO Mosaic Generator — Photo to Brick Mosaic',
  description:
    'Free LEGO mosaic generator: turn any photo into a buildable brick mosaic with a studs preview, solid-color brick bill and baseplate plan. No upload, runs in your browser.',
  alternates: {
    canonical: '/lego-mosaic-generator',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'LEGO Mosaic Generator',
      url: `${getSiteUrl()}/lego-mosaic-generator`,
      description:
        'Convert any photo into a buildable LEGO mosaic with a studs preview, brick bill and baseplate plan — fully in-browser.',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How many LEGO bricks do I need for a mosaic?',
          a: 'A mosaic needs one stud per pixel, so a 32×32 design uses 1,024 bricks. The brick bill lists the exact count per color after conversion.',
        },
        {
          '@type': 'Question',
          name: 'Which baseplate should I use?',
          a: '16×16 mosaics fit a small 16×16 plate, 32×32 fits the standard 10-inch baseplate, and 48×48 fits the large 48×48 plate. Bigger designs tile several 32×32 plates.',
        },
        {
          '@type': 'Question',
          name: 'Do I need exact LEGO colors?',
          a: 'No. The generator matches your photo to the 36 most useful solid brick colors in LAB color space, so standard sets and pick-a-brick orders work fine.',
        },
      ].map((faq) => ({ '@type': 'Question', name: faq.name, acceptedAnswer: { '@type': 'Answer', text: faq.a } })),
    },
  ],
};

export default function LegoMosaicGeneratorPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 lg:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LegoWorkspace />
    </main>
  );
}