import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

export const siteRoutes = [
  { path: '', priority: 1, changeFrequency: 'weekly' as const },
  { path: 'pixel-art-generator', priority: 0.9, changeFrequency: 'weekly' as const },
  { path: 'ja/pixel-art-generator', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: 'litematic-viewer', priority: 0.9, changeFrequency: 'weekly' as const },
  { path: 'avatar-generator', priority: 0.8, changeFrequency: 'weekly' as const },
  { path: 'palette-atlas', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: 'lego-mosaic-generator', priority: 0.8, changeFrequency: 'weekly' as const },
  { path: 'faq', priority: 0.6, changeFrequency: 'monthly' as const },
  { path: 'about', priority: 0.5, changeFrequency: 'yearly' as const },
  { path: 'privacy', priority: 0.3, changeFrequency: 'yearly' as const },
  { path: 'guides', priority: 0.6, changeFrequency: 'monthly' as const },
  { path: 'guides/how-to-make-minecraft-pixel-art', priority: 0.5, changeFrequency: 'monthly' as const },
  { path: 'guides/best-size-for-minecraft-pixel-art', priority: 0.5, changeFrequency: 'monthly' as const },
  { path: 'guides/minecraft-map-art-guide', priority: 0.5, changeFrequency: 'monthly' as const },
];

/** Last content change. Bump when a page's content actually changes so crawlers recrawl for a reason. */
export const siteLastModified = new Date('2026-09-23');

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();

  return siteRoutes.map((route) => ({
    url: `${baseUrl}/${route.path}`.replace(/\/$/, ''),
    lastModified: siteLastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
