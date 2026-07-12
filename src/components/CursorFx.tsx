import { useEffect, useRef } from 'react';
import './CursorFx.css';

/* ---- The visible cursor (difference-blend overlay) ----
   The native cursor is a transparent 1×1 PNG everywhere (tokens.css), and this
   fixed SVG rides the pointer in its place, inverting per-pixel via
   `mix-blend-mode: difference` (palette math in CursorFx.css). Two forms from
   the design — FILLED arrow at rest (Figma 583-1549), OUTLINE over clickables
   (583-1553) — swapped by reading the hovered element's computed `cursor`:
     url(…) + `pointer`  → outline;  url(…) + `auto`/`default` → filled;
     no url() (text fields, disabled chips) → overlay hides, the real native
     cursor (I-beam, not-allowed…) shows. That keeps every `cursor:`
     declaration in component CSS as the single source of pointer semantics. */

/* The arrow's tip in overlay coordinates — same hotspot the CSS-cursor version
   used, so the visual tip sits exactly on the click point. */
const HOTSPOT_X = 2;
const HOTSPOT_Y = 2;

export default function CursorFx() {
  const rootRef = useRef<SVGSVGElement>(null);
  const fillRef = useRef<SVGPathElement>(null);
  const lineRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const fill = fillRef.current;
    const line = lineRef.current;
    if (!root || !fill || !line) return;

    /* getComputedStyle only when the hovered element changes, not per move. */
    let lastTarget: Element | null = null;

    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return; /* touch/pen: no mirrored cursor */
      root.style.transform = `translate3d(${e.clientX - HOTSPOT_X}px, ${e.clientY - HOTSPOT_Y}px, 0)`;
      root.style.opacity = '1';
      const t = e.target;
      if (t instanceof Element && t !== lastTarget) {
        lastTarget = t;
        const cursor = getComputedStyle(t).cursor;
        const custom = cursor.includes('url('); /* our transparent PNG */
        root.style.visibility = custom ? 'visible' : 'hidden';
        const hover = custom && cursor.includes('pointer');
        fill.style.display = hover ? 'none' : '';
        line.style.display = hover ? '' : 'none';
      }
    };

    /* Pointer left the window — don't leave an arrow parked at the edge. */
    const hide = () => {
      root.style.opacity = '0';
    };

    document.addEventListener('pointermove', move, { passive: true });
    /* pointerdown too: a click straight after a screen change can land before
       any move event re-evaluates the (possibly re-rendered) target. */
    document.addEventListener('pointerdown', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', hide);
    return () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerdown', move);
      document.documentElement.removeEventListener('pointerleave', hide);
    };
  }, []);

  return (
    <svg
      ref={rootRef}
      className="cursor-fx"
      viewBox="-1.5 -1.5 28.3557 39.9399"
      aria-hidden="true"
    >
      {/* Rest form: the filled arrow (Figma 583-1549). */}
      <path
        ref={fillRef}
        className="cursor-fx__fill"
        d="M23.8149 18.5129C25.5067 18.113 25.9178 15.8937 24.4815 14.9142L3.12721 0.351981C1.74278 -0.592109 -0.11926 0.482845 0.00600094 2.15385L1.93819 27.9296C2.06815 29.6633 4.19578 30.417 5.38814 29.1517L8.68601 25.6521C9.60486 24.677 11.2038 24.8635 11.8737 26.0238L17.5977 35.9395C18.1499 36.8962 19.3732 37.224 20.3298 36.6716L22.8545 35.214C23.811 34.6617 24.1388 33.4386 23.5866 32.482L17.8622 22.5658C17.1925 21.4056 17.8305 19.9278 19.1342 19.6195L23.8149 18.5129Z"
      />
      {/* Hover form: the outline arrow (Figma 583-1553, its own drawing). */}
      <path
        ref={lineRef}
        className="cursor-fx__line"
        style={{ display: 'none' }}
        d="M0.505075 2.11627C0.411266 0.863112 1.80762 0.0566713 2.8459 0.764707L24.1994 15.3272C25.2766 16.0618 24.9683 17.7264 23.6994 18.0264L22.9426 18.2051C19.3574 19.0528 17.6027 23.1171 19.4445 26.3077L23.1535 32.7325C23.5674 33.4499 23.322 34.3672 22.6047 34.7813L20.0803 36.2383C19.3628 36.6526 18.4447 36.407 18.0305 35.6895L14.3225 29.2657C12.4803 26.0752 8.08355 25.5629 5.55683 28.2442L5.02461 28.8087C4.13044 29.7575 2.5345 29.1926 2.43672 27.8926L0.505075 2.11627Z"
      />
    </svg>
  );
}
