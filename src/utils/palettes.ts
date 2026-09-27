import { PalettePresetId, RGBQuad } from '../types/bmp';

export interface PaletteDef {
  id: PalettePresetId;
  name: string;
  depth: 1 | 4 | 8;
  description: string;
  colors: [number, number, number][]; // [R, G, B] 0..255
}

// 1-Bit Palettes
export const PALETTE_BW: [number, number, number][] = [
  [0, 0, 0],       // 0: Black
  [255, 255, 255], // 1: White
];

export const PALETTE_GREEN_PHOSPHOR: [number, number, number][] = [
  [4, 18, 4],     // 0: Dark phosphor
  [48, 240, 64],  // 1: Bright green phosphor (IBM 5151)
];

export const PALETTE_AMBER: [number, number, number][] = [
  [16, 8, 0],     // 0: Dark amber
  [255, 176, 0],  // 1: Amber monochrome
];

export const PALETTE_CYBER_BLUE: [number, number, number][] = [
  [6, 12, 28],    // 0: Deep navy
  [80, 210, 255], // 1: Cyan blue
];

// 4-Bit Palettes
// The canonical 16-color IBM PC / EGA / VGA DAC palette used in QBasic COLOR 0..15
export const PALETTE_IBM_PC_16: [number, number, number][] = [
  [0, 0, 0],       // 0:  Black
  [0, 0, 170],     // 1:  Blue
  [0, 170, 0],     // 2:  Green
  [0, 170, 170],   // 3:  Cyan
  [170, 0, 0],     // 4:  Red
  [170, 0, 170],   // 5:  Magenta
  [170, 85, 0],    // 6:  Brown
  [170, 170, 170], // 7:  White / Light Gray
  [85, 85, 85],    // 8:  Dark Gray
  [85, 85, 255],   // 9:  Light Blue
  [85, 255, 85],   // 10: Light Green
  [85, 255, 255],  // 11: Light Cyan
  [255, 85, 85],   // 12: Light Red
  [255, 85, 255],  // 13: Light Magenta
  [255, 255, 85],  // 14: Yellow
  [255, 255, 255], // 15: Bright White
];

export const PALETTE_WINDOWS_16: [number, number, number][] = [
  [0, 0, 0],       // Black
  [128, 0, 0],     // Maroon
  [0, 128, 0],     // Green
  [128, 128, 0],   // Olive
  [0, 0, 128],     // Navy
  [128, 0, 128],   // Purple
  [0, 128, 128],   // Teal
  [192, 192, 192], // Silver
  [128, 128, 128], // Gray
  [255, 0, 0],     // Red
  [0, 255, 0],     // Lime
  [255, 255, 0],   // Yellow
  [0, 0, 255],     // Blue
  [255, 0, 255],   // Fuchsia
  [0, 255, 255],   // Aqua
  [255, 255, 255], // White
];

export const PALETTE_C64_16: [number, number, number][] = [
  [0, 0, 0],       // Black
  [255, 255, 255], // White
  [136, 0, 0],     // Red
  [170, 255, 238], // Cyan
  [204, 68, 204],  // Violet
  [0, 204, 85],    // Green
  [0, 0, 170],     // Blue
  [238, 238, 119], // Yellow
  [221, 136, 85],  // Orange
  [102, 68, 0],    // Brown
  [255, 119, 119], // Light Red
  [51, 51, 51],    // Dark Grey
  [119, 119, 119], // Grey
  [170, 255, 102], // Light Green
  [0, 136, 255],   // Light Blue
  [187, 187, 187], // Light Grey
];

export const PALETTE_CGA_MODE1: [number, number, number][] = [
  [0, 0, 0],       // 0: Black
  [85, 255, 255],  // 1: Cyan
  [255, 85, 255],  // 2: Magenta
  [255, 255, 255], // 3: White
  // Padded to 16 with zeros
  ...Array(12).fill([0, 0, 0]),
];

// 8-Bit VGA Mode 13h Default Palette
export function generateVga256Palette(): [number, number, number][] {
  const palette: [number, number, number][] = [];

  // 0-15: Standard 16 colors
  for (let i = 0; i < 16; i++) {
    palette.push(PALETTE_IBM_PC_16[i]);
  }

  // 16-31: 16 shades of gray
  for (let i = 0; i < 16; i++) {
    const val = Math.round((i / 15) * 255);
    palette.push([val, val, val]);
  }

  // 32-247: 216 color ramp (6x6x6 or VGA standard hue/saturation wheel)
  // VGA DAC uses 24 hue steps with 3 saturation & 3 brightness variants
  const hueAngles = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345];
  for (let sat = 1; sat >= 0.35; sat -= 0.325) {
    for (let lum = 0.25; lum <= 0.85; lum += 0.2) {
      for (let h = 0; h < hueAngles.length && palette.length < 248; h++) {
        const [r, g, b] = hslToRgb(hueAngles[h], sat, lum);
        palette.push([r, g, b]);
      }
    }
  }

  // Fill remaining up to 256
  while (palette.length < 256) {
    const idx = palette.length - 248;
    const v = Math.round((idx / 8) * 128);
    palette.push([v, v, v]);
  }

  return palette.slice(0, 256);
}

// 8-Bit Grayscale 256
export function generateGrayscale256Palette(): [number, number, number][] {
  const palette: [number, number, number][] = [];
  for (let i = 0; i < 256; i++) {
    palette.push([i, i, i]);
  }
  return palette;
}

// 8-Bit Web-safe 216
export function generateWebSafe216Palette(): [number, number, number][] {
  const palette: [number, number, number][] = [];
  const steps = [0, 51, 102, 153, 204, 255];
  for (const r of steps) {
    for (const g of steps) {
      for (const b of steps) {
        palette.push([r, g, b]);
      }
    }
  }
  while (palette.length < 256) {
    palette.push([0, 0, 0]);
  }
  return palette.slice(0, 256);
}

// HSL to RGB helper
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = (h % 360) / 360;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color);
  };
  return [f(0), f(8), f(4)];
}

// Median Cut Color Quantization to create an optimal custom 256-color palette from an image
export function generateAdaptive256Palette(
  imageData: ImageData,
  maxColors: number = 256
): [number, number, number][] {
  const pixels: [number, number, number][] = [];
  const data = imageData.data;
  const step = Math.max(1, Math.floor(data.length / (4 * 10000))); // sample up to 10k pixels for speed

  for (let i = 0; i < data.length; i += 4 * step) {
    const a = data[i + 3];
    if (a > 32) {
      pixels.push([data[i], data[i + 1], data[i + 2]]);
    }
  }

  if (pixels.length === 0) {
    return generateVga256Palette();
  }

  interface ColorBox {
    colors: [number, number, number][];
  }

  let boxes: ColorBox[] = [{ colors: pixels }];

  while (boxes.length < maxColors) {
    // Find box with greatest channel variance
    let bestBoxIndex = -1;
    let maxRange = -1;
    let splitChannel = 0;

    for (let b = 0; b < boxes.length; b++) {
      const box = boxes[b];
      if (box.colors.length <= 1) continue;

      let minR = 255, maxR = 0;
      let minG = 255, maxG = 0;
      let minB = 255, maxB = 0;

      for (const [r, g, bVal] of box.colors) {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (g < minG) minG = g;
        if (g > maxG) maxG = g;
        if (bVal < minB) minB = bVal;
        if (bVal > maxB) maxB = bVal;
      }

      const rRange = maxR - minR;
      const gRange = maxG - minG;
      const bRange = maxB - minB;
      const largestRange = Math.max(rRange, gRange, bRange);

      if (largestRange > maxRange) {
        maxRange = largestRange;
        bestBoxIndex = b;
        splitChannel = rRange >= gRange && rRange >= bRange ? 0 : gRange >= bRange ? 1 : 2;
      }
    }

    if (bestBoxIndex === -1 || maxRange <= 0) break;

    const targetBox = boxes.splice(bestBoxIndex, 1)[0];
    targetBox.colors.sort((a, b) => a[splitChannel] - b[splitChannel]);
    const mid = Math.floor(targetBox.colors.length / 2);

    boxes.push({ colors: targetBox.colors.slice(0, mid) });
    boxes.push({ colors: targetBox.colors.slice(mid) });
  }

  const palette: [number, number, number][] = [];
  for (const box of boxes) {
    if (box.colors.length === 0) continue;
    let sumR = 0, sumG = 0, sumB = 0;
    for (const [r, g, b] of box.colors) {
      sumR += r;
      sumG += g;
      sumB += b;
    }
    const len = box.colors.length;
    palette.push([
      Math.round(sumR / len),
      Math.round(sumG / len),
      Math.round(sumB / len),
    ]);
  }

  // Ensure 256 entries
  while (palette.length < maxColors) {
    palette.push([0, 0, 0]);
  }

  return palette.slice(0, maxColors);
}

// Convert RGB [0..255] to RGBQUAD structure
export function colorsToRGBQuad(colors: [number, number, number][]): RGBQuad[] {
  return colors.map(([r, g, b]) => ({
    rgbBlue: b,
    rgbGreen: g,
    rgbRed: r,
    rgbReserved: 0,
  }));
}

// Convert 8-bit RGB [0..255] to QBasic VGA DAC 6-bit registers [0..63]
export function rgbToVgaDac(r: number, g: number, b: number): [number, number, number] {
  return [
    Math.min(63, Math.floor(r / 4)),
    Math.min(63, Math.floor(g / 4)),
    Math.min(63, Math.floor(b / 4)),
  ];
}
