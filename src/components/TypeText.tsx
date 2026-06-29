import { useEffect, useState, type ElementType } from 'react';
import './TypeText.css';

interface TypeTextProps {
  /** The full text to type in (may wrap to multiple lines). */
  text: string;
  /** ms per character. Ignored when `duration` is set. */
  speed?: number;
  /** Total time to type the whole text in (ms). When set, overrides `speed`:
   *  the per-character interval becomes duration / length, so texts of different
   *  lengths (e.g. the three heroes' titles) all type in over the same time. */
  duration?: number;
  /** The element to render (e.g. 'h1' for the title, 'p' for the blurb). */
  as?: ElementType;
  /** Show the blinking caret while typing. Default true. */
  caret?: boolean;
  className?: string;
}

/**
 * Types a text in character by character (typewriter) when it mounts, or when
 * `text` changes — used for the landing's bigger texts (the hover title and the
 * blurb). An invisible sizer holds the FULL text's wrapped box (width, height
 * and line breaks) so the visible typed-so-far overlay fills in without the box
 * reflowing; `dir="rtl"` + the inherited right-alignment make each line type in
 * from its right (start) edge. The sizer and overlay share one width, so a
 * prefix wraps exactly like the full text (earlier words never move as later
 * ones arrive). Unlike SwapText (the small nav swap, which guards against typing
 * on mount), this always types on mount — the element only exists while a hero
 * is hovered, so its mount IS the reveal.
 */
export function TypeText({
  text,
  speed = 30,
  duration,
  as: Tag = 'span',
  caret = true,
  className,
}: TypeTextProps) {
  const [shown, setShown] = useState('');
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    // A fixed total duration (duration / length) keeps every text — whatever its
    // length — typing in over the same time; otherwise fall back to a constant
    // per-character speed.
    const step = duration ? Math.max(8, duration / Math.max(1, text.length)) : speed;
    setTyping(true);
    setShown('');
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      setShown(text.slice(0, n));
      if (n >= text.length) {
        window.clearInterval(id);
        setTyping(false);
      }
    }, step);
    return () => window.clearInterval(id);
  }, [text, speed, duration]);

  return (
    <Tag className={`type${typing ? ' is-typing' : ''}${className ? ` ${className}` : ''}`} dir="rtl">
      {/* Invisible full text reserves the wrapped box so typing never reflows. */}
      <span className="type__sizer" aria-hidden="true">
        {text}
      </span>
      {/* Visible typed-so-far text + caret, overlaid on the sizer. */}
      <span className="type__typed" aria-hidden="true">
        {shown}
        {caret && <i className="type__caret" />}
      </span>
      {/* Stable, screen-reader-only full text (the visible spans are hidden). */}
      <span className="type__a11y">{text}</span>
    </Tag>
  );
}
