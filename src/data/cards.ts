import {
  BLOT_SHAPES,
  EMOTION_COLORS,
  EMOTION_ORDER,
  FULL_CONFIGS,
  FULL_RECIPES,
  FULL_VARIANT_COUNT,
  SPOT_VARIANT_COUNT,
} from './blots';
import type { BlotBlob, EmotionColor } from './blots';
import type { BlotMode } from '../components/Blot';

/**
 * One test card: which silhouette to show, how to colour it (a Blot mode), and
 * the fill for its pagination dot. The four cards of a test follow the fixed
 * Rorschach arc black → spot → full → black, over four DISTINCT shapes picked at
 * random. Built fresh per test (see buildDeck) so each run varies.
 */
export interface TestCard {
  shapeId: number;
  mode: BlotMode;
  /** Dot fill echoing the blot: a colour token, a gradient, or null (neutral). */
  dotFill: string | null;
}

/** A test is four cards. */
export const DECK_SIZE = 4;

const randInt = (n: number) => Math.floor(Math.random() * n);
const pick = <T>(arr: readonly T[]): T => arr[randInt(arr.length)];

/** N distinct shape ids, chosen at random (Fisher–Yates, then sliced). */
function pickDistinctShapes(n: number): number[] {
  const ids = BLOT_SHAPES.map((s) => s.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, n);
}

/** The blob list backing a full-gradient variant (authored config or recipe). */
function fullBlobs(shapeId: number, variant: number): BlotBlob[] {
  if (variant === 0) return FULL_CONFIGS[shapeId] ?? [];
  return FULL_RECIPES[variant - 1] ?? [];
}

/** The distinct colours of a full variant, in paint order. */
function fullColors(shapeId: number, variant: number): EmotionColor[] {
  const seen = new Set<EmotionColor>();
  const out: EmotionColor[] = [];
  for (const b of fullBlobs(shapeId, variant)) {
    if (!seen.has(b.color)) {
      seen.add(b.color);
      out.push(b.color);
    }
  }
  return out;
}

/** A dot fill echoing a full card: a diagonal sweep of its recipe's colours. */
function gradientDot(colors: EmotionColor[]): string {
  const stops = colors.map((c) => EMOTION_COLORS[c]).join(', ');
  return `linear-gradient(120deg, ${stops})`;
}

/**
 * Build a fresh, randomised four-card test: four distinct silhouettes across the
 * fixed arc black → spot(one random colour) → full(one random gradient) → black.
 * Each card's dot echoes its blot — neutral for black, the colour for the spot,
 * a gradient of the recipe's colours for the full.
 */
export function buildDeck(): TestCard[] {
  const [s0, s1, s2, s3] = pickDistinctShapes(DECK_SIZE);

  const spotColor = pick(EMOTION_ORDER);
  const spotVariant = randInt(SPOT_VARIANT_COUNT);
  const fullVariant = randInt(FULL_VARIANT_COUNT);

  return [
    { shapeId: s0, mode: { kind: 'black' }, dotFill: null },
    {
      shapeId: s1,
      mode: { kind: 'spot', color: spotColor, variant: spotVariant },
      dotFill: EMOTION_COLORS[spotColor],
    },
    {
      shapeId: s2,
      mode: { kind: 'full', variant: fullVariant },
      dotFill: gradientDot(fullColors(s2, fullVariant)),
    },
    { shapeId: s3, mode: { kind: 'black' }, dotFill: null },
  ];
}
