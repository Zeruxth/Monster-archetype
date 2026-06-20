import { useEffect, useState } from 'react';
import './Loading.css';

const ANALYZING = 'מנתח את התשובות';
const CHAR_STEP = 60; // delay between characters (matches the intro's cadence)

/**
 * Loading body shown while the answers are analysed. Lives inside the persistent
 * test shell (so the dark page + white frame never remount): the answer card has
 * collapsed to this centred pill, and the shell's four dots sit just below it and
 * loop a loading pulse. The text "writes" itself in like the intro.
 */
export function LoadingBody() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCount((c) => {
        if (c >= ANALYZING.length) {
          window.clearInterval(interval);
          return c;
        }
        return c + 1;
      });
    }, CHAR_STEP);
    return () => window.clearInterval(interval);
  }, []);

  const typed = ANALYZING.slice(0, count);

  return (
    <div className="loading__pill">
      {/* Hidden full text reserves the final width so the pill doesn't grow as
          characters appear; the visible text overlays it exactly. */}
      <p className="loading__text" dir="rtl">
        <span className="loading__text-sizer" aria-hidden="true">
          {ANALYZING}
        </span>
        <span className="loading__text-typed">{typed}</span>
      </p>
    </div>
  );
}
