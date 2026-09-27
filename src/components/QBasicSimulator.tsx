import React, { useState, useEffect, useRef } from 'react';
import { ProcessedBmpData } from '../types/bmp';
import { Play, RotateCcw, Monitor, Pause, FastForward, Tv, X } from 'lucide-react';

interface QBasicSimulatorProps {
  bmpData: ProcessedBmpData;
  code: string;
  filename?: string;
  onClose?: () => void;
}

export const QBasicSimulator: React.FC<QBasicSimulatorProps> = ({
  bmpData,
  code,
  filename = 'LOADBMP.BAS',
  onClose,
}) => {
  const [mode, setMode] = useState<'ide' | 'running' | 'finished'>('ide');
  const [speed, setSpeed] = useState<'slow' | 'medium' | 'instant'>('medium');
  const [crtEffect, setCrtEffect] = useState<boolean>(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [currentScanline, setCurrentScanline] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Screen resolution target
  const targetScreen =
    bmpData.depth === 1 ? 'SCREEN 11 (640x480 Mono)' :
    bmpData.depth === 4 ? 'SCREEN 12 (640x480 16-Color)' :
    'SCREEN 13 (320x200 256-Color VGA)';

  const startExecution = () => {
    setMode('running');
    setActiveMenu(null);
    setCurrentScanline(0);
  };

  const returnToIde = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setMode('ide');
    setCurrentScanline(0);
  };

  // Keyboard shortcut listener for F5
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'ide' && (e.key === 'F5' || (e.shiftKey && e.key === 'F5'))) {
        e.preventDefault();
        startExecution();
      } else if ((mode === 'running' || mode === 'finished') && e.key !== 'F11' && e.key !== 'F12') {
        if (mode === 'finished') {
          returnToIde();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode]);

  // Run graphic execution animation
  useEffect(() => {
    if (mode !== 'running') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = bmpData.width;
    canvas.height = bmpData.height;

    // Clear to black
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, bmpData.width, bmpData.height);

    const imgData = ctx.createImageData(bmpData.width, bmpData.height);

    // Scanlines step: bottom-up from y = height - 1 to 0!
    let curY = bmpData.height - 1;
    const linesPerFrame = speed === 'instant' ? bmpData.height : speed === 'medium' ? 4 : 1;

    const drawLoop = () => {
      for (let s = 0; s < linesPerFrame && curY >= 0; s++, curY--) {
        for (let x = 0; x < bmpData.width; x++) {
          const [r, g, b] = bmpData.rgbPixelGrid[curY][x];
          const pIdx = (curY * bmpData.width + x) * 4;
          imgData.data[pIdx] = r;
          imgData.data[pIdx + 1] = g;
          imgData.data[pIdx + 2] = b;
          imgData.data[pIdx + 3] = 255;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      setCurrentScanline(bmpData.height - 1 - curY);

      if (curY >= 0) {
        animationFrameRef.current = requestAnimationFrame(drawLoop);
      } else {
        setMode('finished');
      }
    };

    animationFrameRef.current = requestAnimationFrame(drawLoop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [mode, speed, bmpData]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0000aa] select-none text-white font-mono text-sm overflow-hidden relative">
      {/* Control bar above the simulator */}
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800 text-xs">
        <div className="flex items-center gap-3 text-neutral-300">
          <span className="flex items-center gap-1.5 font-bold text-amber-400">
            <Monitor className="w-4 h-4" />
            Microsoft QBasic 1.1 / DOSBox Runtime Simulator
          </span>
          <span className="text-neutral-500">|</span>
          <span className="text-neutral-400">Target Mode: <strong className="text-neutral-200">{targetScreen}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          {mode === 'ide' ? (
            <button
              onClick={startExecution}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs shadow transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>RUN (F5)</span>
            </button>
          ) : (
            <button
              onClick={returnToIde}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-xs shadow transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Return to IDE</span>
            </button>
          )}

          {/* Speed controls */}
          <div className="flex items-center bg-neutral-950 p-0.5 rounded border border-neutral-800 text-xs">
            <button
              onClick={() => setSpeed('slow')}
              className={`px-2 py-0.5 rounded text-[11px] ${
                speed === 'slow' ? 'bg-neutral-800 text-amber-400' : 'text-neutral-400'
              }`}
            >
              386 PC
            </button>
            <button
              onClick={() => setSpeed('medium')}
              className={`px-2 py-0.5 rounded text-[11px] ${
                speed === 'medium' ? 'bg-neutral-800 text-amber-400' : 'text-neutral-400'
              }`}
            >
              486 DX
            </button>
            <button
              onClick={() => setSpeed('instant')}
              className={`px-2 py-0.5 rounded text-[11px] ${
                speed === 'instant' ? 'bg-neutral-800 text-amber-400' : 'text-neutral-400'
              }`}
            >
              Instant
            </button>
          </div>

          <button
            onClick={() => setCrtEffect(!crtEffect)}
            className={`p-1.5 rounded border ${
              crtEffect ? 'bg-neutral-800 border-amber-500/60 text-amber-400' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
            }`}
            title="Toggle CRT Scanline Simulation"
          >
            <Tv className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SIMULATOR SCREEN CONTAINER */}
      <div className="flex-1 flex items-center justify-center p-4 bg-neutral-950 overflow-hidden relative">
        <div className="w-full max-w-5xl aspect-[4/3] max-h-[90vh] bg-[#0000aa] border-4 border-[#aaaaaa] shadow-2xl rounded-sm flex flex-col overflow-hidden relative font-['VT323',monospace]">
          {/* CRT Scanline Overlay */}
          {crtEffect && (
            <div className="absolute inset-0 pointer-events-none z-30 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.22),rgba(0,0,0,0.22)_1px,transparent_1px,transparent_2px)]" />
          )}

          {/* VIEW 1: CLASSIC BLUE QBASIC IDE SCREEN */}
          {mode === 'ide' && (
            <div className="flex-1 flex flex-col h-full bg-[#0000aa] text-[#ffffff] select-none">
              {/* DOS Top Menu Bar */}
              <div className="bg-[#aaaaaa] text-[#000000] px-3 py-0.5 flex items-center gap-6 text-base tracking-wide relative z-20">
                {['File', 'Edit', 'View', 'Search', 'Run', 'Debug', 'Options', 'Help'].map((item) => (
                  <div key={item} className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === item ? null : item)}
                      className={`px-1.5 py-0.5 hover:bg-[#0000aa] hover:text-[#ffffff] transition-colors ${
                        activeMenu === item ? 'bg-[#0000aa] text-[#ffffff]' : ''
                      }`}
                    >
                      <span className="underline">{item[0]}</span>
                      {item.slice(1)}
                    </button>

                    {/* Run Dropdown */}
                    {item === 'Run' && activeMenu === 'Run' && (
                      <div className="absolute top-full left-0 bg-[#aaaaaa] text-[#000000] border-2 border-[#000000] shadow-lg py-1 px-1 min-w-[180px] z-30 flex flex-col text-sm">
                        <button
                          onClick={startExecution}
                          className="px-2 py-1 text-left hover:bg-[#0000aa] hover:text-[#ffffff] flex justify-between"
                        >
                          <span><span className="underline">S</span>tart</span>
                          <span className="text-xs text-neutral-800">Shift+F5</span>
                        </button>
                        <button
                          onClick={startExecution}
                          className="px-2 py-1 text-left hover:bg-[#0000aa] hover:text-[#ffffff] flex justify-between"
                        >
                          <span><span className="underline">R</span>estart</span>
                          <span className="text-xs text-neutral-800"></span>
                        </button>
                        <button
                          onClick={startExecution}
                          className="px-2 py-1 text-left hover:bg-[#0000aa] hover:text-[#ffffff] flex justify-between"
                        >
                          <span><span className="underline">C</span>ontinue</span>
                          <span className="text-xs text-neutral-800">F5</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* IDE Main Window Header */}
              <div className="px-2 text-center text-[#55ffff] text-sm py-0.5 bg-[#0000aa] flex items-center justify-between border-b border-[#55ffff]/40">
                <span>[■]</span>
                <span className="font-bold tracking-widest"> {filename} </span>
                <span>▲ ▼</span>
              </div>

              {/* IDE Code Area */}
              <div className="flex-1 overflow-auto p-4 text-[#ffff55] font-['VT323',monospace] text-lg leading-snug whitespace-pre">
                {code.split('\n').slice(0, 32).map((l, i) => (
                  <div key={i} className="flex">
                    <span className="text-[#00aaaa] w-12 select-none">{i + 1} </span>
                    <span className={l.trimStart().startsWith("'") ? 'text-[#00aaaa]' : 'text-[#ffffff]'}>
                      {l}
                    </span>
                  </div>
                ))}
                <div className="flex items-center text-[#ffff55] mt-1">
                  <span className="text-[#00aaaa] w-12 select-none">33 </span>
                  <span className="w-3 h-5 bg-[#ffffff] animate-pulse inline-block" />
                </div>
              </div>

              {/* Immediate Window Divider */}
              <div className="border-t-2 border-[#55ffff] px-3 py-0.5 text-xs text-[#55ffff] flex justify-between bg-[#0000aa]">
                <span>Immediate</span>
                <span>▲ ▼</span>
              </div>
              <div className="h-12 bg-[#0000aa] p-2 text-xs text-[#ffffff]">
                PRINT "QBasic BMP Studio ready. Press F5 to load ${filename}"
              </div>

              {/* DOS Bottom Status Bar */}
              <div className="bg-[#aaaaaa] text-[#000000] px-3 py-1 flex items-center justify-between text-base">
                <div className="flex items-center gap-4">
                  <button onClick={startExecution} className="hover:underline font-bold">
                    &lt;Shift+F5=Restart&gt;
                  </button>
                  <button onClick={startExecution} className="hover:underline font-bold">
                    &lt;F5=Continue&gt;
                  </button>
                  <span>&lt;F1=Help&gt;</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>Line: 1</span>
                  <span>Col: 1</span>
                  <span className="font-bold">C:\{filename}</span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: GRAPHICS EXECUTION SCREEN (SCREEN 11, 12, or 13) */}
          {(mode === 'running' || mode === 'finished') && (
            <div
              onClick={() => mode === 'finished' && returnToIde()}
              className="flex-1 flex flex-col items-center justify-center bg-black cursor-pointer relative"
            >
              {/* Graphic Canvas Output */}
              <canvas
                ref={canvasRef}
                style={{
                  imageRendering: 'pixelated',
                  maxWidth: '92%',
                  maxHeight: '82%',
                  width: bmpData.width * 2,
                  height: bmpData.height * 2,
                }}
                className="border border-[#333333] shadow-lg"
              />

              {/* Scanline loading indicator */}
              {mode === 'running' && (
                <div className="absolute top-3 left-4 bg-black/80 border border-[#555555] px-3 py-1 text-xs text-[#55ff55] font-['VT323',monospace] text-base">
                  Loading {filename}... Scanline: {currentScanline} / {bmpData.height} (Bottom-to-Top)
                </div>
              )}

              {/* Finished Prompt */}
              {mode === 'finished' && (
                <div className="absolute bottom-4 left-0 right-0 text-center text-[#ffffff] font-['VT323',monospace] text-xl animate-pulse">
                  Press any key to return to editor...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
