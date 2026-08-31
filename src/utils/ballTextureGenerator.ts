import { BallTextureItem } from '../data/storeItems';

export function hexToRgb(hex: string): [number, number, number] {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return [255, 255, 255];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// 12 Icosahedron Vertex Centers (Pentagons / Star centers)
const Y_VAL = 1 / Math.sqrt(5); // ~0.4472136
const R_VAL = 2 / Math.sqrt(5); // ~0.8944272

const PENTAGON_CENTERS: { x: number; y: number; z: number }[] = [
  { x: 0, y: 1, z: 0 },  // Top Pole
  { x: 0, y: -1, z: 0 }, // Bottom Pole
];

for (let i = 0; i < 5; i++) {
  const angle = (i * 2 * Math.PI) / 5;
  PENTAGON_CENTERS.push({
    x: R_VAL * Math.sin(angle),
    y: Y_VAL,
    z: R_VAL * Math.cos(angle),
  });
}

for (let i = 0; i < 5; i++) {
  const angle = ((i + 0.5) * 2 * Math.PI) / 5;
  PENTAGON_CENTERS.push({
    x: R_VAL * Math.sin(angle),
    y: -Y_VAL,
    z: R_VAL * Math.cos(angle),
  });
}

// 20 Icosahedron Triangle Face Centroids (Used for Tango triads & Speartips)
const TRIANGLE_CENTERS: { x: number; y: number; z: number }[] = [];
// Upper 5 triangles around top pole (0) with upper ring (2..6)
for (let i = 0; i < 5; i++) {
  const v1 = PENTAGON_CENTERS[0];
  const v2 = PENTAGON_CENTERS[2 + i];
  const v3 = PENTAGON_CENTERS[2 + ((i + 1) % 5)];
  const cx = (v1.x + v2.x + v3.x) / 3;
  const cy = (v1.y + v2.y + v3.y) / 3;
  const cz = (v1.z + v2.z + v3.z) / 3;
  const len = Math.hypot(cx, cy, cz);
  TRIANGLE_CENTERS.push({ x: cx / len, y: cy / len, z: cz / len });
}
// Lower 5 triangles around bottom pole (1) with lower ring (7..11)
for (let i = 0; i < 5; i++) {
  const v1 = PENTAGON_CENTERS[1];
  const v2 = PENTAGON_CENTERS[7 + i];
  const v3 = PENTAGON_CENTERS[7 + ((i + 1) % 5)];
  const cx = (v1.x + v2.x + v3.x) / 3;
  const cy = (v1.y + v2.y + v3.y) / 3;
  const cz = (v1.z + v2.z + v3.z) / 3;
  const len = Math.hypot(cx, cy, cz);
  TRIANGLE_CENTERS.push({ x: cx / len, y: cy / len, z: cz / len });
}
// Middle 10 equatorial zigzag triangles
for (let i = 0; i < 5; i++) {
  const u1 = PENTAGON_CENTERS[2 + i];
  const u2 = PENTAGON_CENTERS[2 + ((i + 1) % 5)];
  const l1 = PENTAGON_CENTERS[7 + i];
  let cx = (u1.x + u2.x + l1.x) / 3;
  let cy = (u1.y + u2.y + l1.y) / 3;
  let cz = (u1.z + u2.z + l1.z) / 3;
  let len = Math.hypot(cx, cy, cz);
  TRIANGLE_CENTERS.push({ x: cx / len, y: cy / len, z: cz / len });

  const l2 = PENTAGON_CENTERS[7 + ((i + 4) % 5)];
  cx = (l1.x + l2.x + u1.x) / 3;
  cy = (l1.y + l2.y + u1.y) / 3;
  cz = (l1.z + l2.z + u1.z) / 3;
  len = Math.hypot(cx, cy, cz);
  TRIANGLE_CENTERS.push({ x: cx / len, y: cy / len, z: cz / len });
}

// 4 Tetrahedral axes (used for Fevernova shuriken & flame blades)
const TETRA_AXES = [
  { x: 1 / Math.sqrt(3), y: 1 / Math.sqrt(3), z: 1 / Math.sqrt(3) },
  { x: -1 / Math.sqrt(3), y: -1 / Math.sqrt(3), z: 1 / Math.sqrt(3) },
  { x: -1 / Math.sqrt(3), y: 1 / Math.sqrt(3), z: -1 / Math.sqrt(3) },
  { x: 1 / Math.sqrt(3), y: -1 / Math.sqrt(3), z: -1 / Math.sqrt(3) },
];

/**
 * Core 3D Spherical Pattern Shader - Evaluates the exact RGB color at any (px, py, pz) unit vector
 */
export function sampleBallPatternColor(
  px: number,
  py: number,
  pz: number,
  lon: number,
  lat: number,
  ballItem: BallTextureItem
): [number, number, number] {
  const { baseColor, panelColor, trimColor, seamColor, style } = ballItem.theme;

  const baseRgb = hexToRgb(baseColor);
  const panelRgb = hexToRgb(panelColor);
  const trimRgb = hexToRgb(trimColor);
  const seamRgb = hexToRgb(seamColor);

  let r = baseRgb[0];
  let g = baseRgb[1];
  let b = baseRgb[2];

  if (style === 'target_rings') {
    // --- 1. Concentric Target Rings Bullseye ---
    const poleX = 0.35;
    const poleY = 0.42;
    const poleZ = 0.837;
    const dotPole = Math.max(-1, Math.min(1, px * poleX + py * poleY + pz * poleZ));
    const theta = Math.acos(dotPole); // 0 to PI

    if (theta < 0.18) {
      // Center Bullseye
      r = panelRgb[0]; g = panelRgb[1]; b = panelRgb[2];
    } else if (theta < 0.23) {
      // Ring 1 Trim
      r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
    } else if (theta < 0.38) {
      // Ring 2 Base Field
      r = baseRgb[0]; g = baseRgb[1]; b = baseRgb[2];
    } else if (theta < 0.43) {
      // Ring 3 Seam Accent
      r = seamRgb[0]; g = seamRgb[1]; b = seamRgb[2];
    } else if (theta < 0.64) {
      // Ring 4 Wide Panel
      r = panelRgb[0]; g = panelRgb[1]; b = panelRgb[2];
    } else if (theta < 0.69) {
      // Ring 5 Trim
      r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
    } else if (theta < 0.82) {
      // Ring 6 Base
      r = baseRgb[0]; g = baseRgb[1]; b = baseRgb[2];
    } else if (theta < 1.45) {
      // Equatorial Band with Racing Stripes
      if ((theta >= 0.96 && theta <= 1.05) || (theta >= 1.20 && theta <= 1.29)) {
        r = seamRgb[0]; g = seamRgb[1]; b = seamRgb[2];
      } else {
        r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
      }
    } else if (theta < 1.60) {
      r = seamRgb[0]; g = seamRgb[1]; b = seamRgb[2];
    } else {
      r = panelRgb[0]; g = panelRgb[1]; b = panelRgb[2];
    }

    // Concentric grooves
    const ringBoundaries = [0.18, 0.23, 0.38, 0.43, 0.64, 0.69, 0.82, 0.96, 1.05, 1.20, 1.29];
    let minRingDist = 999;
    for (let i = 0; i < ringBoundaries.length; i++) {
      const d = Math.abs(theta - ringBoundaries[i]);
      if (d < minRingDist) minRingDist = d;
    }
    if (minRingDist < 0.008) {
      r = Math.floor(r * 0.72);
      g = Math.floor(g * 0.72);
      b = Math.floor(b * 0.72);
    }

  } else if (style === 'tango') {
    // --- 2. Classic Tango 20-Triad Wings ---
    let maxPentDot = -1;
    for (let c = 0; c < 12; c++) {
      const center = PENTAGON_CENTERS[c];
      const dot = px * center.x + py * center.y + pz * center.z;
      if (dot > maxPentDot) maxPentDot = dot;
    }

    let maxTriDot = -1;
    for (let t = 0; t < 20; t++) {
      const triCenter = TRIANGLE_CENTERS[t];
      const dot = px * triCenter.x + py * triCenter.y + pz * triCenter.z;
      if (dot > maxTriDot) maxTriDot = dot;
    }

    const grain = ((Math.sin(px * 120) * Math.cos(py * 120) * 8) | 0);

    // Inside the 20 Triads (facing triangle centroids)
    if (maxTriDot > 0.875) {
      // Triad wing body
      const triadRatio = (maxTriDot - 0.875) / (1.0 - 0.875); // 0 at outer edge, 1 at center

      // Concentric pinstripe arcs inside the triad
      const isPinstripe1 = triadRatio >= 0.28 && triadRatio <= 0.40;
      const isPinstripe2 = triadRatio >= 0.58 && triadRatio <= 0.70;

      if (isPinstripe1 || isPinstripe2) {
        // Pinstripe accent in trim or base
        r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
      } else {
        // Solid curved triad body
        r = panelRgb[0]; g = panelRgb[1]; b = panelRgb[2];
      }
    } else {
      // White/Base Interstitial Hexagonal & Pentagon Leather
      r = Math.max(0, Math.min(255, baseRgb[0] + grain));
      g = Math.max(0, Math.min(255, baseRgb[1] + grain));
      b = Math.max(0, Math.min(255, baseRgb[2] + grain));

      // Seam edge around triad
      if (maxTriDot > 0.862) {
        r = seamRgb[0]; g = seamRgb[1]; b = seamRgb[2];
      }
    }

  } else if (style === 'usa_chevron') {
    // --- 3. USA Chevron / Nordic Valkyrie Panels ---
    let maxPentDot = -1;
    let secondPentDot = -1;
    let nearestIdx = 0;

    for (let c = 0; c < 12; c++) {
      const center = PENTAGON_CENTERS[c];
      const dot = px * center.x + py * center.y + pz * center.z;
      if (dot > maxPentDot) {
        secondPentDot = maxPentDot;
        maxPentDot = dot;
        nearestIdx = c;
      } else if (dot > secondPentDot) {
        secondPentDot = dot;
      }
    }

    const isHexSeam = (maxPentDot - secondPentDot) < 0.018 && maxPentDot < 0.938;
    const center = PENTAGON_CENTERS[nearestIdx];

    const up = Math.abs(center.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
    const tx = up.y * center.z - up.z * center.y;
    const ty = up.z * center.x - up.x * center.z;
    const tz = up.x * center.y - up.y * center.x;
    const tLen = Math.hypot(tx, ty, tz);
    const ux = tx / tLen; const uy = ty / tLen; const uz = tz / tLen;
    const vx = center.y * uz - center.z * uy;
    const vy = center.z * ux - center.x * uz;
    const vz = center.x * uy - center.y * ux;

    const projX = px * ux + py * uy + pz * uz;
    const projY = px * vx + py * vy + pz * vz;
    const localAngle = Math.atan2(projY, projX);

    if (maxPentDot > 0.938) {
      // Pentagon Center
      r = baseRgb[0]; g = baseRgb[1]; b = baseRgb[2];
      if (maxPentDot > 0.965) {
        const pStarDist = Math.hypot(projX, projY);
        const starR = 0.12 + 0.05 * Math.cos(5 * localAngle);
        if (pStarDist < starR) {
          r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
        }
      }
    } else if (maxPentDot > 0.74) {
      const sectorAngle = ((localAngle + Math.PI) % ((2 * Math.PI) / 5)) - (Math.PI / 5);
      const isChevronArm = Math.abs(sectorAngle) < 0.42;

      if (isChevronArm) {
        if (maxPentDot < 0.775) {
          r = panelRgb[0]; g = panelRgb[1]; b = panelRgb[2];
        } else if (maxPentDot > 0.915) {
          r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
        } else {
          const stripeCycle = Math.sin(maxPentDot * 85 + localAngle * 8);
          if (stripeCycle > 0.1) {
            r = panelRgb[0]; g = panelRgb[1]; b = panelRgb[2];
          } else {
            r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
          }
        }
      } else {
        r = baseRgb[0]; g = baseRgb[1]; b = baseRgb[2];
      }
    } else {
      r = baseRgb[0]; g = baseRgb[1]; b = baseRgb[2];
    }

    if (isHexSeam || (maxPentDot > 0.932 && maxPentDot < 0.944)) {
      r = seamRgb[0]; g = seamRgb[1]; b = seamRgb[2];
    }

  } else if (style === 'trionda') {
    // --- 4. Trionda 2026 Flowing Ribbon Ribbons ---
    r = baseRgb[0]; g = baseRgb[1]; b = baseRgb[2];

    const ribbon1Path = Math.sin(2.4 * lon + 1.8 * lat) + 0.35 * Math.cos(3 * lat);
    const distRibbon1 = Math.abs(ribbon1Path);

    const ribbon2Path = Math.sin(2.4 * (lon + 2.1) - 1.8 * lat) + 0.35 * Math.sin(3 * px);
    const distRibbon2 = Math.abs(ribbon2Path);

    const ribbon3Path = Math.cos(2.4 * (lon - 2.1) + 2.2 * py) + 0.35 * Math.cos(3 * pz);
    const distRibbon3 = Math.abs(ribbon3Path);

    const starGrid = Math.sin(lon * 9) * Math.sin(lat * 9);
    const isStar = starGrid > 0.68;

    if (distRibbon1 < 0.28) {
      if (distRibbon1 > 0.245) {
        r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
      } else if (isStar) {
        r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
      } else {
        r = panelRgb[0]; g = panelRgb[1]; b = panelRgb[2];
      }
    } else if (distRibbon2 < 0.28) {
      if (distRibbon2 > 0.245) {
        r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
      } else if (isStar) {
        r = 255; g = 255; b = 255;
      } else {
        r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
      }
    } else if (distRibbon3 < 0.28) {
      if (distRibbon3 > 0.245) {
        r = seamRgb[0]; g = seamRgb[1]; b = seamRgb[2];
      } else {
        r = panelRgb[0]; g = panelRgb[1]; b = panelRgb[2];
      }
    }

    const seamTrack = Math.min(distRibbon1, distRibbon2, distRibbon3);
    if (seamTrack < 0.015) {
      r = seamRgb[0]; g = seamRgb[1]; b = seamRgb[2];
    }

  } else if (style === 'pl_radar') {
    // --- 5. Premier Radar & High-Vis Aerodynamic Contours ---
    r = baseRgb[0]; g = baseRgb[1]; b = baseRgb[2];

    const radar1 = Math.abs(Math.sin(lon * 2.2 + lat * 2.2));
    const radar2 = Math.abs(Math.sin(lat * 3.2 - lon * 1.6));
    const contourVal = radar1 * 0.55 + radar2 * 0.45;

    const dimple = (Math.sin(px * 80) * Math.cos(py * 80) * Math.sin(pz * 80));

    if (contourVal > 0.72 && contourVal <= 0.86) {
      // Primary contour band
      r = panelRgb[0]; g = panelRgb[1]; b = panelRgb[2];
    } else if (contourVal > 0.58 && contourVal <= 0.72) {
      // Secondary contour band
      r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
    } else if (contourVal > 0.86 && contourVal <= 0.90) {
      // Accent ring
      r = seamRgb[0]; g = seamRgb[1]; b = seamRgb[2];
    } else {
      const dShade = dimple > 0.65 ? -20 : 0;
      r = Math.max(0, Math.min(255, baseRgb[0] + dShade));
      g = Math.max(0, Math.min(255, baseRgb[1] + dShade));
      b = Math.max(0, Math.min(255, baseRgb[2] + dShade));
    }

    // Aerodynamic Bracket in seam color
    const arrowSeam = Math.abs(Math.sin(lon * 4 + lat * 4));
    if (arrowSeam > 0.94 && contourVal > 0.50) {
      r = seamRgb[0]; g = seamRgb[1]; b = seamRgb[2];
    }

  } else if (style === 'teal_leather') {
    // --- 6. Luxury Embossed Stitched Leather ---
    let maxPentDot = -1;
    let secondPentDot = -1;

    for (let c = 0; c < 12; c++) {
      const center = PENTAGON_CENTERS[c];
      const dot = px * center.x + py * center.y + pz * center.z;
      if (dot > maxPentDot) {
        secondPentDot = maxPentDot;
        maxPentDot = dot;
      } else if (dot > secondPentDot) {
        secondPentDot = dot;
      }
    }

    const dotDiff = maxPentDot - secondPentDot;
    const isHexSeam = dotDiff < 0.020 && maxPentDot < 0.938;
    const isPentSeam = Math.abs(maxPentDot - 0.938) < 0.015;

    const grain = ((Math.sin(px * 130) * Math.cos(py * 130) * 12) + (Math.sin(pz * 150) * 8)) | 0;
    const edgeDist = Math.max(0, Math.min(0.08, Math.min(dotDiff, Math.abs(0.938 - maxPentDot))));
    const pillowBevel = Math.pow(edgeDist / 0.08, 0.45);

    // Dynamic base leather with pillowed shading
    const fR = Math.max(0, Math.min(255, baseRgb[0] + Math.floor(pillowBevel * 25) + grain));
    const fG = Math.max(0, Math.min(255, baseRgb[1] + Math.floor(pillowBevel * 25) + grain));
    const fB = Math.max(0, Math.min(255, baseRgb[2] + Math.floor(pillowBevel * 25) + grain));

    r = fR; g = fG; b = fB;

    if (isHexSeam || isPentSeam) {
      const stitchCycle = Math.sin(lon * 75 + lat * 75);
      if (Math.abs(stitchCycle) > 0.45) {
        // Saddle stitch thread
        r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
      } else {
        // Seam groove
        r = seamRgb[0]; g = seamRgb[1]; b = seamRgb[2];
      }
    }

  } else if (style === 'star_mosaic') {
    // --- 7. Geometric Star Mosaic Tessellation ---
    let maxPentDot = -1;
    let nearestIdx = 0;
    for (let c = 0; c < 12; c++) {
      const center = PENTAGON_CENTERS[c];
      const dot = px * center.x + py * center.y + pz * center.z;
      if (dot > maxPentDot) {
        maxPentDot = dot;
        nearestIdx = c;
      }
    }

    let maxTriDot = -1;
    for (let t = 0; t < 20; t++) {
      const triCenter = TRIANGLE_CENTERS[t];
      const dot = px * triCenter.x + py * triCenter.y + pz * triCenter.z;
      if (dot > maxTriDot) maxTriDot = dot;
    }

    const center = PENTAGON_CENTERS[nearestIdx];
    const up = Math.abs(center.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
    const tx = up.y * center.z - up.z * center.y;
    const ty = up.z * center.x - up.x * center.z;
    const tz = up.x * center.y - up.y * center.x;
    const tLen = Math.hypot(tx, ty, tz);
    const ux = tx / tLen; const uy = ty / tLen; const uz = tz / tLen;
    const vx = center.y * uz - center.z * uy;
    const vy = center.z * ux - center.x * uz;
    const vz = center.x * uy - center.y * ux;

    const projX = px * ux + py * uy + pz * uz;
    const projY = px * vx + py * vy + pz * vz;
    const starAngle = Math.atan2(projY, projX);
    const distFromCenter = Math.acos(Math.max(-1, Math.min(1, maxPentDot)));

    const rStar = 0.38 + 0.14 * Math.cos(8 * starAngle);
    const isInsideStar = distFromCenter < rStar || maxTriDot > 0.86;
    const isStarBorder = Math.abs(distFromCenter - rStar) < 0.025;

    const brushGrain = ((Math.sin((px + py) * 65) * 18) | 0);

    if (isStarBorder) {
      r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
    } else if (isInsideStar) {
      r = Math.max(0, Math.min(255, panelRgb[0] + brushGrain));
      g = Math.max(0, Math.min(255, panelRgb[1] + brushGrain));
      b = Math.max(0, Math.min(255, panelRgb[2] + brushGrain));
    } else {
      r = Math.max(0, Math.min(255, seamRgb[0] + brushGrain));
      g = Math.max(0, Math.min(255, seamRgb[1] + brushGrain));
      b = Math.max(0, Math.min(255, seamRgb[2] + brushGrain));
    }

  } else if (style === 'rainbow_dodgeball') {
    // --- 8. Spectral Rubber Playground Ball ---
    const t = Math.max(0, Math.min(1, (px * 0.85 + py * 0.35 + 1.0) / 2.0));

    // Dynamic 3-color spectral gradient: base -> panel -> trim
    if (t < 0.5) {
      const f = t / 0.5;
      r = Math.floor(baseRgb[0] + f * (panelRgb[0] - baseRgb[0]));
      g = Math.floor(baseRgb[1] + f * (panelRgb[1] - baseRgb[1]));
      b = Math.floor(baseRgb[2] + f * (panelRgb[2] - baseRgb[2]));
    } else {
      const f = (t - 0.5) / 0.5;
      r = Math.floor(panelRgb[0] + f * (trimRgb[0] - panelRgb[0]));
      g = Math.floor(panelRgb[1] + f * (trimRgb[1] - panelRgb[1]));
      b = Math.floor(panelRgb[2] + f * (trimRgb[2] - panelRgb[2]));
    }

    // Embossed Rubber Waffle Grip Texture
    const gridU = Math.abs(Math.sin(lon * 44));
    const gridV = Math.abs(Math.sin(lat * 44));
    const isWaffleRaised = (gridU > 0.82) !== (gridV > 0.82);
    const rubberShade = isWaffleRaised ? 18 : -14;

    r = Math.max(0, Math.min(255, r + rubberShade));
    g = Math.max(0, Math.min(255, g + rubberShade));
    b = Math.max(0, Math.min(255, b + rubberShade));

    if (Math.abs(py) < 0.012) {
      r = Math.floor(r * 0.75);
      g = Math.floor(g * 0.75);
      b = Math.floor(b * 0.75);
    }

  } else if (style === 'aero_swirl') {
    // --- 9. 18-Panel Tri-Color Swirl ---
    const ax = Math.abs(px);
    const ay = Math.abs(py);
    const az = Math.abs(pz);

    let u = 0;
    let v = 0;
    let isVerticalStripes = false;
    let isWhiteFace = false;

    if (az >= ax && az >= ay) {
      u = px / az;
      v = py / az;
      isVerticalStripes = true;
      isWhiteFace = true;
    } else if (ax >= ay && ax >= az) {
      u = (px > 0 ? -pz : pz) / ax;
      v = py / ax;
      isVerticalStripes = false;
      isWhiteFace = false;
    } else {
      u = px / ay;
      v = (py > 0 ? -pz : pz) / ay;
      isVerticalStripes = false;
      isWhiteFace = false;
    }

    let distInternalSeam = 0;
    if (isVerticalStripes) {
      distInternalSeam = Math.min(Math.abs(u - (-0.333)), Math.abs(u - 0.333));
      if (u < -0.333 || u > 0.333) {
        r = isWhiteFace ? baseRgb[0] : panelRgb[0];
        g = isWhiteFace ? baseRgb[1] : panelRgb[1];
        b = isWhiteFace ? baseRgb[2] : panelRgb[2];
      } else {
        r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
      }
    } else {
      distInternalSeam = Math.min(Math.abs(v - (-0.333)), Math.abs(v - 0.333));
      if (v < -0.333 || v > 0.333) {
        r = isWhiteFace ? baseRgb[0] : panelRgb[0];
        g = isWhiteFace ? baseRgb[1] : panelRgb[1];
        b = isWhiteFace ? baseRgb[2] : panelRgb[2];
      } else {
        r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
      }
    }

    const distBoundary = Math.min(1.0 - Math.abs(u), 1.0 - Math.abs(v));
    const minSeamDist = Math.min(distInternalSeam, distBoundary);

    if (minSeamDist < 0.025) {
      r = seamRgb[0]; g = seamRgb[1]; b = seamRgb[2];
    } else if (minSeamDist < 0.055) {
      const highlight = 1.0 + 0.12 * (1.0 - (minSeamDist - 0.025) / 0.03);
      r = Math.min(255, Math.floor(r * highlight));
      g = Math.min(255, Math.floor(g * highlight));
      b = Math.min(255, Math.floor(b * highlight));
    }

  } else if (style === 'star') {
    // --- 10. Champions League Starball ---
    let insideStar = false;
    let isStarTrim = false;
    let isStarSeam = false;

    for (let c = 0; c < 12; c++) {
      const center = PENTAGON_CENTERS[c];
      const dot = px * center.x + py * center.y + pz * center.z;
      if (dot > 0.5) {
        const up = Math.abs(center.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
        const tangentX = {
          x: up.y * center.z - up.z * center.y,
          y: up.z * center.x - up.x * center.z,
          z: up.x * center.y - up.y * center.x,
        };
        const lenTX = Math.hypot(tangentX.x, tangentX.y, tangentX.z);
        tangentX.x /= lenTX; tangentX.y /= lenTX; tangentX.z /= lenTX;

        const tangentY = {
          x: center.y * tangentX.z - center.z * tangentX.y,
          y: center.z * tangentX.x - center.x * tangentX.z,
          z: center.x * tangentX.y - center.y * tangentX.x,
        };

        const projX = px * tangentX.x + py * tangentX.y + pz * tangentX.z;
        const projY = px * tangentY.x + py * tangentY.y + pz * tangentY.z;
        const angle = Math.atan2(projY, projX);
        const dist = Math.acos(Math.max(-1, Math.min(1, dot)));

        const rStar = 0.40 + 0.18 * Math.cos(5 * angle);
        if (dist < rStar) {
          insideStar = true;
          if (dist > rStar - 0.035) isStarTrim = true;
          if (dist > rStar - 0.012) isStarSeam = true;
          break;
        }
      }
    }

    if (isStarSeam) {
      r = seamRgb[0]; g = seamRgb[1]; b = seamRgb[2];
    } else if (isStarTrim) {
      r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
    } else if (insideStar) {
      r = panelRgb[0]; g = panelRgb[1]; b = panelRgb[2];
    } else {
      r = baseRgb[0]; g = baseRgb[1]; b = baseRgb[2];
    }

  } else if (style === 'blaze') {
    // --- 11. Fevernova / Flame Blades ---
    let insideFlame = false;
    let isFlameTrim = false;
    let isFlameSeam = false;

    for (let t = 0; t < 4; t++) {
      const axis = TETRA_AXES[t];
      const dot = px * axis.x + py * axis.y + pz * axis.z;
      if (dot > 0.2) {
        const up = Math.abs(axis.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
        const tx = up.y * axis.z - up.z * axis.y;
        const ty = up.z * axis.x - up.x * axis.z;
        const tz = up.x * axis.y - up.y * axis.x;
        const tLen = Math.hypot(tx, ty, tz);
        const ux = tx / tLen; const uy = ty / tLen; const uz = tz / tLen;
        const vx = axis.y * uz - axis.z * uy;
        const vy = axis.z * ux - axis.x * uz;
        const vz = axis.x * uy - axis.y * ux;

        const projX = px * ux + py * uy + pz * uz;
        const projY = px * vx + py * vy + pz * vz;
        const angle = Math.atan2(projY, projX);
        const dist = Math.acos(Math.max(-1, Math.min(1, dot)));

        const rFlame = 0.58 * Math.pow(Math.max(0, Math.cos(3 * (angle + 0.3))), 1.8);
        if (dist < rFlame) {
          insideFlame = true;
          if (dist > rFlame * 0.72) isFlameTrim = true;
          if (dist > rFlame * 0.92) isFlameSeam = true;
          break;
        }
      }
    }

    if (isFlameSeam) {
      r = seamRgb[0]; g = seamRgb[1]; b = seamRgb[2];
    } else if (isFlameTrim) {
      r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
    } else if (insideFlame) {
      r = panelRgb[0]; g = panelRgb[1]; b = panelRgb[2];
    } else {
      r = baseRgb[0]; g = baseRgb[1]; b = baseRgb[2];
    }

  } else if (style === 'sakura') {
    // --- 12. Tokyo Sakura Cherry Blossom ---
    r = baseRgb[0]; g = baseRgb[1]; b = baseRgb[2];

    const petalAngle = Math.atan2(py, px);
    const petalDist = Math.hypot(px, py);
    const rPetals = 0.35 + 0.15 * Math.cos(5 * petalAngle);

    if (pz > 0.2 && petalDist < rPetals) {
      if (petalDist > rPetals - 0.04) {
        r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
      } else {
        r = panelRgb[0]; g = panelRgb[1]; b = panelRgb[2];
      }
    } else {
      const swirlLine = Math.sin(lon * 6 + lat * 3);
      if (Math.abs(swirlLine) < 0.15) {
        r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
      }
    }

  } else if (style === 'vortex') {
    // --- 13. Hyper Vortex Knuckleball ---
    const vortexSpiral = Math.sin(lon * 4 + lat * 6 + px * 2);
    if (Math.abs(vortexSpiral) < 0.35) {
      r = panelRgb[0]; g = panelRgb[1]; b = panelRgb[2];
    } else if (Math.abs(vortexSpiral) < 0.55) {
      r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
    } else {
      r = baseRgb[0]; g = baseRgb[1]; b = baseRgb[2];
    }

  } else if (style === 'cyber') {
    // --- 14. Cyberpunk Matrix 2077 Wireframe ---
    r = baseRgb[0]; g = baseRgb[1]; b = baseRgb[2];

    const gridU = Math.abs(Math.sin(lon * 18));
    const gridV = Math.abs(Math.sin(lat * 18));
    const isWireframe = gridU > 0.88 || gridV > 0.88;

    if (isWireframe) {
      r = panelRgb[0]; g = panelRgb[1]; b = panelRgb[2];
    } else if (gridU > 0.80 || gridV > 0.80) {
      r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
    }

  } else if (style === 'carbon') {
    // --- 15. Formula Carbon Fiber Weave ---
    const weaveU = Math.floor((lon + Math.PI) * 40);
    const weaveV = Math.floor((lat + Math.PI / 2) * 40);
    const isWeave = (weaveU + weaveV) % 2 === 0;

    r = isWeave ? panelRgb[0] : baseRgb[0];
    g = isWeave ? panelRgb[1] : baseRgb[1];
    b = isWeave ? panelRgb[2] : baseRgb[2];

    // Racing Pinstripe in trim color
    if (Math.abs(px) < 0.04 || Math.abs(py) < 0.04) {
      r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
    }

  } else if (style === 'arctic') {
    // --- 16. Glacial Frost Subzero Ice Crystals ---
    const frost = Math.sin(lon * 12) * Math.cos(lat * 12) + Math.sin(px * 15 + py * 15);
    if (frost > 0.6) {
      r = panelRgb[0]; g = panelRgb[1]; b = panelRgb[2];
    } else if (frost > 0.2) {
      r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
    } else {
      r = baseRgb[0]; g = baseRgb[1]; b = baseRgb[2];
    }

  } else if (style === 'gold') {
    // --- 17. Ballon d'Or 24K Luxury ---
    const meridianSegments = Math.abs(Math.sin(lon * 4));
    const polarBands = Math.abs(py);

    if (polarBands > 0.82) {
      r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
    } else if (meridianSegments > 0.88) {
      r = seamRgb[0]; g = seamRgb[1]; b = seamRgb[2];
    } else if (meridianSegments > 0.78) {
      r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
    } else {
      r = panelRgb[0]; g = panelRgb[1]; b = panelRgb[2];
    }

  } else if (style === 'vintage_leather') {
    // --- 18. 1930 World Cup Tiento Leather with Lacing ---
    const ax = Math.abs(px);
    const ay = Math.abs(py);
    const az = Math.abs(pz);

    let u = 0;
    let v = 0;
    let isFrontLaceFace = false;

    if (az >= ax && az >= ay) {
      u = px / az; v = py / az;
      if (pz > 0) isFrontLaceFace = true;
    } else if (ax >= ay && ax >= az) {
      u = (px > 0 ? -pz : pz) / ax; v = py / ax;
    } else {
      u = px / ay; v = (py > 0 ? -pz : pz) / ay;
    }

    const slatU = (u + 1) * 1.5;
    const slatV = (v + 1) * 1.5;
    const uMod = Math.abs((slatU % 1) - 0.5);
    const vMod = Math.abs((slatV % 1) - 0.5);
    const minEdge = Math.min(1.0 - Math.abs(u), 1.0 - Math.abs(v), uMod, vMod);

    const grain = ((Math.sin(px * 80) * Math.cos(py * 80) * 12) + (Math.sin(pz * 90) * 8)) | 0;
    r = Math.max(0, Math.min(255, panelRgb[0] + grain));
    g = Math.max(0, Math.min(255, panelRgb[1] + (grain * 0.7) | 0));
    b = Math.max(0, Math.min(255, panelRgb[2] + (grain * 0.4) | 0));

    if (minEdge < 0.035) {
      r = seamRgb[0]; g = seamRgb[1]; b = seamRgb[2];
    } else if (minEdge < 0.07) {
      r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
    }

    if (isFrontLaceFace && Math.abs(u) < 0.28 && Math.abs(v) < 0.65) {
      const laceY = Math.abs((v * 10) % 1 - 0.5);
      if (laceY < 0.2) {
        r = 250; g = 245; b = 230;
      } else if (Math.abs(u) > 0.20 && Math.abs(u) < 0.26) {
        r = 20; g = 10; b = 5;
      }
    }

  } else {
    // --- 19. Standard 32-Panel Telstar ---
    let maxDot = -1;
    let secondMaxDot = -1;

    for (let c = 0; c < 12; c++) {
      const center = PENTAGON_CENTERS[c];
      const dot = px * center.x + py * center.y + pz * center.z;
      if (dot > maxDot) {
        secondMaxDot = maxDot;
        maxDot = dot;
      } else if (dot > secondMaxDot) {
        secondMaxDot = dot;
      }
    }

    const dotDiff = maxDot - secondMaxDot;
    const isHexSeam = dotDiff < 0.015 && maxDot < 0.938;

    if (maxDot > 0.938) {
      r = panelRgb[0]; g = panelRgb[1]; b = panelRgb[2];
    } else if (maxDot > 0.925) {
      r = trimRgb[0]; g = trimRgb[1]; b = trimRgb[2];
    } else if (maxDot > 0.912 || isHexSeam) {
      r = seamRgb[0]; g = seamRgb[1]; b = seamRgb[2];
    } else {
      r = baseRgb[0]; g = baseRgb[1]; b = baseRgb[2];
    }
  }

  return [r, g, b];
}

/**
 * Draws high-precision 3D projected spherical soccer ball texture onto a 2D canvas context
 */
export function renderBallTextureToContext(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  ballItem: BallTextureItem
) {
  const { brandLabel, subLabel, textColor, style } = ballItem.theme;
  const isAeroSwirl = style === 'aero_swirl';
  const isVintageLeather = style === 'vintage_leather';

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const vNorm = y / height;
    const lat = Math.PI * (0.5 - vNorm); // +pi/2 to -pi/2
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);

    for (let x = 0; x < width; x++) {
      const uNorm = x / width;
      const lon = 2 * Math.PI * (uNorm - 0.5); // -pi to +pi

      // 3D Point on Unit Sphere
      const px = cosLat * Math.sin(lon);
      const py = sinLat;
      const pz = cosLat * Math.cos(lon);

      const [r, g, b] = sampleBallPatternColor(px, py, pz, lon, lat, ballItem);

      const idx = (y * width + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Overlay clean branding & stylized elements scaled for thumbnail/in-game texture
  if (!isAeroSwirl && !isVintageLeather && brandLabel && brandLabel.trim() !== '') {
    ctx.save();
    ctx.fillStyle = textColor;
    ctx.font = `bold ${Math.round(width * 0.032)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(brandLabel, width / 2, height / 2 - Math.round(height * 0.03));
    if (subLabel) {
      ctx.font = `bold ${Math.round(width * 0.022)}px sans-serif`;
      ctx.fillText(subLabel, width / 2, height / 2 + Math.round(height * 0.04));
    }
    ctx.restore();
  }
}

/**
 * Directly renders a raytraced 3D shaded sphere for the given ball pattern onto a 2D canvas.
 * Ultra-fast (< 1ms), reliable, zero WebGL context overhead, with studio lighting and shadow.
 */
export function renderBall3DSphereToCanvas(
  ctx: CanvasRenderingContext2D,
  size: number,
  ballItem: BallTextureItem
) {
  const width = size;
  const height = size;
  const cx = width / 2;
  const cy = height * 0.46; // Center slightly above middle to leave room for drop shadow
  const radius = Math.floor(size * 0.38);
  const rSq = radius * radius;

  // 1. Soft Drop Shadow
  ctx.clearRect(0, 0, width, height);
  const shadowGrad = ctx.createRadialGradient(cx, cy + radius * 0.95, radius * 0.1, cx, cy + radius * 0.95, radius * 0.95);
  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
  shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.22)');
  shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.save();
  ctx.scale(1, 0.35);
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.arc(cx, (cy + radius * 0.95) / 0.35, radius * 0.95, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. 3D Raytraced Sphere Pixels
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 3D Lighting Setup
  const L1 = { x: 0.52, y: 0.72, z: 0.46 }; // Key Directional Light (Top-Right)
  const l1Len = Math.hypot(L1.x, L1.y, L1.z);
  L1.x /= l1Len; L1.y /= l1Len; L1.z /= l1Len;

  const L2 = { x: -0.65, y: 0.35, z: -0.30 }; // Rim Light (Top-Left)
  const l2Len = Math.hypot(L2.x, L2.y, L2.z);
  L2.x /= l2Len; L2.y /= l2Len; L2.z /= l2Len;

  // Halfway vector for specular highlights
  const H1 = { x: L1.x, y: L1.y, z: L1.z + 1.0 };
  const h1Len = Math.hypot(H1.x, H1.y, H1.z);
  H1.x /= h1Len; H1.y /= h1Len; H1.z /= h1Len;

  // Ball Presentation Angle (Pitch = 18 deg down, Yaw = -35 deg left for dynamic panel view)
  const pitch = 0.32;
  const yaw = -0.65;
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);

  const style = ballItem.theme.style;
  const isGold = style === 'gold' || style === 'star_mosaic';
  const isLeather = style === 'vintage_leather' || style === 'teal_leather';
  const isRubber = style === 'rainbow_dodgeball';
  const isGlossyPro = style === 'target_rings' || style === 'usa_chevron' || style === 'trionda' || style === 'pl_radar' || style === 'tango';

  const specPower = isGold ? 32 : isRubber ? 6 : isLeather ? 10 : isGlossyPro ? 24 : 16;
  const specIntensity = isGold ? 0.70 : isRubber ? 0.08 : isLeather ? 0.20 : isGlossyPro ? 0.52 : 0.38;

  const minX = Math.max(0, Math.floor(cx - radius - 1));
  const maxX = Math.min(width - 1, Math.ceil(cx + radius + 1));
  const minY = Math.max(0, Math.floor(cy - radius - 1));
  const maxY = Math.min(height - 1, Math.ceil(cy + radius + 1));

  for (let y = minY; y <= maxY; y++) {
    const dy = y - cy;
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx;
      const distSq = dx * dx + dy * dy;

      if (distSq <= rSq + radius) {
        const dist = Math.sqrt(distSq);
        let alpha = 1.0;
        if (dist > radius - 1.0) {
          alpha = Math.max(0, Math.min(1, radius + 0.5 - dist));
        }
        if (alpha <= 0) continue;

        const dz = Math.sqrt(Math.max(0, rSq - distSq));
        const nx = dx / radius;
        const ny = -dy / radius;
        const nz = dz / radius;

        // Rotate normal vector to presentation angle
        const y1 = ny * cosP - nz * sinP;
        const z1 = ny * sinP + nz * cosP;
        const sx = nx * cosY + z1 * sinY;
        const sy = y1;
        const sz = -nx * sinY + z1 * cosY;

        const lat = Math.asin(Math.max(-1, Math.min(1, sy)));
        const lon = Math.atan2(sx, sz);

        const [r, g, b] = sampleBallPatternColor(sx, sy, sz, lon, lat, ballItem);

        // Lighting calculation
        const diff1 = Math.max(0, nx * L1.x + ny * L1.y + nz * L1.z);
        const rim = Math.max(0, nx * L2.x + ny * L2.y + nz * L2.z) * Math.pow(1.0 - Math.max(0, nz), 1.5);
        const specDot = Math.max(0, nx * H1.x + ny * H1.y + nz * H1.z);
        const spec = Math.pow(specDot, specPower) * specIntensity;

        // Ambient + Diffuse + Rim + Specular
        const ambient = 0.38;
        const lightMult = ambient + 0.65 * diff1 + 0.32 * rim;

        const finalR = Math.min(255, Math.floor(r * lightMult + 255 * spec));
        const finalG = Math.min(255, Math.floor(g * lightMult + 255 * spec));
        const finalB = Math.min(255, Math.floor(b * lightMult + 255 * spec));

        const pIdx = (y * width + x) * 4;
        data[pIdx] = finalR;
        data[pIdx + 1] = finalG;
        data[pIdx + 2] = finalB;
        data[pIdx + 3] = Math.floor(255 * alpha);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}
