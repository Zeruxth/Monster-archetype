import { useEffect, useRef, useState } from 'react';

interface HoverGraphicProps {
  src: string;
  className?: string;
  /** Fired once the whole graphic has finished drawing (after an optional hold).
   *  Lets a parent loop to the next graphic when this one completes. */
  onDone?: () => void;
  /** Pause after the draw completes, before onDone fires (ms). Default 0. */
  holdMs?: number;
  /** Gap after the withdraw fully completes before onDone fires (ms) — i.e. the
   *  beat between this graphic finishing its un-draw and the parent advancing to
   *  the next one. Default 0. */
  gapMs?: number;
}

// SVG markup is small and reused, so cache the fetched text by src.
const cache = new Map<string, string>();

/** Warm the cache for a set of srcs ahead of time. A parent that swaps `src`
 *  repeatedly (e.g. the landing's monster loop) can call this once on mount so
 *  every later swap mounts the next graphic synchronously — no per-swap fetch —
 *  keeping the gap to the next draw a tight, consistent beat instead of being
 *  fetch-bound (an uncached creature would otherwise stall the seam). */
export function preloadGraphics(srcs: string[]) {
  for (const src of srcs) {
    if (cache.has(src)) continue;
    fetch(src)
      .then((r) => r.text())
      .then((text) => cache.set(src, text))
      .catch(() => {});
  }
}

/**
 * Inlines an SVG so its paths can be animated. Stroked paths "draw in" via
 * stroke-dashoffset, then "withdraw" (rewind to hidden) so a parent can loop
 * creatures without a hard cut. Used for the line-art landing graphics (an <img>
 * can't animate its internal paths).
 *
 * The SVG is injected imperatively (not via dangerouslySetInnerHTML) so React
 * never reconciles the <svg> node away mid-animation: a parent re-render (e.g.
 * the landing's showDefault flip) would otherwise swap the node and cut the
 * draw short.
 */
export function HoverGraphic({ src, className, onDone, holdMs = 0, gapMs = 0 }: HoverGraphicProps) {
  const [markup, setMarkup] = useState<string | null>(() => cache.get(src) ?? null);
  const ref = useRef<HTMLDivElement>(null);
  // Hold the latest onDone in a ref so changing it never re-runs (restarts) the
  // draw effect below.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (cache.has(src)) {
      setMarkup(cache.get(src)!);
      return;
    }
    let alive = true;
    fetch(src)
      .then((r) => r.text())
      .then((text) => {
        cache.set(src, text);
        if (alive) setMarkup(text);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [src]);

  useEffect(() => {
    const host = ref.current;
    if (!markup || !host) return;

    // Inject imperatively: React owns the empty div, not the svg inside it, so
    // re-renders can't replace the node we're animating.
    host.innerHTML = markup;
    const svg = host.querySelector('svg');
    if (!svg) return;

    // Figma exports line art as thin *filled* outline shapes (not centreline
    // strokes). To "draw" them, trace each path as a stroke. Filled-outline
    // paths are converted to a stroke and *kept* that way (no fill restore), so
    // the stroke looks identical from the first frame to the last.
    // Draw at a constant pen speed that's the SAME across every monster: each
    // path's duration is its length measured in "monster-heights" (len / viewBox
    // height — independent of the render size) times MS_PER_HEIGHT. A big creature
    // therefore takes proportionally LONGER instead of whipping its long strokes
    // through in a fixed time (the old `MAX_DURATION * len / maxLen` pinned every
    // monster's longest path to the same duration, so larger ones drew too fast).
    // Tiny details are floored at MIN_DURATION; a giant outline is capped at
    // MAX_DURATION.
    const MS_PER_HEIGHT = 450; // ms to draw a stroke one monster-height long (↑ = slower)
    const MAX_DURATION = 3800;
    const MIN_DURATION = 250;
    const STAGGER = 80;
    const STROKE_PX = 1.5; // desired stroke weight in *screen* pixels
    const WITHDRAW_FACTOR = 1.0; // withdraw time relative to draw time (1 = draw-out lasts as long as draw-in; ↑ = slower out)

    // The source viewBox is tiny (~46u) but renders ~15× larger, so a stroke
    // width of "1" would be ~15px. Work out the viewBox→screen scale and set
    // the width in viewBox units instead. (We can't use vector-effect:
    // non-scaling-stroke because it also rescales the dash pattern, which is
    // measured in viewBox units via getTotalLength — that mismatch dashes the
    // line into gaps.)
    const vb = svg.viewBox.baseVal;
    const rect = svg.getBoundingClientRect();
    const scale = vb && vb.width > 0 && rect.width > 0 ? rect.width / vb.width : 1;
    const strokeWidth = STROKE_PX / scale;
    // A path's length in monster-heights normalises across creatures AND render
    // sizes, so the pen speed (MS_PER_HEIGHT) reads identically everywhere.
    const vbH = vb && vb.height > 0 ? vb.height : 1;

    const shapes = Array.from(
      svg.querySelectorAll<SVGGeometryElement>('path, line, polyline, polygon'),
    );
    const lengths = shapes.map((el) => {
      try {
        return el.getTotalLength();
      } catch {
        return 0;
      }
    });
    // Per-path timing, captured so the withdraw phase can reverse the exact same
    // draw. `maxEnd` is when the last-finishing stroke completes (delay +
    // duration) — i.e. when the whole graphic is fully drawn.
    let maxEnd = 0;
    const durations: number[] = [];
    const delays: number[] = [];
    shapes.forEach((el, i) => {
      const len = lengths[i];
      if (len <= 0) {
        durations[i] = 0;
        delays[i] = 0;
        return;
      }

      // The svg is freshly parsed on every effect run, so computed styles are
      // always pristine (no inline pollution to work around).
      const cs = getComputedStyle(el);
      const isOutlineFill = el.getAttribute('stroke') === null && cs.fill !== 'none';
      const lineColor = isOutlineFill ? cs.fill : cs.stroke;

      // Normalise every shape to a uniform stroke so the whole graphic — outer
      // body and inner details alike — draws and reads the same way.
      el.style.fill = 'none';
      el.style.stroke = lineColor;
      el.style.strokeWidth = `${strokeWidth}`;

      el.style.strokeDasharray = `${len}`;
      el.style.strokeDashoffset = `${len}`;
      void el.getBoundingClientRect(); // commit the hidden state before transitioning

      const duration = Math.min(
        MAX_DURATION,
        Math.max(MIN_DURATION, Math.round((len / vbH) * MS_PER_HEIGHT)),
      );
      const delay = i * STAGGER;
      durations[i] = duration;
      delays[i] = delay;
      maxEnd = Math.max(maxEnd, delay + duration);
      el.style.transition = `stroke-dashoffset ${duration}ms ease-in`;
      el.style.transitionDelay = `${delay}ms`;
      el.style.strokeDashoffset = '0';
    });

    // After the draw settles (plus an optional hold), WITHDRAW: rewind each path
    // back to hidden (dashoffset 0 → len reverses the draw), last-drawn first, so
    // the figure un-draws as a reverse playback instead of a hard cut to blank.
    // The withdraw runs WITHDRAW_FACTOR× slower than the draw and eases *out*, so
    // the figure dissolves gently — the strokes fade away softly instead of
    // whipping off at the end (ease-out is also the true time-reverse of the
    // draw's ease-in, so it reads as genuine reverse playback).
    const withdrawTimer = window.setTimeout(() => {
      shapes.forEach((el, i) => {
        if (lengths[i] <= 0) return;
        const wDur = Math.round(durations[i] * WITHDRAW_FACTOR);
        const wDelay = Math.round((maxEnd - (delays[i] + durations[i])) * WITHDRAW_FACTOR);
        el.style.transition = `stroke-dashoffset ${wDur}ms ease-out`;
        el.style.transitionDelay = `${wDelay}ms`;
        el.style.strokeDashoffset = `${lengths[i]}`;
      });
    }, maxEnd + holdMs);

    // One full cycle = draw (maxEnd) + hold + withdraw (maxEnd × WITHDRAW_FACTOR)
    // + gap. Then tell the parent to advance the loop: the next creature mounts
    // hidden and draws in from the same place this one withdrew to — gapMs is the
    // brief beat between this un-draw finishing and that next draw. Cleared if we
    // unmount first.
    const withdrawMs = Math.round(maxEnd * WITHDRAW_FACTOR);
    const doneTimer = window.setTimeout(
      () => onDoneRef.current?.(),
      maxEnd + holdMs + withdrawMs + gapMs,
    );
    return () => {
      window.clearTimeout(withdrawTimer);
      window.clearTimeout(doneTimer);
    };
  }, [markup, holdMs, gapMs]);

  return <div ref={ref} className={className} aria-hidden="true" />;
}
