export type BmpDepth = 1 | 4 | 8 | 24;

export type DitherMethod =
  | 'none'
  | 'floyd-steinberg'
  | 'atkinson'
  | 'bayer-4x4'
  | 'bayer-8x8'
  | 'sierra-lite';

export type ResolutionPreset =
  | '320x200'  // Mode 13h (SCREEN 13) / Mode 7 (SCREEN 7)
  | '640x480'  // Mode 12h (SCREEN 12) / Mode 11 (SCREEN 11)
  | '640x350'  // Mode 9 (SCREEN 9 - EGA)
  | '320x240'  // Mode X
  | '160x100'  // CGA 160x100 16-color tweaked
  | 'native'   // Keep input image dimensions
  | 'custom';  // Custom width and height

export type PalettePresetId =
  // 1-bit
  | 'bw'
  | 'green_phosphor'
  | 'amber'
  | 'cyber_blue'
  // 4-bit
  | 'ibm_pc_16'
  | 'windows_16'
  | 'c64_16'
  | 'cga_mode1'
  // 8-bit
  | 'vga_256'
  | 'adaptive_256'
  | 'grayscale_256'
  | 'websafe_216';

export interface RGBQuad {
  rgbBlue: number;
  rgbGreen: number;
  rgbRed: number;
  rgbReserved: number;
}

export interface BitmapFileHeader {
  bfType: string;       // "BM" (0x4D42)
  bfSize: number;       // Total size of BMP in bytes
  bfReserved1: number;  // 0
  bfReserved2: number;  // 0
  bfOffBits: number;    // Offset to start of pixel data
}

export interface BitmapInfoHeader {
  biSize: number;          // 40 bytes
  biWidth: number;         // Width in pixels
  biHeight: number;        // Height in pixels
  biPlanes: number;        // 1
  biBitCount: BmpDepth;    // 1, 4, 8, 24
  biCompression: number;   // 0 (BI_RGB)
  biSizeImage: number;     // Raw image data size (including row padding)
  biXPelsPerMeter: number; // e.g. 2835 (72 DPI)
  biYPelsPerMeter: number; // e.g. 2835
  biClrUsed: number;       // Number of colors in palette (0 for 24-bit, 2, 16, 256)
  biClrImportant: number;  // 0
}

export interface ProcessedBmpData {
  buffer: ArrayBuffer;
  uint8Array: Uint8Array;
  fileHeader: BitmapFileHeader;
  infoHeader: BitmapInfoHeader;
  palette: RGBQuad[];
  rowSize: number;
  paddingBytesPerRow: number;
  width: number;
  height: number;
  depth: BmpDepth;
  previewDataUrl: string;
  indexedPixelGrid: number[][]; // [y][x] = palette index (for 1, 4, 8-bit)
  rgbPixelGrid: [number, number, number][][]; // [y][x] = [r, g, b]
}

export interface ImageProcessingOptions {
  depth: BmpDepth;
  width: number;
  height: number;
  maintainAspectRatio: boolean;
  ditherMethod: DitherMethod;
  ditherStrength: number; // 0 to 1
  serpentine: boolean;
  paletteId: PalettePresetId;
  brightness: number; // -100 to 100
  contrast: number;   // -100 to 100
  invert: boolean;
}
