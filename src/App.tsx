import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BmpDepth,
  ImageProcessingOptions,
  ProcessedBmpData,
} from './types/bmp';
import {
  generateAdaptive256Palette,
  generateGrayscale256Palette,
  generateVga256Palette,
  generateWebSafe216Palette,
  PALETTE_AMBER,
  PALETTE_BW,
  PALETTE_C64_16,
  PALETTE_CGA_MODE1,
  PALETTE_CYBER_BLUE,
  PALETTE_GREEN_PHOSPHOR,
  PALETTE_IBM_PC_16,
  PALETTE_WINDOWS_16,
} from './utils/palettes';
import { quantizeAndDither } from './utils/dithering';
import { createBmpBinary } from './utils/bmpGenerator';
import { generateQBasicCode, QBasicCodeTemplates } from './utils/qbasicCodeGenerator';
import { SAMPLE_IMAGES } from './utils/sampleImages';
import { Header } from './components/Header';
import { ImageControls } from './components/ImageControls';
import { PreviewWorkspace } from './components/PreviewWorkspace';
import { BmpHeaderInspector } from './components/BmpHeaderInspector';
import { QBasicCodeViewer } from './components/QBasicCodeViewer';
import { QBasicSimulator } from './components/QBasicSimulator';
import { HelpModal } from './components/HelpModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'preview' | 'headers' | 'code' | 'simulator'>('preview');
  const [selectedSampleId, setSelectedSampleId] = useState<string>('gorilla');
  const [sourceImageDataUrl, setSourceImageDataUrl] = useState<string>('');
  const [sourceImageDims, setSourceImageDims] = useState<{ width: number; height: number }>({
    width: 320,
    height: 200,
  });

  const [options, setOptions] = useState<ImageProcessingOptions>({
    depth: 8,
    width: 320,
    height: 200,
    maintainAspectRatio: true,
    ditherMethod: 'floyd-steinberg',
    ditherStrength: 0.85,
    serpentine: true,
    paletteId: 'adaptive_256',
    brightness: 0,
    contrast: 0,
    invert: false,
  });

  const [bmpData, setBmpData] = useState<ProcessedBmpData | null>(null);
  const [qbasicTemplates, setQbasicTemplates] = useState<QBasicCodeTemplates | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Raw source image element reference
  const rawImageRef = useRef<HTMLImageElement | null>(null);

  // Load a sample image into source
  const loadSample = useCallback((sampleId: string) => {
    const sample = SAMPLE_IMAGES.find((s) => s.id === sampleId) || SAMPLE_IMAGES[0];
    const imgData = sample.generate(320, 200);

    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 200;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imgData, 0, 0);

    const dataUrl = canvas.toDataURL();
    setSourceImageDataUrl(dataUrl);
    setSourceImageDims({ width: 320, height: 200 });

    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      rawImageRef.current = img;
      processCurrentBitmap(img, options);
    };
    setSelectedSampleId(sampleId);
  }, [options]);

  // Load custom file (upload or drag-drop or paste)
  const loadCustomImageFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        rawImageRef.current = img;
        setSourceImageDataUrl(dataUrl);
        setSourceImageDims({ width: img.naturalWidth, height: img.naturalHeight });
        setSelectedSampleId('');
        processCurrentBitmap(img, options);
      };
    };
    reader.readAsDataURL(file);
  }, [options]);

  // Core image processing pipeline
  const processCurrentBitmap = useCallback(
    (img: HTMLImageElement, opts: ImageProcessingOptions) => {
      const { width: targetW, height: targetH, maintainAspectRatio } = opts;

      // 1. Resample onto canvas
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

      // Fill background with black for letterbox
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, targetW, targetH);

      if (maintainAspectRatio) {
        const srcAspect = img.naturalWidth / img.naturalHeight;
        const targetAspect = targetW / targetH;
        let drawW = targetW;
        let drawH = targetH;
        let drawX = 0;
        let drawY = 0;

        if (srcAspect > targetAspect) {
          drawH = Math.round(targetW / srcAspect);
          drawY = Math.round((targetH - drawH) / 2);
        } else {
          drawW = Math.round(targetH * srcAspect);
          drawX = Math.round((targetW - drawW) / 2);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
      } else {
        ctx.drawImage(img, 0, 0, targetW, targetH);
      }

      const resampledData = ctx.getImageData(0, 0, targetW, targetH);

      // 2. Resolve Palette
      let paletteColors: [number, number, number][] = [];

      if (opts.depth === 1) {
        if (opts.paletteId === 'green_phosphor') paletteColors = PALETTE_GREEN_PHOSPHOR;
        else if (opts.paletteId === 'amber') paletteColors = PALETTE_AMBER;
        else if (opts.paletteId === 'cyber_blue') paletteColors = PALETTE_CYBER_BLUE;
        else paletteColors = PALETTE_BW;
      } else if (opts.depth === 4) {
        if (opts.paletteId === 'windows_16') paletteColors = PALETTE_WINDOWS_16;
        else if (opts.paletteId === 'c64_16') paletteColors = PALETTE_C64_16;
        else if (opts.paletteId === 'cga_mode1') paletteColors = PALETTE_CGA_MODE1;
        else paletteColors = PALETTE_IBM_PC_16;
      } else if (opts.depth === 8) {
        if (opts.paletteId === 'adaptive_256') {
          paletteColors = generateAdaptive256Palette(resampledData, 256);
        } else if (opts.paletteId === 'grayscale_256') {
          paletteColors = generateGrayscale256Palette();
        } else if (opts.paletteId === 'websafe_216') {
          paletteColors = generateWebSafe216Palette();
        } else {
          paletteColors = generateVga256Palette();
        }
      }

      // 3. Dithering & Color Quantization
      let indexedPixels: number[][] = [];
      let rgbPixels: [number, number, number][][] = [];

      if (opts.depth === 24) {
        // Direct RGB with brightness/contrast/invert
        indexedPixels = Array.from({ length: targetH }, () => new Array(targetW).fill(0));
        rgbPixels = Array.from({ length: targetH }, () => new Array(targetW));

        const contrastFactor = (259 * (opts.contrast + 255)) / (255 * (259 - opts.contrast));

        for (let y = 0; y < targetH; y++) {
          for (let x = 0; x < targetW; x++) {
            const idx = (y * targetW + x) * 4;
            let r = resampledData.data[idx];
            let g = resampledData.data[idx + 1];
            let b = resampledData.data[idx + 2];

            if (opts.invert) {
              r = 255 - r;
              g = 255 - g;
              b = 255 - b;
            }
            if (opts.brightness !== 0) {
              r = Math.min(255, Math.max(0, r + opts.brightness * 2.55));
              g = Math.min(255, Math.max(0, g + opts.brightness * 2.55));
              b = Math.min(255, Math.max(0, b + opts.brightness * 2.55));
            }
            if (opts.contrast !== 0) {
              r = Math.min(255, Math.max(0, contrastFactor * (r - 128) + 128));
              g = Math.min(255, Math.max(0, contrastFactor * (g - 128) + 128));
              b = Math.min(255, Math.max(0, contrastFactor * (b - 128) + 128));
            }

            rgbPixels[y][x] = [Math.round(r), Math.round(g), Math.round(b)];
          }
        }
      } else {
        const ditherRes = quantizeAndDither(
          resampledData,
          paletteColors,
          opts.ditherMethod,
          opts.ditherStrength,
          opts.serpentine,
          opts.brightness,
          opts.contrast,
          opts.invert
        );
        indexedPixels = ditherRes.indexed;
        rgbPixels = ditherRes.rgb;
      }

      // 4. Generate BMP Binary & Header Metadata
      const processed = createBmpBinary(
        targetW,
        targetH,
        opts.depth,
        paletteColors,
        indexedPixels,
        rgbPixels
      );

      setBmpData(processed);

      // 5. Generate QBasic Source Code
      const templates = generateQBasicCode(processed, 'IMAGE.BMP');
      setQbasicTemplates(templates);
    },
    []
  );

  // Initialize on mount with first sample
  useEffect(() => {
    loadSample('gorilla');
  }, []);

  // Re-process when options change
  useEffect(() => {
    if (rawImageRef.current) {
      processCurrentBitmap(rawImageRef.current, options);
    }
  }, [options, processCurrentBitmap]);

  // Global Clipboard paste listener (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            loadCustomImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [loadCustomImageFile]);

  // Global Drag & Drop listener
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/') || file.name.endsWith('.bmp')) {
        loadCustomImageFile(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Download BMP Binary
  const handleDownloadBmp = () => {
    if (!bmpData) return;
    const blob = new Blob([bmpData.buffer], { type: 'image/bmp' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IMAGE_${bmpData.depth}BIT_${bmpData.width}x${bmpData.height}.BMP`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download QBasic BAS file
  const handleDownloadBas = (
    codeContent?: string,
    filename: string = 'LOADBMP.BAS'
  ) => {
    if (!qbasicTemplates && !codeContent) return;
    const content = codeContent || qbasicTemplates?.loaderCode || '';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 font-sans overflow-hidden"
    >
      {/* 1. Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadBmp={handleDownloadBmp}
        onDownloadBas={() => handleDownloadBas()}
        onOpenHelp={() => setIsHelpOpen(true)}
        depth={options.depth}
        width={options.width}
        height={options.height}
        fileSize={bmpData?.fileHeader.bfSize || 0}
      />

      {/* 2. Main Content Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Settings & Controls (Collapsible or always visible in preview mode) */}
        {activeTab === 'preview' && (
          <aside className="w-80 border-r border-neutral-800 bg-neutral-900/60 overflow-y-auto p-4 shrink-0 shadow-lg">
            <ImageControls
              options={options}
              setOptions={setOptions}
              onUploadImage={loadCustomImageFile}
              onSelectSample={loadSample}
              selectedSampleId={selectedSampleId}
              sourceImageDimensions={sourceImageDims}
            />
          </aside>
        )}

        {/* Right Main Panel */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {activeTab === 'preview' && (
            <PreviewWorkspace
              sourceImageDataUrl={sourceImageDataUrl}
              bmpData={bmpData}
              ditherMethodName={options.ditherMethod}
            />
          )}

          {activeTab === 'headers' && bmpData && (
            <BmpHeaderInspector bmpData={bmpData} />
          )}

          {activeTab === 'code' && qbasicTemplates && (
            <QBasicCodeViewer
              templates={qbasicTemplates}
              onDownloadBas={handleDownloadBas}
              onDownloadBmp={handleDownloadBmp}
              onOpenSimulator={() => setActiveTab('simulator')}
            />
          )}

          {activeTab === 'simulator' && bmpData && (
            <QBasicSimulator
              bmpData={bmpData}
              code={qbasicTemplates?.loaderCode || ''}
              filename="LOADBMP.BAS"
            />
          )}
        </main>
      </div>

      {/* 3. Documentation & Technical Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
