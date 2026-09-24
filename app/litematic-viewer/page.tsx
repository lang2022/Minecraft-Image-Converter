import type { Metadata } from 'next';
import { ViewerWorkspace } from './ViewerWorkspace';

export const metadata: Metadata = {
  title: 'Online Litematic Viewer — .litematic, .schem & .mcstructure',
  description:
    'Open and inspect Minecraft .litematic, .schem and .mcstructure files in your browser. Free 3D viewer, no upload, no mods required.',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Online Litematic Viewer',
  description:
    'Open and inspect Minecraft .litematic, .schem and .mcstructure files in 3D directly in the browser.',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function LitematicViewerPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 lg:px-10">
        <ViewerWorkspace />
      </main>
    </>
  );
}