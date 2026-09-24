import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from 'next/font/google';
import Script from 'next/script';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import './globals.css';

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
});

const bodyFont = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
});

const monoFont = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono-count',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com';
const adsClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export const viewport: Viewport = {
  themeColor: '#101210',
  colorScheme: 'dark',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Minecraft Pixel Art Generator & Image Converter',
    template: '%s | Minecraft Image Converter',
  },
  description:
    'Turn any image into Minecraft pixel art, blocks, schematics, map art and structure files with a fast browser-based generator.',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    type: 'website',
    siteName: 'Minecraft Image Converter',
    title: 'Minecraft Pixel Art Generator & Image Converter',
    description:
      'Convert any image to Minecraft pixel art — free, private, and fully in-browser. Export PNG, CSV, .schem, .litematic and .mcstructure.',
    url: siteUrl,
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Minecraft Image Converter — pixel art generator with schematic exports',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Minecraft Pixel Art Generator & Image Converter',
    description:
      'Convert any image to Minecraft pixel art — free, private, and fully in-browser.',
    images: ['/og-default.png'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Minecraft Image Converter',
  url: siteUrl,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
      <body className="flex min-h-screen flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {adsClient && (
          <Script
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsClient}`}
          />
        )}
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}