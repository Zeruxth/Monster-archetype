import { useEffect, useRef, useState } from 'react';
import { Menu } from '../components/Menu';
import './About.css';

interface AboutProps {
  onTest?: () => void;
  onDefiner?: () => void;
  onHome?: () => void;
}

// The project blurb (Figma 558-610). One flowing paragraph at 34px pinned to the
// bottom and right-aligned, with the closing contact line directly beneath it at
// the same size — one full-width text column (see About.css). RTL. The text
// "types itself in"; a \n separates the blurb from the contact line.
const ABOUT_TEXT =
  'הפרויקט בוחן מפלצות מיתיות כצורות חזותיות של רגשות. במקום לסווג אותן לפי תרבות, תקופה או מבנה גוף, הוא מציע לקרוא אותן דרך הפעולה הרגשית שלהן: מה הן מעוררות, מה הן מסמנות, ואיזה גבול הן מערערות. הפרויקט מתקיים בשני פורמטים: ספר עיון ואתר אינטראקטיבי. הספר מציע קריאה מחקרית ופרשנית במפלצות וברגשות שהן מגלמות, בעוד האתר מזמין את הצופה לפגוש את המפלצת דרך פעולה אישית, אסוציאטיבית ועכשווית. דרך שני הפורמטים, הפרויקט שואל כיצד רגשות עתיקים ממשיכים להפעיל אותנו היום, וכיצד האדם ממשיך ליצור לעצמו מפלצות חדשות. העבודה נשענת על מקורות מיתולוגיים, טקסטים עתיקים וספרות מחקר. כלי בינה מלאכותית שימשו בתהליך לארגון, ניסוח, עריכה וניתוח תגובות, ככלי עזר בלבד. תודה לכל מי שתמך, ליווה, קרא, העיר ועצר להתבונן.';

// The closing contact line, on its own line directly beneath the blurb.
const CONTACT_TEXT = 'להמשך שיחה, מחשבות או שאלות @aki.wip באינסטגרם';

// The full typed run: blurb, then the contact line on its own line. Rendered with
// `white-space: pre-line`, so the \n becomes a single line break.
const FULL_TEXT = `${ABOUT_TEXT}\n${CONTACT_TEXT}`;

// Typewriter cadence: one character every ~35ms — a slow, deliberate crawl.
// Click or any key skips to the full text.
const CHARS_PER_TICK = 1;
const TICK_MS = 35;

/**
 * על הפרוייקט (Figma 558-610). A dark page with the project blurb pinned to the
 * bottom-right and its contact line on the next line — one full-width, right-
 * aligned text column. No big scale-open — the text simply types itself in. A
 * hidden full-text twin reserves the final box so nothing reflows as it fills.
 */
export function About({ onTest, onDefiner, onHome }: AboutProps) {
  const [count, setCount] = useState(0);
  const done = count >= FULL_TEXT.length;
  // Don't re-run the typewriter on prefers-reduced-motion: show it all at once.
  const reduceMotion = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (reduceMotion.current) {
      setCount(FULL_TEXT.length);
      return;
    }
    if (done) return;
    const id = window.setInterval(() => {
      setCount((c) => Math.min(FULL_TEXT.length, c + CHARS_PER_TICK));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [done]);

  // Skip to the full text on any interaction.
  const finish = () => setCount(FULL_TEXT.length);
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
        {/* Hidden full-text twin reserves the final wrapped box so the visible
            typed copy (overlaid) never shifts the layout as it fills. */}
        <p className="about__text about__text--ghost" dir="rtl" aria-hidden="true">
          {FULL_TEXT}
        </p>
        <p className="about__text about__text--typed" dir="rtl">
          {FULL_TEXT.slice(0, count)}
          {!done && <span className="about__caret" aria-hidden="true" />}
        </p>
      </div>
    </div>
  );
}
