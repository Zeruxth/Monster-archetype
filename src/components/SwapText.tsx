import { useEffect, useRef, useState, type CSSProperties } from 'react';
import './SwapText.css';

type SwapMode = 'type' | 'fade';

interface SwapTextProps {
  /** The resting word. */
  base: string;
  /** The word shown when `active` (e.g. on hover). */
  hover: string;
  /** When true the hover word is shown; when false, the base word. */
  active?: boolean;
  /** How the word changes: 'type' (typewriter, default) for the bigger texts, or
   *  'fade' (a plain opacity crossfade) for the small nav labels. */
  mode?: SwapMode;
  /** ms per character while typing (type mode). */
  speed?: number;
  /** ms for each half of the crossfade — out, then in (fade mode). */
  fade?: number;
  className?: string;
}

/**
 * A small hover word-swap that types the new word in, character by character
 * (typewriter) with a blinking caret. An invisible sizer reserves the full width
 * of the current word, so the visible overlay fills in without nudging the
 * layout, and `dir="rtl"` makes the letters appear right-to-left from the word's
 * start. Reused for the site's small UI texts (nav items, etc.).
 */
export function SwapText({
  base,
  hover,
  active = false,
  mode = 'type',
  speed = 55,
  fade = 160,
  className,
}: SwapTextProps) {
  const target = active ? hover : base;
  const [display, setDisplay] = useState(target);
  const [typing, setTyping] = useState(false);
  // `out` is true while the current word is faded to 0 (fade mode); the word swap
  // happens at that invisible midpoint. The box never resizes during a swap — the
  // sizer reserves BOTH words' max width (see below) — so there's nothing to hide.
  const [out, setOut] = useState(false);
  const prevTarget = useRef<string | null>(null);

  useEffect(() => {
    // Show the first target (initial mount) outright; only later changes animate.
    // Guarding on the previous target — rather than a "mounted" flag — keeps React
    // 18 StrictMode's double-invoked mount effect (same deps) from triggering a
    // phantom animation before any interaction.
    if (prevTarget.current === target) return;
    const initial = prevTarget.current === null;
    prevTarget.current = target;
    if (initial) {
      setDisplay(target);
      return;
    }

    if (mode === 'fade') {
      // Fade the current word out, then (while invisible) swap the text and fade
      // the new word in — a plain opacity crossfade, no typewriter.
      setOut(true);
      const id = window.setTimeout(() => {
        setDisplay(target);
        setOut(false);
      }, fade);
      return () => window.clearTimeout(id);
    }

    // Type mode: reveal the new word character by character.
    setTyping(true);
    setDisplay('');
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      setDisplay(target.slice(0, n));
      if (n >= target.length) {
        window.clearInterval(id);
        setTyping(false);
      }
    }, speed);
    return () => window.clearInterval(id);
  }, [target, speed, mode, fade]);

  return (
    <span
      className={`swap swap--${mode}${typing ? ' is-typing' : ''}${out ? ' is-out' : ''}${
        className ? ` ${className}` : ''
      }`}
      dir="rtl"
      style={mode === 'fade' ? ({ '--swap-fade': `${fade}ms` } as CSSProperties) : undefined}
    >
      {/* Both words overlaid in one grid cell reserve the box at the WIDER of the
          two, so it never resizes when the visible word swaps — the word then sits
          centred in that stable box (see .swap--fade) instead of shifting. */}
      <span className="swap__sizer" aria-hidden="true">
        <span className="swap__sizer-word">{base}</span>
        <span className="swap__sizer-word">{hover}</span>
      </span>
      {/* Visible word: typed-so-far + caret (type mode), or the whole word
          crossfading on opacity (fade mode). */}
      <span className="swap__typed" aria-hidden="true">
        {display}
        {mode === 'type' && <i className="swap__caret" />}
      </span>
      {/* Stable, screen-reader-only label. */}
      <span className="swap__a11y">{base}</span>
    </span>
  );
}
