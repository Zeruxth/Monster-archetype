import { useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Menu } from '../components/Menu';
import { INSTRUCTIONS_RISE_DELAY } from './Instructions';
import './Test.css';

interface TestShellProps {
  phase: 'instructions' | 'cards' | 'loading' | 'reveal';
  /** -1 in the instructions phase; 0-based card index in the cards phase. */
  cardIndex: number;
  total: number;
  /** Fill colour for each dot once reached (defaults to neutral black). */
  dotColors?: (string | null)[];
  onTest?: () => void;
  onDefiner?: () => void;
  onAbout?: () => void;
  onHome?: () => void;
  children: ReactNode;
}

/**
 * Persistent shell for the מבחן flow. The dark page, white frame and pagination
 * dots stay mounted across the instructions → cards transition (so the frame
 * never re-animates); only the body content swaps. When the phase changes the
 * dots FLIP from their old position to the new one.
 */
export function TestShell({
  phase,
  cardIndex,
  total,
  dotColors,
  onTest,
  onDefiner,
  onAbout,
  onHome,
  children,
}: TestShellProps) {
  const dotsRef = useRef<HTMLDivElement>(null);
  // Stored as offsets relative to the positioned frame, which ignore transforms
  // (so the rise-in animation doesn't pollute the FLIP measurement).
  const prev = useRef<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const el = dotsRef.current;
    if (!el) return;
    const next = { top: el.offsetTop, left: el.offsetLeft };
    // On reveal the dots simply fade out, so don't FLIP them to a new spot.
    if (prev.current && phase !== 'reveal') {
      const dx = prev.current.left - next.left;
      const dy = prev.current.top - next.top;
      if (dx || dy) {
        // Heading into loading the dots glide up toward the pill; elsewhere they
        // settle with the gentle ease-out used across the shell. Ease-in-out so
        // the motion starts moving promptly instead of lagging at the front.
        const easing =
          phase === 'loading'
            ? 'cubic-bezier(0.42, 0, 0.58, 1)'
            : 'cubic-bezier(0.22, 1, 0.36, 1)';
        el.animate(
          [
            { transform: `translate(${dx}px, ${dy}px)` },
            { transform: 'translate(0, 0)' },
          ],
          { duration: 1300, easing },
        );
      }
    }
    prev.current = next;
  }, [phase]);

  return (
    <div className="test">
      <Menu
        onTest={onTest}
        onDefiner={onDefiner}
        onAbout={onAbout}
        onHome={onHome}
        active="test"
      />

      <div className={`test__frame test__frame--${phase}`}>
        {children}

        {/* Dots persist across the whole flow — they FLIP from the intro centre
            to the cards bottom, fill in their card's colour as each is reached,
            then FLIP back up under the loading pill and loop. They never unmount,
            so the rise-in only plays once (on the intro mount). */}
        <div
          ref={dotsRef}
          className={`test__dots ${phase === 'loading' ? 'test__dots--loading' : ''} ${phase === 'reveal' ? 'test__dots--out' : ''}`}
          style={{ animationDelay: `${INSTRUCTIONS_RISE_DELAY}ms` }}
          aria-hidden="true"
        >
          {Array.from({ length: total }).map((_, i) => {
            const on = i <= cardIndex;
            const fill = dotColors?.[i] || 'var(--color-text-primary)';
            // Gradient fills go through `background` (a gradient isn't a valid
            // background-color); the border drops out so only the fill shows.
            const isGradient = fill.includes('gradient');
            return (
              <span
                key={i}
                className={`test__dot ${on ? 'test__dot--on' : ''}`}
                style={
                  on
                    ? {
                        background: fill,
                        borderColor: isGradient ? 'transparent' : fill,
                      }
                    : undefined
                }
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
