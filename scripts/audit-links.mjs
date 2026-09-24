import fs from 'node:fs';
import path from 'node:path';

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (!entry.name.endsWith('.tsx')) continue;
    const text = fs.readFileSync(full, 'utf8');
    const hrefs = [];
    const re = /href=(?:"([^"]+)"|'([^']+)')/g;
    let m;
    while ((m = re.exec(text)) !== null) hrefs.push(m[1] ?? m[2]);
    // external http links
    const ext = [];
    const re2 = /https?:\/\/[^\s"'<>]+/g;
    let m2;
    while ((m2 = re2.exec(text)) !== null) ext.push(m2[0]);
    out.push({ file: full, meta: text.includes('export const metadata'), jsonld: text.includes('ld+json'), hrefs, ext });
  }
}

const out = [];
for (const root of ['app', 'components']) {
  if (fs.existsSync(root)) walk(root, out);
}
for (const row of out) {
  console.log('=== ' + row.file);
  console.log('  metadata:' + row.meta + ' jsonld:' + row.jsonld);
  console.log('  hrefs: ' + JSON.stringify(row.hrefs));
  const uniqExt = [...new Set(row.ext)].filter((u) => !u.includes('schema.org') && !u.includes('example.com') && !u.includes('nextjs.org'));
  if (uniqExt.length) console.log('  external: ' + JSON.stringify(uniqExt));
}
