import { MONSTER_ART } from '../data/monsterArt';
import './MonsterArt.css';

interface MonsterArtProps {
  /** Monster id (matches MONSTERS / MONSTER_ART keys). */
  id: string;
  className?: string;
}

/**
 * Renders a finished monster's line-art (from MONSTER_ART). Strokes resolve to
 * `currentColor`, so the surrounding context — the catalogue card's hover flip,
 * a future reveal screen — recolours them by setting `color`. Returns null when
 * the monster has no finished art yet (caller falls back to a placeholder).
 */
export function MonsterArt({ id, className }: MonsterArtProps) {
  const art = MONSTER_ART[id];
  if (!art) return null;
  return (
    <svg
      className={`monster-art${className ? ` ${className}` : ''}`}
      viewBox={art.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {art.paths.map((d, i) => (
        <path key={i} className="monster-art__line" d={d} />
      ))}
    </svg>
  );
}

/** Whether a monster has finished line-art (vs. still on the placeholder). */
export function hasMonsterArt(id: string): boolean {
  return id in MONSTER_ART;
}
