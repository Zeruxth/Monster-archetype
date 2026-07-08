/* ---- Rorschach blot library (Figma 557-208) ----
   8 symmetric silhouettes, each a single-path SVG used as a CSS alpha mask. The
   colour is painted in code (Hybrid approach): a black fill, a single symmetric
   colour "spot", or several mirrored colour blobs for the fully-coloured cards.
   Every colour is applied symmetrically (mirrored L↔R), matching the source. */

/** A silhouette shape. `w`/`h` are its source viewBox, so a render box can take
 *  the same aspect ratio and the mask fills it undistorted (mask-size:100% 100%). */
export interface BlotShape {
  id: number;
  src: string;
  w: number;
  h: number;
}

/** All 8 shapes, in the reading order of the Figma sheet (top row, then bottom). */
export const BLOT_SHAPES: BlotShape[] = [
  { id: 1, src: '/blots/blot-1.svg', w: 157.089, h: 108.617 },
  { id: 2, src: '/blots/blot-2.svg', w: 158.809, h: 106.538 },
  { id: 3, src: '/blots/blot-3.svg', w: 156.679, h: 107.886 },
  { id: 4, src: '/blots/blot-4.svg', w: 158.356, h: 104.864 },
  { id: 5, src: '/blots/blot-5.svg', w: 158.144, h: 104.731 },
  { id: 6, src: '/blots/blot-6.svg', w: 161.184, h: 102.379 },
  { id: 7, src: '/blots/blot-7.svg', w: 156, h: 104.302 },
  { id: 8, src: '/blots/blot-8.svg', w: 164.933, h: 109.691 },
];

/** The 7 design-system emotion colours (see tokens.css), referenced as tokens so
 *  a theme change flows through automatically. */
export const EMOTION_COLORS = {
  confusion: 'var(--color-confusion)',
  suspicion: 'var(--color-suspicion)',
  terror: 'var(--color-terror)',
  awe: 'var(--color-awe)',
  longing: 'var(--color-longing)',
  smallness: 'var(--color-smallness)',
  security: 'var(--color-security)',
} as const;

export type EmotionColor = keyof typeof EMOTION_COLORS;

/** Stable order for iterating the 7 colours (e.g. the per-blot spot variations). */
export const EMOTION_ORDER: EmotionColor[] = [
  'confusion',
  'suspicion',
  'terror',
  'awe',
  'longing',
  'smallness',
  'security',
];

/** A soft colour blob, positioned as a percentage of the blot's bounding box.
 *  `x` is authored on the LEFT half (0–50); the engine mirrors it to (100 − x)
 *  so every blob is a symmetric pair. Use `x: 50` for an on-axis centre blob
 *  (rendered once, no mirror). `rx`/`ry` are the blob's radii, also in %. */
export interface BlotBlob {
  color: EmotionColor;
  x: number;
  y: number;
  rx: number;
  ry: number;
}

/* ---- The 8 fully-coloured configs ----
   Each uses 2–5 colours as large, overlapping soft blobs so the blot reads as
   mostly coloured while leaving transparent gaps inside (the "empty spaces").
   Authored on the left half + centreline; the engine mirrors them. Across all 8
   every one of the 7 emotion colours appears at least once. */
export const FULL_CONFIGS: Record<number, BlotBlob[]> = {
  1: [
    { color: 'awe', x: 50, y: 30, rx: 34, ry: 34 },
    { color: 'confusion', x: 18, y: 52, rx: 30, ry: 34 },
    { color: 'suspicion', x: 50, y: 74, rx: 32, ry: 34 },
  ],
  2: [
    { color: 'terror', x: 50, y: 42, rx: 40, ry: 42 },
    { color: 'longing', x: 22, y: 70, rx: 28, ry: 28 },
  ],
  3: [
    { color: 'smallness', x: 24, y: 32, rx: 30, ry: 30 },
    { color: 'security', x: 50, y: 56, rx: 36, ry: 36 },
    { color: 'awe', x: 22, y: 74, rx: 24, ry: 26 },
  ],
  4: [
    { color: 'longing', x: 50, y: 26, rx: 30, ry: 26 },
    { color: 'confusion', x: 20, y: 48, rx: 28, ry: 30 },
    { color: 'terror', x: 50, y: 62, rx: 30, ry: 30 },
    { color: 'suspicion', x: 18, y: 80, rx: 22, ry: 22 },
  ],
  5: [
    { color: 'security', x: 50, y: 40, rx: 40, ry: 40 },
    { color: 'smallness', x: 24, y: 70, rx: 30, ry: 30 },
  ],
  6: [
    { color: 'awe', x: 22, y: 32, rx: 30, ry: 30 },
    { color: 'terror', x: 50, y: 54, rx: 36, ry: 36 },
    { color: 'longing', x: 50, y: 80, rx: 30, ry: 26 },
  ],
  7: [
    { color: 'confusion', x: 50, y: 22, rx: 28, ry: 24 },
    { color: 'suspicion', x: 20, y: 40, rx: 26, ry: 28 },
    { color: 'smallness', x: 50, y: 56, rx: 30, ry: 30 },
    { color: 'security', x: 20, y: 72, rx: 24, ry: 26 },
    { color: 'awe', x: 50, y: 86, rx: 26, ry: 22 },
  ],
  8: [
    { color: 'terror', x: 24, y: 32, rx: 30, ry: 30 },
    { color: 'security', x: 50, y: 56, rx: 38, ry: 38 },
    { color: 'longing', x: 22, y: 76, rx: 26, ry: 26 },
  ],
};

/* ---- Spot ("black + 1 colour") variations ----
   Beyond the default bottom-up wash (variant 0, painted in code), 5 more layouts
   pool the single colour in different symmetric places over the black ink. A
   spot layout is a colourless blob set (the emotion colour is injected at render)
   — same mirror rule as BlotBlob (x on the left half, or 50 on-axis). */
export interface SpotBlob {
  x: number;
  y: number;
  rx: number;
  ry: number;
}

/** The 5 extra spot layouts (indices 1–5; variant 0 is the code-painted wash). */
export const SPOT_LAYOUTS: SpotBlob[][] = [
  // 1 — crown: the colour pools along the top edge.
  [{ x: 50, y: 15, rx: 56, ry: 36 }],
  // 2 — core: a single central bloom, ink around it.
  [{ x: 50, y: 48, rx: 52, ry: 48 }],
  // 3 — flanks-high: mirrored blobs on the upper sides (wing/eye-like).
  [{ x: 24, y: 30, rx: 34, ry: 36 }],
  // 4 — flanks-low: mirrored blobs low on the sides.
  [{ x: 22, y: 78, rx: 34, ry: 34 }],
  // 5 — twin columns: two mirrored vertical bands.
  [{ x: 28, y: 60, rx: 22, ry: 70 }],
];

/** Total spot variations per colour (the wash + SPOT_LAYOUTS). */
export const SPOT_VARIANT_COUNT = 1 + SPOT_LAYOUTS.length;

/* ---- Extra fully-coloured recipes ----
   7 more gradient configs (indices 1–7; variant 0 is the per-blot FULL_CONFIGS
   above). Unlike FULL_CONFIGS these are shape-agnostic: each is masked to
   whichever silhouette it's drawn on, so one recipe reads differently per blot.
   Each keeps 2–5 colours + transparent gaps; across the 7, all colours appear. */
export const FULL_RECIPES: BlotBlob[][] = [
  // 1 — ember (warm): terror core, suspicion flanks, awe crown.
  [
    { color: 'awe', x: 50, y: 18, rx: 32, ry: 28 },
    { color: 'suspicion', x: 24, y: 42, rx: 30, ry: 32 },
    { color: 'terror', x: 50, y: 70, rx: 44, ry: 44 },
  ],
  // 2 — tide (cool): awe crown, security band, longing base.
  [
    { color: 'awe', x: 50, y: 22, rx: 42, ry: 36 },
    { color: 'security', x: 24, y: 56, rx: 30, ry: 32 },
    { color: 'longing', x: 50, y: 84, rx: 34, ry: 28 },
  ],
  // 3 — moss (earthy): smallness flanks, security core, confusion base.
  [
    { color: 'smallness', x: 24, y: 30, rx: 32, ry: 32 },
    { color: 'security', x: 50, y: 58, rx: 38, ry: 36 },
    { color: 'confusion', x: 24, y: 82, rx: 26, ry: 26 },
  ],
  // 4 — spectrum (5): a top-to-bottom ladder of five colours.
  [
    { color: 'awe', x: 50, y: 16, rx: 30, ry: 26 },
    { color: 'longing', x: 22, y: 40, rx: 26, ry: 26 },
    { color: 'terror', x: 50, y: 56, rx: 30, ry: 28 },
    { color: 'suspicion', x: 20, y: 74, rx: 24, ry: 24 },
    { color: 'smallness', x: 50, y: 90, rx: 28, ry: 22 },
  ],
  // 5 — bloom (2): a large security centre with a confusion undercurrent.
  [
    { color: 'security', x: 50, y: 42, rx: 48, ry: 46 },
    { color: 'confusion', x: 24, y: 76, rx: 30, ry: 30 },
  ],
  // 6 — dusk (3): longing crown, suspicion flanks, terror base.
  [
    { color: 'longing', x: 50, y: 20, rx: 38, ry: 32 },
    { color: 'suspicion', x: 24, y: 52, rx: 32, ry: 34 },
    { color: 'terror', x: 50, y: 84, rx: 34, ry: 28 },
  ],
  // 7 — prism (5): a fine scatter of five colours down the axis.
  [
    { color: 'confusion', x: 50, y: 18, rx: 26, ry: 24 },
    { color: 'awe', x: 22, y: 42, rx: 26, ry: 28 },
    { color: 'terror', x: 50, y: 58, rx: 28, ry: 26 },
    { color: 'longing', x: 22, y: 78, rx: 24, ry: 24 },
    { color: 'security', x: 50, y: 92, rx: 26, ry: 20 },
  ],
];

/** Total full-gradient variations per blot (the authored config + FULL_RECIPES). */
export const FULL_VARIANT_COUNT = 1 + FULL_RECIPES.length;
