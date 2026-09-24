export type AvatarMode = 'isometric' | 'face';

export type SkinRegions = {
  top: number;
  right: number;
  front: number;
  hatTop: number;
  hatRight: number;
  hatFront: number;
};

/**
 * Head UV regions for a skin file. Vanilla skins are 64x64 (modern, with
 * overlay layers) or 64x32 (legacy); HD skins scale all regions linearly,
 * so every coordinate is expressed in units of skinWidth / 64.
 */
export function skinHeadRegions(skinWidth: number): SkinRegions {
  const r = skinWidth / 64;
  return {
    top: 8 * r,
    right: 0,
    front: 8 * r,
    hatTop: 40 * r,
    hatRight: 32 * r,
    hatFront: 40 * r,
  };
}

export function isSupportedSkinSize(width: number, height: number): boolean {
  const validWidths = [64, 128, 256, 512, 1024];
  if (!validWidths.includes(width)) return false;
  return height === width || height === width / 2;
}

const REGION_SIZE_BASE = 8;

function drawRegion(
  ctx: CanvasRenderingContext2D,
  skin: HTMLImageElement | HTMLCanvasElement,
  sx: number,
  sy: number,
  regionScale: number,
  transform: [number, number, number, number, number, number],
) {
  ctx.save();
  ctx.transform(...transform);
  const size = REGION_SIZE_BASE * regionScale;
  ctx.drawImage(skin, sx, sy, size, size, 0, 0, REGION_SIZE_BASE, REGION_SIZE_BASE);
  ctx.restore();
}

/**
 * Renders the head from a skin file onto a canvas.
 *
 * Isometric mode composites top + front (left panel) + right side into the
 * classic 2:1 dimetric head; "face" mode is the flat front view. The hat
 * overlay layer is composited on top when enabled. Output is transparent.
 */
export function drawAvatar(
  canvas: HTMLCanvasElement,
  skin: HTMLImageElement,
  options: { mode: AvatarMode; size: number; hat: boolean },
) {
  const { mode, size, hat } = options;
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, size, size);

  const regions = skinHeadRegions(skin.width);
  const r = skin.width / 64;

  if (mode === 'face') {
    // Flat front face, scaled with nearest-neighbor.
    const faceSize = 8 * r;
    ctx.drawImage(skin, regions.front, regions.front, faceSize, faceSize, 0, 0, size, size);
    if (hat) {
      ctx.drawImage(skin, regions.hatFront, regions.front, faceSize, faceSize, 0, 0, size, size);
    }
    return;
  }

  // Isometric head: the cube fits exactly into a 16x16 texel frame.
  const k = size / 16;
  ctx.setTransform(k, 0, 0, k, 0, 0);

  const transforms: Record<'top' | 'left' | 'right', [number, number, number, number, number, number]> = {
    // [a, b, c, d, e, f] in texel space; verified against the standard 2:1
    // dimetric projection with the face on the left panel.
    top: [-1, -0.5, -1, 0.5, 16, 4],
    left: [-1, -0.5, 0, 1, 8, 8],
    right: [-1, 0.5, 0, 1, 16, 4],
  };

  // Base head faces.
  drawRegion(ctx, skin, regions.top, regions.top, r, transforms.top);
  drawRegion(ctx, skin, regions.front, regions.front, r, transforms.left);
  drawRegion(ctx, skin, regions.right, regions.front, r, transforms.right);

  // Hat overlay uses the same faces offset +32 texels in the source.
  if (hat) {
    drawRegion(ctx, skin, regions.hatTop, regions.top, r, transforms.top);
    drawRegion(ctx, skin, regions.hatFront, regions.front, r, transforms.left);
    drawRegion(ctx, skin, regions.hatRight, regions.front, r, transforms.right);
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
}