import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import './Instructions.css';

interface InstructionsBodyProps {
  onStart: () => void;
}

// Two sentences with a hard break before the last one (matches Figma 487-384);
// `\n` + white-space: pre-line in the CSS forces that break while the first
// sentence still wraps naturally within the text box.
const INTRO =
  'במבחן יוצגו ארבעה דימויים מופשטים. אחרי כל דימוי כתבו מה הוא יכול להיות בעיניכם.\nאין תשובה נכונה ואין הגבלת זמן.';

// Reveal timeline (ms), relative to the shell mounting:
//  0–800   white frame scales in (CSS, see .test__frame)
//  800…    text "types" one character at a time (no fade — chars just appear)
//  after   the button rises up from below (the dots live on the next screen)
const TEXT_START = 800;
const CHAR_STEP = 50; // delay between characters
const RISE_GAP = 100; // pause after the text finishes before the rise

/** When the button + dots rise in, after the text has finished "writing". */
export const INSTRUCTIONS_RISE_DELAY =
  TEXT_START + INTRO.length * CHAR_STEP + RISE_GAP;

export function InstructionsBody({ onStart }: InstructionsBodyProps) {
  // Reveal a growing prefix of the real string (keeps RTL layout intact, unlike
  // per-character spans which break Hebrew word-wrapping and bidi ordering).
  const [count, setCount] = useState(0);

  useEffect(() => {
    let interval: number | undefined;
    const startId = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setCount((c) => {
          if (c >= INTRO.length) {
            window.clearInterval(interval);
            return c;
          }
          return c + 1;
        });
      }, CHAR_STEP);
    }, TEXT_START);
    return () => {
      window.clearTimeout(startId);
      if (interval) window.clearInterval(interval);
    };
  }, []);

  const typed = INTRO.slice(0, count);

  return (
    <div className="instructions__content">
      {/* Hidden full text reserves the final wrapped size so the visible,
          growing text overlays it exactly and nothing reflows. */}
      <p className="instructions__text" dir="rtl">
        <span className="instructions__text-sizer" aria-hidden="true">
          {INTRO}
        </span>
        <span className="instructions__text-typed">{typed}</span>
      </p>
      <div
        className="instructions__cta"
        style={{ animationDelay: `${INSTRUCTIONS_RISE_DELAY}ms` }}
      >
        <Button arrow onClick={onStart}>
          התחלה
        </Button>
      </div>
    </div>
  );
}
