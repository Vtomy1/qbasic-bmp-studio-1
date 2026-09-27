import React, { useState } from 'react';
import { ProcessedBmpData } from '../types/bmp';
import { rgbToVgaDac } from '../utils/palettes';
import { Binary, Palette, Table, Calculator, Info, Check } from 'lucide-react';

interface BmpHeaderInspectorProps {
  bmpData: ProcessedBmpData;
}

export const BmpHeaderInspector: React.FC<BmpHeaderInspectorProps> = ({ bmpData }) => {
  const [activeSubTab, setActiveSubTab] = useState<'headers' | 'palette' | 'hexdump' | 'padding'>('headers');
  const [hoveredByteInfo, setHoveredByteInfo] = useState<string | null>(null);

  const {
    fileHeader,
    infoHeader,
    palette,
    width,
    height,
    depth,
    rowSize,
    paddingBytesPerRow,
    uint8Array,
  } = bmpData;

  // Hex dump preview of first 512 bytes
  const hexDumpLimit = Math.min(uint8Array.length, 768);
  const hexLines: { offset: number; bytes: number[]; ascii: string }[] = [];
  for (let i = 0; i < hexDumpLimit; i += 16) {
    const chunk = Array.from(uint8Array.slice(i, i + 16));
    const ascii = chunk
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
      .join('');
    hexLines.push({ offset: i, bytes: chunk, ascii });
  }

  // Get segment classification for a given byte offset
  const getByteClassification = (offset: number) => {
    if (offset < 14) {
      return {
        type: 'fileHeader',
        color: 'text-sky-400 bg-sky-950/40',
        name: 'BITMAPFILEHEADER (14 bytes)',
        detail:
          offset < 2 ? 'bfType ("BM" / 0x4D42)' :
          offset < 6 ? 'bfSize (Total file size in bytes, 32-bit uint)' :
          offset < 8 ? 'bfReserved1 (0)' :
          offset < 10 ? 'bfReserved2 (0)' :
          'bfOffBits (Offset to pixel data array, 32-bit uint)',
      };
    }
    if (offset < 54) {
      return {
        type: 'infoHeader',
        color: 'text-emerald-400 bg-emerald-950/40',
        name: 'BITMAPINFOHEADER (40 bytes)',
        detail:
          offset < 18 ? 'biSize (Header size = 40 bytes)' :
          offset < 22 ? `biWidth (${width} pixels, 32-bit int)` :
          offset < 26 ? `biHeight (${height} pixels, 32-bit int, positive = bottom-up)` :
          offset < 28 ? 'biPlanes (1 color plane)' :
          offset < 30 ? `biBitCount (${depth} bits per pixel)` :
          offset < 34 ? 'biCompression (0 = BI_RGB uncompressed)' :
          offset < 38 ? `biSizeImage (${infoHeader.biSizeImage} bytes)` :
          offset < 42 ? 'biXPelsPerMeter (horizontal resolution, ~2835 = 72 DPI)' :
          offset < 46 ? 'biYPelsPerMeter (vertical resolution, ~2835 = 72 DPI)' :
          offset < 50 ? `biClrUsed (${infoHeader.biClrUsed} colors in palette)` :
          'biClrImportant (0 = all colors important)',
      };
    }
    if (offset < fileHeader.bfOffBits) {
      const palIndex = Math.floor((offset - 54) / 4);
      const byteInQuad = (offset - 54) % 4;
      const quadField = byteInQuad === 0 ? 'Blue' : byteInQuad === 1 ? 'Green' : byteInQuad === 2 ? 'Red' : 'Reserved (0)';
      return {
        type: 'palette',
        color: 'text-purple-400 bg-purple-950/40',
        name: 'Palette RGBQUAD Entry',
        detail: `Color #${palIndex} -> ${quadField} channel (offset ${offset})`,
      };
    }
    return {
      type: 'pixels',
      color: 'text-amber-400 bg-amber-950/40',
      name: 'Pixel Data Array',
      detail: `Scanline row data (Bottom-Up order with 4-byte padding)`,
    };
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-y-auto">
      {/* Sub navigation tabs */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-neutral-900 border-b border-neutral-800 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab('headers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeSubTab === 'headers'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-sky-400" />
            <span>Header Breakdown</span>
          </button>

          <button
            onClick={() => setActiveSubTab('hexdump')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeSubTab === 'hexdump'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Binary className="w-3.5 h-3.5 text-emerald-400" />
            <span>Interactive Hex Dump</span>
          </button>

          {depth !== 24 && (
            <button
              onClick={() => setActiveSubTab('palette')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeSubTab === 'palette'
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>Palette Table & DAC</span>
            </button>
          )}

          <button
            onClick={() => setActiveSubTab('padding')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeSubTab === 'padding'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            <span>4-Byte Padding Math</span>
          </button>
        </div>

        <div className="text-[11px] text-neutral-400 font-mono">
          Total File Size: <span className="text-emerald-400 font-semibold">{fileHeader.bfSize} bytes</span>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto w-full flex flex-col gap-6">
        {/* SUBTAB 1: HEADERS BREAKDOWN TABLE */}
        {activeSubTab === 'headers' && (
          <div className="flex flex-col gap-6">
            {/* BITMAPFILEHEADER (14 Bytes) */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  <h3 className="font-semibold text-sm text-neutral-100 font-mono">
                    BITMAPFILEHEADER (14 Bytes)
                  </h3>
                </div>
                <span className="text-xs text-neutral-400 font-mono">
                  Offset 0x00 to 0x0D (Bytes 0 - 13)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 font-mono bg-neutral-950/40">
                      <th className="py-2.5 px-4">Offset</th>
                      <th className="py-2.5 px-4">Size</th>
                      <th className="py-2.5 px-4">Field</th>
                      <th className="py-2.5 px-4">QBasic Type</th>
                      <th className="py-2.5 px-4">Current Value</th>
                      <th className="py-2.5 px-4">Hex</th>
                      <th className="py-2.5 px-4">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 font-mono text-neutral-300">
                    <tr className="hover:bg-neutral-800/40">
                      <td className="py-2.5 px-4 text-sky-400">0x00 (0)</td>
                      <td className="py-2.5 px-4">2 bytes</td>
                      <td className="py-2.5 px-4 font-bold text-neutral-100">bfType</td>
                      <td className="py-2.5 px-4 text-amber-300">INTEGER</td>
                      <td className="py-2.5 px-4 text-emerald-400">"BM"</td>
                      <td className="py-2.5 px-4 text-neutral-400">0x4D42</td>
                      <td className="py-2.5 px-4 font-sans text-neutral-400">
                        Magic identifier signature for Windows bitmap
                      </td>
                    </tr>
                    <tr className="hover:bg-neutral-800/40">
                      <td className="py-2.5 px-4 text-sky-400">0x02 (2)</td>
                      <td className="py-2.5 px-4">4 bytes</td>
                      <td className="py-2.5 px-4 font-bold text-neutral-100">bfSize</td>
                      <td className="py-2.5 px-4 text-amber-300">LONG</td>
                      <td className="py-2.5 px-4 text-emerald-400">{fileHeader.bfSize}</td>
                      <td className="py-2.5 px-4 text-neutral-400">0x{fileHeader.bfSize.toString(16).toUpperCase()}</td>
                      <td className="py-2.5 px-4 font-sans text-neutral-400">
                        Total size of BMP file in bytes
                      </td>
                    </tr>
                    <tr className="hover:bg-neutral-800/40">
                      <td className="py-2.5 px-4 text-sky-400">0x06 (6)</td>
                      <td className="py-2.5 px-4">2 bytes</td>
                      <td className="py-2.5 px-4 font-bold text-neutral-100">bfReserved1</td>
                      <td className="py-2.5 px-4 text-amber-300">INTEGER</td>
                      <td className="py-2.5 px-4 text-neutral-400">0</td>
                      <td className="py-2.5 px-4 text-neutral-400">0x0000</td>
                      <td className="py-2.5 px-4 font-sans text-neutral-400">Reserved (always 0)</td>
                    </tr>
                    <tr className="hover:bg-neutral-800/40">
                      <td className="py-2.5 px-4 text-sky-400">0x08 (8)</td>
                      <td className="py-2.5 px-4">2 bytes</td>
                      <td className="py-2.5 px-4 font-bold text-neutral-100">bfReserved2</td>
                      <td className="py-2.5 px-4 text-amber-300">INTEGER</td>
                      <td className="py-2.5 px-4 text-neutral-400">0</td>
                      <td className="py-2.5 px-4 text-neutral-400">0x0000</td>
                      <td className="py-2.5 px-4 font-sans text-neutral-400">Reserved (always 0)</td>
                    </tr>
                    <tr className="hover:bg-neutral-800/40">
                      <td className="py-2.5 px-4 text-sky-400">0x0A (10)</td>
                      <td className="py-2.5 px-4">4 bytes</td>
                      <td className="py-2.5 px-4 font-bold text-neutral-100">bfOffBits</td>
                      <td className="py-2.5 px-4 text-amber-300">LONG</td>
                      <td className="py-2.5 px-4 text-emerald-400">{fileHeader.bfOffBits}</td>
                      <td className="py-2.5 px-4 text-neutral-400">0x{fileHeader.bfOffBits.toString(16).toUpperCase()}</td>
                      <td className="py-2.5 px-4 font-sans text-neutral-400">
                        Byte offset from file start where raw pixel rows begin
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* BITMAPINFOHEADER (40 Bytes) */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <h3 className="font-semibold text-sm text-neutral-100 font-mono">
                    BITMAPINFOHEADER (40 Bytes)
                  </h3>
                </div>
                <span className="text-xs text-neutral-400 font-mono">
                  Offset 0x0E to 0x35 (Bytes 14 - 53)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 font-mono bg-neutral-950/40">
                      <th className="py-2.5 px-4">Offset</th>
                      <th className="py-2.5 px-4">Size</th>
                      <th className="py-2.5 px-4">Field</th>
                      <th className="py-2.5 px-4">QBasic Type</th>
                      <th className="py-2.5 px-4">Current Value</th>
                      <th className="py-2.5 px-4">Hex</th>
                      <th className="py-2.5 px-4">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 font-mono text-neutral-300">
                    <tr className="hover:bg-neutral-800/40">
                      <td className="py-2.5 px-4 text-emerald-400">0x0E (14)</td>
                      <td className="py-2.5 px-4">4 bytes</td>
                      <td className="py-2.5 px-4 font-bold text-neutral-100">biSize</td>
                      <td className="py-2.5 px-4 text-amber-300">LONG</td>
                      <td className="py-2.5 px-4 text-emerald-400">40</td>
                      <td className="py-2.5 px-4 text-neutral-400">0x00000028</td>
                      <td className="py-2.5 px-4 font-sans text-neutral-400">Header size in bytes</td>
                    </tr>
                    <tr className="hover:bg-neutral-800/40">
                      <td className="py-2.5 px-4 text-emerald-400">0x12 (18)</td>
                      <td className="py-2.5 px-4">4 bytes</td>
                      <td className="py-2.5 px-4 font-bold text-neutral-100">biWidth</td>
                      <td className="py-2.5 px-4 text-amber-300">LONG</td>
                      <td className="py-2.5 px-4 text-emerald-400">{width}</td>
                      <td className="py-2.5 px-4 text-neutral-400">0x{width.toString(16).toUpperCase()}</td>
                      <td className="py-2.5 px-4 font-sans text-neutral-400">Bitmap width in pixels</td>
                    </tr>
                    <tr className="hover:bg-neutral-800/40">
                      <td className="py-2.5 px-4 text-emerald-400">0x16 (22)</td>
                      <td className="py-2.5 px-4">4 bytes</td>
                      <td className="py-2.5 px-4 font-bold text-neutral-100">biHeight</td>
                      <td className="py-2.5 px-4 text-amber-300">LONG</td>
                      <td className="py-2.5 px-4 text-emerald-400">{height}</td>
                      <td className="py-2.5 px-4 text-neutral-400">0x{height.toString(16).toUpperCase()}</td>
                      <td className="py-2.5 px-4 font-sans text-neutral-400">
                        Height in pixels (Positive = Bottom-to-Top scanlines)
                      </td>
                    </tr>
                    <tr className="hover:bg-neutral-800/40">
                      <td className="py-2.5 px-4 text-emerald-400">0x1A (26)</td>
                      <td className="py-2.5 px-4">2 bytes</td>
                      <td className="py-2.5 px-4 font-bold text-neutral-100">biPlanes</td>
                      <td className="py-2.5 px-4 text-amber-300">INTEGER</td>
                      <td className="py-2.5 px-4 text-emerald-400">1</td>
                      <td className="py-2.5 px-4 text-neutral-400">0x0001</td>
                      <td className="py-2.5 px-4 font-sans text-neutral-400">Number of color planes (must be 1)</td>
                    </tr>
                    <tr className="hover:bg-neutral-800/40">
                      <td className="py-2.5 px-4 text-emerald-400">0x1C (28)</td>
                      <td className="py-2.5 px-4">2 bytes</td>
                      <td className="py-2.5 px-4 font-bold text-neutral-100">biBitCount</td>
                      <td className="py-2.5 px-4 text-amber-300">INTEGER</td>
                      <td className="py-2.5 px-4 text-amber-400 font-bold">{depth}</td>
                      <td className="py-2.5 px-4 text-neutral-400">0x000{depth.toString(16)}</td>
                      <td className="py-2.5 px-4 font-sans text-neutral-400">
                        Bits per pixel (1=Mono, 4=16c, 8=256c, 24=TrueColor)
                      </td>
                    </tr>
                    <tr className="hover:bg-neutral-800/40">
                      <td className="py-2.5 px-4 text-emerald-400">0x1E (30)</td>
                      <td className="py-2.5 px-4">4 bytes</td>
                      <td className="py-2.5 px-4 font-bold text-neutral-100">biCompression</td>
                      <td className="py-2.5 px-4 text-amber-300">LONG</td>
                      <td className="py-2.5 px-4 text-emerald-400">0</td>
                      <td className="py-2.5 px-4 text-neutral-400">0x00000000</td>
                      <td className="py-2.5 px-4 font-sans text-neutral-400">
                        0 = BI_RGB (Uncompressed raw scanlines)
                      </td>
                    </tr>
                    <tr className="hover:bg-neutral-800/40">
                      <td className="py-2.5 px-4 text-emerald-400">0x22 (34)</td>
                      <td className="py-2.5 px-4">4 bytes</td>
                      <td className="py-2.5 px-4 font-bold text-neutral-100">biSizeImage</td>
                      <td className="py-2.5 px-4 text-amber-300">LONG</td>
                      <td className="py-2.5 px-4 text-emerald-400">{infoHeader.biSizeImage}</td>
                      <td className="py-2.5 px-4 text-neutral-400">0x{infoHeader.biSizeImage.toString(16).toUpperCase()}</td>
                      <td className="py-2.5 px-4 font-sans text-neutral-400">
                        Size of raw pixel data (rowSize * height)
                      </td>
                    </tr>
                    <tr className="hover:bg-neutral-800/40">
                      <td className="py-2.5 px-4 text-emerald-400">0x26 (38)</td>
                      <td className="py-2.5 px-4">4 bytes</td>
                      <td className="py-2.5 px-4 font-bold text-neutral-100">biXPelsPerMeter</td>
                      <td className="py-2.5 px-4 text-amber-300">LONG</td>
                      <td className="py-2.5 px-4 text-neutral-400">2835</td>
                      <td className="py-2.5 px-4 text-neutral-400">0x00000B13</td>
                      <td className="py-2.5 px-4 font-sans text-neutral-400">Horizontal resolution (~72 DPI)</td>
                    </tr>
                    <tr className="hover:bg-neutral-800/40">
                      <td className="py-2.5 px-4 text-emerald-400">0x2A (42)</td>
                      <td className="py-2.5 px-4">4 bytes</td>
                      <td className="py-2.5 px-4 font-bold text-neutral-100">biYPelsPerMeter</td>
                      <td className="py-2.5 px-4 text-amber-300">LONG</td>
                      <td className="py-2.5 px-4 text-neutral-400">2835</td>
                      <td className="py-2.5 px-4 text-neutral-400">0x00000B13</td>
                      <td className="py-2.5 px-4 font-sans text-neutral-400">Vertical resolution (~72 DPI)</td>
                    </tr>
                    <tr className="hover:bg-neutral-800/40">
                      <td className="py-2.5 px-4 text-emerald-400">0x2E (46)</td>
                      <td className="py-2.5 px-4">4 bytes</td>
                      <td className="py-2.5 px-4 font-bold text-neutral-100">biClrUsed</td>
                      <td className="py-2.5 px-4 text-amber-300">LONG</td>
                      <td className="py-2.5 px-4 text-emerald-400">{infoHeader.biClrUsed}</td>
                      <td className="py-2.5 px-4 text-neutral-400">0x{infoHeader.biClrUsed.toString(16).toUpperCase()}</td>
                      <td className="py-2.5 px-4 font-sans text-neutral-400">
                        Number of colors in palette (0 for 24-bit)
                      </td>
                    </tr>
                    <tr className="hover:bg-neutral-800/40">
                      <td className="py-2.5 px-4 text-emerald-400">0x32 (50)</td>
                      <td className="py-2.5 px-4">4 bytes</td>
                      <td className="py-2.5 px-4 font-bold text-neutral-100">biClrImportant</td>
                      <td className="py-2.5 px-4 text-amber-300">LONG</td>
                      <td className="py-2.5 px-4 text-neutral-400">0</td>
                      <td className="py-2.5 px-4 text-neutral-400">0x00000000</td>
                      <td className="py-2.5 px-4 font-sans text-neutral-400">
                        Important colors (0 = all colors important)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: INTERACTIVE HEX DUMP */}
        {activeSubTab === 'hexdump' && (
          <div className="flex flex-col gap-4">
            {/* Legend & Hover Info */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs">
              <div className="flex items-center gap-3">
                <span className="text-neutral-400 font-medium">Color Map:</span>
                <span className="flex items-center gap-1.5 text-sky-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-500/30 border border-sky-400" />
                  BITMAPFILEHEADER (14B)
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30 border border-emerald-400" />
                  BITMAPINFOHEADER (40B)
                </span>
                {depth !== 24 && (
                  <span className="flex items-center gap-1.5 text-purple-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-purple-500/30 border border-purple-400" />
                    RGBQUAD Palette
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/30 border border-amber-400" />
                  Pixel Scanlines
                </span>
              </div>
            </div>

            {/* Hover details badge */}
            <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg text-xs font-mono min-h-[44px] flex items-center">
              {hoveredByteInfo ? (
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-neutral-200">{hoveredByteInfo}</span>
                </div>
              ) : (
                <span className="text-neutral-500 italic">
                  Hover over any byte in the dump below to view its header field, offset, and decoded meaning.
                </span>
              )}
            </div>

            {/* Hex Table */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 font-mono text-xs overflow-x-auto">
              <div className="flex pb-2 mb-2 border-b border-neutral-800 text-neutral-500 select-none">
                <span className="w-20 shrink-0">Offset</span>
                <span className="w-[380px] shrink-0 flex gap-2">
                  {Array.from({ length: 16 }, (_, i) => (
                    <span key={i} className="w-5 text-center">
                      {i.toString(16).toUpperCase()}
                    </span>
                  ))}
                </span>
                <span className="ml-4">ASCII</span>
              </div>

              <div className="flex flex-col gap-1">
                {hexLines.map((line) => (
                  <div key={line.offset} className="flex items-center hover:bg-neutral-800/40 rounded px-1">
                    {/* Line Offset */}
                    <span className="w-20 shrink-0 text-neutral-500 select-none">
                      0x{line.offset.toString(16).padStart(6, '0').toUpperCase()}
                    </span>

                    {/* Hex Bytes */}
                    <div className="w-[380px] shrink-0 flex gap-2">
                      {line.bytes.map((byte, idx) => {
                        const globalOffset = line.offset + idx;
                        const classification = getByteClassification(globalOffset);
                        const hexStr = byte.toString(16).padStart(2, '0').toUpperCase();

                        return (
                          <span
                            key={idx}
                            onMouseEnter={() =>
                              setHoveredByteInfo(
                                `Offset 0x${globalOffset.toString(16).toUpperCase()} (${globalOffset}): Value 0x${hexStr} (${byte}) · ${classification.name} · ${classification.detail}`
                              )
                            }
                            onMouseLeave={() => setHoveredByteInfo(null)}
                            className={`w-5 text-center cursor-pointer rounded transition-colors ${classification.color} hover:brightness-150 font-bold`}
                          >
                            {hexStr}
                          </span>
                        );
                      })}
                    </div>

                    {/* ASCII Representation */}
                    <span className="ml-4 text-neutral-400 select-none tracking-widest font-mono">
                      {line.ascii}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: PALETTE TABLE & VGA DAC HARDWARE MAPPING */}
        {activeSubTab === 'palette' && depth !== 24 && (
          <div className="flex flex-col gap-5">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-neutral-300 leading-relaxed">
              <strong className="text-amber-400 block mb-1">
                Critical QBasic Hardware Note: The VGA 6-Bit DAC (OUT &H3C8 / &H3C9)
              </strong>
              Standard BMP files store RGB color channels in the range <strong>0 to 255</strong> (8 bits per channel).
              However, IBM VGA graphics hardware registers (ports &H3C8 and &H3C9) only accept <strong>6 bits per channel (0 to 63)</strong>.
              When writing QBasic code, you must scale BMP channels down using integer division by 4:
              <code className="block mt-2 p-2 bg-neutral-900 border border-neutral-800 rounded font-mono text-amber-300">
                OUT &H3C8, paletteIndex% : OUT &H3C9, red% \ 4 : OUT &H3C9, green% \ 4 : OUT &H3C9, blue% \ 4
              </code>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {palette.map((q, idx) => {
                const [r6, g6, b6] = rgbToVgaDac(q.rgbRed, q.rgbGreen, q.rgbBlue);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono"
                  >
                    <div
                      className="w-8 h-8 rounded border border-neutral-700 shadow-sm shrink-0"
                      style={{
                        backgroundColor: `rgb(${q.rgbRed}, ${q.rgbGreen}, ${q.rgbBlue})`,
                      }}
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-100">Index #{idx}</span>
                        <span className="text-[10px] text-neutral-500">
                          #{q.rgbRed.toString(16).padStart(2, '0')}{q.rgbGreen.toString(16).padStart(2, '0')}{q.rgbBlue.toString(16).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">
                        BMP (0-255): R:{q.rgbRed} G:{q.rgbGreen} B:{q.rgbBlue}
                      </div>
                      <div className="text-[10px] text-amber-400 font-semibold mt-0.5">
                        DAC (0-63): R:{r6} G:{g6} B:{b6}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBTAB 4: 4-BYTE PADDING MATHEMATICS */}
        {activeSubTab === 'padding' && (
          <div className="flex flex-col gap-6 text-xs text-neutral-300 leading-relaxed">
            <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-xl flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-400" />
                Windows BMP 4-Byte (32-bit) Scanline Alignment Rule
              </h3>
              <p>
                In the Windows DIB bitmap specification, every horizontal scanline row <strong>must</strong> be padded to a multiple of 4 bytes (a 32-bit DWORD boundary).
                If the raw row byte count is not evenly divisible by 4, extra zero bytes (<code className="font-mono text-amber-400">0x00</code>) are appended to the end of each scanline.
              </p>

              {/* The Formula Box */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg flex flex-col gap-2 font-mono">
                <div className="text-neutral-400 text-[11px] uppercase tracking-wider">Canonical Formula:</div>
                <div className="text-sm text-amber-300 font-bold">
                  RowBytes = INT((biWidth * biBitCount + 31) / 32) * 4
                </div>
                <div className="text-neutral-400 text-xs mt-1">
                  PaddingBytesPerRow = RowBytes - CEIL((biWidth * biBitCount) / 8)
                </div>
              </div>

              {/* Step-by-Step for Current Image */}
              <div className="flex flex-col gap-3 pt-2">
                <h4 className="font-semibold text-neutral-200">Calculation for Current Image:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
                  <div className="p-3 bg-neutral-950/60 border border-neutral-800/80 rounded-lg">
                    <span className="text-neutral-500 block mb-1">Image Dimensions & Depth:</span>
                    <span className="text-neutral-100 font-bold">{width} px wide × {height} px high</span>
                    <span className="text-amber-400 block mt-1">Bit Depth: {depth} bits per pixel</span>
                  </div>

                  <div className="p-3 bg-neutral-950/60 border border-neutral-800/80 rounded-lg">
                    <span className="text-neutral-500 block mb-1">Raw Bits per Scanline:</span>
                    <span className="text-neutral-100">
                      {width} × {depth} = <strong>{width * depth} bits</strong>
                    </span>
                    <span className="text-neutral-400 block mt-1">
                      = {Math.ceil((width * depth) / 8)} unpadded bytes
                    </span>
                  </div>

                  <div className="p-3 bg-neutral-950/60 border border-neutral-800/80 rounded-lg">
                    <span className="text-neutral-500 block mb-1">32-Bit Alignment Math:</span>
                    <span className="text-neutral-100">
                      INT(({width * depth} + 31) / 32) × 4
                    </span>
                    <span className="text-emerald-400 font-bold block mt-1">
                      = {rowSize} padded bytes per row
                    </span>
                  </div>

                  <div className="p-3 bg-neutral-950/60 border border-neutral-800/80 rounded-lg">
                    <span className="text-neutral-500 block mb-1">Zero Padding Result:</span>
                    <span className="text-neutral-100">
                      {rowSize} - {Math.ceil((width * depth) / 8)} ={' '}
                      <strong className="text-amber-400">{paddingBytesPerRow} zero-byte{paddingBytesPerRow === 1 ? '' : 's'}</strong> added per scanline
                    </span>
                    <span className="text-neutral-400 block mt-1">
                      Total waste padding across {height} rows: {paddingBytesPerRow * height} bytes
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
