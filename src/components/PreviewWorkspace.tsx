import React, { useState, useRef, useEffect } from 'react';
import { ProcessedBmpData } from '../types/bmp';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Tv,
  Columns,
  Split,
  Eye,
  Crosshair,
} from 'lucide-react';

interface PreviewWorkspaceProps {
  sourceImageDataUrl: string;
  bmpData: ProcessedBmpData | null;
  ditherMethodName: string;
}

export const PreviewWorkspace: React.FC<PreviewWorkspaceProps> = ({
  sourceImageDataUrl,
  bmpData,
  ditherMethodName,
}) => {
  const [zoom, setZoom] = useState<number>(2);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [showCrtEffect, setShowCrtEffect] = useState<boolean>(false);
  const [compareMode, setCompareMode] = useState<'dithered' | 'side-by-side' | 'split'>('side-by-side');
  const [splitPos, setSplitPos] = useState<number>(50); // percentage

  // Hover pixel inspection
  const [hoveredPixel, setHoveredPixel] = useState<{
    x: number;
    y: number;
    r: number;
    g: number;
    b: number;
    index?: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!bmpData || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    if (clientX >= 0 && clientX < rect.width && clientY >= 0 && clientY < rect.height) {
      const pixelX = Math.floor((clientX / rect.width) * bmpData.width);
      const pixelY = Math.floor((clientY / rect.height) * bmpData.height);

      if (
        pixelX >= 0 &&
        pixelX < bmpData.width &&
        pixelY >= 0 &&
        pixelY < bmpData.height
      ) {
        const [r, g, b] = bmpData.rgbPixelGrid[pixelY][pixelX];
        const index = bmpData.depth !== 24 ? bmpData.indexedPixelGrid[pixelY][pixelX] : undefined;
        setHoveredPixel({ x: pixelX, y: pixelY, r, g, b, index });
        return;
      }
    }
    setHoveredPixel(null);
  };

  const handleMouseLeave = () => {
    setHoveredPixel(null);
  };

  if (!bmpData) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px] text-neutral-500">
        Processing image preview...
      </div>
    );
  }

  const { width, height, depth, rowSize, paddingBytesPerRow, fileHeader, infoHeader } = bmpData;

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-hidden select-none">
      {/* 1. Top Preview Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800 text-xs">
        {/* Left: View Mode Controls */}
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-400 font-medium mr-1">Display:</span>
          <div className="flex items-center bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
            <button
              onClick={() => setCompareMode('dithered')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                compareMode === 'dithered'
                  ? 'bg-neutral-800 text-amber-400 font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              BMP Result
            </button>
            <button
              onClick={() => setCompareMode('side-by-side')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                compareMode === 'side-by-side'
                  ? 'bg-neutral-800 text-amber-400 font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Side by Side
            </button>
            <button
              onClick={() => setCompareMode('split')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                compareMode === 'split'
                  ? 'bg-neutral-800 text-amber-400 font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Split Curtain
            </button>
          </div>
        </div>

        {/* Center: Zoom and Display Toggles */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-neutral-950 px-1 py-0.5 rounded-lg border border-neutral-800">
            <button
              onClick={() => setZoom((z) => Math.max(1, z - 1))}
              disabled={zoom <= 1}
              className="p-1 text-neutral-400 hover:text-neutral-200 disabled:opacity-30"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-neutral-300 min-w-[36px] text-center">
              {zoom}x
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(16, z + 1))}
              disabled={zoom >= 16}
              className="p-1 text-neutral-400 hover:text-neutral-200 disabled:opacity-30"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 text-neutral-400 hover:text-neutral-200 border-l border-neutral-800 pl-1.5 ml-0.5"
              title="Reset Zoom to 1x"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
              showGrid
                ? 'bg-neutral-800 border-amber-500/60 text-amber-400'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
            title="Toggle Pixel Grid"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pixel Grid</span>
          </button>

          <button
            onClick={() => setShowCrtEffect(!showCrtEffect)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
              showCrtEffect
                ? 'bg-neutral-800 border-amber-500/60 text-amber-400'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
            title="Toggle CRT Scanline Simulation"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CRT FX</span>
          </button>
        </div>

        {/* Right: Quick metadata tags */}
        <div className="hidden md:flex items-center gap-2 text-[11px] text-neutral-400">
          <span className="font-mono text-neutral-300">{width}x{height}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-amber-400">{depth}-bit ({ditherMethodName})</span>
        </div>
      </div>

      {/* 2. Main Canvas Viewport Area */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="flex-1 overflow-auto p-6 flex items-center justify-center bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:16px_16px] relative"
      >
        {/* Render View based on compareMode */}
        {compareMode === 'dithered' && (
          <div className="relative shadow-2xl rounded-sm overflow-hidden border border-neutral-800 bg-black">
            <img
              ref={imageRef}
              src={bmpData.previewDataUrl}
              alt="Dithered BMP output"
              style={{
                width: width * zoom,
                height: height * zoom,
                imageRendering: 'pixelated',
              }}
              className="block pointer-events-auto"
            />
            {showGrid && zoom >= 4 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundSize: `${zoom}px ${zoom}px`,
                  backgroundImage:
                    'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
                }}
              />
            )}
            {showCrtEffect && (
              <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.25),rgba(0,0,0,0.25)_1px,transparent_1px,transparent_2px)] opacity-60" />
            )}
          </div>
        )}

        {compareMode === 'side-by-side' && (
          <div className="flex flex-wrap items-center justify-center gap-8 max-w-full">
            {/* Original Input */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-neutral-400 font-medium">Original Source Image</span>
              <div className="relative shadow-2xl rounded-sm overflow-hidden border border-neutral-800 bg-black">
                <img
                  src={sourceImageDataUrl}
                  alt="Original"
                  style={{
                    width: width * zoom,
                    height: height * zoom,
                    imageRendering: 'pixelated',
                  }}
                  className="block"
                />
              </div>
            </div>

            {/* Dithered Output */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-amber-400 font-medium flex items-center gap-1.5">
                <span>{depth}-Bit BMP Output</span>
                <span className="text-neutral-500 text-[10px]">({ditherMethodName})</span>
              </span>
              <div className="relative shadow-2xl rounded-sm overflow-hidden border border-neutral-800 bg-black">
                <img
                  ref={imageRef}
                  src={bmpData.previewDataUrl}
                  alt="Dithered BMP output"
                  style={{
                    width: width * zoom,
                    height: height * zoom,
                    imageRendering: 'pixelated',
                  }}
                  className="block pointer-events-auto"
                />
                {showGrid && zoom >= 4 && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundSize: `${zoom}px ${zoom}px`,
                      backgroundImage:
                        'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
                    }}
                  />
                )}
                {showCrtEffect && (
                  <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.25),rgba(0,0,0,0.25)_1px,transparent_1px,transparent_2px)] opacity-60" />
                )}
              </div>
            </div>
          </div>
        )}

        {compareMode === 'split' && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-neutral-400">
              Drag slider to compare: <strong className="text-neutral-200">Original (Left)</strong> vs <strong className="text-amber-400">{depth}-bit BMP (Right)</strong>
            </span>
            <div
              className="relative shadow-2xl rounded-sm overflow-hidden border border-neutral-800 bg-black select-none"
              style={{ width: width * zoom, height: height * zoom }}
            >
              {/* Full Original Image */}
              <img
                src={sourceImageDataUrl}
                alt="Original"
                style={{
                  width: width * zoom,
                  height: height * zoom,
                  imageRendering: 'pixelated',
                }}
                className="absolute inset-0 block"
              />

              {/* Clipped BMP Image on top */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${splitPos}%` }}
              >
                <img
                  ref={imageRef}
                  src={bmpData.previewDataUrl}
                  alt="Dithered output"
                  style={{
                    width: width * zoom,
                    height: height * zoom,
                    imageRendering: 'pixelated',
                  }}
                  className="block"
                />
              </div>

              {/* Vertical divider line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] cursor-ew-resize flex items-center justify-center"
                style={{ left: `${splitPos}%` }}
              >
                <div className="w-4 h-4 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center text-[9px] shadow font-bold">
                  ↔
                </div>
              </div>

              {/* Range input for split control */}
              <input
                type="range"
                min="0"
                max="100"
                value={splitPos}
                onChange={(e) => setSplitPos(Number(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
              />

              {showGrid && zoom >= 4 && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundSize: `${zoom}px ${zoom}px`,
                    backgroundImage:
                      'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Information & Pixel Inspector Bar */}
      <div className="px-4 py-2.5 bg-neutral-900 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Pixel Under Cursor Inspector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Crosshair className="w-3.5 h-3.5 text-amber-400" />
            <span>Pixel Inspector:</span>
          </div>
          {hoveredPixel ? (
            <div className="flex items-center gap-2.5 font-mono">
              <span className="text-neutral-200">
                X:<span className="text-amber-400">{hoveredPixel.x}</span> Y:<span className="text-amber-400">{hoveredPixel.y}</span>
              </span>
              <div
                className="w-3.5 h-3.5 rounded border border-neutral-600 shadow-sm"
                style={{ backgroundColor: `rgb(${hoveredPixel.r}, ${hoveredPixel.g}, ${hoveredPixel.b})` }}
              />
              <span className="text-neutral-300">
                rgb({hoveredPixel.r},{hoveredPixel.g},{hoveredPixel.b})
              </span>
              {hoveredPixel.index !== undefined && (
                <span className="text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded text-[11px] border border-amber-500/20">
                  Index #{hoveredPixel.index}
                </span>
              )}
            </div>
          ) : (
            <span className="text-neutral-500 italic">Hover over image to inspect pixel coordinates and palette indices</span>
          )}
        </div>

        {/* Scanline & BMP Alignment Metrics */}
        <div className="flex items-center gap-3 text-neutral-400 font-mono text-[11px]">
          <div>
            <span>Row Size: </span>
            <span className="text-neutral-200">{rowSize} B</span>
            {paddingBytesPerRow > 0 && (
              <span className="text-amber-400/90 ml-1">
                ({paddingBytesPerRow} pad {paddingBytesPerRow === 1 ? 'byte' : 'bytes'})
              </span>
            )}
          </div>
          <span aria-hidden="true" className="text-neutral-700">|</span>
          <div>
            <span>File Size: </span>
            <span className="text-emerald-400 font-bold">{fileHeader.bfSize.toLocaleString()} bytes</span>
          </div>
          <span aria-hidden="true" className="text-neutral-700">|</span>
          <div>
            <span>Scanline Order: </span>
            <span className="text-neutral-200">Bottom-to-Top</span>
          </div>
        </div>
      </div>
    </div>
  );
};
