import React from 'react';
import { X, BookOpen, Terminal, CheckCircle2, AlertTriangle, Monitor } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-neutral-300 text-xs">
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-neutral-100">
              QBasic BMP Programming & Hardware Guide
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6 leading-relaxed">
          {/* Section 1: Overview */}
          <section className="flex flex-col gap-2">
            <h3 className="text-neutral-100 font-semibold text-sm flex items-center gap-2">
              <Monitor className="w-4 h-4 text-sky-400" />
              1. QBasic Graphics Modes & BMP Bit Depths
            </h3>
            <p>
              QBasic supports several historical graphics adapters (CGA, EGA, VGA).
              Depending on your desired color fidelity and resolution, select the appropriate bit depth:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                <span className="font-bold text-amber-400 block mb-1">1-Bit (SCREEN 11)</span>
                <p className="text-neutral-400 text-[11px]">
                  640x480 resolution, 2 colors (monochrome). Packed 8 pixels per byte, MSB first. Very fast file I/O.
                </p>
              </div>
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                <span className="font-bold text-amber-400 block mb-1">4-Bit (SCREEN 12 or 7)</span>
                <p className="text-neutral-400 text-[11px]">
                  640x480 (SCREEN 12) or 320x200 (SCREEN 7), 16 colors. Packed 2 pixels per byte (nibbles). Standard EGA/VGA palette.
                </p>
              </div>
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                <span className="font-bold text-amber-400 block mb-1">8-Bit (SCREEN 13)</span>
                <p className="text-neutral-400 text-[11px]">
                  320x200 resolution, 256 colors. 1 byte per pixel. Supports custom DAC palette programming. Ideal for games and photos!
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Hardware DAC Conversion */}
          <section className="flex flex-col gap-2">
            <h3 className="text-neutral-100 font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              2. The VGA 6-Bit DAC Trapping (OUT &H3C8 / &H3C9)
            </h3>
            <p>
              Windows BMP files specify palette channels (Red, Green, Blue) from <strong>0 to 255</strong> (8 bits per channel).
              However, genuine IBM VGA DAC hardware only supports <strong>6 bits per channel (values 0 to 63)</strong>!
            </p>
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-[11px] text-amber-300">
              OUT &amp;H3C8, colorIndex%<br />
              OUT &amp;H3C9, ASC(r$) \ 4  ' Integer divide by 4 to map 0..255 -&gt; 0..63<br />
              OUT &amp;H3C9, ASC(g$) \ 4<br />
              OUT &amp;H3C9, ASC(b$) \ 4
            </div>
            <p className="text-neutral-400 text-[11px]">
              If you forget to divide by 4, the upper bits will wrap around, creating distorted psychedelic colors!
            </p>
          </section>

          {/* Section 3: 4-Byte Scanline Padding */}
          <section className="flex flex-col gap-2">
            <h3 className="text-neutral-100 font-semibold text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              3. The 4-Byte (32-Bit) Row Alignment Rule
            </h3>
            <p>
              Every scanline row in a BMP file must be padded to a multiple of 4 bytes.
              For example, in an 8-bit image that is 318 pixels wide, 318 bytes are needed for pixels, plus <strong>2 zero padding bytes</strong> to reach 320 bytes (divisible by 4).
            </p>
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-[11px] text-emerald-300">
              RowBytes& = INT((biWidth * biBitCount + 31) / 32) * 4
            </div>
          </section>

          {/* Section 4: Running in DOSBox / QB64 */}
          <section className="flex flex-col gap-2">
            <h3 className="text-neutral-100 font-semibold text-sm flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              4. Running in MS-DOS, DOSBox, or QB64
            </h3>
            <ol className="list-decimal pl-4 flex flex-col gap-1.5 text-neutral-300">
              <li>Download both the <strong>.BMP</strong> and <strong>.BAS</strong> files using the buttons above.</li>
              <li>Place both files in your QBasic folder (e.g. <code className="bg-neutral-950 px-1 py-0.5 rounded text-amber-400">C:\QB45\</code> or mounted DOSBox directory).</li>
              <li>Launch QBasic / QuickBASIC 4.5: <code className="bg-neutral-950 px-1 py-0.5 rounded text-amber-400">qb /l LOADBMP.BAS</code></li>
              <li>Press <kbd className="bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700 text-neutral-200">Shift+F5</kbd> to run!</li>
            </ol>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-900 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md transition-colors text-xs font-medium"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
