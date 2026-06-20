/** Chromatic progression mirrors the original Rorschach sequence. */
export type CardStage = 'bw' | 'spot' | 'color';

export interface CardDef {
  index: number;
  stage: CardStage;
  /** Real blot artwork drops in here later; null = grey placeholder. */
  image: string | null;
  /**
   * The blot SVG already carries its own colours (Figma exports the silhouette
   * as a mask over blurred colour ellipses), so render it directly instead of
   * masking a flat fill. Used by the full-colour cards.
   */
  colored?: boolean;
  /**
   * Optional emotion colour, painted as a symmetric gradient masked inside the
   * blot (the single-colour "spot" cards). null = neutral black.
   */
  tint?: string | null;
  /**
   * Fill for this card's pagination dot. Solid colour OR a CSS gradient string
   * (the full-colour card's dot mirrors the blot's gradient). Defaults to the
   * tint, then neutral black.
   */
  dotFill?: string | null;
}

export const CARDS: CardDef[] = [
  { index: 0, stage: 'bw', image: '/blots/blot-card.svg', tint: null },
  {
    index: 1,
    stage: 'spot',
    image: '/blots/blot-card.svg',
    tint: 'var(--color-terror)',
  },
  {
    index: 2,
    stage: 'color',
    image: '/blots/blot-card-3.svg',
    colored: true,
    dotFill: 'linear-gradient(120deg, #3246F9, #FA7443, #583FA7)',
  },
  // Loops back to the opening black-and-white blot; its dot fills neutral black.
  { index: 3, stage: 'bw', image: '/blots/blot-card.svg', tint: null },
];
