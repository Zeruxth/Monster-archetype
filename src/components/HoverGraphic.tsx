import { useEffect, useRef, useState } from 'react';

interface HoverGraphicProps {
  src: string;
  className?: string;
}

// SVG markup is small and reused, so cache the fetched text by src.
const cache = new Map<string, string>();

/**
 * Inlines an SVG so its paths can be animated. Stroked paths "draw in" via
 * stroke-dashoffset; filled details fade in. Used for the line-art hover
 * graphics (an <img> can't animate its internal paths).
 *
 * The SVG is injected imperatively (not via dangerouslySetInnerHTML) so React
 * never reconciles the <svg> node away mid-animation: a parent re-render (e.g.
 * the landing's showDefault flip) would otherwise swap the node and cut the
 * draw short.
 */
export function HoverGraphic({ src, className }: HoverGraphicProps) {
  const [markup, setMarkup] = useState<string | null>(() => cache.get(src) ?? null);
  const ref = useRef<HTMLDivElement>(null);

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
    // Draw at a roughly constant pen speed: each path's duration scales with its
    // length, so the long outer body draws slowly (~MAX_DURATION) while the short
    // inner details draw quickly. Tiny strokes are floored at MIN_DURATION so they
    // still visibly draw rather than pop.
    const MAX_DURATION = 2200;
    const MIN_DURATION = 250;
    const STAGGER = 80;
    const STROKE_PX = 1.5; // desired stroke weight in *screen* pixels

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
    const maxLen = Math.max(1, ...lengths);

    shapes.forEach((el, i) => {
      const len = lengths[i];
      if (len <= 0) return;

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

      const duration = Math.max(MIN_DURATION, Math.round((MAX_DURATION * len) / maxLen));
      const delay = i * STAGGER;
      el.style.transition = `stroke-dashoffset ${duration}ms ease-in`;
      el.style.transitionDelay = `${delay}ms`;
      el.style.strokeDashoffset = '0';
    });
  }, [markup]);

  return <div ref={ref} className={className} aria-hidden="true" />;
}
