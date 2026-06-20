import { useEffect, useRef, useState } from 'react';
import { Menu } from '../components/Menu';
import { HoverGraphic } from '../components/HoverGraphic';
import { monsterArtIds, monsterArtSvg } from '../data/monsterArt';
import './Landing.css';

// The finished monsters (line-art). Hovering מגדיר מפלצות draws a random one,
// avoiding an immediate repeat so each hover feels like a new creature.
const MONSTER_IDS = monsterArtIds();

// Build a self-contained data: URL for a monster's line-art so HoverGraphic can
// fetch + inline it (strokes in #BABABA to match the landing's faint graphics).
function monsterSrc(id: string): string {
  return 'data:image/svg+xml,' + encodeURIComponent(monsterArtSvg(id, '#BABABA'));
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
  // Pool of background graphics — one is picked at random on each hover.
  // (Today each has one; more will be added later.)
  graphics: string[];
  // How the graphic enters: 'fade' (filled blot <img>), 'draw' (line-art
  // stroke-draw via HoverGraphic), or 'slide' (<img> sliding up from below).
  reveal: 'fade' | 'draw' | 'slide';
}

// Hover heroes (Figma 381-40 מבחן, 381-58 מגדיר מפלצות, 381-101 על הפרוייקט).
const HERO: Record<HeroKey, Hero> = {
  test: {
    title: 'מבחן פרשנות חזותית',
    blurb:
      'לפניכם יוצגו ארבעה דימויים מופשטים. לאחר כל דימוי כתבו תגובה חופשית וקבלו תוצאה בהתאם למה שראיתם',
    graphics: ['/blots/hover-test.svg'],
    reveal: 'fade',
  },
  catalog: {
    title: 'מאגר המפלצות מתוך הפרוייקט',
    blurb:
      'מאגר המפלצות של הפרויקט. כל מפלצת מוצגת עם דימוי, תרבות מקור, שיוך רגשי וטקסט מחקרי קצר.',
    // The graphic is chosen per-hover from the finished monsters (see `enter`),
    // so this pool is left empty.
    graphics: [],
    reveal: 'draw',
  },
  about: {
    title: 'המחקר ושיטת העבודה',
    blurb:
      'הסבר קצר על הקשר בין האתר לספר, מטרת המבחן, מבנה המאגר וקרדיטים לתהליך העבודה.',
    graphics: ['/blots/hover-about.jpg'],
    reveal: 'slide',
  },
};

function pick(pool: string[]) {
  return pool[Math.floor(Math.random() * pool.length)];
}

export function Landing({ onStart, onCatalog, onAbout, exiting = false }: LandingProps) {
  const [hover, setHover] = useState<HeroKey | null>(null);
  const [graphic, setGraphic] = useState<string | null>(null);
  const active = hover ? HERO[hover] : null;

  // Track the last monster drawn so consecutive catalog hovers differ.
  const lastMonster = useRef<string | null>(null);

  const enter = (key: HeroKey) => {
    if (key === 'catalog' && MONSTER_IDS.length > 0) {
      // Pick a different finished monster than last time, so every hover draws
      // a new creature.
      const pool =
        MONSTER_IDS.length > 1
          ? MONSTER_IDS.filter((id) => id !== lastMonster.current)
          : MONSTER_IDS;
      const id = pick(pool);
      lastMonster.current = id;
      setGraphic(monsterSrc(id));
    } else {
      setGraphic(pick(HERO[key].graphics));
    }
    setHover(key);
  };
  // Freeze the hover while exiting so the fade-out happens from the מבחן hover
  // screen (the graphic + section title), not the default landing.
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
      {/* Corner square doubles as the shared Menu so it opens on hover here too,
          matching every other screen. No item is "active" on the home screen. */}
      <Menu onTest={onStart} onDefiner={() => onCatalog?.()} onAbout={onAbout} />

      {active && hover && graphic && (
        active.reveal === 'draw' ? (
          <HoverGraphic
            key={graphic}
            src={graphic}
            className={`landing__bg landing__bg--${hover}`}
          />
        ) : (
          <img
            key={graphic}
            className={`landing__bg landing__bg--${active.reveal} landing__bg--${hover}`}
            src={graphic}
            alt=""
            aria-hidden="true"
          />
        )
      )}

      <nav className="landing__nav" aria-label="ניווט ראשי">
        <button
          type="button"
          className="landing__nav-item landing__nav-item--right"
          onClick={() => {
            // Ensure the test hero is showing, then begin the exit so we fade
            // out of the מבחן hover screen.
            if (hover !== 'test') enter('test');
            onStart();
          }}
          onMouseEnter={() => enter('test')}
          onMouseLeave={leave}
        >
          מבחן
        </button>
        <button
          type="button"
          className="landing__nav-item landing__nav-item--center"
          onClick={() => {
            // Hand the catalogue the exact monster currently drawn and its box,
            // so it can fly that creature from here into its tile. If nothing is
            // hovered (e.g. keyboard/click without hover), navigate plainly.
            const id = lastMonster.current;
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
          מגדיר מפלצות
        </button>
        <button
          type="button"
          className="landing__nav-item landing__nav-item--left"
          onClick={onAbout}
          onMouseEnter={() => enter('about')}
          onMouseLeave={leave}
        >
          על הפרוייקט
        </button>
      </nav>

      <div className="landing__bottom">
        <div className="landing__slot landing__slot--left">
          {showDefault && !exiting && (
            <p
              className={`landing__credit ${active ? 'is-exiting' : ''}`}
              dir="rtl"
            >
              פרויקט גמר 2026
            </p>
          )}
          {active && (
            <p className="landing__blurb is-entering" dir="rtl">
              {active.blurb}
            </p>
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
            <h1 className="landing__title landing__title--hover is-entering" dir="rtl">
              {active.title}
            </h1>
          )}
        </div>
      </div>
    </div>
  );
}
