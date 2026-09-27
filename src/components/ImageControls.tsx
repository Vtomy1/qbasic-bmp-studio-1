import React, { useRef } from 'react';
import {
  BmpDepth,
  DitherMethod,
  ImageProcessingOptions,
  PalettePresetId,
  ResolutionPreset,
} from '../types/bmp';
import { SAMPLE_IMAGES } from '../utils/sampleImages';
import {
  Upload,
  Image as ImageIcon,
  Palette,
  Layers,
  Wand2,
  RefreshCw,
  Sun,
  Contrast,
  SlidersHorizontal,
} from 'lucide-react';

interface ImageControlsProps {
  options: ImageProcessingOptions;
  setOptions: React.Dispatch<React.SetStateAction<ImageProcessingOptions>>;
  onUploadImage: (file: File) => void;
  onSelectSample: (sampleId: string) => void;
  selectedSampleId: string;
  sourceImageDimensions: { width: number; height: number };
}

export const ImageControls: React.FC<ImageControlsProps> = ({
  options,
  setOptions,
  onUploadImage,
  onSelectSample,
  selectedSampleId,
  sourceImageDimensions,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadImage(e.target.files[0]);
    }
  };

  const handleResolutionPreset = (preset: ResolutionPreset) => {
    if (preset === '320x200') {
      setOptions((prev) => ({ ...prev, width: 320, height: 200 }));
    } else if (preset === '640x480') {
      setOptions((prev) => ({ ...prev, width: 640, height: 480 }));
    } else if (preset === '640x350') {
      setOptions((prev) => ({ ...prev, width: 640, height: 350 }));
    } else if (preset === '320x240') {
      setOptions((prev) => ({ ...prev, width: 320, height: 240 }));
    } else if (preset === '160x100') {
      setOptions((prev) => ({ ...prev, width: 160, height: 100 }));
    } else if (preset === 'native') {
      setOptions((prev) => ({
        ...prev,
        width: sourceImageDimensions.width,
        height: sourceImageDimensions.height,
      }));
    }
  };

  const handleDepthChange = (depth: BmpDepth) => {
    let defaultPalette: PalettePresetId = 'ibm_pc_16';
    if (depth === 1) defaultPalette = 'bw';
    else if (depth === 4) defaultPalette = 'ibm_pc_16';
    else if (depth === 8) defaultPalette = 'adaptive_256';

    setOptions((prev) => ({
      ...prev,
      depth,
      paletteId: defaultPalette,
    }));
  };

  return (
    <div className="w-full flex flex-col gap-5 text-sm text-neutral-300">
      {/* 1. Source Image Picker & Presets */}
      <section className="flex flex-col gap-2.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            Image Source
          </span>
          <span className="text-[11px] text-neutral-500 lowercase font-normal">
            or paste image (Ctrl+V)
          </span>
        </label>

        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-neutral-200 bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700 rounded-lg transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Upload Image</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/bmp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />

          <select
            value={selectedSampleId}
            onChange={(e) => onSelectSample(e.target.value)}
            className="flex-1 text-xs bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="" disabled>Select Retro Sample...</option>
            {SAMPLE_IMAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.category})
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* 2. BMP Bit Depth (1, 4, 8, 24) */}
      <section className="flex flex-col gap-2.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          Color Bit Depth & QBasic Target
        </label>

        <div className="grid grid-cols-4 gap-1.5 p-1 bg-neutral-900 rounded-lg border border-neutral-800">
          <button
            onClick={() => handleDepthChange(1)}
            className={`flex flex-col items-center py-2 px-1 rounded-md transition-all ${
              options.depth === 1
                ? 'bg-neutral-800 text-amber-400 font-semibold shadow-sm border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span className="text-xs font-mono font-bold">1-Bit</span>
            <span className="text-[10px] text-neutral-400">Mono / 2c</span>
            <span className="text-[9px] text-neutral-500 mt-0.5">SCREEN 11</span>
          </button>

          <button
            onClick={() => handleDepthChange(4)}
            className={`flex flex-col items-center py-2 px-1 rounded-md transition-all ${
              options.depth === 4
                ? 'bg-neutral-800 text-amber-400 font-semibold shadow-sm border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span className="text-xs font-mono font-bold">4-Bit</span>
            <span className="text-[10px] text-neutral-400">16 Colors</span>
            <span className="text-[9px] text-neutral-500 mt-0.5">SCREEN 12/7</span>
          </button>

          <button
            onClick={() => handleDepthChange(8)}
            className={`flex flex-col items-center py-2 px-1 rounded-md transition-all ${
              options.depth === 8
                ? 'bg-neutral-800 text-amber-400 font-semibold shadow-sm border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span className="text-xs font-mono font-bold">8-Bit</span>
            <span className="text-[10px] text-neutral-400">256 Colors</span>
            <span className="text-[9px] text-neutral-500 mt-0.5">SCREEN 13</span>
          </button>

          <button
            onClick={() => handleDepthChange(24)}
            className={`flex flex-col items-center py-2 px-1 rounded-md transition-all ${
              options.depth === 24
                ? 'bg-neutral-800 text-amber-400 font-semibold shadow-sm border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span className="text-xs font-mono font-bold">24-Bit</span>
            <span className="text-[10px] text-neutral-400">16.7M True</span>
            <span className="text-[9px] text-neutral-500 mt-0.5">RGB / BGR</span>
          </button>
        </div>
      </section>

      {/* 3. Palette Selection (when <= 8-bit) */}
      {options.depth !== 24 && (
        <section className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              Palette Configuration
            </span>
          </label>

          {options.depth === 1 && (
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'bw', label: 'Classic B&W', desc: 'Monochrome Black & White' },
                { id: 'green_phosphor', label: 'Green Phosphor', desc: 'IBM 5151 CRT Monitor' },
                { id: 'amber', label: 'Amber CRT', desc: 'Vintage Monochrome Amber' },
                { id: 'cyber_blue', label: 'Cyber Blue', desc: 'Navy & Cyan Phosphor' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setOptions((prev) => ({ ...prev, paletteId: p.id as PalettePresetId }))}
                  className={`text-left p-2 rounded-lg border text-xs transition-colors ${
                    options.paletteId === p.id
                      ? 'border-amber-500/80 bg-neutral-800 text-neutral-100'
                      : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                  }`}
                >
                  <div className="font-medium text-neutral-200">{p.label}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          )}

          {options.depth === 4 && (
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'ibm_pc_16', label: 'IBM PC 16 Color', desc: 'Standard QBasic CGA/EGA/VGA DAC' },
                { id: 'windows_16', label: 'Windows 16', desc: 'Classic Win3.1 / 95 System Palette' },
                { id: 'c64_16', label: 'Commodore 64', desc: 'C64 VIC-II 16-color palette' },
                { id: 'cga_mode1', label: 'CGA Mode 1 (High)', desc: 'Cyan, Magenta, White & Black' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setOptions((prev) => ({ ...prev, paletteId: p.id as PalettePresetId }))}
                  className={`text-left p-2 rounded-lg border text-xs transition-colors ${
                    options.paletteId === p.id
                      ? 'border-amber-500/80 bg-neutral-800 text-neutral-100'
                      : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                  }`}
                >
                  <div className="font-medium text-neutral-200">{p.label}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          )}

          {options.depth === 8 && (
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'adaptive_256', label: 'Adaptive 256', desc: 'Median-Cut optimal for this image' },
                { id: 'vga_256', label: 'Default VGA 256', desc: 'Standard Mode 13h DAC ramp' },
                { id: 'grayscale_256', label: 'Grayscale 256', desc: 'Linear 0-255 luminance scale' },
                { id: 'websafe_216', label: 'Web-Safe 216', desc: '6x6x6 color cube + grays' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setOptions((prev) => ({ ...prev, paletteId: p.id as PalettePresetId }))}
                  className={`text-left p-2 rounded-lg border text-xs transition-colors ${
                    options.paletteId === p.id
                      ? 'border-amber-500/80 bg-neutral-800 text-neutral-100'
                      : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                  }`}
                >
                  <div className="font-medium text-neutral-200">{p.label}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 4. Dithering Algorithms */}
      {options.depth !== 24 && (
        <section className="flex flex-col gap-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-amber-400" />
              Dithering Engine
            </span>
            <span className="text-[11px] text-amber-400 font-mono">
              {Math.round(options.ditherStrength * 100)}%
            </span>
          </label>

          <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-900 rounded-lg border border-neutral-800 text-xs">
            {[
              { id: 'none', label: 'None / Threshold' },
              { id: 'floyd-steinberg', label: 'Floyd-Steinberg' },
              { id: 'atkinson', label: 'Atkinson (Mac)' },
              { id: 'bayer-4x4', label: 'Bayer 4x4' },
              { id: 'bayer-8x8', label: 'Bayer 8x8' },
              { id: 'sierra-lite', label: 'Sierra Lite' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setOptions((prev) => ({ ...prev, ditherMethod: d.id as DitherMethod }))}
                className={`py-1.5 px-2 rounded-md text-center transition-colors truncate ${
                  options.ditherMethod === d.id
                    ? 'bg-neutral-800 text-neutral-100 font-medium border border-neutral-700 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Dither strength slider */}
          {options.ditherMethod !== 'none' && (
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Dither Error Attenuation</span>
                <span className="font-mono text-neutral-300">
                  {Math.round(options.ditherStrength * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={options.ditherStrength}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    ditherStrength: parseFloat(e.target.value),
                  }))
                }
                className="w-full accent-amber-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
              />
            </div>
          )}

          {/* Serpentine toggle */}
          {options.ditherMethod !== 'none' &&
            !options.ditherMethod.startsWith('bayer') && (
              <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-400 hover:text-neutral-300">
                <input
                  type="checkbox"
                  checked={options.serpentine}
                  onChange={(e) =>
                    setOptions((prev) => ({ ...prev, serpentine: e.target.checked }))
                  }
                  className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-0"
                />
                <span>Serpentine raster (alternates left/right to remove directional bias)</span>
              </label>
            )}
        </section>
      )}

      {/* 5. Resolution & Screen Geometry */}
      <section className="flex flex-col gap-2.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            Target Resolution & Aspect
          </span>
          <span className="font-mono text-[11px] text-neutral-400">
            {options.width} x {options.height}
          </span>
        </label>

        {/* Quick retro screen buttons */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handleResolutionPreset('320x200')}
            className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
              options.width === 320 && options.height === 200
                ? 'border-amber-500 bg-neutral-800 text-amber-300 font-semibold'
                : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            320x200 (Mode 13h)
          </button>

          <button
            onClick={() => handleResolutionPreset('640x480')}
            className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
              options.width === 640 && options.height === 480
                ? 'border-amber-500 bg-neutral-800 text-amber-300 font-semibold'
                : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            640x480 (Mode 12h)
          </button>

          <button
            onClick={() => handleResolutionPreset('640x350')}
            className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
              options.width === 640 && options.height === 350
                ? 'border-amber-500 bg-neutral-800 text-amber-300 font-semibold'
                : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            640x350 (EGA Mode 9)
          </button>

          <button
            onClick={() => handleResolutionPreset('160x100')}
            className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
              options.width === 160 && options.height === 100
                ? 'border-amber-500 bg-neutral-800 text-amber-300 font-semibold'
                : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            160x100 (CGA Tweaked)
          </button>

          <button
            onClick={() => handleResolutionPreset('native')}
            className="px-2.5 py-1 text-xs rounded-md border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200"
          >
            Source Native
          </button>
        </div>

        {/* Custom Width / Height Inputs */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div>
            <span className="text-[11px] text-neutral-500 block mb-1">Width (px)</span>
            <input
              type="number"
              min="8"
              max="1920"
              step="8"
              value={options.width}
              onChange={(e) => {
                const w = Math.max(8, parseInt(e.target.value) || 8);
                setOptions((prev) => ({ ...prev, width: w }));
              }}
              className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1 text-xs font-mono"
            />
          </div>
          <div>
            <span className="text-[11px] text-neutral-500 block mb-1">Height (px)</span>
            <input
              type="number"
              min="8"
              max="1200"
              step="4"
              value={options.height}
              onChange={(e) => {
                const h = Math.max(8, parseInt(e.target.value) || 8);
                setOptions((prev) => ({ ...prev, height: h }));
              }}
              className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1 text-xs font-mono"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-400 hover:text-neutral-300">
          <input
            type="checkbox"
            checked={options.maintainAspectRatio}
            onChange={(e) =>
              setOptions((prev) => ({
                ...prev,
                maintainAspectRatio: e.target.checked,
              }))
            }
            className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-0"
          />
          <span>Maintain Aspect Ratio (letterbox / pad with background)</span>
        </label>
      </section>

      {/* 6. Image Pre-Adjustments (Brightness & Contrast & Invert) */}
      <section className="flex flex-col gap-2.5 pt-2 border-t border-neutral-800/80">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            Image Adjustments
          </span>
          {(options.brightness !== 0 || options.contrast !== 0 || options.invert) && (
            <button
              onClick={() =>
                setOptions((prev) => ({
                  ...prev,
                  brightness: 0,
                  contrast: 0,
                  invert: false,
                }))
              }
              className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Reset
            </button>
          )}
        </label>

        <div className="flex flex-col gap-2">
          {/* Brightness */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="flex items-center gap-1">
                <Sun className="w-3 h-3 text-neutral-500" />
                Brightness
              </span>
              <span className="font-mono text-neutral-300">{options.brightness}</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={options.brightness}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  brightness: parseInt(e.target.value),
                }))
              }
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />
          </div>

          {/* Contrast */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="flex items-center gap-1">
                <Contrast className="w-3 h-3 text-neutral-500" />
                Contrast
              </span>
              <span className="font-mono text-neutral-300">{options.contrast}</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={options.contrast}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  contrast: parseInt(e.target.value),
                }))
              }
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />
          </div>

          {/* Invert */}
          <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-400 hover:text-neutral-300 pt-1">
            <input
              type="checkbox"
              checked={options.invert}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, invert: e.target.checked }))
              }
              className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-0"
            />
            <span>Invert Colors (Negative)</span>
          </label>
        </div>
      </section>
    </div>
  );
};
