import { useLayoutEffect, useRef, useState } from 'react';
import type { Monster } from '../data/monsters';
import { Button } from '../components/Button';
import { RetryIcon } from '../components/Retry';
import { Menu } from '../components/Menu';
import { Minotaur } from '../components/Minotaur';
import { MonsterSolid, hasSolidArt } from '../components/MonsterSolid';
import './Result.css';

// How long the filled silhouette takes to drain into a line drawing before the
// page hero-morph begins (kept in sync with the .is-draining rules in Result.css).
const DRAIN_MS = 600;

interface ResultProps {
  monster: Monster;
  /** True when this is the Vritra error-fallback — show a retry, not "discover". */
  isFallback?: boolean;
  /** Vritra fallback → "נסה שוב": re-run the analysis with the same answers. */
  onRetry?: () => void;
  /** Reserved for the "all monsters" catalogue link (wired up later). */
  onAllMonsters: () => void;
  /** "discover more" → open this monster's inner page. The art column's box is
      handed up so the page can scale open from the monster (zoom-to-discover). */
  onDiscover: (origin?: DOMRect) => void;
  /** Menu → "מבחן": restart the Rorschach experience. */
  onTest?: () => void;
  /** Menu → "מגדיר": open the monster catalogue. */
  onDefiner?: () => void;
  /** Menu → "על הפרוייקט": the about screen. */
  onAbout?: () => void;
  /** Menu square → home (landing) screen. */
  onHome?: () => void;
}

/**
 * The monster reveal (Figma 382-717). A light rounded panel on the dark page,
 * split into a text column (name + "why this monster" + cultural blurb) and a
 * bordered art column holding the filled monster graphic.
 */
export function Result({
  monster,
  isFallback,
  onRetry,
  onDiscover,
  onTest,
  onDefiner,
  onAbout,
  onHome,
}: ResultProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  // The art column's box, measured at click time so the inner page can scale
  // open from the monster (see App.openMonster / MonsterPage origin).
  const artRef = useRef<HTMLDivElement>(null);

  // "Discover more" plays in two beats. First the filled silhouette DRAINS in
  // place: its fill goes transparent while the outline + interior lines darken
  // into a line drawing — no opacity fade, the shape never disappears. Only once
  // that's done do we hand up to onDiscover, which hero-morphs the (now) line-art
  // to the monster's page. `draining` gates the first beat.
  const [draining, setDraining] = useState(false);
  const handleDiscover = () => {
    if (draining) return;
    const rect = artRef.current?.getBoundingClientRect();
    setDraining(true);
    window.setTimeout(() => onDiscover(rect), DRAIN_MS);
  };

  // The monster strokes draw at a constant 1 screen-px (vector-effect:
  // non-scaling-stroke), which means stroke-dasharray is measured in screen px
  // too — so the pathLength=1 normalization can't drive the draw. Instead seed
  // each path's dash with its real rendered length (geometric length × the SVG's
  // on-screen scale) so a single dash hides the whole path, then the CSS keyframe
  // animates the offset to 0 to "draw" it. Runs in a layout effect so the dash is
  // set before first paint (no flash of the full outline).
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const paths = root.querySelectorAll<SVGPathElement>(
      '.minotaur__body, .minotaur__line',
    );
    paths.forEach((p) => {
      const ctm = p.getScreenCTM();
      const scale = ctm ? Math.hypot(ctm.a, ctm.b) : 1;
      const len = p.getTotalLength() * scale;
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
    });
  }, []);

  return (
    <div className={`result${draining ? ' is-draining' : ''}`} ref={rootRef}>
      <div className="result__panel panel-scroll">
        {/* The menu lives INSIDE the white panel (pinned to its top-right corner),
            matching the test-shell frames that precede this screen. It also keeps
            the menu in the same spot across the reveal→result hand-off, since the
            result panel is the same surface the reveal frame morphs into.
            `variant="dark"` because the panel surface is light. */}
        <Menu
          onTest={onTest}
          onDefiner={onDefiner}
          onAbout={onAbout}
          onHome={onHome}
          active="test"
          variant="dark"
        />

        <div className="result__row">
          <div className="result__text">
            <div className="result__title-wrap">
              <h1 className="result__title" dir="rtl">
                {monster.he} / {monster.en}
              </h1>
            </div>

            <div className="result__section">
              {/* Title↓section divider — drawn right→left (RTL) on entrance. */}
              <span className="result__rule result__rule--section" aria-hidden="true" />
              <p className="result__why-label" dir="rtl">
                למה {monster.he}?
              </p>

              <div className="result__why">
                <p className="result__why-text" dir="rtl">
                  {monster.why}
                </p>
                {isFallback ? (
                  <Button
                    variant="link"
                    icon={<RetryIcon />}
                    onClick={onRetry}
                  >
                    נסה שוב
                  </Button>
                ) : (
                  <Button variant="link" arrow onClick={handleDiscover}>
                    סיים את המבחן וגלה עוד על{' '}
                    {monster.heDefinite ?? `ה${monster.he}`}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="result__art" ref={artRef}>
            {/* Art-column frame lines: the vertical divider draws top→bottom,
                then the top/bottom rules draw outward from it. */}
            <span className="result__rule result__rule--v" aria-hidden="true" />
            <span className="result__rule result__rule--t" aria-hidden="true" />
            <span className="result__rule result__rule--b" aria-hidden="true" />
            {/* The finished solid-fill silhouette for the matched monster; Garuda
                (and anything without art) falls back to the Minotaur. Both use the
                same .minotaur__body/.minotaur__line classes, so the reveal + drain
                animations and the dash-seeding effect below apply either way. */}
            {hasSolidArt(monster.id) ? (
              <MonsterSolid
                id={monster.id}
                className="result__minotaur monster-hero"
              />
            ) : (
              <Minotaur className="result__minotaur monster-hero" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
