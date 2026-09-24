import Link from 'next/link';

const toolLinks = [
  { href: '/pixel-art-generator', label: 'Pixel Art Generator' },
  { href: '/litematic-viewer', label: '3D Litematic Viewer' },
  { href: '/avatar-generator', label: 'Avatar Generator' },
  { href: '/palette-atlas', label: 'Block Atlas' },
  { href: '/lego-mosaic-generator', label: 'LEGO Mosaic Generator' },
];

const resourceLinks = [
  { href: '/guides/how-to-make-minecraft-pixel-art', label: 'How to Make Pixel Art' },
  { href: '/guides/best-size-for-minecraft-pixel-art', label: 'Pixel Art Sizes' },
  { href: '/guides/minecraft-map-art-guide', label: 'Map Art Guide' },
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'About' },
  { href: '/privacy', label: 'Privacy Policy' },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[#232723] bg-[#0e100e]">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-10">
        <div>
          <p className="text-sm font-semibold text-neutral-200">Minecraft Image Converter</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-neutral-500">
            Free browser tools for turning images into Minecraft pixel art, schematics, map art and avatars — every
            file is processed locally, nothing ever leaves your device.
          </p>
        </div>

        <nav>
          <p className="text-sm font-semibold text-neutral-200">Tools</p>
          <ul className="mt-4 space-y-2 text-sm text-neutral-500">
            {toolLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition hover:text-neutral-200">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav>
          <p className="text-sm font-semibold text-neutral-200">Guides & resources</p>
          <ul className="mt-4 space-y-2 text-sm text-neutral-500">
            {resourceLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition hover:text-neutral-200">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-[#1c1f1c] px-4 py-4 sm:px-6 lg:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 text-xs text-neutral-600 sm:flex-row">
          <p>© {new Date().getFullYear()} Minecraft Image Converter. All tools free to use.</p>
          <nav className="flex items-center gap-5">
            <Link href="/about" className="transition hover:text-neutral-200">
              About
            </Link>
            <Link href="/privacy" className="transition hover:text-neutral-200">
              Privacy Policy
            </Link>
            <Link href="/sitemap" className="transition hover:text-neutral-200">
              Sitemap
            </Link>
          </nav>
          <p>Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.</p>
        </div>
      </div>
    </footer>
  );
}