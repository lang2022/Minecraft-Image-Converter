import type { Metadata } from 'next';
import Link from 'next/link';
import { siteRoutes } from '../sitemap';

export const metadata: Metadata = {
  title: 'Sitemap',
  description:
    'Every page on Minecraft Image Converter: pixel art and LEGO mosaic generators, 3D viewer, avatar tool, block atlas, guides, FAQ, about and privacy.',
};

const groups: Array<{ title: string; paths: string[] }> = [
  {
    title: 'Tools',
    paths: [
      'pixel-art-generator',
      'litematic-viewer',
      'avatar-generator',
      'lego-mosaic-generator',
      'palette-atlas',
    ],
  },
  {
    title: 'Guides',
    paths: [
      'guides',
      'guides/how-to-make-minecraft-pixel-art',
      'guides/best-size-for-minecraft-pixel-art',
      'guides/minecraft-map-art-guide',
    ],
  },
  { title: 'Site', paths: ['faq', 'about', 'privacy'] },
];

function labelFor(path: string): string {
  const route = siteRoutes.find((entry) => entry.path === path);
  void route;
  const labels: Record<string, string> = {
    'pixel-art-generator': 'Pixel Art Generator',
    'litematic-viewer': 'Online Litematic Viewer',
    'avatar-generator': 'Avatar Generator',
    'lego-mosaic-generator': 'LEGO Mosaic Generator',
    'palette-atlas': 'Block Atlas',
    guides: 'Guides & Tutorials',
    'guides/how-to-make-minecraft-pixel-art': 'How to Make Minecraft Pixel Art',
    'guides/best-size-for-minecraft-pixel-art': 'Best Size for Minecraft Pixel Art',
    'guides/minecraft-map-art-guide': 'Minecraft Map Art Guide',
    faq: 'FAQ',
    about: 'About',
    privacy: 'Privacy Policy',
  };
  return labels[path] ?? path;
}

export default function SitemapPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10 lg:px-8">
      <header className="max-w-2xl">
        <p className="eyebrow">Index</p>
        <h1 className="mt-4 text-4xl font-bold text-neutral-100 sm:text-5xl">Sitemap</h1>
        <p className="mt-4 text-lg leading-7 text-neutral-400">
          Every page on this site. Crawlers can use the machine-readable{' '}
          <Link href="/sitemap.xml" className="text-[#7cbe4e] hover:text-[#a3d47e]">
            sitemap.xml
          </Link>
          .
        </p>
      </header>

      <div className="mt-10 space-y-4">
        {groups.map((group) => (
          <section key={group.title} className="card p-6">
            <h2 className="text-xl font-bold text-neutral-100">{group.title}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {group.paths.map((path) => (
                <li key={path}>
                  <Link
                    href={path === '' ? '/' : `/${path}`}
                    className="text-neutral-300 transition hover:text-neutral-100"
                  >
                    {labelFor(path)}
                    <span className="ml-2 text-xs text-neutral-600">/{path}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
