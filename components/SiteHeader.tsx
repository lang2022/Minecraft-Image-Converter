'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Globe } from 'lucide-react';

const navLinks = [
  { href: '/pixel-art-generator', label: 'Generator' },
  { href: '/litematic-viewer', label: 'Viewer' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/avatar-generator', label: 'Avatar' },
  { href: '/guides', label: 'Guides' },
  { href: '/faq', label: 'FAQ' },
];

const moreLinks = [
  { href: '/lego-mosaic-generator', label: 'LEGO Mosaic' },
  { href: '/palette-atlas', label: 'Block Atlas' },
  { href: '/about', label: 'About' },
];

function BlockMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true" className="shrink-0">
      <rect x="1" y="1" width="24" height="24" rx="5" fill="#1d211d" stroke="#333833" />
      <rect x="5" y="5" width="7" height="7" fill="#57a82a" />
      <rect x="14" y="5" width="7" height="7" fill="#4a9423" />
      <rect x="5" y="14" width="7" height="7" fill="#3a761b" />
      <rect x="14" y="14" width="7" height="7" fill="#57a82a" opacity="0.55" />
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isJa = pathname === '/ja' || pathname.startsWith('/ja/');

  // Only /pixel-art-generator has a Japanese counterpart today.
  // The toggle always lands on the matching page when one exists,
  // otherwise on the closest translated page.
  const enHref = isJa ? pathname.replace(/^\/ja/, '') || '/' : pathname;
  const jaHref = '/ja/pixel-art-generator';

  return (
    <header className="sticky top-0 z-40 border-b border-[#232723] bg-[#101210]">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
        <Link
          href={isJa ? '/ja/pixel-art-generator' : '/'}
          className="flex items-center gap-2.5"
          onClick={() => setOpen(false)}
        >
          <BlockMark />
          <span className="text-[15px] font-semibold text-neutral-100">Minecraft Image Converter</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-neutral-400 md:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-neutral-100">
              {link.label}
            </Link>
          ))}
          <details className="group relative">
            <summary className="cursor-pointer list-none transition hover:text-neutral-100 [&::-webkit-details-marker]:hidden">
              More ▾
            </summary>
            <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-lg border border-[#2a2e2a] bg-[#161816] py-1 shadow-xl">
              {moreLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block px-4 py-2.5 text-sm text-neutral-300 transition hover:bg-[#1d211d] hover:text-neutral-100">
                  {link.label}
                </Link>
              ))}
            </div>
          </details>
        </nav>

        <div className="hidden items-center gap-2 text-[13px] md:flex">
          <Globe size={14} className="text-neutral-500" aria-hidden="true" />
          <Link
            href={enHref}
            aria-current={isJa ? undefined : 'page'}
            className={`rounded px-1.5 py-0.5 transition ${
              isJa ? 'text-neutral-500 hover:text-neutral-200' : 'font-semibold text-neutral-100'
            }`}
          >
            EN
          </Link>
          <span className="text-neutral-700" aria-hidden="true">
            /
          </span>
          <Link
            href={jaHref}
            aria-current={isJa ? 'page' : undefined}
            title={isJa ? undefined : 'Only the pixel art generator is translated; other pages stay in English'}
            className={`rounded px-1.5 py-0.5 transition ${
              isJa ? 'font-semibold text-neutral-100' : 'text-neutral-500 hover:text-neutral-200'
            }`}
          >
            日本語
          </Link>
        </div>

        <button
          type="button"
          className="rounded-md border border-[#2a2e2a] p-2 text-neutral-300 md:hidden"
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-[#232723] px-4 py-3 sm:px-6 md:hidden" aria-label="Mobile">
          <ul className="space-y-1 text-[15px]">
            {[...navLinks, ...moreLinks].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-md px-2 py-2.5 text-neutral-300 transition hover:bg-[#161816] hover:text-neutral-100"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center gap-2 border-t border-[#232723] px-2 pt-3 text-sm">
            <Globe size={14} className="text-neutral-500" aria-hidden="true" />
            <Link
              href={enHref}
              onClick={() => setOpen(false)}
              className={isJa ? 'text-neutral-500' : 'font-semibold text-neutral-100'}
            >
              EN
            </Link>
            <span className="text-neutral-700" aria-hidden="true">
              /
            </span>
            <Link
              href={jaHref}
              onClick={() => setOpen(false)}
              className={isJa ? 'font-semibold text-neutral-100' : 'text-neutral-500'}
            >
              日本語
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
