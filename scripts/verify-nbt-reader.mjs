import { execSync } from 'node:child_process';

/**
 * Round-trip sanity check: our own NBT reader must decode what our writers
 * produce, for all three formats, before the browser viewer trusts it.
 */

execSync('npx tsc --project tsconfig.verify.json', { stdio: 'inherit' });

const { exportLitematic, exportSchem, exportMcstructure } = await import('../out-test/lib/export/index.js');
const { parseSchematicFile } = await import('../out-test/lib/schematic-view.js');

const width = 8;
const height = 6;
const blockIds = [];
for (let row = 0; row < height; row += 1) {
  for (let x = 0; x < width; x += 1) {
    const quadrant = (row < height / 2 ? 0 : 2) + (x < width / 2 ? 0 : 1);
    blockIds.push(
      ['minecraft:orange_concrete', 'minecraft:emerald_block', 'minecraft:purple_concrete', 'minecraft:gold_block'][
        quadrant
      ],
    );
  }
}

let failures = 0;
function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures += 1;
    console.error(`  FAIL ${name}${detail ? ` ${detail}` : ''}`);
  }
}

function verifyFormat(fileName, bytes) {
  console.log(`\n[${fileName}]`);
  const parsed = parseSchematicFile(fileName, bytes);
  check('dimensions match', parsed.width === width && parsed.height === height && parsed.depth === 1, `${parsed.width}x${parsed.height}x${parsed.depth}`);
  check('palette has 4 blocks', parsed.paletteUsed.length === 4, parsed.paletteUsed.join(','));
  let mismatches = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      // Reader returns world order (y = 0 is the bottom layer); the writer
      // flips image rows so image row 0 lands at the top. Compare accordingly.
      const parsedId = parsed.blockIds[(height - 1 - y) * width + x];
      if (parsedId !== blockIds[y * width + x]) mismatches += 1;
    }
  }
  check('all cells round-trip', mismatches === 0, `${mismatches} mismatches`);
}

verifyFormat('test.litematic', exportLitematic({ width, height, blockIds }, { name: 'rt' }));
verifyFormat('test.schem', exportSchem({ width, height, blockIds }, { name: 'rt' }));
verifyFormat('test.mcstructure', exportMcstructure({ width, height, blockIds }));

console.log(failures === 0 ? '\nNBT reader round-trip passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
