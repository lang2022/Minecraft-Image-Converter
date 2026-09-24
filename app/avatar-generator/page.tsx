import type { Metadata } from 'next';
import { AvatarWorkspace } from './AvatarWorkspace';

export const metadata: Metadata = {
  title: 'Minecraft Avatar Generator — Skin Head & Face Renderer',
  description:
    'Turn a Minecraft skin into an isometric head or flat face avatar. Free browser tool, transparent PNG export, nothing uploaded.',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Minecraft Avatar Generator',
  description:
    'Render Minecraft player skins into isometric head avatars or flat face images and export transparent PNGs.',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function AvatarGeneratorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 lg:px-10">
        <AvatarWorkspace />
      </main>
    </>
  );
}