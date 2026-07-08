import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Arrow } from '../components/Arrow';
import { Lightbox } from '../components/Lightbox';
import { Menu } from '../components/Menu';
import { Minotaur } from '../components/Minotaur';
import { MonsterArt, hasMonsterArt } from '../components/MonsterArt';
import { MonsterSolid, hasSolidArt } from '../components/MonsterSolid';
import { EMOTIONS } from '../data/emotions';
import { monsterImages } from '../data/monsterImages';
import type { Monster } from '../data/monsters';
import './MonsterPage.css';

interface MonsterPageProps {
  monster: Monster;
  /** The clicked catalogue tile's box — the panel scales open from its centre. */
  origin?: DOMRect | null;
  /** Back arrow → return to the catalogue. */
  onBack?: () => void;
  onTest?: () => void;
  onDefiner?: () => void;
  onAbout?: () => void;
  onHome?: () => void;
}

// Open transition: the white panel grows out of the clicked tile (like the
// מבחן frame scaling in, but originating from where the monster was clicked).
const OPEN_MS = 600;
const OPEN_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * A single monster's page (Figma 382-1522, the Minotaur). A light scrolling
 * panel on the dark page: a text column (origin, myth, the emotion it embodies,
 * further reading) beside the monster art, with a gallery of reference images
 * wrapping below. The art is the filled Minotaur placeholder until per-monster
 * designs land. The panel itself scrolls, so its (minimal) scrollbar stays
 * inside the rounded frame.
 */
export function MonsterPage({
  monster,
  origin = null,
  onBack,
  onTest,
  onDefiner,
  onAbout,
  onHome,
}: MonsterPageProps) {
  const emotion = EMOTIONS[monster.emotion];
  const images = monsterImages(monster.id);

  // Which gallery image is open in the lightbox (null = closed).
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Scale the panel open from the clicked tile's centre: it starts roughly
  // tile-sized at that point and grows to fill, so the monster "changes places
  // and scales" while the frame opens from the direction of the click.
  const panelRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!origin) return;
    const panel = panelRef.current;
    if (!panel) return;
    panel.getAnimations().forEach((a) => a.cancel());

    const panelRect = panel.getBoundingClientRect();
    const cx = origin.left + origin.width / 2;
    const cy = origin.top + origin.height / 2;
    panel.style.transformOrigin = `${cx - panelRect.left}px ${cy - panelRect.top}px`;
    const startScale = Math.max(0.08, origin.width / panelRect.width);

    const anim = panel.animate(
      [
        { transform: `scale(${startScale})`, opacity: 0 },
        { opacity: 1, offset: 0.45 },
        { transform: 'scale(1)', opacity: 1 },
      ],
      { duration: OPEN_MS, easing: OPEN_EASE, fill: 'both' },
    );
    anim.onfinish = () => {
      // Drop the animation entirely once it lands. With fill:'both' a finished
      // animation keeps holding `transform: scale(1)` on the panel, which forces
      // it onto a composited layer — and the browser then rasterizes the inline
      // monster SVG at the layer bitmap (1× on non-retina), making the line-art
      // look pixelated/aliased. The end state equals the panel's natural state,
      // so cancelling is visually seamless but restores crisp vector rendering.
      anim.cancel();
      panel.style.transformOrigin = '';
    };
    return () => anim.cancel();
  }, [origin]);

  // Show the emotion word (e.g. "לבלבול") in the emotion's colour mid-sentence.
  const emotionBody = (): ReactNode => {
    const text = monster.emotionText ?? '';
    const word = monster.emotionWord;
    if (!word) return text;
    const i = text.indexOf(word);
    if (i === -1) return text;
    return (
      <>
        {text.slice(0, i)}
        <span style={{ color: emotion.colorVar }}>{word}</span>
        {text.slice(i + word.length)}
      </>
    );
  };

  return (
    <div className="monster-page">
      <Menu
        onTest={onTest}
        onDefiner={onDefiner}
        onAbout={onAbout}
        onHome={onHome}
        active="definer"
      />

      <div className="monster-page__panel panel-scroll" ref={panelRef}>
        <div className="monster-page__top">
          <div className="monster-page__info">
            <h1 className="monster-page__title" dir="rtl">
              {monster.he} / {monster.en}
            </h1>

            <div className="monster-page__sections">
              {monster.culture && (
                <section className="monster-page__section">
                  <h2 className="monster-page__label" dir="rtl">
                    מקור תרבותי
                  </h2>
                  <p className="monster-page__body" dir="rtl">
                    {monster.culture}
                  </p>
                </section>
              )}

              {monster.about && (
                <section className="monster-page__section">
                  <h2 className="monster-page__label" dir="rtl">
                    על המפלצת
                  </h2>
                  <p className="monster-page__body" dir="rtl">
                    {monster.about}
                  </p>
                </section>
              )}

              {monster.emotionText && (
                <section className="monster-page__section">
                  <h2 className="monster-page__label" dir="rtl">
                    הרגש שהמפלצת מגלמת
                  </h2>
                  <p className="monster-page__body" dir="rtl">
                    {emotionBody()}
                  </p>
                </section>
              )}

              {monster.links && monster.links.length > 0 && (
                <section className="monster-page__section">
                  <h2 className="monster-page__label" dir="rtl">
                    לקריאה נוספת
                  </h2>
                  <div className="monster-page__links">
                    {monster.links.map((l) => (
                      <a
                        key={l.label}
                        className="monster-page__link"
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {l.label}
                      </a>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          <div className="monster-page__art">
            <button
              type="button"
              className="monster-page__back arrow-host"
              onClick={onBack}
              aria-label="חזרה למגדיר"
            >
              <Arrow direction="right" />
            </button>
            {/* Mirror the Result's art choice so the "discover more" hero-morph is
                a true identity: the Result reveals the finished SILHOUETTE
                (MonsterSolid) and drains it to line art, so this page must show that
                SAME drawing (same component, same viewBox, same paths) — the CSS
                below repaints it from filled to line so it equals the drained
                end-state exactly. MonsterArt (the catalogue's outline) stays only as
                a fallback for any monster that has outline art but no silhouette;
                the filled Minotaur is the last resort. */}
            {hasSolidArt(monster.id) ? (
              <MonsterSolid id={monster.id} className="monster-page__monster monster-hero" />
            ) : hasMonsterArt(monster.id) ? (
              <MonsterArt id={monster.id} className="monster-page__monster monster-hero" />
            ) : (
              <Minotaur className="monster-page__monster monster-hero" />
            )}
          </div>
        </div>

        {images.length > 0 && (
          <div className="monster-page__gallery">
            {images.map((img, i) => (
              <button
                key={img.src}
                type="button"
                className="monster-page__image-btn"
                onClick={() => setLightboxIndex(i)}
                aria-label={`הגדלה: ${img.title}`}
              >
                <img
                  className="monster-page__image"
                  src={img.src}
                  alt={img.title}
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndex={setLightboxIndex}
        />
      )}
    </div>
  );
}
