import { MONSTER_SOLID } from '../data/monsterSolid';
import { centreScale } from './MonsterArt';
import './Minotaur.css';

interface MonsterSolidProps {
  /** Monster id — keys into MONSTER_SOLID. Guard with hasSolidArt() first. */
  id: string;
  className?: string;
  /**
   * Optional uniform shrink, applied about the drawing's centre — the same
   * opt-in MonsterArt offers. Only the מגדיר inner pages pass it (tall
   * portrait drawings read outsized there); the Result screen never does, so
   * the test's reveal keeps every monster at full frame. Leaves the viewBox
   * (and the shared hero-morph box) untouched; non-scaling-stroke keeps the
   * 1px line weight.
   */
  scale?: number;
}

/** True when a finished solid-fill silhouette exists for this monster id. */
export function hasSolidArt(id: string): boolean {
  return id in MONSTER_SOLID;
}

/**
 * A finished monster rendered as a filled silhouette + interior contour lines,
 * for the RESULT screen's reveal (Figma node 560:1276, "Finished Monsters dark
 * outline"). It deliberately reuses the Minotaur's class names
 * (.minotaur / .minotaur__body / .minotaur__line) and stylesheet so it is a
 * drop-in twin: the Result screen's reveal + drain animations and the
 * dash-seeding layout effect target those classes and keep working unchanged.
 *
 * Colours resolve through CSS variables (see Minotaur.css / Result.css) — the
 * path data is colour-stripped. All body paths render with fill-rule="evenodd"
 * exactly like the Minotaur (safe here: the source's non-evenodd body paths are
 * all single-subpath shapes, where the rule is a no-op). Garuda has no art in
 * this node and the caller falls back to <Minotaur/>.
 */
export function MonsterSolid({ id, className, scale }: MonsterSolidProps) {
  const art = MONSTER_SOLID[id];
  if (!art) return null;

  return (
    <svg
      className={`minotaur${className ? ` ${className}` : ''}`}
      viewBox={art.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g
        className="minotaur__group"
        transform={
          scale && scale !== 1 ? centreScale(art.viewBox, scale) : undefined
        }
      >
        {art.body.map((d, i) => (
          <path
            key={`b${i}`}
            className="minotaur__body"
            fillRule="evenodd"
            clipRule="evenodd"
            d={d}
          />
        ))}
        {art.lines.map((d, i) => (
          <path key={`l${i}`} className="minotaur__line" d={d} />
        ))}
      </g>
    </svg>
  );
}
