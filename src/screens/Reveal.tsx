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
  /** Live 0..1 probe of how far the monster result's generation has actually
   *  come (the analysis stream's own progress; only 1 once it has settled).
   *  The typewriter throttles itself against it, so the text can never
   *  outrun the generation: its last character and the result land together
   *  by construction, and any waiting is spread through the writing as small
   *  hesitations rather than parked after a finished-looking paragraph.
   *  Absent (dev jump): unthrottled. */
  progress?: () => number;
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
// The typewriter's speed limits, in ms per character. TOP is the approved
// reading pace — the fastest the text ever moves; FLOOR is the slow walk
// near the stream's frontier — the ease-off bottoms out here, so the
// approach always terminates (a pure exponential glide never lands; that bug
// once left the button hanging seconds after the text looked done).
const TOP_MS_PER_CHAR = 30;
const FLOOR_MS_PER_CHAR = 75;
// Chase stiffness: the fraction of the text→frontier gap closed per
// MILLISECOND. The typing runs on animation frames with time-based advance,
// so inter-character delays vary continuously between TOP and FLOOR (a fixed
// interval quantized them to a coarse 30/60ms grid — a faint mechanical
// jitter). Lower = softer glide trailing further behind the stream; the
// steady-state trail is (stream rate / CHASE_PER_MS) characters.
const CHASE_PER_MS = 0.0045;

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
  progress,
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

  // One growing counter spans title then body, so the body only starts once the
  // title is fully written.
  const [count, setCount] = useState(0);
  // The chase's fractional position (count = floor of it) — a ref, not state,
  // so sub-character advances don't re-render.
  const posRef = useRef(0);

  // Read by the ticking interval so a mid-write `ready` flip lifts the hold
  // WITHOUT recreating the interval (an effect restart would re-apply the
  // TEXT_START delay in the middle of the text).
  const readyRef = useRef(ready);
  readyRef.current = ready;

  useEffect(() => {
    let raf = 0;
    let lastT = 0;
    const loop = (now: number) => {
      const dt = lastT ? Math.min(now - lastT, 100) : 0; // clamp hiccups
      lastT = now;
      // The frontier the text may approach: while the monster is still
      // generating, the title is free (it's the already-announced emotion)
      // but the paragraph only reaches as far as the stream itself has
      // come — with its LAST character in reserve, so the text can never
      // look finished before the result is truly in hand. `ready` releases
      // everything (reserve + bridge), and the arrow rises with the final
      // character.
      const target = readyRef.current
        ? total
        : Math.min(
            holdAt - 1,
            titleLen + Math.round((progress?.() ?? 1) * (holdAt - titleLen)),
          );
      const lead = target - posRef.current;
      if (lead > 0 && dt > 0) {
        // Glide toward the frontier, time-based: the rate eases off with the
        // remaining gap, clamped between the reading pace (TOP) and the
        // terminating walk (FLOOR). Far behind → full pace; nearing the
        // frontier → a continuous slow-down; fresh chunks → it picks back
        // up. Smooth, no staccato, and it lands.
        const rate = Math.min(
          1 / TOP_MS_PER_CHAR,
          Math.max(1 / FLOOR_MS_PER_CHAR, lead * CHASE_PER_MS),
        );
        posRef.current = Math.min(target, posRef.current + rate * dt);
        const next = Math.floor(posRef.current);
        setCount((c) => (next > c ? next : c));
        if (readyRef.current && next >= total) return; // done — stop the loop
      }
      raf = requestAnimationFrame(loop);
    };
    const startId = window.setTimeout(() => {
      raf = requestAnimationFrame(loop);
    }, TEXT_START);
    return () => {
      window.clearTimeout(startId);
      cancelAnimationFrame(raf);
    };
  }, [total, holdAt, titleLen, progress]);

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
