import type { Metadata } from 'next';
import { GeneratorWorkspace } from './GeneratorWorkspace';

export const metadata: Metadata = {
  title: 'Free Minecraft Pixel Art Generator',
  description: 'Upload an image, convert it to Minecraft-style pixel art, and export PNG, CSV or structure files.',
  alternates: {
    canonical: '/pixel-art-generator',
    languages: {
      en: '/pixel-art-generator',
      ja: '/ja/pixel-art-generator',
    },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Free Minecraft Pixel Art Generator',
  description:
    'Upload an image, convert it to Minecraft-style pixel art, and export PNG, CSV, .schem, .litematic and .mcstructure files.',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function PixelArtGeneratorPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 lg:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GeneratorWorkspace />
    </main>
  );
}