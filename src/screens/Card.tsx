import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Arrow } from '../components/Arrow';
import { Blot } from '../components/Blot';
import type { TestCard } from '../data/cards';
import './Card.css';

interface CardBodyProps {
  card: TestCard;
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
  }, [card.shapeId]);

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
            מה אתם רואים?
          </h2>
          <div className="card-screen__field">
            <textarea
              ref={inputRef}
              className="card-screen__input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={1}
              aria-label="מה אתם רואים?"
              autoFocus
            />
            <button
              type="button"
              className="card-screen__submit arrow-host"
              onClick={handleContinue}
              disabled={!text.trim()}
              aria-label={isLast ? 'סיום' : 'המשך'}
            >
              <Arrow />
            </button>
          </div>
        </div>
      </div>

      {/* Right: ink blot (changes per card). The Blot component masks the shape's
          silhouette SVG and paints the colour treatment behind it (black / spot /
          full — see Blot.tsx). One mask = one clean antialiased edge. The sized
          wrapper fixes the blot's width and fades it in as a unit. */}
      <div className="card-screen__stage">
        <div className="card-screen__blot">
          <Blot shapeId={card.shapeId} mode={card.mode} />
        </div>
      </div>
    </div>
  );
}
