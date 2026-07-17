import { useEffect, useState } from 'react';
import { HoverGraphic, preloadGraphics } from '../components/HoverGraphic';
import { monsterArtIds, monsterArtSvg } from '../data/monsterArt';
import './Reel.css';

// Dev-only capture stage (open at #reel) for exporting the landing's monster
// draw-loop as video: every line-art creature, IN DATA-FILE ORDER (the landing
// itself picks randomly, so it can't be captured directly), each drawing in,
// holding, and un-drawing with exactly the landing's HoverGraphic timings.
// One pass through the full set, then `window.__reelDone` flips — the capture
// script (see the export pipeline) watches it to stop recording.
//
// `#reel=N` limits the pass to the first N creatures (smoke tests).

// Same look as the landing loop: faint grey line-art on the dark page.
const STROKE = '#BABABA';
// Same timing pair the landing passes its HoverGraphic.
const HOLD_MS = 120;
const GAP_MS = 30;

const monsterSrc = (id: string) =>
  'data:image/svg+xml,' + encodeURIComponent(monsterArtSvg(id, STROKE));

function reelIds(): string[] {
  const ids = monsterArtIds();
  const limit = Number(window.location.hash.split('=')[1]);
  return Number.isFinite(limit) && limit > 0 ? ids.slice(0, limit) : ids;
}

declare global {
  interface Window {
    /** True once the last creature has fully un-drawn (capture can stop). */
    __reelDone?: boolean;
    /** 0-based index of the creature currently drawing (capture progress). */
    __reelIndex?: number;
    /** Starts the reel when it loaded in the held state (see below). */
    __reelGo?: () => void;
  }
}

export function Reel() {
  const [ids] = useState(reelIds);
  const [index, setIndex] = useState(0);
  // Under automation (the capture script) the reel loads HELD on the empty
  // dark stage: real time passes between page load and the script freezing
  // the virtual clock, and a draw that starts in that window is already
  // mid-stroke when recording begins. The script starts the reel itself —
  // via __reelGo(), after the clock is frozen — so the video opens on empty
  // dark and the first stroke starts under the recorded clock. A human
  // opening #reel just gets autoplay.
  const [go, setGo] = useState(() => !navigator.webdriver);
  useEffect(() => {
    if (go) return;
    window.__reelGo = () => setGo(true);
  }, [go]);
  const done = index >= ids.length;

  // Progress markers for the capture script. Render-time assignment is fine
  // here — same value on a StrictMode double-render, and there is no consumer
  // inside React.
  window.__reelIndex = index;
  if (done) window.__reelDone = true;

  // Warm every creature up front (same as the landing) so each advance mounts
  // synchronously and the gap between creatures stays a tight, uniform beat.
  useEffect(() => {
    preloadGraphics(ids.map(monsterSrc));
  }, [ids]);

  return (
    <div className="reel">
      {go && !done && (
        <HoverGraphic
          key={ids[index]}
          src={monsterSrc(ids[index])}
          className="reel__stage"
          holdMs={HOLD_MS}
          gapMs={GAP_MS}
          onDone={() => setIndex((i) => i + 1)}
        />
      )}
    </div>
  );
}
