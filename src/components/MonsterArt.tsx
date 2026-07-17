import { MONSTER_ART } from '../data/monsterArt';
import './MonsterArt.css';

interface MonsterArtProps {
  /** Monster id (matches MONSTERS / MONSTER_ART keys). */
  id: string;
  className?: string;
  /**
   * Optional uniform shrink for THIS render, applied about the drawing's centre.
   * Only the מגדיר catalogue tiles pass it (see MonsterCard's CATALOGUE_SCALE),
   * to make a few monsters read a touch smaller in the grid. Left off everywhere
   * else — so the inner monster pages fill their frame identically for every
   * monster. Leaves the viewBox (and the shared hero-morph box) untouched.
   */
  scale?: number;
}

/**
 * SVG transform that scales a drawing about the centre of its own viewBox, so a
 * `scale` shrink stays centred in its box instead of drifting toward the origin.
 * (Shared with MonsterSolid, which offers the same opt-in shrink.)
 */
export function centreScale(viewBox: string, scale: number): string {
  const [minX, minY, w, h] = viewBox.split(/\s+/).map(Number);
  const cx = minX + w / 2;
  const cy = minY + h / 2;
  return `translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`;
}

/**
 * Renders a finished monster's line-art (from MONSTER_ART). Strokes resolve to
 * `currentColor`, so the surrounding context — the catalogue card's hover flip,
 * a future reveal screen — recolours them by setting `color`. Returns null when
 * the monster has no finished art yet (caller falls back to a placeholder).
 */
export function MonsterArt({ id, className, scale }: MonsterArtProps) {
  const art = MONSTER_ART[id];
  if (!art) return null;
  const lines = art.paths.map((d, i) => (
    <path key={i} className="monster-art__line" d={d} />
  ));
  return (
    <svg
      className={`monster-art${className ? ` ${className}` : ''}`}
      viewBox={art.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Only the catalogue tiles pass `scale`; when they do, shrink the drawing
          via an inner <g> so the <svg>'s own box / view-transition-name is
          untouched and non-scaling-stroke holds the 1px line weight. */}
      {scale && scale !== 1 ? (
        <g transform={centreScale(art.viewBox, scale)}>{lines}</g>
      ) : (
        lines
      )}
    </svg>
  );
}

/** Whether a monster has finished line-art (vs. still on the placeholder). */
export function hasMonsterArt(id: string): boolean {
  return id in MONSTER_ART;
}
