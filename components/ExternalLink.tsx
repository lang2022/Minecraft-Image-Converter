import type { ReactNode } from 'react';

type ExternalLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  title?: string;
};

/** Outbound link to an official / authoritative source. Always a real anchor, new tab, no referrer leak. */
export function ExternalLink({ href, children, className, title }: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? 'font-semibold text-[#7cbe4e] transition hover:text-[#a3d47e]'}
      title={title}
    >
      {children}
    </a>
  );
}
