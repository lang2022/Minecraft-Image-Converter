/**
 * Generates public/og-default.png (1200x630) without any image library:
 * the pixel heart is blitted from a sprite map and the text is rendered with
 * a hand-rolled 5x7 bitmap font. Zero dependencies, deterministic output.
 *
 * Run: node scripts/generate-og-image.mjs
 */
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';

const W = 1200;
const H = 630;

// ---------- minimal PNG encoder ----------
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc(height * (1 + stride));
  for (let y = 0; y < height; y += 1) {
    raw[y * (1 + stride)] = 0;
    rgba.copy(raw, y * (1 + stride) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- canvas ----------
const px = Buffer.alloc(W * H * 4);

function setPixel(x, y, [r, g, b]) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const o = (y * W + x) * 4;
  px[o] = r;
  px[o + 1] = g;
  px[o + 2] = b;
  px[o + 3] = 255;
}

function hex(h) {
  const v = Number.parseInt(h.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function fillRect(x, y, w, h, color) {
  for (let dy = 0; dy < h; dy += 1) {
    for (let dx = 0; dx < w; dx += 1) setPixel(x + dx, y + dy, color);
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Background: same three-stop gradient as the site.
function drawBackground() {
  const top = hex('#101210');
  const mid = hex('#141511');
  const bottom = hex('#0e100e');
  for (let y = 0; y < H; y += 1) {
    const t = y / H;
    const c = t < 0.45
      ? top.map((v, i) => lerp(v, mid[i], t / 0.45))
      : mid.map((v, i) => lerp(v, bottom[i], (t - 0.45) / 0.55));
    for (let x = 0; x < W; x += 1) setPixel(x, y, c);
  }
  // Emerald glow top-right, blue glow left — echoes the page background.
  const glow = (cx, cy, radius, color, strength) => {
    for (let y = Math.max(0, cy - radius); y < Math.min(H, cy + radius); y += 1) {
      for (let x = Math.max(0, cx - radius); x < Math.min(W, cx + radius); x += 1) {
        const d = Math.hypot(x - cx, y - cy) / radius;
        if (d >= 1) continue;
        const o = (y * W + x) * 4;
        const k = (1 - d) ** 2 * strength;
        px[o] = lerp(px[o], color[0], k);
        px[o + 1] = lerp(px[o + 1], color[1], k);
        px[o + 2] = lerp(px[o + 2], color[2], k);
      }
    }
  };
  glow(1020, 0, 520, hex('#57a82a'), 0.16);
  glow(60, 120, 460, hex('#2c4419'), 0.12);
}

// ---------- pixel heart sprite ----------
const HEART = [
  '..oo..oo..',
  '.orrorrro.',
  'orrrrrrrro',
  'orrrrrrrro',
  'orrrrrrrro',
  '.orrrrrro.',
  '..orrrro..',
  '...orro...',
  '....oo....',
];

function drawHeart(x0, y0, scale) {
  const colors = { o: hex('#1c1f1c'), r: hex('#ef4444') };
  HEART.forEach((row, y) => {
    [...row].forEach((char, x) => {
      const color = colors[char];
      if (color) fillRect(x0 + x * scale, y0 + y * scale, scale, scale, color);
    });
  });
}

// ---------- 5x7 bitmap font (A-Z, 0-9, basics) ----------
const FONT = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10011', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  '·': ['00000', '00000', '00000', '00100', '00000', '00000', '00000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '00000', '00100'],
};

function drawText(text, x0, y0, scale, color, letterSpacing = 1) {
  let cursor = x0;
  for (const char of text.toUpperCase()) {
    const glyph = FONT[char];
    if (!glyph) {
      cursor += 3 * scale + letterSpacing * scale;
      continue;
    }
    glyph.forEach((row, gy) => {
      [...row].forEach((bit, gx) => {
        if (bit === '1') fillRect(cursor + gx * scale, y0 + gy * scale, scale, scale, color);
      });
    });
    cursor += 5 * scale + letterSpacing * scale;
  }
  return cursor;
}

function textWidth(text, scale, letterSpacing = 1) {
  return text.length * (5 + letterSpacing) * scale - letterSpacing * scale;
}

// ---------- compose ----------
drawBackground();

drawText('FREE · IN YOUR BROWSER', 72, 96, 4, hex('#7cbe4e'));
drawText('MINECRAFT', 72, 170, 14, hex('#f8fafc'));
drawText('IMAGE CONVERTER', 72, 290, 14, hex('#57a82a'));
drawText('PIXEL ART / SCHEMATICS / MAP ART / AVATARS', 72, 440, 4, hex('#9aa39a'));
drawText('NO UPLOAD · 101 BLOCKS · SCHEM · LITEMATIC · MCSTRUCTURE', 72, 505, 3, hex('#6b726b'));

// Heart panel, right side.
const panelX = 810;
const panelY = 165;
const pad = 28;
fillRect(panelX - pad, panelY - pad, 10 * 26 + pad * 2, 9 * 26 + pad * 2, hex('#0c0e0c'));
fillRect(panelX - pad + 2, panelY - pad + 2, 10 * 26 + pad * 2 - 4, 9 * 26 + pad * 2 - 4, hex('#101210'));
drawHeart(panelX, panelY, 26);

const outPath = path.join('public', 'og-default.png');
fs.writeFileSync(outPath, encodePng(W, H, px));
console.log(`wrote ${outPath} (${W}x${H})`);