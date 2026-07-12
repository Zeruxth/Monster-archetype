/* Generates src/data/aboutShapes.ts from the Figma SVG exports of the About
   redesign's stage shapes (Figma 558-610 / 577-727), expected in
   /tmp/about-shapes/: star, polygon, dragon1-4, blots, logo.

   What it does:
   - keeps only <path> elements (the exports carry two decorative background
     <rect>s — dropping non-paths strips them);
   - records each path's raw `d` (export-local absolute coordinates — the
     artwork groups carry no transforms), stroke-width, and whether it's a
     filled union (star/polygon + a few dragon-4 details) vs a stroked line;
   - picks each shape's MAIN RING — the subpath with the largest
     endpoint-bounding-box (endpoints only, fine for ranking) — which is what
     the runtime morph engine feeds to flubber; for the blots sheet it picks
     one ring per <path> (4 blots) and orders them left→right.

   Re-run with `node scripts/extract-about-shapes.mjs` after a re-export. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = '/tmp/about-shapes';
// fileURLToPath, NOT .pathname — the project folder is Hebrew and .pathname
// leaves it percent-encoded (ENOENT).
const OUT = fileURLToPath(new URL('../src/data/aboutShapes.ts', import.meta.url));

/** Parse one export: natural size + every <path>'s attributes. */
function parseSvg(file) {
  const xml = readFileSync(`${SRC}/${file}`, 'utf8');
  const m = xml.match(/<svg[^>]*\bwidth="([\d.]+)"[^>]*\bheight="([\d.]+)"/);
  if (!m) throw new Error(`${file}: no width/height on <svg>`);
  const paths = [];
  for (const [, attrStr] of xml.matchAll(/<path\b([^>]*?)\/?>/g)) {
    const attr = {};
    for (const [, k, v] of attrStr.matchAll(/([\w-]+)="([^"]*)"/g)) attr[k] = v;
    if (!attr.d) continue;
    // Guard the split-on-M assumption: Figma exports absolute commands only.
    const letters = attr.d.replace(/[^a-zA-Z]/g, '');
    if (/[a-z]/.test(letters))
      console.warn(`WARN ${file} #${attr.id ?? '?'}: lowercase (relative) commands present`);
    paths.push(attr);
  }
  return { w: +m[1], h: +m[2], paths };
}

const subpaths = (d) =>
  d
    .split(/(?=M)/)
    .map((s) => s.trim())
    .filter(Boolean);

/** Command-aware walk of a subpath's ANCHOR points (curve endpoints; control
    points skipped — a uniform underestimate). Naive number-pairing breaks on
    H/V/A commands, so this tracks the grammar properly. */
function anchors(d) {
  const tokens = d.match(/-?\d*\.?\d+(?:e[+-]?\d+)?|[A-Za-z]/g) ?? [];
  const pts = [];
  let i = 0;
  let cmd = '';
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  const num = () => +tokens[i++];
  const push = () => pts.push([x, y]);
  while (i < tokens.length) {
    if (tokens[i].length === 1 && /[A-Za-z]/.test(tokens[i])) cmd = tokens[i++];
    switch (cmd) {
      case 'M':
        x = num();
        y = num();
        startX = x;
        startY = y;
        push();
        cmd = 'L'; // subsequent implicit pairs are linetos
        break;
      case 'L':
      case 'T':
        x = num();
        y = num();
        push();
        break;
      case 'H':
        x = num();
        push();
        break;
      case 'V':
        y = num();
        push();
        break;
      case 'C':
        num();
        num();
        num();
        num();
        x = num();
        y = num();
        push();
        break;
      case 'S':
      case 'Q':
        num();
        num();
        x = num();
        y = num();
        push();
        break;
      case 'A':
        num(); // rx
        num(); // ry
        num(); // x-axis-rotation
        num(); // large-arc flag
        num(); // sweep flag
        x = num();
        y = num();
        push();
        break;
      case 'Z':
        x = startX;
        y = startY;
        push();
        break;
      default:
        // Lowercase (relative) — already warned in parseSvg; skip one token
        // so we can't loop forever.
        i++;
        break;
    }
  }
  return pts;
}

/** bbox + chord length of a subpath. Length (not bbox area) ranks the main
    ring: serpent-style line art (dragon 3) is drawn in fragments whose
    largest-bbox piece is just a coil — the LONGEST stroke is the body. */
function metrics(sp) {
  const pts = anchors(sp);
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity,
    len = 0;
  for (let i = 0; i < pts.length; i++) {
    const [px, py] = pts[i];
    minX = Math.min(minX, px);
    maxX = Math.max(maxX, px);
    minY = Math.min(minY, py);
    maxY = Math.max(maxY, py);
    if (i > 0) len += Math.hypot(px - pts[i - 1][0], py - pts[i - 1][1]);
  }
  return { minX, minY, maxX, maxY, area: (maxX - minX) * (maxY - minY), len };
}

/** All subpaths across the given paths, longest first. */
function rank(paths) {
  const cands = [];
  for (const p of paths)
    for (const sp of subpaths(p.d)) cands.push({ sp, m: metrics(sp) });
  cands.sort((a, b) => b.m.len - a.m.len);
  return cands;
}

/** Hand-tune hook: shape key → index into rank()'s longest-first list, for
    when the longest stroke still isn't the visually right morph ring. */
const RING_OVERRIDE = {};

const mainRing = (key, paths) => rank(paths)[RING_OVERRIDE[key] ?? 0];

const files = {
  star: 'star.svg',
  polygon: 'polygon.svg',
  dragon1: 'dragon1.svg',
  dragon2: 'dragon2.svg',
  dragon3: 'dragon3.svg',
  dragon4: 'dragon4.svg',
  blots: 'blots.svg',
  logo: 'logo.svg',
};
const art = Object.fromEntries(
  Object.entries(files).map(([k, f]) => [k, parseSvg(f)])
);

// ---- report (top 3 by length so a wrong main-ring pick is visible) ----
for (const [k, a] of Object.entries(art)) {
  const spCount = a.paths.reduce((n, p) => n + subpaths(p.d).length, 0);
  console.log(`${k.padEnd(8)} ${a.w}x${a.h}  paths=${a.paths.length} subpaths=${spCount}`);
  for (const { m } of rank(a.paths).slice(0, 3))
    console.log(
      `   len=${m.len.toFixed(0).padStart(5)}  bbox=[${m.minX.toFixed(0)},${m.minY.toFixed(0)} ` +
        `${m.maxX.toFixed(0)},${m.maxY.toFixed(0)}]`
    );
}

// ---- sanity checks (fail loud rather than emit a wrong data file) ----
const count = (a) => a.paths.reduce((n, p) => n + subpaths(p.d).length, 0);
if (count(art.star) !== 1) throw new Error('star: expected a single ring');
if (count(art.polygon) !== 2) throw new Error('polygon: expected outer+inner band contours');
if (count(art.logo) !== 1) throw new Error('logo: expected a single ring');
if (art.blots.paths.length !== 4) throw new Error('blots: expected 4 paths (one per blot)');

// ---- emit ----
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const tsPath = (p) => {
  const parts = [`d: '${esc(p.d)}'`];
  if (p['stroke-width'] && +p['stroke-width'] !== 1)
    parts.push(`strokeWidth: ${+p['stroke-width']}`);
  if (p.fill && p.fill !== 'none') parts.push(`filled: true`);
  return `    { ${parts.join(', ')} },`;
};
const tsArt = (name, a, rings, extraComment = '') =>
  `${extraComment}export const ${name}: AboutArt = {
  w: ${a.w},
  h: ${a.h},
  paths: [
${a.paths.map(tsPath).join('\n')}
  ],
  mainRings: [
${rings.map((r) => `    '${esc(r)}',`).join('\n')}
  ],
};\n`;

// Blots: one ring per path, ordered left→right in the 1184-wide sheet so the
// runtime can pair blot N with the dragon in slot N.
const blotRings = art.blots.paths
  .map((p) => mainRing('blots', [p]))
  .sort((a, b) => a.m.minX - b.m.minX);
console.log(
  'blot ring x-order:',
  blotRings.map((r) => r.m.minX.toFixed(0)).join(', ')
);

/* Stage-1 circle (the L.U.C.A entry shape) is synthesized, not exported — a
   plain ring in a 370x370 box (the star/stage box size), as two arcs. */
const CIRCLE_D =
  'M369 185A184 184 0 1 1 1 185A184 184 0 1 1 369 185Z';

const out = `/* ---- About-page stage shapes (Figma 558-610 / 577-727) ----
   GENERATED by scripts/extract-about-shapes.mjs from the Figma exports — do
   not hand-edit the path data; re-run the script after a re-export.

   Coordinates are each export's own local space (absolute commands, no
   transforms), with the natural size in \`w\`/\`h\`. The runtime morph engine
   samples \`mainRings\` into point rings (native getPointAtLength), maps the
   points into the shared stage space, and hands them to flubber; \`paths\` is
   the full artwork for the settled (non-morphing) render. */

export interface AboutShapePath {
  /** Raw \`d\` in the export's local coordinates (absolute commands only). */
  d: string;
  /** Stroke width from the export, when not 1 (design px in local space). */
  strokeWidth?: number;
  /** Filled union (render fill: currentColor) vs stroked line-work. */
  filled?: boolean;
}

export interface AboutArt {
  /** Natural (export viewBox) size. */
  w: number;
  h: number;
  /** Every artwork path, document order — the settled static render. */
  paths: AboutShapePath[];
  /** The ring(s) that morph. One per shape; the blots sheet has 4 (left→right,
      so ring N pairs with the dragon in slot N). */
  mainRings: string[];
}

/** Stage 1 — the L.U.C.A circle (synthesized ring, no export needed). */
export const circle: AboutArt = {
  w: 370,
  h: 370,
  paths: [{ d: '${CIRCLE_D}' }],
  mainRings: ['${CIRCLE_D}'],
};

/** Stage 2 — the eight-ray line star (Jung), a single filled-union ring. */
${tsArt('star', art.star, [mainRing('star', art.star.paths).sp])}
/** Stage 3 — the irregular polygon band (Cohen). The main ring is the OUTER
    contour; the inner contour is settle-only detail. */
${tsArt('polygon', art.polygon, [mainRing('polygon', art.polygon.paths).sp])}
/** Stage 4 — the four seminar dragons, [01] פייתון / [02] יפני / [03] אפופיס /
    [04] קצלקואטל. Each morphs on its largest contour; the rest of its
    line-work is settle-only detail. */
export const dragons: AboutArt[] = [
${['dragon1', 'dragon2', 'dragon3', 'dragon4']
  .map((k) => {
    const a = art[k];
    return `  {
    w: ${a.w},
    h: ${a.h},
    paths: [
${a.paths.map(tsPath).join('\n')}
    ],
    mainRings: [
      '${esc(mainRing(k, a.paths).sp)}',
    ],
  },`;
  })
  .join('\n')}
];

/** Stage 5 — the four Rorschach blots (one sheet, rings ordered left→right). */
${tsArt('blots', art.blots, blotRings.map((r) => r.sp))}
/** Stage 6 — the project logo (asterisk), a single ring. */
${tsArt('logo', art.logo, [mainRing('logo', art.logo.paths).sp])}`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, out);
console.log(`\nwrote ${OUT} (${(out.length / 1024).toFixed(0)}kB)`);
