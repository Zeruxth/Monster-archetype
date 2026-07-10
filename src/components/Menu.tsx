import { useEffect, useState } from 'react';
import './Menu.css';

/** Which top-level page is currently open (gets the active underline). */
type MenuPage = 'about' | 'definer' | 'test';

/** The asterisk mark (Figma 356-136 / 558-1102) — the inline logo. Inlined (not
 *  a mask) so the logo can swap its solid fill for a 1px outline on hover;
 *  `currentColor` drives both. */
const ASTERISK_PATH =
  'M13.583 8.01128C13.583 8.39234 14.0055 8.62162 14.325 8.41395L20.2271 4.57751C20.625 4.31883 21.117 4.7327 20.9303 5.16908L19.2541 9.08722C19.1614 9.30375 19.2395 9.5555 19.4384 9.68166L22.8307 11.8338C23.2155 12.0779 23.0758 12.6705 22.6225 12.717L16.9446 13.3001C16.5548 13.3401 16.3744 13.805 16.6353 14.0975L21.3164 19.3465C21.478 19.5276 21.479 19.8009 21.3187 19.9832L19.1347 22.4679C18.9444 22.6844 18.6076 22.6857 18.4157 22.4707L14.4216 17.997C14.1278 17.668 13.583 17.8758 13.583 18.3169V23.5197C13.583 23.785 13.368 24 13.1028 24H10.8972C10.632 24 10.417 23.785 10.417 23.5197L10.417 15.9881C10.417 15.607 9.99442 15.3777 9.67493 15.5854L3.77296 19.4224C3.37502 19.6811 2.88296 19.2672 3.06965 18.8308L4.74593 14.9123C4.83856 14.6958 4.76051 14.444 4.56164 14.3179L1.16935 12.166C0.784561 11.9219 0.924239 11.3292 1.37754 11.2827L7.05533 10.6994C7.44513 10.6594 7.62549 10.1946 7.36472 9.90209L2.58918 4.54598C2.42765 4.36481 2.42668 4.09161 2.58693 3.9093L4.80839 1.38203C4.99965 1.16444 5.33857 1.16444 5.52982 1.38203L9.57598 5.98519C9.8684 6.31786 10.417 6.11104 10.417 5.66812V0.480259C10.417 0.21502 10.632 0 10.8972 0L13.1028 0C13.368 0 13.583 0.215019 13.583 0.480258V8.01128Z';

/** The X mark (Figma 574-1534) — the mobile overlay's close button. Same brand
 *  letterform family as the asterisk, but an X reads unambiguously as "exit",
 *  so the mark that opened the menu visibly becomes the mark that closes it. */
const X_PATH =
  'M25.263 0.315898C25.477 0.14142 25.7919 0.173404 25.9664 0.387341L26.7571 1.35665C26.9317 1.57064 26.8997 1.88565 26.6857 2.06019L17.0117 9.94971C16.6586 10.2377 16.378 10.6045 16.1924 11.0206L16.1742 11.0616C15.8393 11.8127 15.8496 12.6728 16.2025 13.4156C16.3817 13.7927 16.6424 14.1252 16.9659 14.389L26.6857 22.3168C26.8997 22.4913 26.9317 22.8063 26.7571 23.0203L25.9662 23.9898C25.7918 24.2037 25.477 24.2357 25.263 24.0614L15.7467 16.3095C14.4595 15.261 12.6128 15.261 11.3256 16.3096L1.81024 24.0614C1.59625 24.2357 1.28148 24.2037 1.107 23.9898L0.316094 23.0203C0.141525 22.8063 0.173496 22.4913 0.387501 22.3168L10.062 14.426C10.4148 14.1382 10.6953 13.7717 10.8807 13.3559L10.8987 13.3156C11.2338 12.5643 11.2236 11.7041 10.8708 10.9609C10.6916 10.5835 10.4306 10.2507 10.1069 9.98663L0.38754 2.06019C0.173517 1.88565 0.141536 1.57065 0.316112 1.35665L1.10685 0.387357C1.28138 0.173413 1.59629 0.141435 1.81027 0.315925L11.3243 8.07427C12.6119 9.12429 14.4603 9.12433 15.748 8.07436L25.263 0.315898Z';

/** Colour scheme (Figma 356-136). `light` (default) — light logo + links, for the
 *  dark surfaces every current screen uses. `dark` — dark logo + links, for light
 *  surfaces; wired up for an upcoming change, not yet used anywhere. */
type MenuVariant = 'light' | 'dark';

interface MenuProps {
  /** "מבחן" — enters the Rorschach experience. */
  onTest?: () => void;
  /** "מגדיר" — opens the monster catalogue. */
  onDefiner?: () => void;
  /** "על הפרוייקט" — opens the about screen. */
  onAbout?: () => void;
  /** The asterisk logo — returns to the home (landing) screen. */
  onHome?: () => void;
  /** The current page — its menu item is underlined to mark "you are here". */
  active?: MenuPage;
  /** Colour scheme; see MenuVariant. Defaults to `light`. */
  variant?: MenuVariant;
}

export function Menu({
  onTest,
  onDefiner,
  onAbout,
  onHome,
  active,
  variant = 'light',
}: MenuProps) {
  const linkClass = (page: MenuPage) =>
    `menu__link${active === page ? ' menu__link--active' : ''}`;

  // Mobile (≤700px): touch has no hover to reveal the inline links, so the
  // asterisk becomes a toggle for a full-screen menu instead of going home
  // (home lives inside the overlay). Desktop keeps asterisk = home.
  const [open, setOpen] = useState(false);
  const handleLogo = () => {
    if (window.matchMedia('(max-width: 700px)').matches) {
      setOpen((o) => !o);
    } else {
      onHome?.();
    }
  };
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  /** Close the overlay, then run the item's navigation. */
  const pick = (go?: () => void) => () => {
    setOpen(false);
    go?.();
  };
  const overlayLinkClass = (page: MenuPage) =>
    `menu__overlay-link${active === page ? ' menu__overlay-link--active' : ''}`;

  return (
    <nav className={`menu menu--${variant}`} aria-label="ניווט ראשי">
      <div className="menu__links">
        <button
          type="button"
          className={linkClass('about')}
          onClick={onAbout}
          disabled={!onAbout}
          aria-current={active === 'about' ? 'page' : undefined}
        >
          על הפרוייקט
        </button>
        <button
          type="button"
          className={linkClass('definer')}
          onClick={onDefiner}
          disabled={!onDefiner}
          aria-current={active === 'definer' ? 'page' : undefined}
        >
          מגדיר
        </button>
        <button
          type="button"
          className={linkClass('test')}
          onClick={onTest}
          aria-current={active === 'test' ? 'page' : undefined}
        >
          מבחן
        </button>
      </div>
      <button
        type="button"
        className="menu__logo"
        aria-label="דף הבית"
        onClick={handleLogo}
      >
        {/* Inlined so the asterisk can toggle fill → 1px stroke on hover. A CSS
            mask can only fill a shape, never outline it, so the SVG lives in the
            DOM and `currentColor` drives both the fill and the stroke (colour
            set per variant on .menu__logo). */}
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d={ASTERISK_PATH} />
        </svg>
      </button>

      {/* Mobile full-screen menu: the whole page goes dark with the links large
          and stacked; the asterisk (same spot as the trigger) closes it. Only
          ever opened by handleLogo's ≤700px branch. */}
      {open && (
        <div className="menu__overlay">
          <button
            type="button"
            className="menu__overlay-close"
            aria-label="סגור תפריט"
            onClick={() => setOpen(false)}
          >
            <svg viewBox="0 0 27.0732 24.377" aria-hidden="true" focusable="false">
              <path d={X_PATH} />
            </svg>
          </button>
          <button
            type="button"
            className="menu__overlay-link"
            onClick={pick(onHome)}
            disabled={!onHome}
          >
            דף הבית
          </button>
          <button
            type="button"
            className={overlayLinkClass('test')}
            onClick={pick(onTest)}
            aria-current={active === 'test' ? 'page' : undefined}
          >
            מבחן
          </button>
          <button
            type="button"
            className={overlayLinkClass('definer')}
            onClick={pick(onDefiner)}
            disabled={!onDefiner}
            aria-current={active === 'definer' ? 'page' : undefined}
          >
            מגדיר
          </button>
          <button
            type="button"
            className={overlayLinkClass('about')}
            onClick={pick(onAbout)}
            disabled={!onAbout}
            aria-current={active === 'about' ? 'page' : undefined}
          >
            על הפרוייקט
          </button>
        </div>
      )}
    </nav>
  );
}
