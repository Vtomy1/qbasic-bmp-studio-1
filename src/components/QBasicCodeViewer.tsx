import React, { useState } from 'react';
import { QBasicCodeTemplates } from '../utils/qbasicCodeGenerator';
import { Copy, Check, Download, Play, FileCode, BookOpen, Layers } from 'lucide-react';

interface QBasicCodeViewerProps {
  templates: QBasicCodeTemplates;
  onDownloadBas: (code: string, filename: string) => void;
  onDownloadBmp: () => void;
  onOpenSimulator: () => void;
}

export const QBasicCodeViewer: React.FC<QBasicCodeViewerProps> = ({
  templates,
  onDownloadBas,
  onDownloadBmp,
  onOpenSimulator,
}) => {
  const [selectedFile, setSelectedFile] = useState<'loader' | 'saver' | 'inline' | 'spec'>('loader');
  const [copied, setCopied] = useState<boolean>(false);

  const getActiveCode = () => {
    switch (selectedFile) {
      case 'loader':
        return { code: templates.loaderCode, filename: 'LOADBMP.BAS' };
      case 'saver':
        return { code: templates.saverCode, filename: 'SAVEBMP.BAS' };
      case 'inline':
        return { code: templates.inlineDataCode, filename: 'INLINEDAT.BAS' };
      case 'spec':
        return { code: templates.headerSpecText, filename: 'BMP_SPEC.TXT' };
    }
  };

  const active = getActiveCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(active.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple QBasic syntax highlighter renderer
  const renderHighlightedCode = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Check for comment line
      const trimmed = line.trimStart();
      if (trimmed.startsWith("'") || trimmed.startsWith('REM ')) {
        return (
          <div key={idx} className="text-emerald-400/90 font-mono">
            {line}
          </div>
        );
      }

      // Tokenize line simply
      const parts = line.split(/('(?:.*)$)/); // preserve inline comments
      const codePart = parts[0];
      const commentPart = parts[1];

      // Highlight keywords in codePart
      const keywords = [
        'DEFINT', 'DIM', 'AS', 'TYPE', 'END TYPE', 'INTEGER', 'LONG', 'STRING',
        'OPEN', 'FOR', 'BINARY', 'OUTPUT', 'INPUT', 'CLOSE', 'GET', 'PUT', 'SEEK',
        'SCREEN', 'WIDTH', 'CLS', 'PRINT', 'SLEEP', 'SELECT CASE', 'CASE', 'CASE ELSE',
        'END SELECT', 'IF', 'THEN', 'ELSE', 'END IF', 'NEXT', 'TO', 'STEP',
        'PSET', 'POINT', 'OUT', 'INP', 'DEF SEG', 'POKE', 'PEEK', 'DO', 'LOOP',
        'UNTIL', 'INKEY$', 'SUB', 'END SUB', 'DECLARE', 'CALL', 'DATA', 'READ', 'RESTORE',
        'FREEFILE', 'MKI$', 'MKL$', 'CHR$', 'ASC', 'MID$', 'SPACE$', 'STRING$', 'INT'
      ];

      return (
        <div key={idx} className="font-mono text-neutral-200">
          <span dangerouslySetInnerHTML={{
            __html: highlightQBasicLine(codePart, keywords) + (commentPart ? `<span class="text-emerald-400/90">${escapeHtml(commentPart)}</span>` : '')
          }} />
        </div>
      );
    });
  };

  function escapeHtml(str: string) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function highlightQBasicLine(line: string, keywords: string[]) {
    let result = escapeHtml(line);

    // Strings "..."
    result = result.replace(/"([^"]*)"/g, '<span class="text-amber-300">"$1"</span>');

    // Numbers & Hex (&H4D42, 123)
    result = result.replace(/(&amp;H[0-9A-Fa-f]+|\b\d+\b)/g, '<span class="text-purple-300 font-bold">$1</span>');

    // Keywords
    const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
    result = result.replace(keywordRegex, '<span class="text-sky-400 font-bold">$1</span>');

    return result;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-hidden">
      {/* 1. Header Toolbar with File Tabs & Actions */}
      <div className="flex flex-wrap items-center justify-between px-6 py-2.5 bg-neutral-900 border-b border-neutral-800 text-xs gap-3">
        {/* Left: File tabs */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedFile('loader')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              selectedFile === 'loader'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-sky-400" />
            <span>LOADBMP.BAS (Loader)</span>
          </button>

          <button
            onClick={() => setSelectedFile('saver')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              selectedFile === 'saver'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>SAVEBMP.BAS (Saver)</span>
          </button>

          <button
            onClick={() => setSelectedFile('inline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              selectedFile === 'inline'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>INLINEDAT.BAS (DATA)</span>
          </button>

          <button
            onClick={() => setSelectedFile('spec')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              selectedFile === 'spec'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>BMP_SPEC.TXT</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-300 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/80 rounded-md transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-purple-400" />
            <span>Run in DOS IDE</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-md transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>

          <button
            onClick={() => onDownloadBas(active.code, active.filename)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-md shadow-sm transition-colors font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {active.filename}</span>
          </button>
        </div>
      </div>

      {/* 2. Code Display Box with line numbers */}
      <div className="flex-1 overflow-auto p-6 font-mono text-xs leading-relaxed bg-[#0b0e14]">
        <div className="max-w-5xl mx-auto flex gap-4">
          {/* Line numbers */}
          <div className="select-none text-neutral-600 text-right pr-4 border-r border-neutral-800/80">
            {active.code.split('\n').map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Syntax highlighted code */}
          <div className="flex-1 overflow-x-auto whitespace-pre">
            {renderHighlightedCode(active.code)}
          </div>
        </div>
      </div>
    </div>
  );
};
