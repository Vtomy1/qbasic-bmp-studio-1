import {
  BitmapFileHeader,
  BitmapInfoHeader,
  BmpDepth,
  ProcessedBmpData,
  RGBQuad,
} from '../types/bmp';
import { colorsToRGBQuad } from './palettes';

export function createBmpBinary(
  width: number,
  height: number,
  depth: BmpDepth,
  paletteColors: [number, number, number][],
  indexedPixels: number[][], // [y][x]
  rgbPixels: [number, number, number][][] // [y][x]
): ProcessedBmpData {
  // 1. Calculate dimensions and offsets
  const numColors = depth === 24 ? 0 : depth === 8 ? 256 : depth === 4 ? 16 : 2;
  const paletteSizeBytes = numColors * 4;
  const fileHeaderSize = 14;
  const infoHeaderSize = 40;
  const dataOffset = fileHeaderSize + infoHeaderSize + paletteSizeBytes;

  // Row size in bytes (padded to multiple of 4 bytes)
  // Formula: ((width * bitCount + 31) / 32) * 4
  const rowSize = Math.floor((width * depth + 31) / 32) * 4;

  // Unpadded row width in bytes
  let unpaddedRowBytes = 0;
  if (depth === 1) unpaddedRowBytes = Math.ceil(width / 8);
  else if (depth === 4) unpaddedRowBytes = Math.ceil(width / 2);
  else if (depth === 8) unpaddedRowBytes = width;
  else if (depth === 24) unpaddedRowBytes = width * 3;

  const paddingBytesPerRow = rowSize - unpaddedRowBytes;
  const rawImageSize = rowSize * height;
  const totalFileSize = dataOffset + rawImageSize;

  // 2. Build buffer
  const buffer = new ArrayBuffer(totalFileSize);
  const view = new DataView(buffer);
  const uint8Array = new Uint8Array(buffer);

  // BITMAPFILEHEADER (14 bytes)
  // bfType = "BM" (0x4D42) -> 'B' (0x42), 'M' (0x4D)
  view.setUint8(0, 0x42);
  view.setUint8(1, 0x4d);
  view.setUint32(2, totalFileSize, true);  // bfSize
  view.setUint16(6, 0, true);              // bfReserved1
  view.setUint16(8, 0, true);              // bfReserved2
  view.setUint32(10, dataOffset, true);    // bfOffBits

  const fileHeader: BitmapFileHeader = {
    bfType: 'BM',
    bfSize: totalFileSize,
    bfReserved1: 0,
    bfReserved2: 0,
    bfOffBits: dataOffset,
  };

  // BITMAPINFOHEADER (40 bytes)
  view.setUint32(14, infoHeaderSize, true); // biSize (40)
  view.setInt32(18, width, true);           // biWidth
  view.setInt32(22, height, true);          // biHeight (positive = bottom-up)
  view.setUint16(26, 1, true);              // biPlanes
  view.setUint16(28, depth, true);          // biBitCount
  view.setUint32(30, 0, true);              // biCompression (0 = BI_RGB)
  view.setUint32(34, rawImageSize, true);   // biSizeImage
  view.setInt32(38, 2835, true);            // biXPelsPerMeter (72 DPI)
  view.setInt32(42, 2835, true);            // biYPelsPerMeter (72 DPI)
  view.setUint32(46, numColors, true);      // biClrUsed
  view.setUint32(50, 0, true);              // biClrImportant

  const infoHeader: BitmapInfoHeader = {
    biSize: infoHeaderSize,
    biWidth: width,
    biHeight: height,
    biPlanes: 1,
    biBitCount: depth,
    biCompression: 0,
    biSizeImage: rawImageSize,
    biXPelsPerMeter: 2835,
    biYPelsPerMeter: 2835,
    biClrUsed: numColors,
    biClrImportant: 0,
  };

  // 3. Write Palette (RGBQUAD entries: Blue, Green, Red, Reserved)
  let palette: RGBQuad[] = [];
  if (depth !== 24) {
    palette = colorsToRGBQuad(paletteColors.slice(0, numColors));
    let palOffset = 54;
    for (let i = 0; i < numColors; i++) {
      const q = palette[i] || { rgbBlue: 0, rgbGreen: 0, rgbRed: 0, rgbReserved: 0 };
      view.setUint8(palOffset++, q.rgbBlue);
      view.setUint8(palOffset++, q.rgbGreen);
      view.setUint8(palOffset++, q.rgbRed);
      view.setUint8(palOffset++, 0);
    }
  }

  // 4. Write Pixels in Bottom-Up Scanline order
  // Row 0 in BMP is the bottom row of the image (y = height - 1)
  let curOffset = dataOffset;

  for (let y = height - 1; y >= 0; y--) {
    const rowStartOffset = curOffset;

    if (depth === 1) {
      // 8 pixels per byte, MSB first
      let currentByte = 0;
      let bitPos = 7;
      for (let x = 0; x < width; x++) {
        const pixelVal = (indexedPixels[y][x] & 1) ? 1 : 0;
        currentByte |= (pixelVal << bitPos);
        bitPos--;
        if (bitPos < 0) {
          view.setUint8(curOffset++, currentByte);
          currentByte = 0;
          bitPos = 7;
        }
      }
      if (bitPos !== 7) {
        view.setUint8(curOffset++, currentByte);
      }
    } else if (depth === 4) {
      // 2 pixels per byte, high nibble first
      let currentByte = 0;
      let isHighNibble = true;
      for (let x = 0; x < width; x++) {
        const colorIdx = indexedPixels[y][x] & 0x0f;
        if (isHighNibble) {
          currentByte = (colorIdx << 4);
          isHighNibble = false;
        } else {
          currentByte |= colorIdx;
          view.setUint8(curOffset++, currentByte);
          currentByte = 0;
          isHighNibble = true;
        }
      }
      if (!isHighNibble) {
        view.setUint8(curOffset++, currentByte);
      }
    } else if (depth === 8) {
      // 1 pixel per byte
      for (let x = 0; x < width; x++) {
        view.setUint8(curOffset++, indexedPixels[y][x] & 0xff);
      }
    } else if (depth === 24) {
      // 3 bytes per pixel: B, G, R
      for (let x = 0; x < width; x++) {
        const [r, g, b] = rgbPixels[y][x];
        view.setUint8(curOffset++, b);
        view.setUint8(curOffset++, g);
        view.setUint8(curOffset++, r);
      }
    }

    // Write row padding bytes (0x00)
    for (let p = 0; p < paddingBytesPerRow; p++) {
      view.setUint8(curOffset++, 0);
    }
  }

  // 5. Generate Preview Data URL using offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  let previewDataUrl = '';

  if (ctx) {
    const imgData = ctx.createImageData(width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pIdx = (y * width + x) * 4;
        const [r, g, b] = rgbPixels[y][x];
        imgData.data[pIdx] = r;
        imgData.data[pIdx + 1] = g;
        imgData.data[pIdx + 2] = b;
        imgData.data[pIdx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    previewDataUrl = canvas.toDataURL('image/png');
  }

  return {
    buffer,
    uint8Array,
    fileHeader,
    infoHeader,
    palette,
    rowSize,
    paddingBytesPerRow,
    width,
    height,
    depth,
    previewDataUrl,
    indexedPixelGrid: indexedPixels,
    rgbPixelGrid: rgbPixels,
  };
}
