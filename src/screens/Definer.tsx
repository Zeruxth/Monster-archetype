import { useLayoutEffect, useRef } from 'react';
import { Menu } from '../components/Menu';
import { MonsterCard } from '../components/MonsterCard';
import { MonsterArt } from '../components/MonsterArt';
import { MONSTERS } from '../data/monsters';
import type { Monster } from '../data/monsters';
import type { CatalogOrigin } from './Landing';
import './Definer.css';

interface DefinerProps {
  /** Menu → "מבחן": back into the Rorschach experience. */
  onTest?: () => void;
  /** Menu → "על הפרוייקט": the about screen. */
  onAbout?: () => void;
  /** Menu square → home (landing) screen. */
  onHome?: () => void;
  /** Tile click → open that monster's inner page. `rect` is the clicked tile's
   *  box, so the page can scale open from the direction of the click. */
  onOpen?: (monster: Monster, rect?: DOMRect) => void;
  /** When arriving from a landing hover, the monster + box to fly into its tile. */
  origin?: CatalogOrigin | null;
}

// Fly duration + curve for the handoff (matches the reveal morph's easeOutQuint
// feel so motion reads consistently across the app).
const FLY_MS = 750;
const FLY_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
// The grid fades in behind the flying monster, finishing as it lands.
const GRID_FADE_MS = 450;
const GRID_FADE_DELAY = 250;

/**
 * מגדיר מפלצות (Figma 382-817) — the catalogue. A dark page with a grid of all
 * 39 monster tiles, each flipping to a filled treatment on hover. The per-monster
 * art is still the Minotaur placeholder until the real designs land.
 *
 * Option C handoff: when the user navigates here by clicking the landing's
 * מגדיר מפלצות hover, `origin` carries the exact monster drawn there and its
 * on-screen box. We render that monster as a fixed overlay starting at that box
 * and animate it (width/height/left/top + colour) into its tile, while the grid
 * fades in around it — so the creature you hovered "becomes" its catalogue entry.
 */
export function Definer({ onTest, onAbout, onHome, onOpen, origin = null }: DefinerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const flyRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!origin) return;
    const root = rootRef.current;
    const grid = gridRef.current;
    const fly = flyRef.current;
    if (!root || !grid || !fly) return;

    // Locate the destination tile's art box (the monster's slot within its card).
    const targetArt = root.querySelector<HTMLElement>(
      `[data-monster-id="${origin.id}"] .monster-art`,
    );
    if (!targetArt) return;

    // Cancel any in-flight animations (StrictMode double-invoke / fast re-entry).
    fly.getAnimations().forEach((a) => a.cancel());
    grid.getAnimations().forEach((a) => a.cancel());

    const src = origin.rect;
    const tgt = targetArt.getBoundingClientRect();

    // Hide the real tile art while the clone flies, so only one monster shows.
    targetArt.style.opacity = '0';
    fly.style.display = 'block';

    const flyAnim = fly.animate(
      [
        {
          left: `${src.left}px`,
          top: `${src.top}px`,
          width: `${src.width}px`,
          height: `${src.height}px`,
          // Landing hover graphics are faint #BABABA; the catalogue art is light.
          color: '#BABABA',
        },
        {
          left: `${tgt.left}px`,
          top: `${tgt.top}px`,
          width: `${tgt.width}px`,
          height: `${tgt.height}px`,
          color: '#E4E4E4',
        },
      ],
      { duration: FLY_MS, easing: FLY_EASE, fill: 'forwards' },
    );

    const gridAnim = grid.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      {
        duration: GRID_FADE_MS,
        delay: GRID_FADE_DELAY,
        easing: 'ease-in',
        fill: 'both',
      },
    );

    flyAnim.onfinish = () => {
      // Hand off to the real tile and retire the clone.
      targetArt.style.opacity = '';
      fly.style.display = 'none';
    };

    return () => {
      flyAnim.cancel();
      gridAnim.cancel();
      targetArt.style.opacity = '';
    };
  }, [origin]);

  return (
    <div className="definer" ref={rootRef}>
      <Menu onTest={onTest} onAbout={onAbout} onHome={onHome} active="definer" />

      <div className="definer__grid" ref={gridRef}>
        {MONSTERS.map((m) => (
          <MonsterCard
            key={m.id}
            id={m.id}
            he={m.he}
            en={m.en}
            onClick={
              onOpen
                ? (e) => onOpen(m, e.currentTarget.getBoundingClientRect())
                : undefined
            }
          />
        ))}
      </div>

      {origin && (
        <div className="definer__fly" ref={flyRef} aria-hidden="true">
          <MonsterArt id={origin.id} />
        </div>
      )}
    </div>
  );
}
