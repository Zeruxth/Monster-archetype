import './Menu.css';

/** Which top-level page is currently open (gets the active underline). */
type MenuPage = 'about' | 'definer' | 'test';

interface MenuProps {
  /** "מבחן" — enters the Rorschach experience. */
  onTest?: () => void;
  /** "מגדיר" — opens the monster catalogue. */
  onDefiner?: () => void;
  /** "על הפרוייקט" — opens the about screen. */
  onAbout?: () => void;
  /** The square logo — returns to the home (landing) screen. */
  onHome?: () => void;
  /** The current page — its menu item is underlined to mark "you are here". */
  active?: MenuPage;
}

export function Menu({ onTest, onDefiner, onAbout, onHome, active }: MenuProps) {
  const linkClass = (page: MenuPage) =>
    `menu__link${active === page ? ' menu__link--active' : ''}`;

  return (
    <nav className="menu" aria-label="ניווט ראשי">
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
        className="menu__square"
        aria-label="דף הבית"
        onClick={onHome}
      />
    </nav>
  );
}
