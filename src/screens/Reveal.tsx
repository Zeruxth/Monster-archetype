import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '../components/Button';
import type { Emotion } from '../data/emotions';
import './Reveal.css';

interface RevealBodyProps {
  emotion: Emotion;
  onReveal: () => void;
  /** The loading pill's box, so this card can expand (morph) out of it. */
  morphFrom?: DOMRect | null;
  /** When true (heading to the result), the card slides down and out while the
   *  white frame stays put (it's the same surface as the monster panel). */
  exiting?: boolean;
}

/** A run of text, optionally tinted (the emotion word). */
type Seg = { text: string; color?: string };

const MORPH_MS = 600; // pill → card box expansion
const TEXT_START = MORPH_MS; // start writing once the box has finished growing
const CHAR_STEP = 30; // delay between characters
const RISE_GAP = 200; // pause after the text finishes before the CTA rises

const segLen = (segs: Seg[]) => segs.reduce((n, s) => n + s.text.length, 0);

/** Render the segments, but only the first `n` characters (for the typewriter). */
function typedSegs(segs: Seg[], n: number) {
  let left = n;
  return segs.map((s, i) => {
    const slice = left <= 0 ? '' : s.text.slice(0, left);
    left -= s.text.length;
    return (
      <span key={i} style={s.color ? { color: s.color } : undefined}>
        {slice}
      </span>
    );
  });
}

/** Full segments, used by the hidden sizer that reserves the final wrapped size. */
function fullSegs(segs: Seg[]) {
  return segs.map((s, i) => (
    <span key={i} style={s.color ? { color: s.color } : undefined}>
      {s.text}
    </span>
  ));
}

/**
 * Emotion reveal (Figma 382-671). Lives inside the persistent test shell — the
 * loading pill has expanded into this bordered card. Title + body "write"
 * themselves in (the emotion word tinted), then the CTA rises in.
 */
export function RevealBody({
  emotion,
  onReveal,
  morphFrom,
  exiting = false,
}: RevealBodyProps) {
  const color = emotion.colorVar;
  const cardRef = useRef<HTMLDivElement>(null);

  // Entrance: if we have the pill's box, expand this card out of it (a shared-
  // element FLIP — both are centred in the frame, so it's a scale about the
  // common centre with a tiny translate). Otherwise (dev jump) just rise in.
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    // Clear any in-flight morph (notably StrictMode's dev double-invoke of this
    // effect) and reset inline overrides, so we always measure the card's
    // natural resting box — never one captured mid-animation.
    el.getAnimations().forEach((a) => a.cancel());
    el.style.overflow = '';

    let anim: Animation;
    if (morphFrom) {
      const to = el.getBoundingClientRect();
      // Align the pill's and card's centres so the box grows about the shared
      // centre (both are centred in the frame, so this is only a small nudge).
      const dx =
        morphFrom.left + morphFrom.width / 2 - (to.left + to.width / 2);
      const dy =
        morphFrom.top + morphFrom.height / 2 - (to.top + to.height / 2);
      // Grow the real box (width/height) rather than scaling it: a non-uniform
      // scale smears the 1px border and 16px corners into flat ovals, whereas
      // animating the box keeps them crisp the whole way. The content is clipped
      // while the box grows (it only starts typing once the morph finishes).
      el.style.overflow = 'hidden';
      anim = el.animate(
        [
          {
            width: `${morphFrom.width}px`,
            height: `${morphFrom.height}px`,
            transform: `translate(${dx}px, ${dy}px)`,
            opacity: 0.7,
          },
          {
            width: `${to.width}px`,
            height: `${to.height}px`,
            transform: 'translate(0px, 0px)',
            opacity: 1,
          },
        ],
        { duration: MORPH_MS, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      );
      anim.onfinish = () => {
        el.style.overflow = '';
      };
    } else {
      anim = el.animate(
        [
          { transform: 'translateY(16px)', opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 },
        ],
        { duration: 500, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      );
    }

    return () => {
      anim.cancel();
      el.style.overflow = '';
    };
  }, [morphFrom]);

  const title: Seg[] = [
    { text: 'הרגשת ' },
    { text: emotion.he, color },
    { text: '.' },
  ];
  const body: Seg[] = [
    { text: 'כשצפית בדימויים, התגובות שלך הצביעו על ' },
    { text: emotion.he, color },
    {
      text: `: ${emotion.reveal}. במסך הבא יוצג הייצוג המפלצתי של הרגש הזה.`,
    },
  ];

  const titleLen = segLen(title);
  const bodyLen = segLen(body);
  const total = titleLen + bodyLen;

  // One growing counter spans title then body, so the body only starts once the
  // title is fully written.
  const [count, setCount] = useState(0);

  useEffect(() => {
    let interval: number | undefined;
    const startId = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setCount((c) => {
          if (c >= total) {
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
  }, [total]);

  const ctaDelay = TEXT_START + total * CHAR_STEP + RISE_GAP;

  return (
    <div
      className={`reveal__card ${exiting ? 'reveal__card--exit' : ''}`}
      ref={cardRef}
    >
      <div className="reveal__text-group">
        <p className="reveal__title" dir="rtl">
          <span className="reveal__sizer" aria-hidden="true">
            {fullSegs(title)}
          </span>
          <span className="reveal__typed">
            {typedSegs(title, Math.min(count, titleLen))}
          </span>
        </p>
        <p className="reveal__body" dir="rtl">
          <span className="reveal__sizer" aria-hidden="true">
            {fullSegs(body)}
          </span>
          <span className="reveal__typed">
            {typedSegs(body, Math.max(0, count - titleLen))}
          </span>
        </p>
      </div>
      <div className="reveal__cta" style={{ animationDelay: `${ctaDelay}ms` }}>
        <Button arrow onClick={onReveal}>
          הצג את המפלצת
        </Button>
      </div>
    </div>
  );
}
