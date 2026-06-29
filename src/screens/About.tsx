import { useEffect, useRef, useState } from 'react';
import { Menu } from '../components/Menu';
import './About.css';

interface AboutProps {
  onTest?: () => void;
  onDefiner?: () => void;
  onHome?: () => void;
}

// The project blurb (Figma 486-299). Three paragraphs, RTL — the project's
// emotional reading of monsters, the sources it leans on, and the role of AI
// tools — each on its own line (single \n breaks, rendered via
// `white-space: pre-line` on .about__text). The third paragraph closes with a
// personal thank-you note.
const ABOUT_TEXT =
  'הפרויקט בוחן מפלצות כצורות חזותיות של רגשות. במקום לסדר אותן לפי תרבות, תקופה או מבנה גוף, הוא מציע לקרוא אותן דרך הפעולה הרגשית שלהן: מה הן מעוררות, מה הן מסמנות, ואיזה גבול הן מערערות.\nהספר והאתר נשענים על מקורות מיתולוגיים, טקסטים עתיקים, מאמרים וספרי מחקר. החיבור בין המפלצות לרגשות הוא הפרשנות שמציע הפרויקט, ולכן המקורות משמשים בסיס לקריאה, לא תחליף לה.\nכלי בינה מלאכותית שימשו בתהליך העבודה לארגון מידע, ניסוח, עריכה וניתוח תגובות באתר. הם אינם משמשים כאבחון או כמקור סמכות עצמאי, אלא ככלי עזר בתוך מהלך פרשני.  תודה רבה לכל מי שתמך והקשיב לחפירות שלי על הפרוייקט, לאשתי היקרה, לחברי לשולחן הלימודים ולכם שצפיתם בפרוייקט ואני מקווה שהוא עניין אתכם כמו שהוא עניין אותי.';

// Typewriter cadence: one character every ~35ms — a slow, deliberate crawl
// (~24s for the full blurb). Click or any key skips to the full text.
const CHARS_PER_TICK = 1;
const TICK_MS = 35;

/**
 * על הפרוייקט (Figma 486-299). A dark page with the project blurb pinned to
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
