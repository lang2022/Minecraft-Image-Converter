export type LabColor = [number, number, number];

export function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function pivotRgb(value: number) {
  const v = value / 255;
  return v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92;
}

export function rgbToLab(r: number, g: number, b: number): LabColor {
  const rr = pivotRgb(r);
  const gg = pivotRgb(g);
  const bb = pivotRgb(b);

  const x = rr * 0.4124 + gg * 0.3576 + bb * 0.1805;
  const y = rr * 0.2126 + gg * 0.7152 + bb * 0.0722;
  const z = rr * 0.0193 + gg * 0.1192 + bb * 0.9505;

  const xn = 0.95047;
  const yn = 1;
  const zn = 1.08883;

  const fx = xyzPivot(x / xn);
  const fy = xyzPivot(y / yn);
  const fz = xyzPivot(z / zn);

  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function xyzPivot(value: number) {
  return value > 0.008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116;
}

export function ciede2000(lab1: LabColor, lab2: LabColor) {
  const [l1, a1, b1] = lab1;
  const [l2, a2, b2] = lab2;

  const avgLp = (l1 + l2) / 2;
  const c1 = Math.sqrt(a1 * a1 + b1 * b1);
  const c2 = Math.sqrt(a2 * a2 + b2 * b2);
  const avgC = (c1 + c2) / 2;

  const g = 0.5 * (1 - Math.sqrt((avgC ** 7) / (avgC ** 7 + 25 ** 7)));
  const a1p = (1 + g) * a1;
  const a2p = (1 + g) * a2;
  const c1p = Math.sqrt(a1p * a1p + b1 * b1);
  const c2p = Math.sqrt(a2p * a2p + b2 * b2);
  const avgCp = (c1p + c2p) / 2;

  const h1p = hueAngle(b1, a1p);
  const h2p = hueAngle(b2, a2p);

  const deltLp = l2 - l1;
  const deltCp = c2p - c1p;

  const deltHp =
    c1p * c2p === 0
      ? 0
      : 2 * Math.sqrt(c1p * c2p) * Math.sin(degToRad(angleDiff(h1p, h2p)) / 2);

  const avgHp =
    c1p * c2p === 0
      ? h1p + h2p
      : Math.abs(h1p - h2p) > 180
        ? (h1p + h2p + 360) / 2
        : (h1p + h2p) / 2;

  const t =
    1 -
    0.17 * Math.cos(degToRad(avgHp - 30)) +
    0.24 * Math.cos(degToRad(2 * avgHp)) +
    0.32 * Math.cos(degToRad(3 * avgHp + 6)) -
    0.2 * Math.cos(degToRad(4 * avgHp - 63));

  const deltaTheta = 30 * Math.exp(-(((avgHp - 275) / 25) ** 2));
  const rc = 2 * Math.sqrt((avgCp ** 7) / (avgCp ** 7 + 25 ** 7));
  const sl = 1 + (0.015 * ((avgLp - 50) ** 2)) / Math.sqrt(20 + ((avgLp - 50) ** 2));
  const sc = 1 + 0.045 * avgCp;
  const sh = 1 + 0.015 * avgCp * t;
  const rt = -Math.sin(degToRad(2 * deltaTheta)) * rc;

  return Math.sqrt(
    (deltLp / sl) ** 2 +
      (deltCp / sc) ** 2 +
      (deltHp / sh) ** 2 +
      rt * (deltCp / sc) * (deltHp / sh),
  );
}

function hueAngle(b: number, a: number) {
  if (a === 0 && b === 0) return 0;
  const angle = (Math.atan2(b, a) * 180) / Math.PI;
  return angle >= 0 ? angle : angle + 360;
}

function angleDiff(a: number, b: number) {
  const diff = Math.abs(a - b);
  return diff > 180 ? 360 - diff : diff;
}

function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}
