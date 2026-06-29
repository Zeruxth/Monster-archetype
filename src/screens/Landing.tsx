import { useEffect, useState } from 'react';
import { HoverGraphic, preloadGraphics } from '../components/HoverGraphic';
import { SwapText } from '../components/SwapText';
import { TypeText } from '../components/TypeText';
import { monsterArtIds, monsterArtSvg } from '../data/monsterArt';
import './Landing.css';

// The finished monsters (line-art). The landing draws them in the background on a
// constant loop — one creature draws in, withdraws (un-draws), then a different
// one draws in its place — running from first load onward, independent of hover.
const MONSTER_IDS = monsterArtIds();

// Build a self-contained data: URL for a monster's line-art so HoverGraphic can
// fetch + inline it (strokes in #BABABA to match the landing's faint graphics).
function monsterSrc(id: string): string {
  return 'data:image/svg+xml,' + encodeURIComponent(monsterArtSvg(id, '#BABABA'));
}

// Pick a monster different from the current one, so the loop never repeats a
// creature back-to-back.
function pickNextMonster(current: string | null): string | null {
  if (MONSTER_IDS.length === 0) return null;
  const pool =
    MONSTER_IDS.length > 1 && current
      ? MONSTER_IDS.filter((id) => id !== current)
      : MONSTER_IDS;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** The monster + its on-screen box at the moment of navigation, so the catalogue
 *  can fly that exact creature from here into its tile (Option C handoff). */
export interface CatalogOrigin {
  id: string;
  rect: DOMRect;
}

interface LandingProps {
  onStart: () => void;
  onCatalog?: (origin?: CatalogOrigin) => void;
  onAbout?: () => void;
  /** Fade the landing content out (the next screen scales in over the same bg). */
  exiting?: boolean;
}

type HeroKey = 'test' | 'catalog' | 'about';

interface Hero {
  title: string;
  blurb: string;
}

// Hover heroes (Figma 381-40 מבחן, 381-58 מגדיר מפלצות, 381-101 על הפרוייקט).
// Hovering a nav item now only swaps the bottom text — the background monster
// loop runs on its own, unaffected by hover.
const HERO: Record<HeroKey, Hero> = {
  test: {
    title: 'דימוי, רגש, מפלצת.',
    blurb:
      'ארבעה דימויים מופשטים מתוך הספר. התגובה אליהם מובילה למפלצת אחת מתוך המגדיר, ולרגש שהיא מגלמת.',
  },
  catalog: {
    title: 'מאגר המפלצות מתוך הפרוייקט',
    blurb:
      'מאגר המפלצות של הפרויקט. כל מפלצת מוצגת עם דימוי, תרבות מקור, שיוך רגשי וטקסט מחקרי קצר.',
  },
  about: {
    title: 'המחקר ושיטת העבודה',
    blurb:
      'הסבר קצר על הקשר בין האתר לספר, מטרת המבחן, מבנה המאגר וקרדיטים לתהליך העבודה.',
  },
};

export function Landing({ onStart, onCatalog, onAbout, exiting = false }: LandingProps) {
  const [hover, setHover] = useState<HeroKey | null>(null);
  const active = hover ? HERO[hover] : null;

  // The background monster currently drawing. It starts on mount and, each time a
  // draw completes (HoverGraphic's onDone), advances to a different creature — a
  // constant loop behind the page. Frozen while exiting so the fade-out is clean.
  const [bgMonster, setBgMonster] = useState<string | null>(() => pickNextMonster(null));

  // Warm every monster's line-art into the cache on first load, so each loop swap
  // mounts the next creature synchronously (no fetch). The gap to the next draw is
  // then a tight, consistent beat (see gapMs below) rather than fetch-bound.
  useEffect(() => {
    preloadGraphics(MONSTER_IDS.map(monsterSrc));
  }, []);

  const enter = (key: HeroKey) => setHover(key);
  // Freeze the hover while exiting so the fade-out happens from the hovered
  // screen's text, not the default landing.
  const leave = () => {
    if (!exiting) setHover(null);
  };

  // Keep the default content mounted for a beat after hover so it can fade out
  // before it unmounts (the hover content slides up into the same slot).
  const [showDefault, setShowDefault] = useState(true);
  useEffect(() => {
    if (!active) {
      setShowDefault(true);
      return;
    }
    const id = window.setTimeout(() => setShowDefault(false), 360);
    return () => window.clearTimeout(id);
  }, [active]);

  return (
    <div className={`landing ${active ? 'landing--hover' : ''} ${exiting ? 'landing--exiting' : ''}`}>
      {/* Constant background: a monster draws in, holds, withdraws (un-draws),
          then — after a short gap — the next creature draws in its place, looping
          for as long as the landing is shown. The `key` forces a fresh mount per
          creature so the next stroke-draw starts clean; onDone advances the loop
          once the draw + hold + withdraw + gap completes. `holdMs` is the linger
          at full draw before it withdraws; `gapMs` is the brief beat after the
          un-draw before the next creature begins. */}
      {bgMonster && (
        <HoverGraphic
          key={bgMonster}
          src={monsterSrc(bgMonster)}
          className="landing__bg landing__bg--catalog"
          holdMs={120}
          gapMs={30}
          onDone={() => {
            if (!exiting) setBgMonster((cur) => pickNextMonster(cur));
          }}
        />
      )}

      <nav className="landing__nav" aria-label="ניווט ראשי">
        <button
          type="button"
          className="landing__nav-item landing__nav-item--right"
          onClick={() => {
            // Ensure the test hero text is showing, then begin the exit.
            if (hover !== 'test') enter('test');
            onStart();
          }}
          onMouseEnter={() => enter('test')}
          onMouseLeave={leave}
        >
          <SwapText base="מבחן" hover="התחל" active={hover === 'test'} mode="fade" />
        </button>
        <button
          type="button"
          className="landing__nav-item landing__nav-item--center"
          onClick={() => {
            // Hand the catalogue the monster currently drawn in the background
            // (and its on-screen box) so it can fly that creature into its tile.
            // If none is present, navigate plainly.
            const id = bgMonster;
            const svg = document.querySelector('.landing__bg--catalog svg');
            if (id && svg) {
              onCatalog?.({ id, rect: svg.getBoundingClientRect() });
            } else {
              onCatalog?.();
            }
          }}
          onMouseEnter={() => enter('catalog')}
          onMouseLeave={leave}
        >
          <SwapText base="מגדיר מפלצות" hover="היכנס" active={hover === 'catalog'} mode="fade" />
        </button>
        <button
          type="button"
          className="landing__nav-item landing__nav-item--left"
          onClick={onAbout}
          onMouseEnter={() => enter('about')}
          onMouseLeave={leave}
        >
          <SwapText base="על הפרוייקט" hover="היכנס" active={hover === 'about'} mode="fade" />
        </button>
      </nav>

      <div className="landing__bottom">
        <div className="landing__slot landing__slot--left">
          {active && (
            <TypeText as="p" className="landing__blurb" text={active.blurb} duration={1500} />
          )}
        </div>

        <div className="landing__slot landing__slot--right">
          {showDefault && !exiting && (
            <h1
              className={`landing__title ${active ? 'is-exiting' : ''}`}
              dir="rtl"
            >
              הארכיטיפ
              <br />
              של המפלצת
            </h1>
          )}
          {active && (
            <TypeText
              as="h1"
              className="landing__title landing__title--hover"
              text={active.title}
              duration={1500}
            />
          )}
        </div>
      </div>
    </div>
  );
}
