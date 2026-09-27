import { DitherMethod } from '../types/bmp';

// Color distance using perceptual weighting (Reduces color banding in green/red channels)
export function colorDistanceSq(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number
): number {
  const rMean = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return (2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db;
}

// Find nearest color in palette
export function findNearestColorIndex(
  r: number, g: number, b: number,
  palette: [number, number, number][]
): number {
  let bestIdx = 0;
  let bestDist = Infinity;

  for (let i = 0; i < palette.length; i++) {
    const [pr, pg, pb] = palette[i];
    const dist = colorDistanceSq(r, g, b, pr, pg, pb);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }

  return bestIdx;
}

// Bayer 4x4 matrix normalized 0..1
const BAYER_4X4 = [
  [ 0/16,  8/16,  2/16, 10/16],
  [12/16,  4/16, 14/16,  6/16],
  [ 3/16, 11/16,  1/16,  9/16],
  [15/16,  7/16, 13/16,  5/16],
];

// Bayer 8x8 matrix normalized 0..1
const BAYER_8X8 = [
  [ 0/64, 32/64,  8/64, 40/64,  2/64, 34/64, 10/64, 42/64],
  [48/64, 16/64, 56/64, 24/64, 50/64, 18/64, 58/64, 26/64],
  [12/64, 44/64,  4/64, 36/64, 14/64, 46/64,  6/64, 38/64],
  [60/64, 28/64, 52/64, 20/64, 62/64, 30/64, 54/64, 22/64],
  [ 3/64, 35/64, 11/64, 43/64,  1/64, 33/64,  9/64, 41/64],
  [51/64, 19/64, 59/64, 27/64, 49/64, 17/64, 57/64, 25/64],
  [15/64, 47/64,  7/64, 39/64, 13/64, 45/64,  5/64, 37/64],
  [63/64, 31/64, 55/64, 23/64, 61/64, 29/64, 53/64, 21/64],
];

export interface DitherResult {
  indexed: number[][]; // [y][x]
  rgb: [number, number, number][][]; // [y][x]
}

export function quantizeAndDither(
  imageData: ImageData,
  palette: [number, number, number][],
  method: DitherMethod,
  strength: number, // 0 to 1
  serpentine: boolean,
  brightness: number = 0, // -100 to 100
  contrast: number = 0,   // -100 to 100
  invert: boolean = false
): DitherResult {
  const width = imageData.width;
  const height = imageData.height;

  // Working float buffer [y][x][r, g, b]
  const buffer: Float32Array[] = [];
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let y = 0; y < height; y++) {
    const row = new Float32Array(width * 3);
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      let r = imageData.data[idx];
      let g = imageData.data[idx + 1];
      let b = imageData.data[idx + 2];

      // Invert
      if (invert) {
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;
      }

      // Brightness (-100 to 100)
      if (brightness !== 0) {
        r = Math.min(255, Math.max(0, r + brightness * 2.55));
        g = Math.min(255, Math.max(0, g + brightness * 2.55));
        b = Math.min(255, Math.max(0, b + brightness * 2.55));
      }

      // Contrast (-100 to 100)
      if (contrast !== 0) {
        r = Math.min(255, Math.max(0, contrastFactor * (r - 128) + 128));
        g = Math.min(255, Math.max(0, contrastFactor * (g - 128) + 128));
        b = Math.min(255, Math.max(0, contrastFactor * (b - 128) + 128));
      }

      row[x * 3] = r;
      row[x * 3 + 1] = g;
      row[x * 3 + 2] = b;
    }
    buffer.push(row);
  }

  const indexed: number[][] = Array.from({ length: height }, () => new Array(width).fill(0));
  const rgb: [number, number, number][][] = Array.from({ length: height }, () => new Array(width));

  // Ordered dithering check
  const isBayer4 = method === 'bayer-4x4';
  const isBayer8 = method === 'bayer-8x8';

  if (isBayer4 || isBayer8) {
    const bayer = isBayer4 ? BAYER_4X4 : BAYER_8X8;
    const bSize = isBayer4 ? 4 : 8;
    const spread = 48 * strength; // dithering spread range

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const threshold = (bayer[y % bSize][x % bSize] - 0.5) * spread;
        const curR = Math.min(255, Math.max(0, buffer[y][x * 3] + threshold));
        const curG = Math.min(255, Math.max(0, buffer[y][x * 3 + 1] + threshold));
        const curB = Math.min(255, Math.max(0, buffer[y][x * 3 + 2] + threshold));

        const colorIdx = findNearestColorIndex(curR, curG, curB, palette);
        indexed[y][x] = colorIdx;
        rgb[y][x] = palette[colorIdx];
      }
    }

    return { indexed, rgb };
  }

  // Error diffusion loop
  for (let y = 0; y < height; y++) {
    const isReverse = serpentine && y % 2 === 1;
    const startX = isReverse ? width - 1 : 0;
    const endX = isReverse ? -1 : width;
    const stepX = isReverse ? -1 : 1;

    for (let x = startX; x !== endX; x += stepX) {
      const curR = Math.min(255, Math.max(0, buffer[y][x * 3]));
      const curG = Math.min(255, Math.max(0, buffer[y][x * 3 + 1]));
      const curB = Math.min(255, Math.max(0, buffer[y][x * 3 + 2]));

      const colorIdx = findNearestColorIndex(curR, curG, curB, palette);
      const [matchR, matchG, matchB] = palette[colorIdx];

      indexed[y][x] = colorIdx;
      rgb[y][x] = [matchR, matchG, matchB];

      if (method === 'none' || strength <= 0) continue;

      const errR = (curR - matchR) * strength;
      const errG = (curG - matchG) * strength;
      const errB = (curB - matchB) * strength;

      const distribute = (dx: number, dy: number, factor: number) => {
        const targetX = x + dx;
        const targetY = y + dy;
        if (targetX >= 0 && targetX < width && targetY >= 0 && targetY < height) {
          buffer[targetY][targetX * 3] += errR * factor;
          buffer[targetY][targetX * 3 + 1] += errG * factor;
          buffer[targetY][targetX * 3 + 2] += errB * factor;
        }
      };

      const dir = isReverse ? -1 : 1;

      if (method === 'floyd-steinberg') {
        distribute(dir * 1, 0, 7 / 16);
        distribute(-dir * 1, 1, 3 / 16);
        distribute(0, 1, 5 / 16);
        distribute(dir * 1, 1, 1 / 16);
      } else if (method === 'atkinson') {
        // Atkinson diffuses 1/8 to 6 neighbors (retains 2/8 of error, producing iconic retro contrast)
        distribute(dir * 1, 0, 1 / 8);
        distribute(dir * 2, 0, 1 / 8);
        distribute(-dir * 1, 1, 1 / 8);
        distribute(0, 1, 1 / 8);
        distribute(dir * 1, 1, 1 / 8);
        distribute(0, 2, 1 / 8);
      } else if (method === 'sierra-lite') {
        distribute(dir * 1, 0, 2 / 4);
        distribute(-dir * 1, 1, 1 / 4);
        distribute(0, 1, 1 / 4);
      }
    }
  }

  return { indexed, rgb };
}
