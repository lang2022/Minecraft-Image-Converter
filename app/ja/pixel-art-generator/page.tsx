import type { Metadata } from 'next';
import { GeneratorWorkspace } from '../../pixel-art-generator/GeneratorWorkspace';
import { getSiteUrl } from '@/lib/site-url';

/* NEEDS-NATIVE-REVIEW: Japanese copy on this page is a first draft
   (machine-assisted). Have a native speaker review before treating /ja
   as production SEO: tone, keigo level, and terms (ドット絵 / 設計図 /
   ストラクチャーブロック). Search Console validation gate: top-20 for マイクラ ドット絵
   within 6–8 weeks, otherwise revisit. */

export const metadata: Metadata = {
  title: 'マイクラ ドット絵ジェネレーター｜画像から無料で設計図作成',
  description:
    'マイクラのドット絵を作れる無料ツール。画像を入れるだけでブロックの設計図に変換し、必要な素材・PNG・.schem／.litematic／.mcstructureで持ち出せます。登録不要。',
  alternates: {
    canonical: '/ja/pixel-art-generator',
    languages: {
      en: '/pixel-art-generator',
      ja: '/ja/pixel-art-generator',
    },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'マイクラ ドット絵ジェネレーター',
      url: `${getSiteUrl()}/ja/pixel-art-generator`,
      inLanguage: 'ja',
      description:
        '画像をマイクラのドット絵・ブロック設計図に無料で変換。必要な素材と.schem／.litematic／.mcstructureの出力に対応。',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'マイクラのドット絵は無料で作れますか？',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'はい、無料です。画像を入れてから設計図を持ち出すまで、全部ブラウザの中で処理されます。会員登録もいりません。',
          },
        },
        {
          '@type': 'Question',
          name: '出力した設計図（.schem）はどう使えばいいですか？',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'WorldEditを入れているなら、//schem loadで読み込んで//pasteで貼り付けるだけです。.litematicはLitematica、.mcstructureは統合版のストラクチャーブロックで使えます。',
          },
        },
        {
          '@type': 'Question',
          name: 'ブロックが何個いるか分かりますか？',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '変換するとブロックごとの個数が出るので、サバイバルで集める目安にしてください。持っていない系列（石材など）は設定で外せば、そのブロック抜きの設計図になります。',
          },
        },
      ],
    },
  ],
};

export default function JaPixelArtGeneratorPage() {
  return (
    <main lang="ja" className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 lg:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GeneratorWorkspace locale="ja" />
      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          ['写真から設計図まで1分', '画像を選んでサイズを決めるだけ。16×16のアイコンから128×128の大作までいけます。'],
          ['サバイバルでも安心の素材表示', 'ブロックごとの個数がひと目で分かるので、集める量の目安になります。'],
          ['WorldEditですぐ建てられる', '.schem・.litematic・.mcstructureの3形式対応。出す前に3Dビューアで見た目も確認できます。'],
        ].map(([title, body]) => (
          <article key={title} className="card p-5">
            <h2 className="text-lg font-semibold text-neutral-100">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-400">{body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
