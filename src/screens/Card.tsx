import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CardDef } from '../data/cards';
import './Card.css';

interface CardBodyProps {
  card: CardDef;
  isLast: boolean;
  onSubmit: (text: string, responseMs: number) => void;
}

export function CardBody({ card, isLast, onSubmit }: CardBodyProps) {
  const [text, setText] = useState('');
  const shownAt = useRef(performance.now());
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Reset per-card state when the card changes.
  useEffect(() => {
    setText('');
    shownAt.current = performance.now();
  }, [card.index]);

  // Grow the text field to fit the typed content. The card is centred in the
  // row, so the growth reads as symmetric — the card expands up AND down from
  // the middle. The height is capped so the card never grows past the row (i.e.
  // it stops at the frame's padding); beyond that the textarea scrolls.
  const autosize = useCallback(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    let next = ta.scrollHeight;
    const row = ta.closest('.card-screen__row') as HTMLElement | null;
    const card = ta.closest('.card-screen__answer') as HTMLElement | null;
    const field = ta.parentElement as HTMLElement | null;
    if (row && card && field) {
      // The card minus the field = its fixed chrome (title + gaps + padding +
      // border); the field can fill whatever the row has left for it.
      const chrome = card.offsetHeight - field.offsetHeight;
      const maxField = row.clientHeight - chrome;
      if (maxField > 0) next = Math.min(next, maxField);
    }
    ta.style.height = `${next}px`;
  }, []);

  // Re-measure before paint whenever the text changes, and on resize so the cap
  // tracks the frame's size.
  useLayoutEffect(() => {
    autosize();
  }, [text, autosize]);
  useEffect(() => {
    window.addEventListener('resize', autosize);
    return () => window.removeEventListener('resize', autosize);
  }, [autosize]);

  const handleContinue = () => {
    if (!text.trim()) return;
    onSubmit(text.trim(), Math.round(performance.now() - shownAt.current));
  };

  return (
    <div className="card-screen__row">
      {/* Left: bordered answer card (title + grey text field), rises in. */}
      <div className="card-screen__answer">
        <div className="card-screen__answer-inner">
          <h2 className="card-screen__question" dir="rtl">
            מה אתה רואה?
          </h2>
          <div className="card-screen__field">
            <textarea
              ref={inputRef}
              className="card-screen__input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={1}
              aria-label="מה אתה רואה?"
              autoFocus
            />
            <button
              type="button"
              className="card-screen__submit"
              onClick={handleContinue}
              disabled={!text.trim()}
              aria-label={isLast ? 'סיום' : 'המשך'}
            >
              <svg
                width="16"
                height="15"
                viewBox="0 0 16 15"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M15 7.5H1M6.6 1.2 1 7.5l5.6 6.3"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Right: ink blot (changes per card). A single masked element — the blot
          SVG is the mask and the fill is a gradient (dark at top, emotion tint
          at the bottom for tinted cards). One mask = one clean edge (layering a
          separate tint over an <img> left a noisy fringe on the stroke). The
          tint is static — a fill motion could read as the inkblot itself moving. */}
      <div className="card-screen__stage">
        {card.image &&
          (card.colored ? (
            // Full-colour blot: the SVG already carries its own colours (its own
            // silhouette mask over blurred colour fields), so paint it straight
            // as one image — no extra mask, so the edge stays a single clean
            // rasterisation. Fades in as a unit like the masked cards.
            <div
              className="blot blot--colored"
              style={{ backgroundImage: `url(${card.image})` }}
            />
          ) : (
            <div
              className="blot"
              style={{
                WebkitMaskImage: `url(${card.image})`,
                maskImage: `url(${card.image})`,
                background: card.tint
                  ? `linear-gradient(to top, ${card.tint} 0%, ${card.tint} 8%, var(--color-text-primary) 56%)`
                  : 'var(--color-text-primary)',
              }}
            />
          ))}
      </div>
    </div>
  );
}
