import fs from 'node:fs';

// Final mojibake sweep. These sequences were produced when PowerShell wrote
// UTF-8 files through the GBK codepage:
//   脳            -> ×
//   馃П etc.      -> 🧱
//   —揝 / —檚     -> 'S (the em dash + next char were one GBK pair)
//   …word        -> '. ' (ellipsis swallowed a real em dash separator)
// The legitimate characters we re-insert are plain ASCII-safe equivalents so
// this class of bug cannot resurface from a future encoding accident.
const files = [
  'app/avatar-generator/AvatarWorkspace.tsx',
  'app/faq/page.tsx',
  'app/palette-atlas/page.tsx',
  'app/guides/page.tsx',
  'app/guides/how-to-make-minecraft-pixel-art/page.tsx',
];

const replacements = [
  // faq: "Floyd—揝teinberg" -> "Floyd–Steinberg" (the dash was originally "-")
  ['Floyd—揝teinberg', 'Floyd-Steinberg'],
  // faq: "Mojang—檚" -> "Mojang's"
  ['Mojang—檚', "Mojang's"],
  // avatar placeholder emoji still corrupted in a different form
  ['馃—嶐煔€', '🧱'],
  ['馃', '🧱'],
  ['—嶐煔€', ''],
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
