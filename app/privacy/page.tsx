import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy policy for Minecraft Image Converter: files never leave your browser, recent conversions are stored only on your device, and no analytics or advertising runs today.',
};

const sections = [
  {
    title: 'The short version',
    body: [
      'Your images, skins and structure files are processed entirely inside your browser. They are never uploaded to our servers, stored, or seen by anyone but you.',
      'We run no analytics, show no advertising, and require no account. We never ask for personal information.',
    ],
  },
  {
    title: 'Files you process',
    body: [
      'Every conversion, render and parse on this site runs locally in your browser using JavaScript and Web Workers. When you drop in an image, a skin, or a .litematic file, the data stays in your device\'s memory.',
      'Closing the tab erases it. We cannot recover your files because we never receive them.',
    ],
  },
  {
    title: 'On-device history (localStorage)',
    body: [
      'The pixel art generator can remember your recent conversions so a page refresh does not lose your work. This history — file names, settings, block grids and material lists — is saved in your browser\'s local storage, on your device only.',
      'It is never transmitted anywhere. You can delete individual entries from the Recent panel, or clear it entirely by clearing your browser\'s site data.',
    ],
  },
  {
    title: 'Analytics',
    body: [
      'We currently run no analytics of any kind — no pageview tracking, no third-party beacons. If that ever changes, this policy will be updated first and the change will stay aggregate and anonymous.',
      'Blocking scripts or trackers in your browser or an extension changes nothing about how the site works.',
    ],
  },
  {
    title: 'Cookies and advertising',
    body: [
      'We currently display no advertising and set no cookies of our own. Third-party ad networks (such as Google AdSense) may be introduced in the future; if so, they may set cookies to measure and personalize advertising according to their own privacy policies, and this page will say so before it happens.',
    ],
  },
  {
    title: 'Children',
    body: [
      'The site is a general-audience utility and does not knowingly collect any personal information from any visitor, including children under 13.',
    ],
  },
  {
    title: 'Changes to this policy',
    body: [
      'If the policy changes materially, we will update this page and revise the "last updated" date below before the change takes effect.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10 lg:px-8">
      <header className="max-w-2xl">
        <span className="inline-flex rounded-full border border-[#2c4419] bg-[#57a82a]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[#7cbe4e]">
          Privacy
        </span>
        <h1 className="mt-4 text-4xl font-bold text-neutral-100 sm:text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-lg leading-7 text-neutral-400">
          Last updated: September 2026
        </p>
      </header>

      <section className="mt-10 space-y-4">
        {sections.map((section) => (
          <article key={section.title} className="card p-6">
            <h2 className="text-xl font-bold text-neutral-100">{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="mt-3 text-sm leading-6 text-neutral-400">
                {paragraph}
              </p>
            ))}
          </article>
        ))}
      </section>
    </main>
  );
}