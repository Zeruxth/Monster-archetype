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

// The first-entrance intro (nav buttons slide in, title rises) plays only once
// per page load. A module-level flag — not React state — survives the Landing
// unmount/remount that "back to menu" (goHome in App.tsx) triggers, so returning
// to the landing shows everything already at rest instead of replaying the intro.
// A full page reload resets it, which is correct: a reload IS a fresh entrance.
let hasPlayedIntro = false;

export function Landing({ onStart, onCatalog, onAbout, exiting = false }: LandingProps) {
  const [hover, setHover] = useState<HeroKey | null>(null);
  const active = hover ? HERO[hover] : null;

  // First-entrance intro: on the very first landing mount of this page load,
  // hold the nav buttons + title hidden for ~1s (the background monster draws
  // alone), then slide/rise them in (see .landing--intro in Landing.css). `intro`
  // gates the CSS; it's captured once from the module flag so it's true only on
  // that first mount and false when returning via "back to menu".
  const [intro, setIntro] = useState(() => !hasPlayedIntro);
  useEffect(() => {
    if (!intro) return;
    hasPlayedIntro = true;
    // Drop the class once the delayed entrance has finished, so the completed
    // animations stop applying and normal hover styling takes back over. Covers
    // the slowest leg: the title's fade (1000ms delay + 1200ms) plus a buffer.
    const id = window.setTimeout(() => setIntro(false), 2400);
    return () => window.clearTimeout(id);
  }, [intro]);

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

  // Touch has no hover, so the hover-preview (swap text + hero title/blurb)
  // would never be seen — a tap would navigate blind. In the two-tap flow the
  // FIRST tap only reveals the item's info and "arms" it; the SECOND tap enters.
  // Note the synthetic mouseenter a tap fires can't arm — only a click can — so
  // the first tap always previews.
  const [armed, setArmed] = useState<HeroKey | null>(null);

  const enter = (key: HeroKey) => setHover(key);
  // Freeze the hover while exiting so the fade-out happens from the hovered
  // screen's text, not the default landing.
  const leave = () => {
    if (!exiting) {
      setHover(null);
      // Touch: tapping away also disarms — the next tap shows the info again
      // instead of navigating blind.
      setArmed(null);
    }
  };

  // Checked at tap time (not mount) so it tracks the live input environment.
  // Two-tap applies on hover-less devices at any width AND in the mobile layout
  // (≤700px) even with a mouse — the phone flow is part of that layout, so a
  // narrow desktop window behaves exactly like the phone (tap מבחן → the hero
  // text enters and the label swaps; tap again → enter the test).
  const tapPreviews = (key: HeroKey): boolean => {
    const twoTap =
      window.matchMedia('(hover: none)').matches ||
      window.matchMedia('(max-width: 700px)').matches;
    if (!twoTap) return false;
    if (armed === key) return false; // second tap — let the click navigate
    enter(key);
    setArmed(key);
    return true;
  };

  // The three destinations, shared by the nav buttons (second tap / desktop
  // click) and the comparison sheet's היכנס button (variant D below).
  const goTest = () => {
    // Ensure the test hero text is showing, then begin the exit.
    if (hover !== 'test') enter('test');
    onStart();
  };
  const goCatalog = () => {
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
  };
  const goAbout = () => onAbout?.();

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
    <div
      className={`landing ${active ? 'landing--hover' : ''} ${exiting ? 'landing--exiting' : ''} ${
        intro ? 'landing--intro' : ''
      }`}
    >
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

      {/* Brand mark: the asterisk logo pinned to the bottom-left corner
          (Figma 558-1273), opposite the title — the home screen's own logo, the
          same mark the Menu shows on every other screen. It fades out on hover so
          the hero blurb can take over the bottom-left slot. */}
      <svg
        className="landing__logo"
        viewBox="0 0 64 57"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M36.2214 18.913C36.2214 19.7774 37.1552 20.3192 37.9056 19.8905L54.3047 10.5206C55.2664 9.9711 56.3601 10.9948 55.8754 11.9906L51.3816 21.2234C51.1202 21.7605 51.3239 22.4083 51.8456 22.6993L60.8143 27.7006C61.7817 28.24 61.4704 29.7054 60.3673 29.8049L45.1112 31.182C44.1565 31.2682 43.7394 32.432 44.4222 33.1049L56.7909 45.2958C57.236 45.7345 57.2386 46.4517 56.7967 46.8936L50.8612 52.8291C50.424 53.2663 49.716 53.2691 49.2754 52.8353L38.1369 41.8692C37.4253 41.1686 36.2214 41.6727 36.2214 42.6714V55.13C36.2214 55.7517 35.7174 56.2557 35.0957 56.2557H28.9043C28.2826 56.2557 27.7786 55.7517 27.7786 55.13V37.3412C27.7786 36.4768 26.8448 35.9349 26.0943 36.3638L9.6953 45.7349C8.73366 46.2844 7.63988 45.2608 8.12456 44.2649L12.6184 35.0312C12.8798 34.4941 12.6761 33.8463 12.1544 33.5554L3.18574 28.5545C2.21838 28.0151 2.52964 26.5498 3.63274 26.4501L18.8887 25.0726C19.8434 24.9865 20.2604 23.8228 19.5778 23.1498L6.95734 10.7078C6.51237 10.2692 6.50981 9.55202 6.95165 9.11019L12.9883 3.07355C13.4279 2.63393 14.1407 2.63393 14.5803 3.07355L25.8568 14.3501C26.566 15.0593 27.7786 14.557 27.7786 13.5541V1.12572C27.7786 0.504 28.2826 0 28.9043 0L35.0957 0C35.7174 0 36.2214 0.504002 36.2214 1.12572V18.913Z" />
      </svg>

      <nav className="landing__nav" aria-label="ניווט ראשי">
        <button
          type="button"
          className="landing__nav-item landing__nav-item--right"
          onClick={() => {
            if (tapPreviews('test')) return; // touch: first tap = info only
            goTest();
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
            if (tapPreviews('catalog')) return; // touch: first tap = info only
            goCatalog();
          }}
          onMouseEnter={() => enter('catalog')}
          onMouseLeave={leave}
        >
          <SwapText base="מגדיר מפלצות" hover="היכנס" active={hover === 'catalog'} mode="fade" />
        </button>
        <button
          type="button"
          className="landing__nav-item landing__nav-item--left"
          onClick={() => {
            if (tapPreviews('about')) return; // touch: first tap = info only
            goAbout();
          }}
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
