import fs from 'node:fs';
import path from 'node:path';

// List every line containing non-ASCII characters so nothing corrupted can
// hide. Scanned with Node (UTF-8 safe) — never PowerShell.
const roots = ['app', 'components', 'lib', 'scripts'];
const skip = new Set(['fix-mojibake.mjs', 'fix-mojibake-2.mjs', 'scan-nonascii.mjs']);
const findings = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(tsx?|mjs|css|json)$/.test(entry.name) || skip.has(entry.name)) continue;
    const lines = fs.readFileSync(full, 'utf8').split('\n');
    lines.forEach((line, index) => {
      // eslint-disable-next-line no-control-regex
      const matches = line.match(/[^\x00-\x7F]+/g);
      if (matches) findings.push(`${full}:${index + 1}: ${matches.join(' ')} | ${line.trim().slice(0, 90)}`);
    });
  }
}

for (const root of roots) {
  if (fs.existsSync(root)) walk(root);
}
console.log(findings.length ? findings.join('\n') : 'No non-ASCII characters found.');
