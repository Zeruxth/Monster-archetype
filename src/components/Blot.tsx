import type { CSSProperties } from 'react';
import {
  BLOT_SHAPES,
  EMOTION_COLORS,
  FULL_CONFIGS,
  FULL_RECIPES,
  SPOT_LAYOUTS,
} from '../data/blots';
import type { BlotBlob, EmotionColor } from '../data/blots';
import './Blot.css';

/**
 * A blot's colour treatment:
 *  - `black` — the neutral ink silhouette (opening / closing beat).
 *  - `spot`  — black ink with ONE emotion colour (the "black + 1 colour" beat).
 *    `variant` 0 is the default bottom-up wash; 1–5 pool the colour in different
 *    symmetric places over the ink (see SPOT_LAYOUTS).
 *  - `full`  — several mirrored colour blobs clipped to the silhouette, with
 *    transparent gaps left inside (the fully-coloured beat). `variant` 0 is the
 *    shape's authored FULL_CONFIGS; 1–7 are the shared FULL_RECIPES. Or pass a
 *    custom blob list, which wins over `variant`.
 */
export type BlotMode =
  | { kind: 'black' }
  | { kind: 'spot'; color: EmotionColor; variant?: number }
  | { kind: 'full'; variant?: number; blobs?: BlotBlob[] };

interface BlotProps {
  /** Which of the 8 silhouettes (see BLOT_SHAPES). */
  shapeId: number;
  mode: BlotMode;
  className?: string;
}

/** A soft blob → one or two radial-gradients. Authored on the left half, so a
 *  blob with x ≠ 50 is emitted twice (x and its mirror 100 − x) for symmetry. */
function radialsFor(b: BlotBlob): string[] {
  const c = EMOTION_COLORS[b.color];
  // Mostly-solid core with a soft feathered edge, so overlapping blobs blend.
  const stops = `${c} 0%, ${c} 32%, transparent 78%`;
  const at = (x: number) =>
    `radial-gradient(${b.rx}% ${b.ry}% at ${x}% ${b.y}%, ${stops})`;
  return b.x === 50 ? [at(50)] : [at(b.x), at(100 - b.x)];
}

/** The CSS `background` for a mode — painted BEHIND the silhouette mask. */
function backgroundFor(shapeId: number, mode: BlotMode): string {
  if (mode.kind === 'black') return 'var(--color-text-primary)';

  if (mode.kind === 'spot') {
    const c = EMOTION_COLORS[mode.color];
    const variant = mode.variant ?? 0;
    // Variant 0 — the default vertical wash: the colour saturates the base and
    // fades into black toward the top (symmetric by construction).
    if (variant === 0) {
      return `linear-gradient(to top, ${c} 0%, ${c} 10%, var(--color-text-primary) 60%)`;
    }
    // Variants 1–5 — pool the single colour as symmetric blob(s) over a solid
    // black ink base (the last, bottom layer), so ink shows in the gaps.
    const layout = SPOT_LAYOUTS[variant - 1] ?? [];
    const blobs: BlotBlob[] = layout.map((b) => ({ ...b, color: mode.color }));
    return [...blobs.flatMap(radialsFor), 'var(--color-text-primary)'].join(', ');
  }

  // full — variant 0 is the shape's authored config; 1–7 are shared recipes.
  const variant = mode.variant ?? 0;
  const blobs =
    mode.blobs ??
    (variant === 0 ? FULL_CONFIGS[shapeId] : FULL_RECIPES[variant - 1]) ??
    [];
  // Later blobs paint on top; transparent gaps between them show the page/frame.
  return blobs.flatMap(radialsFor).join(', ');
}

/**
 * Renders one Rorschach blot. The silhouette SVG is a CSS alpha mask and the
 * colour is painted with CSS behind it (see Blot.css / the data in blots.ts), so
 * a single clean mask edge is preserved across all colour treatments.
 */
export function Blot({ shapeId, mode, className }: BlotProps) {
  const shape =
    BLOT_SHAPES.find((s) => s.id === shapeId) ?? BLOT_SHAPES[0];
  const style: CSSProperties = {
    WebkitMaskImage: `url(${shape.src})`,
    maskImage: `url(${shape.src})`,
    aspectRatio: `${shape.w} / ${shape.h}`,
    background: backgroundFor(shapeId, mode),
  };
  return <div className={`blot-art${className ? ` ${className}` : ''}`} style={style} />;
}
