import type { Metadata } from 'next';
import Link from 'next/link';

const guides = [
  {
    title: 'How to Make Minecraft Pixel Art',
    description: 'The complete beginner-friendly workflow: pick an image, convert it, place the blocks, and finish your build.',
    href: '/guides/how-to-make-minecraft-pixel-art',
    time: '5 min read',
  },
  {
    title: 'Best Size for Minecraft Pixel Art',
    description: 'From 16×16 icons to 128×128 murals — which grid size fits your build, and how scale changes the result.',
    href: '/guides/best-size-for-minecraft-pixel-art',
    time: '4 min read',
  },
  {
    title: 'Minecraft Map Art Guide',
    description: 'How map art works, why 128×128 layouts map to in-game maps 1:1, and how to plan a multi-map billboard.',
    href: '/guides/minecraft-map-art-guide',
    time: '6 min read',
  },
  {
    title: 'Palette Atlas & Block Preview',
    description: 'Inspect the block atlas that powers the generator and see how the future texture-driven palette layer is structured.',
    href: '/palette-atlas',
    time: '3 min read',
  },
  {
    title: 'Online Litematic Viewer',
    description: 'Open .litematic, .schem and .mcstructure files in 3D right in the browser — no mods, no upload.',
    href: '/litematic-viewer',
    time: 'Tool',
  },
];

export const metadata: Metadata = {
  title: 'Minecraft Pixel Art Guides & Tutorials',
  description:
    'Step-by-step guides on converting images to Minecraft pixel art, choosing the best size, and building map art.',
};

export default function GuidesHubPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-10 lg:px-10">
      <header className="max-w-3xl">
        <span className="inline-flex rounded-full border border-[#2c4419] bg-[#57a82a]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[#7cbe4e]">
          Guides
        </span>
        <h1 className="mt-4 text-4xl font-bold text-neutral-100 sm:text-5xl">Minecraft Pixel Art Guides & Tutorials</h1>
        <p className="mt-4 text-lg leading-7 text-neutral-400">
          Learn the full workflow — from a source image to a finished block build in your world.
        </p>
      </header>

      <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {guides.map((guide) => (
          <Link
            key={guide.href}
            href={guide.href}
            className="group card p-6 transition hover:border-[#2c4419] hover:border-[#3a3f3a]"
          >
            <p className="eyebrow">{guide.time}</p>
            <h2 className="mt-3 text-xl font-bold text-neutral-100 group-hover:text-[#a3d47e]">{guide.title}</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-400">{guide.description}</p>
            <p className="mt-5 text-sm font-semibold text-[#7cbe4e]">Read guide →</p>
          </Link>
        ))}
      </section>

      <section className="mt-12 card p-6">
        <h2 className="text-lg font-bold text-neutral-100">Ready to convert?</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-400">
          Skip the theory and try the tool — upload an image and get a block design in seconds.
        </p>
        <Link
          href="/pixel-art-generator"
          className="mt-4 inline-block rounded-full bg-[#57a82a] px-6 py-3 text-sm font-semibold text-[#0c120d] transition hover:bg-[#7cbe4e]"
        >
          Open the generator
        </Link>
      </section>
    </main>
  );
}