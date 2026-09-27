export interface SampleImageOption {
  id: string;
  name: string;
  category: string;
  description: string;
  generate: (width: number, height: number) => ImageData;
}

export const SAMPLE_IMAGES: SampleImageOption[] = [
  {
    id: 'gorilla',
    name: 'QBasic GORILLA Tribute',
    category: 'Retro Gaming',
    description: 'Iconic MS-DOS QBasic skyline with building rooftops, full moon, and city lights.',
    generate: (w: number, h: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Deep night sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#000044');
      skyGrad.addColorStop(0.6, '#000088');
      skyGrad.addColorStop(1, '#110033');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Stars
      ctx.fillStyle = '#ffffff';
      const rng = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };
      for (let i = 0; i < 40; i++) {
        const sx = rng(i * 12.3) * w;
        const sy = rng(i * 45.6) * (h * 0.5);
        ctx.fillRect(Math.floor(sx), Math.floor(sy), 1, 1);
      }

      // Bright Full Moon
      const mx = Math.floor(w * 0.78);
      const my = Math.floor(h * 0.22);
      const moonR = Math.max(8, Math.floor(w * 0.08));

      ctx.fillStyle = '#ffffaa';
      ctx.beginPath();
      ctx.arc(mx, my, moonR, 0, Math.PI * 2);
      ctx.fill();

      // Moon craters
      ctx.fillStyle = '#eedd88';
      ctx.beginPath();
      ctx.arc(mx - moonR * 0.3, my - moonR * 0.2, moonR * 0.25, 0, Math.PI * 2);
      ctx.arc(mx + moonR * 0.2, my + moonR * 0.3, moonR * 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Buildings
      const buildingWidth = Math.max(16, Math.floor(w / 7));
      const buildingColors = ['#aa0000', '#00aaaa', '#aa5500', '#00aa00', '#aa00aa', '#aaaaaa', '#0000aa'];
      const heights = [0.55, 0.4, 0.65, 0.45, 0.6, 0.5, 0.7];

      for (let i = 0; i < 7; i++) {
        const bx = i * buildingWidth;
        const bh = Math.floor(h * heights[i % heights.length]);
        const by = h - bh;
        const bCol = buildingColors[i % buildingColors.length];

        ctx.fillStyle = bCol;
        ctx.fillRect(bx, by, buildingWidth - 1, bh);

        // Windows
        ctx.fillStyle = '#ffff55';
        const winW = Math.max(2, Math.floor(buildingWidth * 0.18));
        const winH = Math.max(3, Math.floor(h * 0.035));
        for (let wy = by + 6; wy < h - 8; wy += winH + 4) {
          for (let wx = bx + 4; wx < bx + buildingWidth - 6; wx += winW + 4) {
            if (rng(wx * 11 + wy * 13) > 0.35) {
              ctx.fillRect(wx, wy, winW, winH);
            }
          }
        }
      }

      // Title banner at top
      ctx.fillStyle = '#ffff55';
      ctx.font = `bold ${Math.max(10, Math.floor(h * 0.08))}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText('QBASIC GORILLA', 8, Math.max(14, Math.floor(h * 0.1)));

      return ctx.getImageData(0, 0, w, h);
    },
  },
  {
    id: 'retro_gradient',
    name: 'Synthwave Sunset & Grid',
    category: 'Gradients & Dithering',
    description: 'Smooth gradient skies and perspective grid that push dithering algorithms to the limit.',
    generate: (w: number, h: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Sunset gradient
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.65);
      sky.addColorStop(0, '#0c0728');
      sky.addColorStop(0.3, '#3b1443');
      sky.addColorStop(0.65, '#851c52');
      sky.addColorStop(0.85, '#e03c46');
      sky.addColorStop(1, '#ffb834');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, Math.floor(h * 0.65));

      // Sun
      const sunX = Math.floor(w / 2);
      const sunY = Math.floor(h * 0.42);
      const sunR = Math.floor(h * 0.22);
      const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
      sunGrad.addColorStop(0, '#ffff55');
      sunGrad.addColorStop(0.6, '#ff5555');
      sunGrad.addColorStop(1, '#aa00aa');

      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      ctx.fill();

      // Sun scanline blinds
      ctx.fillStyle = '#851c52';
      for (let sl = sunY - Math.floor(sunR * 0.1); sl < sunY + sunR; sl += Math.max(2, Math.floor(h * 0.03))) {
        const lineH = Math.max(1, Math.floor((sl - (sunY - sunR * 0.1)) / 10));
        ctx.fillRect(sunX - sunR, sl, sunR * 2, lineH);
      }

      // Ground / Tron grid
      const groundH = Math.floor(h * 0.35);
      const groundY = h - groundH;
      ctx.fillStyle = '#0a0518';
      ctx.fillRect(0, groundY, w, groundH);

      // Horizontal grid lines with perspective compression
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 8; i++) {
        const factor = Math.pow(i / 8, 2.2);
        const gy = groundY + Math.floor(groundH * factor);
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      // Perspective vertical grid lines radiating from center
      const vanishingX = w / 2;
      for (let x = -w * 0.6; x <= w * 1.6; x += w / 7) {
        ctx.beginPath();
        ctx.moveTo(vanishingX, groundY);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      return ctx.getImageData(0, 0, w, h);
    },
  },
  {
    id: 'test_ramp',
    name: 'Hardware Test Calibration Ramps',
    category: 'Calibration',
    description: 'RGB & Gray ramps, color swatches, circles, and fine line patterns to test pixel fidelity.',
    generate: (w: number, h: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#222222';
      ctx.fillRect(0, 0, w, h);

      const sectionH = Math.floor(h / 5);

      // 1. Grayscale linear ramp
      for (let x = 0; x < w; x++) {
        const v = Math.floor((x / w) * 255);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x, 0, 1, sectionH);
      }

      // 2. Red & Green ramps
      const halfW = Math.floor(w / 2);
      for (let x = 0; x < halfW; x++) {
        const v = Math.floor((x / halfW) * 255);
        ctx.fillStyle = `rgb(${v}, 0, 0)`;
        ctx.fillRect(x, sectionH, 1, sectionH);
      }
      for (let x = 0; x < halfW; x++) {
        const v = Math.floor((x / halfW) * 255);
        ctx.fillStyle = `rgb(0, ${v}, 0)`;
        ctx.fillRect(halfW + x, sectionH, 1, sectionH);
      }

      // 3. Blue & Cyan ramps
      for (let x = 0; x < halfW; x++) {
        const v = Math.floor((x / halfW) * 255);
        ctx.fillStyle = `rgb(0, 0, ${v})`;
        ctx.fillRect(x, sectionH * 2, 1, sectionH);
      }
      for (let x = 0; x < halfW; x++) {
        const v = Math.floor((x / halfW) * 255);
        ctx.fillStyle = `rgb(0, ${v}, ${v})`;
        ctx.fillRect(halfW + x, sectionH * 2, 1, sectionH);
      }

      // 4. Standard 16 Color Chips
      const chipW = w / 16;
      const ibmColors = [
        '#000000', '#0000aa', '#00aa00', '#00aaaa',
        '#aa0000', '#aa00aa', '#aa5500', '#aaaaaa',
        '#555555', '#5555ff', '#55ff55', '#55ffff',
        '#ff5555', '#ff55ff', '#ffff55', '#ffffff'
      ];
      for (let i = 0; i < 16; i++) {
        ctx.fillStyle = ibmColors[i];
        ctx.fillRect(Math.floor(i * chipW), sectionH * 3, Math.ceil(chipW), sectionH);
      }

      // 5. Test geometry: concentric rings & checkerboard
      const lastY = sectionH * 4;
      const lastH = h - lastY;
      ctx.fillStyle = '#111111';
      ctx.fillRect(0, lastY, w, lastH);

      // Circles
      ctx.lineWidth = 1;
      const cx = Math.floor(w * 0.25);
      const cy = lastY + Math.floor(lastH / 2);
      const maxR = Math.floor(lastH * 0.42);
      for (let r = 4; r <= maxR; r += 4) {
        ctx.strokeStyle = r % 8 === 0 ? '#ffff00' : '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Checkerboard block
      const startX = Math.floor(w * 0.55);
      const cbW = Math.floor(w * 0.4);
      for (let cy = lastY + 2; cy < h - 2; cy += 4) {
        for (let cx = startX; cx < startX + cbW; cx += 4) {
          ctx.fillStyle = ((cx / 4 + cy / 4) % 2 === 0) ? '#ffffff' : '#000000';
          ctx.fillRect(cx, cy, 4, 4);
        }
      }

      return ctx.getImageData(0, 0, w, h);
    },
  },
  {
    id: 'dos_workstation',
    name: '386 MS-DOS PC Workstation',
    category: 'Retro Hardware',
    description: 'Classic beige desktop tower, CRT monitor displaying QBasic blue screen, floppy drive.',
    generate: (w: number, h: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Background office wall
      const wallGrad = ctx.createLinearGradient(0, 0, 0, h);
      wallGrad.addColorStop(0, '#556677');
      wallGrad.addColorStop(0.7, '#334455');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, w, Math.floor(h * 0.72));

      // Desk
      const deskY = Math.floor(h * 0.72);
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(0, deskY, w, h - deskY);
      ctx.fillStyle = '#653a1b';
      ctx.fillRect(0, deskY + 6, w, 4);

      // CRT Monitor Bezel (Classic Beige #d8cfb4)
      const monW = Math.floor(w * 0.55);
      const monH = Math.floor(h * 0.52);
      const monX = Math.floor((w - monW) / 2);
      const monY = Math.floor(h * 0.12);

      // Outer bezel
      ctx.fillStyle = '#dcd3b8';
      ctx.fillRect(monX, monY, monW, monH);

      // Shadowed inner bezel
      ctx.fillStyle = '#b8af94';
      ctx.fillRect(monX + 4, monY + 4, monW - 8, monH - 8);

      // CRT Screen (Dark border + glass)
      const scrW = monW - 20;
      const scrH = monH - 24;
      const scrX = monX + 10;
      const scrY = monY + 8;

      ctx.fillStyle = '#222222';
      ctx.fillRect(scrX, scrY, scrW, scrH);

      // QBasic Blue Screen inside CRT!
      ctx.fillStyle = '#0000aa';
      ctx.fillRect(scrX + 2, scrY + 2, scrW - 4, scrH - 4);

      // Top menu bar (White text on gray)
      ctx.fillStyle = '#aaaaaa';
      ctx.fillRect(scrX + 2, scrY + 2, scrW - 4, Math.max(5, Math.floor(scrH * 0.08)));
      ctx.fillStyle = '#000000';
      ctx.font = `${Math.max(6, Math.floor(scrH * 0.06))}px monospace`;
      ctx.fillText(' File  Edit  View  Search  Run  Debug  Options  Help', scrX + 4, scrY + Math.max(5, Math.floor(scrH * 0.07)));

      // Code text lines
      ctx.fillStyle = '#ffffff';
      const lineY0 = scrY + Math.max(12, Math.floor(scrH * 0.18));
      const step = Math.max(5, Math.floor(scrH * 0.1));
      ctx.fillText('\' Welcome to QBasic!', scrX + 6, lineY0);
      ctx.fillText('SCREEN 13', scrX + 6, lineY0 + step);
      ctx.fillText('PRINT "HELLO WORLD"', scrX + 6, lineY0 + step * 2);
      ctx.fillText('LINE (0,0)-(319,199), 14', scrX + 6, lineY0 + step * 3);

      // Monitor Stand
      const standW = Math.floor(monW * 0.35);
      const standX = monX + Math.floor((monW - standW) / 2);
      ctx.fillStyle = '#c5bc9f';
      ctx.fillRect(standX, monY + monH, standW, deskY - (monY + monH));

      // 3.5" Floppy Disk on desk
      const flopX = Math.floor(w * 0.1);
      const flopY = deskY + Math.floor((h - deskY) * 0.2);
      const flopW = Math.floor(w * 0.12);
      const flopH = Math.floor(flopW * 0.95);
      ctx.fillStyle = '#111111'; // Black floppy shell
      ctx.fillRect(flopX, flopY, flopW, flopH);
      ctx.fillStyle = '#eeeeee'; // White label
      ctx.fillRect(flopX + 2, flopY + 2, flopW - 4, Math.floor(flopH * 0.5));
      ctx.fillStyle = '#aa0000';
      ctx.font = '6px sans-serif';
      ctx.fillText('QBASIC', flopX + 3, flopY + 8);
      ctx.fillStyle = '#888888'; // Metal shutter
      ctx.fillRect(flopX + 4, flopY + Math.floor(flopH * 0.65), flopW - 8, Math.floor(flopH * 0.3));

      return ctx.getImageData(0, 0, w, h);
    },
  },
];
