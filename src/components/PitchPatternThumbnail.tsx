import React, { useRef, useEffect } from 'react';
import { PitchPatternItem } from '../data/storeItems';

interface PitchPatternThumbnailProps {
  pitch: PitchPatternItem;
  isEquipped?: boolean;
}

export default function PitchPatternThumbnail({ pitch, isEquipped }: PitchPatternThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const { grassDark, grassLight, lineColor, patternType } = pitch.theme;

    // 1. Base Dark Grass
    ctx.fillStyle = grassDark;
    ctx.fillRect(0, 0, w, h);

    // 2. Pattern rendering
    if (patternType === 'stripes') {
      const stripes = 8;
      const sw = w / stripes;
      for (let i = 0; i < stripes; i++) {
        if (i % 2 === 1) {
          ctx.fillStyle = grassLight;
          ctx.fillRect(i * sw, 0, sw, h);
        }
      }
    } else if (patternType === 'horizontal_stripes') {
      const stripes = 10;
      const sh = h / stripes;
      for (let i = 0; i < stripes; i++) {
        if (i % 2 === 1) {
          ctx.fillStyle = grassLight;
          ctx.fillRect(0, i * sh, w, sh);
        }
      }
    } else if (patternType === 'checkerboard') {
      const cols = 8;
      const rows = 6;
      const cw = w / cols;
      const rh = h / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if ((r + c) % 2 === 1) {
            ctx.fillStyle = grassLight;
            ctx.fillRect(c * cw, r * rh, cw, rh);
          }
        }
      }
    } else if (patternType === 'rings') {
      const cx = w / 2;
      const cy = h / 2;
      const rings = 6;
      const rw = Math.hypot(w, h) / 2 / rings;
      for (let i = rings; i >= 0; i--) {
        ctx.fillStyle = i % 2 === 0 ? grassLight : grassDark;
        ctx.beginPath();
        ctx.arc(cx, cy, (i + 1) * rw, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (patternType === 'diamond') {
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(Math.PI / 4);
      const sw = 16;
      const ext = Math.max(w, h) * 1.5;
      for (let x = -ext; x < ext; x += sw * 2) {
        ctx.fillStyle = grassLight;
        ctx.fillRect(x, -ext, sw, ext * 2);
      }
      ctx.restore();
    } else if (patternType === 'diagonal_stripes') {
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(Math.PI / 6);
      const sw = 14;
      const ext = Math.max(w, h) * 1.5;
      for (let x = -ext; x < ext; x += sw * 2) {
        ctx.fillStyle = grassLight;
        ctx.fillRect(x, -ext, sw, ext * 2);
      }
      ctx.restore();
    } else if (patternType === 'chevron' || patternType === 'herringbone') {
      const bh = 18;
      const rows = Math.ceil(h / bh);
      const midX = w / 2;
      for (let r = 0; r < rows; r++) {
        if (r % 2 === 0) {
          ctx.fillStyle = grassLight;
          ctx.beginPath();
          ctx.moveTo(0, r * bh);
          ctx.lineTo(midX, r * bh - 12);
          ctx.lineTo(w, r * bh);
          ctx.lineTo(w, (r + 1) * bh);
          ctx.lineTo(midX, (r + 1) * bh - 12);
          ctx.lineTo(0, (r + 1) * bh);
          ctx.closePath();
          ctx.fill();
        }
      }
    } else if (patternType === 'sunburst' || patternType === 'starburst') {
      const cx = w / 2;
      const cy = h / 2;
      const rays = 16;
      const angle = (Math.PI * 2) / rays;
      const maxR = Math.hypot(w, h);
      for (let i = 0; i < rays; i += 2) {
        ctx.fillStyle = grassLight;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, maxR, i * angle, (i + 1) * angle);
        ctx.closePath();
        ctx.fill();
      }
    } else if (patternType === 'cross_hatch' || patternType === 'tartan') {
      const sw = 16;
      for (let x = 0; x < w; x += sw * 2) {
        ctx.fillStyle = grassLight;
        ctx.fillRect(x, 0, sw, h);
      }
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      for (let y = 0; y < h; y += sw * 2) {
        ctx.fillRect(0, y, w, sw);
      }
    } else if (patternType === 'hexagonal') {
      const r = 14;
      const hh = Math.sqrt(3) * r;
      for (let y = 0; y < h + hh; y += hh * 0.75) {
        const row = Math.floor(y / (hh * 0.75));
        const offX = (row % 2 === 0) ? 0 : r * 1.5;
        for (let x = -r * 2; x < w + r * 2; x += r * 3) {
          ctx.fillStyle = ((Math.floor(x / (r * 3)) + row) % 2 === 0) ? grassLight : grassDark;
          ctx.beginPath();
          for (let a = 0; a < 6; a++) {
            const ang = (Math.PI / 3) * a;
            const hx = x + offX + r * Math.cos(ang);
            const hy = y + r * Math.sin(ang);
            if (a === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.fill();
        }
      }
    } else if (patternType === 'waves') {
      const wh = 20;
      const rows = Math.ceil(h / wh);
      for (let r = 0; r < rows; r++) {
        if (r % 2 === 0) {
          ctx.fillStyle = grassLight;
          ctx.beginPath();
          ctx.moveTo(0, r * wh);
          for (let x = 0; x <= w; x += 10) {
            const yOffset = Math.sin((x / w) * Math.PI * 4) * 6;
            ctx.lineTo(x, r * wh + yOffset);
          }
          ctx.lineTo(w, (r + 1) * wh);
          for (let x = w; x >= 0; x -= 10) {
            const yOffset = Math.sin((x / w) * Math.PI * 4) * 6;
            ctx.lineTo(x, (r + 1) * wh + yOffset);
          }
          ctx.closePath();
          ctx.fill();
        }
      }
    } else if (patternType === 'quadrant') {
      const mx = w / 2;
      const my = h / 2;
      const sw = 12;
      for (let x = 0; x < mx; x += sw * 2) {
        ctx.fillStyle = grassLight;
        ctx.fillRect(x, 0, sw, my);
      }
      for (let x = mx; x < w; x += sw * 2) {
        ctx.fillStyle = grassLight;
        ctx.fillRect(x, my, sw, my);
      }
      const sh = 12;
      for (let y = 0; y < my; y += sh * 2) {
        ctx.fillStyle = grassLight;
        ctx.fillRect(mx, y, mx, sh);
      }
      for (let y = my; y < h; y += sh * 2) {
        ctx.fillStyle = grassLight;
        ctx.fillRect(0, y, mx, sh);
      }
    } else if (patternType === 'boxes') {
      const boxes = 6;
      const sx = (w / 2) / boxes;
      const sy = (h / 2) / boxes;
      for (let i = boxes; i >= 0; i--) {
        ctx.fillStyle = (i % 2 === 0) ? grassLight : grassDark;
        ctx.fillRect((w / 2) - i * sx, (h / 2) - i * sy, i * sx * 2, i * sy * 2);
      }
    } else if (patternType === 'spiral') {
      const cx = w / 2;
      const cy = h / 2;
      const totalRings = 7;
      const rw = 12;
      for (let ring = totalRings; ring >= 0; ring--) {
        ctx.fillStyle = ring % 2 === 0 ? grassLight : grassDark;
        ctx.beginPath();
        ctx.arc(cx, cy, (ring + 1) * rw, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (patternType === 'fine_grid') {
      const cols = 14;
      const rows = 10;
      const cw = w / cols;
      const rh = h / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if ((r + c) % 2 === 1) {
            ctx.fillStyle = grassLight;
            ctx.fillRect(c * cw, r * rh, cw, rh);
          }
        }
      }
    } else {
      // Emerald / uniform fine weave
      const stripes = 12;
      const sw = w / stripes;
      for (let i = 0; i < stripes; i++) {
        if (i % 2 === 1) {
          ctx.fillStyle = grassLight;
          ctx.fillRect(i * sw, 0, sw, h);
        }
      }
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      const hstripes = 14;
      const sh = h / hstripes;
      for (let j = 0; j < hstripes; j++) {
        if (j % 2 === 1) {
          ctx.fillRect(0, j * sh, w, sh);
        }
      }
    }

    // 3. Pitch Stadium Turf Line Markings Overlay (Chalk Line, Penalty Boxes & Center Circle)
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    // Outer boundary line
    const pad = 6;
    ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
    // Halfway line
    ctx.moveTo(pad, h / 2);
    ctx.lineTo(w - pad, h / 2);
    // Center circle
    ctx.moveTo(w / 2 + 16, h / 2);
    ctx.arc(w / 2, h / 2, 16, 0, Math.PI * 2);
    // Top Penalty Area
    ctx.strokeRect(w / 2 - 28, pad, 56, 22);
    // Bottom Penalty Area
    ctx.strokeRect(w / 2 - 28, h - pad - 22, 56, 22);
    ctx.stroke();

    // Center Spot
    ctx.fillStyle = lineColor;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 2, 0, Math.PI * 2);
    ctx.fill();

  }, [pitch]);

  return (
    <div className="w-full h-28 sm:h-36 rounded-[14px] sm:rounded-[18px] border-[2px] sm:border-[2.5px] border-black p-1 sm:p-1.5 mb-2.5 sm:mb-4 relative overflow-hidden flex items-center justify-center bg-slate-900 shadow-inner">
      <canvas
        ref={canvasRef}
        width={240}
        height={160}
        className="w-full h-full rounded-[10px] sm:rounded-[12px] border-[1.5px] border-black object-cover"
      />
    </div>
  );
}
