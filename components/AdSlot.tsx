'use client';

import { useEffect, useRef, useState } from 'react';

type AdFormat = 'leaderboard' | 'rectangle' | 'sidebar';

const FORMATS: Record<AdFormat, { className: string; label: string }> = {
  leaderboard: { className: 'min-h-[90px] w-full', label: 'Advertisement · 728×90' },
  rectangle: { className: 'min-h-[250px] w-full', label: 'Advertisement · 336×280' },
  sidebar: { className: 'min-h-[600px] w-full', label: 'Advertisement · 300×600' },
};

/**
 * Reserved ad inventory. Renders a branded placeholder until an AdSense
 * client ID is configured (NEXT_PUBLIC_ADSENSE_CLIENT), then upgrades to a
 * real <ins class="adsbygoogle"> slot using the standard push flow.
 * Layout is reserved in both states so activation never shifts content
 * (a Core Web Vitals requirement for the high-CPC keywords this site targets).
 */
export function AdSlot({ format, slotId }: { format: AdFormat; slotId: string }) {
  const config = FORMATS[format];
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pushed, setPushed] = useState(false);

  useEffect(() => {
    if (!client || !containerRef.current || pushed) return;
    const ins = containerRef.current.querySelector('ins.adsbygoogle');
    if (!ins) return;
    try {
      (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle = [];
      (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle.push({});
      setPushed(true);
    } catch {
      // Ad blockers make the push throw; the placeholder keeps rendering.
    }
  }, [client, pushed]);

  if (!client) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-dashed border-[#2a2e2a] bg-black/15 text-[11px] uppercase tracking-[0.25em] text-slate-600 ${config.className}`}
        aria-hidden
      >
        {config.label}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={config.className}>
      <ins
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}