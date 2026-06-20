import { useEffect, useRef, useState } from 'react';
import { Menu } from '../components/Menu';
import './About.css';

interface AboutProps {
  onTest?: () => void;
  onDefiner?: () => void;
  onHome?: () => void;
}

// The project blurb (Figma 382-1635, node 382:1640). Two paragraphs, RTL — the
// project description, then a personal thank-you note (separated by a blank line,
// rendered via `white-space: pre-line` on .about__text).
const ABOUT_TEXT =
  'הארכיטיפ של המפלצת הוא פרויקט גמר ב־B.Des תקשורת חזותית, אוניברסיטת חיפה, 2026. הפרויקט בוחן מפלצות כתגובות רגשיות: 39 מפלצות ממסורות שונות, מחולקות לשבעה פרקים לפי הרגש שהן מגלמות. האתר הוא תרגום דיגיטלי של המחקר, מבחן דימויים קצר, מאגר מפלצות ועמודי מידע. הוא אינו מחליף את הספר, אלא מציע דרך נוספת לפגוש את מערכת הסיווג שנבנתה בו. המחקר מבוסס על מקורות אקדמיים ומיתולוגיים המפורטים בספר. כלי AI שימשו בתהליך העבודה ככלי עזר למחקר, ארגון, ניסוח ופיתוח חזותי.\n\nתודה רבה לכל מי שתמך והקשיב לחפירות שלי על הפרוייקט, לאשתי היקרה, לחברי לשולחן הלימודים ולכם שצפיתם בפרוייקט ואני מקווה שהוא עניין אתכם כמו שהוא עניין אותי.';

// Typewriter cadence: one character every ~35ms so the whole paragraph (~574
// chars) lands in ~20s — slow and deliberate. Click or any key skips to the
// full text.
const CHARS_PER_TICK = 1;
const TICK_MS = 35;

/**
 * על הפרוייקט (Figma 382-1635). A dark page with the project blurb pinned to
 * the bottom, right-aligned. No big scale-open animation — the text simply
 * types itself in. A hidden full-text twin reserves the final box so the
 * paragraph never reflows as it fills.
 */
export function About({ onTest, onDefiner, onHome }: AboutProps) {
  const [count, setCount] = useState(0);
  const done = count >= ABOUT_TEXT.length;
  // Don't re-run the typewriter on prefers-reduced-motion: show it all at once.
  const reduceMotion = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (reduceMotion.current) {
      setCount(ABOUT_TEXT.length);
      return;
    }
    if (done) return;
    const id = window.setInterval(() => {
      setCount((c) => Math.min(ABOUT_TEXT.length, c + CHARS_PER_TICK));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [done]);

  // Skip to the full text on any interaction.
  const finish = () => setCount(ABOUT_TEXT.length);
  useEffect(() => {
    if (done) return;
    const onKey = () => finish();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [done]);

  return (
    <div className="about" onClick={finish}>
      <Menu onTest={onTest} onDefiner={onDefiner} onHome={onHome} active="about" />

      <div className="about__body">
        {/* Hidden full-text twin reserves the final multi-line height so the
            visible typed text (overlaid) never shifts the layout as it fills. */}
        <p className="about__text about__text--ghost" dir="rtl" aria-hidden="true">
          {ABOUT_TEXT}
        </p>
        <p className="about__text about__text--typed" dir="rtl">
          {ABOUT_TEXT.slice(0, count)}
          {!done && <span className="about__caret" aria-hidden="true" />}
        </p>
      </div>
    </div>
  );
}
