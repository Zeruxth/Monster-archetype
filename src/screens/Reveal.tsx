import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '../components/Button';
import type { Emotion } from '../data/emotions';
import './Reveal.css';

interface RevealBodyProps {
  emotion: Emotion;
  onReveal: () => void;
  /** True once the monster + paragraph have landed (stage 2 of the staged
   *  analysis, still generating in the background when this screen opens).
   *  Until then the typewriter stops short of the final bridge sentence and
   *  blinks its caret — visibly mid-write, so a slow generation never leaves
   *  a finished-looking paragraph with no button (which reads as an error).
   *  The CTA arrow only rises once BOTH the full text has typed and this is
   *  true — the next screen must never open onto a half-written result. */
  ready?: boolean;
  /** How long the loading dots showed before this screen (ms). The App splits
   *  the expected wait half dots / half writing, so the full text paces itself
   *  to span roughly this same time again (clamped to a readable cadence).
   *  Absent (dev jump): a fixed comfortable pace. */
  typeMs?: number;
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
// Character-cadence band for the typewriter. The actual step is
// typeMs / total — the writing spans about the time the dots already spent —
// but never speeds past the 30ms/char floor, which lands the typical text at
// ~7.5s of writing (the beat this screen is meant to hold; 12-24ms all read
// too fast): the tie to the loading time may only STRETCH the writing, never
// rush it. Nor does it crawl past 40.
const CHAR_STEP_MIN = 30;
const CHAR_STEP_MAX = 40;
// Without a typeMs (dev jump straight here) the text spans this — the same
// ~7.5s / 30ms-per-char feel.
const DEFAULT_TYPE_MS = 7500;

// The fixed bridge sentence closing the body. It only types once the monster
// result has actually landed (`ready`) — it promises the next screen, so it
// must not finish while that screen still has nothing to show. Until then the
// typewriter holds just before it, caret blinking mid-write.
const BRIDGE = ' המסך הבא יחשוף את הייצוג המפלצתי של רגש זה.';

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
  ready = true,
  typeMs,
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
  // The reveal copy is a self-contained clinical paragraph that names the
  // emotion exactly once; tint that word in place (matching the title), then
  // append the transitional line pointing to the monster.
  const para = emotion.reveal;
  const at = para.indexOf(emotion.he);
  const paraSegs: Seg[] =
    at === -1
      ? [{ text: para }]
      : [
          { text: para.slice(0, at) },
          { text: emotion.he, color },
          { text: para.slice(at + emotion.he.length) },
        ];
  const body: Seg[] = [...paraSegs, { text: BRIDGE }];

  const titleLen = segLen(title);
  const bodyLen = segLen(body);
  const total = titleLen + bodyLen;
  // The hold checkpoint: everything up to (not including) the bridge sentence.
  const holdAt = total - BRIDGE.length;
  // Pace the writing to span the handed-down time (≈ what the dots took), so
  // the final period lands about when the monster result does; the band keeps
  // it readable whatever that time was.
  const charStep = Math.round(
    Math.min(
      CHAR_STEP_MAX,
      Math.max(CHAR_STEP_MIN, (typeMs ?? DEFAULT_TYPE_MS) / total),
    ),
  );

  // One growing counter spans title then body, so the body only starts once the
  // title is fully written.
  const [count, setCount] = useState(0);

  // Read by the ticking interval so a mid-write `ready` flip lifts the hold
  // WITHOUT recreating the interval (an effect restart would re-apply the
  // TEXT_START delay in the middle of the text).
  const readyRef = useRef(ready);
  readyRef.current = ready;

  useEffect(() => {
    let interval: number | undefined;
    const startId = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setCount((c) => {
          // While the monster is still generating, stop short of the bridge
          // sentence. The tick keeps idling (React bails on the no-op state)
          // and flows straight through the moment `ready` flips — or never
          // pauses at all if the result landed before the paragraph finished.
          const cap = readyRef.current ? total : holdAt;
          if (c >= cap) {
            if (c >= total) window.clearInterval(interval);
            return c;
          }
          return c + 1;
        });
      }, charStep);
    }, TEXT_START);
    return () => {
      window.clearTimeout(startId);
      if (interval) window.clearInterval(interval);
    };
  }, [total, holdAt, charStep]);

  // The CTA rises once the typewriter is done AND the background result is in
  // (`ready`). It stays mounted throughout — reserving its space — so the card
  // box the entrance morph measures never changes size when the arrow arrives.
  const showCta = ready && count >= total;

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
            {/* The caret rides the write position: here while the title is
                being written, then in the body until the FULL text — including
                the bridge sentence held back for `ready` — has typed. A held
                pause with a blinking caret reads as "still writing", never as
                a missing button. */}
            {count < titleLen && (
              <span className="reveal__caret" aria-hidden="true" />
            )}
          </span>
        </p>
        <p className="reveal__body" dir="rtl">
          <span className="reveal__sizer" aria-hidden="true">
            {fullSegs(body)}
          </span>
          <span className="reveal__typed">
            {typedSegs(body, Math.max(0, count - titleLen))}
            {count >= titleLen && count < total && (
              <span className="reveal__caret" aria-hidden="true" />
            )}
          </span>
        </p>
      </div>
      <div className={`reveal__cta${showCta ? ' reveal__cta--on' : ''}`}>
        {/* Guarded (not just pointer-events) — the hidden button can still be
            reached by keyboard, and advancing early would open the monster
            screen before the monster exists. */}
        <Button arrow onClick={() => showCta && onReveal()}>
          הצג את המפלצת
        </Button>
      </div>
    </div>
  );
}
