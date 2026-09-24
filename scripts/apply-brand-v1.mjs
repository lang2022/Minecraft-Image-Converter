import fs from 'node:fs';
import path from 'node:path';

// Spec v1 global pass: converge every green to the single brand system.
// --brand  #57a82a  primary surfaces (buttons, active states)
// --link   #7cbe4e  text links on dark
// --link-hover #a3d47e
// tints -> #141d0e bg / #2c4419 border / #1a2612 hover

const reps = [
  ['#57a82a', '#57a82a'],
  ['#7cbe4e', '#7cbe4e'],
  ['#a3d47e', '#a3d47e'],
  ['#141d0e', '#141d0e'],
  ['#1a2612', '#1a2612'],
  ['#2c4419', '#2c4419'],
  // SVG logo ramp -> grass-block ramp
  ['#4a9423', '#4a9423'],
  ['#3a761b', '#3a761b'],
];

const roots = ['app', 'components', 'lib', 'worker', 'scripts'];
let files = 0;
for (const root of roots) {
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(tsx|ts|mjs|css|svg)$/.test(full)) continue;
      if (full.includes('node_modules')) continue;
      let t = fs.readFileSync(full, 'utf8');
      const before = t;
      for (const [a, b] of reps) t = t.split(a).join(b);
      if (t !== before) {
        fs.writeFileSync(full, t);
        files += 1;
      }
    }
  };
  if (fs.existsSync(root)) walk(root);
}
console.log(`recolored ${files} files`);
