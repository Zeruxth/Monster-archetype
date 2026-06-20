import { useLayoutEffect, useRef } from 'react';
import type { Monster } from '../data/monsters';
import { Button } from '../components/Button';
import { Menu } from '../components/Menu';
import { Minotaur } from '../components/Minotaur';
import './Result.css';

interface ResultProps {
  monster: Monster;
  /** Reserved for the "all monsters" catalogue link (wired up later). */
  onAllMonsters: () => void;
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
export function Result({ monster, onTest, onDefiner, onAbout, onHome }: ResultProps) {
  const rootRef = useRef<HTMLDivElement>(null);

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
    <div className="result" ref={rootRef}>
      <Menu
        onTest={onTest}
        onDefiner={onDefiner}
        onAbout={onAbout}
        onHome={onHome}
        active="test"
      />

      <div className="result__panel">
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
                <Button variant="link" arrow onClick={() => {}}>
                  גלה עוד על {monster.he}
                </Button>
              </div>
            </div>
          </div>

          <div className="result__art">
            {/* Art-column frame lines: the vertical divider draws top→bottom,
                then the top/bottom rules draw outward from it. */}
            <span className="result__rule result__rule--v" aria-hidden="true" />
            <span className="result__rule result__rule--t" aria-hidden="true" />
            <span className="result__rule result__rule--b" aria-hidden="true" />
            <Minotaur className="result__minotaur" />
          </div>
        </div>
      </div>
    </div>
  );
}
