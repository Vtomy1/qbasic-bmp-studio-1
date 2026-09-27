import React from 'react';
import { Download, Play, FileCode2, Binary, Sliders, Sparkles, HelpCircle } from 'lucide-react';

interface HeaderProps {
  activeTab: 'preview' | 'headers' | 'code' | 'simulator';
  setActiveTab: (tab: 'preview' | 'headers' | 'code' | 'simulator') => void;
  onDownloadBmp: () => void;
  onDownloadBas: () => void;
  onOpenHelp: () => void;
  depth: number;
  width: number;
  height: number;
  fileSize: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onDownloadBmp,
  onDownloadBas,
  onOpenHelp,
  depth,
  width,
  height,
  fileSize,
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <a href="/" className="text-base font-semibold tracking-tight text-neutral-100 flex items-center gap-2.5">
          <span className="w-6 h-6 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono text-xs font-bold border border-amber-500/40">
            QB
          </span>
          <span>QBasic BMP Studio</span>
        </a>
        <div className="hidden lg:flex items-center gap-2 text-xs text-neutral-400 border-l border-neutral-800 pl-3">
          <span className="font-mono text-neutral-300">{width}x{height}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-amber-400">{depth}-bit</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-neutral-300">{(fileSize / 1024).toFixed(1)} KB</span>
        </div>
      </div>

      {/* Zone 2: Navigation / Workspace View Tabs */}
      <nav className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'preview'
              ? 'bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700/50'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span className="whitespace-nowrap">Image & Dither</span>
        </button>

        <button
          onClick={() => setActiveTab('headers')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'headers'
              ? 'bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700/50'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Binary className="w-3.5 h-3.5 text-emerald-400" />
          <span className="whitespace-nowrap">BMP Headers & Hex</span>
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'code'
              ? 'bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700/50'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5 text-sky-400" />
          <span className="whitespace-nowrap">QBasic Code</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'simulator'
              ? 'bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700/50'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Play className="w-3.5 h-3.5 text-purple-400" />
          <span className="whitespace-nowrap">DOS QBasic IDE</span>
        </button>
      </nav>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenHelp}
          title="QBasic BMP Format & Hardware Guide"
          className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={onDownloadBas}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-md transition-colors whitespace-nowrap"
        >
          <FileCode2 className="w-3.5 h-3.5 text-sky-400" />
          <span>Get .BAS</span>
        </button>

        <button
          onClick={onDownloadBmp}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-md shadow-sm transition-colors whitespace-nowrap font-semibold"
        >
          <Download className="w-3.5 h-3.5 text-neutral-950" />
          <span>Save .BMP</span>
        </button>
      </div>
    </header>
  );
};
