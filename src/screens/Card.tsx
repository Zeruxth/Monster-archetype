import { useEffect, useRef, useState } from 'react';
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

  // Reset per-card state when the card changes.
  useEffect(() => {
    setText('');
    shownAt.current = performance.now();
  }, [card.index]);

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
              className="card-screen__input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              dir="rtl"
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
