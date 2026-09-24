import fs from 'node:fs';

// Repair the remaining GBK mojibake: "脳" is the corrupted rendering of "×",
// "馃П" / "馃—嶐煔€" are corrupted renders of the brick emoji. Legitimate
// typographic characters (— … · → © ▲ ⛏) are left untouched.
const files = [
  'app/avatar-generator/AvatarWorkspace.tsx',
  'app/pixel-art-generator/GeneratorWorkspace.tsx',
  'app/faq/page.tsx',
  'app/guides/best-size-for-minecraft-pixel-art/page.tsx',
  'app/guides/how-to-make-minecraft-pixel-art/page.tsx',
  'app/guides/minecraft-map-art-guide/page.tsx',
  'app/guides/page.tsx',
];

const replacements = [
  ['脳', '×'],
  ['馃П', '🧱'],
  ['馃—嶐煔€', '🧱'],
];

let changed = 0;
for (const file of files) {
  let text = fs.readFileSync(file, 'utf8');
  const before = text;
  for (const [bad, good] of replacements) {
    text = text.split(bad).join(good);
  }
  if (text !== before) {
    fs.writeFileSync(file, text, 'utf8');
    changed += 1;
    console.log(`repaired ${file}`);
  }
}
console.log(`done, ${changed} file(s) changed`);
