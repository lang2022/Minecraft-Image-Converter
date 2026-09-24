import fs from 'node:fs';

// The corrupted "…" instances were originally em dashes separating two
// independent clauses (or a bullet marker in list items). Repair each with
// full context so no legitimate usage is touched. List-marker bullets in the
// palette-atlas page become plain sentences with capitalized words.
const fixes = {
  'app/avatar-generator/AvatarWorkspace.tsx': [
    ['avatar …rendered locally', 'avatar — rendered locally'],
    ['HD skins (128…024)', 'HD skins (128–1024)'],
  ],
  'app/faq/page.tsx': [
    ["'Yes …the online 3D viewer", "'Yes — the online 3D viewer"],
    ["title: 'FAQ …Minecraft", "title: 'FAQ — Minecraft"],
    ['Try the tool …most answers', 'Try the tool — most answers'],
  ],
  'app/palette-atlas/page.tsx': [
    ['one block entry …with the', 'one block entry — with the'],
    ['<li>…The atlas layout', '<li>The atlas layout'],
    ['<li>…The manifest also', '<li>The manifest also'],
    ['only references block IDs …the atlas', 'only references block IDs — the atlas'],
    ['<li>…Biome-tinted blocks', '<li>Biome-tinted blocks'],
    ['exact textures …what you see', 'exact textures — what you see'],
  ],
  'app/guides/page.tsx': [
    ['murals …which grid size', 'murals — which grid size'],
    ['browser …no mods', 'browser — no mods'],
    ['full workflow …from a source', 'full workflow — from a source'],
    ['try the tool …upload an image', 'try the tool — upload an image'],
  ],
  'app/guides/how-to-make-minecraft-pixel-art/page.tsx': [
    ['deliberately …e.g. swap', 'deliberately (e.g. swap'],
    ['to keep a build coherent.', 'to keep a build coherent).'],
    ['under a minute …no upload', 'under a minute — no upload'],
  ],
  'app/guides/minecraft-map-art-guide/page.tsx': [
    ['one map pixel …which means', 'one map pixel — which means'],
    ['high-contrast families …wool, concrete, terracotta …and use', 'high-contrast families (wool, concrete, terracotta) and use'],
  ],
};

let changed = 0;
for (const [file, pairs] of Object.entries(fixes)) {
  let text = fs.readFileSync(file, 'utf8');
  const before = text;
  for (const [bad, good] of pairs) {
    text = text.split(bad).join(good);
  }
  if (text !== before) {
    fs.writeFileSync(file, text, 'utf8');
    changed += 1;
    console.log(`repaired ${file}`);
  }
}
console.log(`done, ${changed} file(s) changed`);
