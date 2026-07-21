import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Landing } from './screens/Landing';
import type { CatalogOrigin } from './screens/Landing';
import { TestShell } from './screens/Test';
import { InstructionsBody } from './screens/Instructions';
import { CardBody } from './screens/Card';
import { LoadingBody } from './screens/Loading';
import { RevealBody } from './screens/Reveal';
import { Result } from './screens/Result';
import { Definer } from './screens/Definer';
import { MonsterPage } from './screens/MonsterPage';
import { About } from './screens/About';
import { BlotGallery } from './screens/BlotGallery';
import { Reel } from './screens/Reel';
import CursorFx from './components/CursorFx';
import { buildDeck, DECK_SIZE } from './data/cards';
import type { TestCard } from './data/cards';
import type { CardAnswer, Monster } from './data/monsters';
import { EMOTIONS } from './data/emotions';
import type { EmotionId } from './data/emotions';
import { analyze, warmupAnalysis } from './services/analysis';
import './App.css';

type Step =
  | 'landing'
  | 'instructions'
  | 'cards'
  | 'loading'
  | 'reveal'
  | 'result'
  | 'definer'
  | 'monster'
  | 'about';

// How long the רגש frame takes to slide down and out before the monster screen
// mounts (kept in sync with the frame-exit-down animation in Test.css).
const REVEAL_EXIT_MS = 500;

// A floor on the loading beat so a fast (or fast-failing) emotion call doesn't
// flash the dots and jump straight to the reveal.
const MIN_LOADING_MS = 1400;

// Any screen past the landing, left with no visitor activity (mouse move,
// click, key, scroll, touch) for this long, returns to the home screen — an
// exhibition kiosk must never sit on the previous visitor's screen.
const IDLE_RESET_MS = 2 * 60_000;
// How often the idle watchdog checks the last-activity stamp. Coarse on
// purpose (the reset just needs to land within a few seconds of the 2-min
// mark) so high-frequency pointermove events only stamp a timestamp rather
// than churn a timer.
const IDLE_CHECK_MS = 5_000;

// Dev-only: open the app at #blots to review the blot variation library. Read
// once at load (a module constant) so App's hook order never changes at runtime.
const SHOW_BLOTS =
  typeof window !== 'undefined' && window.location.hash === '#blots';

// Dev-only: open the app at #reel for the video-export capture stage — every
// landing monster drawing in and un-drawing once, in order (see screens/Reel).
const SHOW_REEL =
  typeof window !== 'undefined' && window.location.hash.startsWith('#reel');

export default function App() {
  const [step, setStep] = useState<Step>('landing');
  const [cardIndex, setCardIndex] = useState(0);
  const [answers, setAnswers] = useState<CardAnswer[]>([]);
  // The four blot cards for this run — four distinct shapes over the fixed arc
  // black → spot → full → black, rebuilt each time the test begins so it varies.
  const [deck, setDeck] = useState<TestCard[]>(() => buildDeck());
  const [monster, setMonster] = useState<Monster | null>(null);
  // True when the shown monster is the Vritra error-fallback (both API attempts
  // failed) — the result screen swaps its "discover" link for a "נסה שוב" retry.
  const [isFallback, setIsFallback] = useState(false);
  // Stage-1 result: the detected emotion driving the רגש reveal. Lands seconds
  // before the monster + paragraph, which finish in the background while the
  // reveal types itself out (see runAnalysis).
  const [revealEmotion, setRevealEmotion] = useState<EmotionId | null>(null);
  const [exiting, setExiting] = useState(false);
  // The loading pill's box, captured at the loading→reveal hand-off so the reveal
  // card can morph (expand) out of it. null = no morph (e.g. dev jump).
  const [morphFrom, setMorphFrom] = useState<DOMRect | null>(null);
  // The live analysis-progress probe of the CURRENT run (see StagedAnalysis
  // .progress) — the reveal's typewriter throttles itself against it so the
  // text can never outrun the actual generation. A ref (not state): it's set
  // synchronously in runAnalysis before the reveal can mount, and reading it
  // has no render of its own.
  const resultProgress = useRef<() => number>(() => 1);
  // Reveal → Result hand-off: the reveal (רגש) frame slides down and out before
  // the monster screen draws itself in. True while that exit is playing.
  const [revealExiting, setRevealExiting] = useState(false);
  // Landing → Definer hand-off: the monster hovered on the landing (and its box)
  // so the catalogue can fly it into its tile (Option C). null = plain entrance.
  const [definerOrigin, setDefinerOrigin] = useState<CatalogOrigin | null>(null);
  // The monster whose page is open (catalogue tile → inner page).
  const [pageMonster, setPageMonster] = useState<Monster | null>(null);
  // The clicked tile's box, so the page scales open from the direction of the
  // click (null = no animation, e.g. dev jump).
  const [monsterOrigin, setMonsterOrigin] = useState<DOMRect | null>(null);

  // Landing → Instructions: fade the landing content out (500ms) over the
  // shared dark background, then mount the shell whose white frame scales in.
  const startTest = () => {
    setExiting(true);
    window.setTimeout(() => {
      setExiting(false);
      setStep('instructions');
    }, 500);
  };

  const beginCards = () => {
    setCardIndex(0);
    setAnswers([]);
    setDeck(buildDeck());
    setStep('cards');
  };

  // Run the staged analysis. Shared by the last-card submit and the Vritra
  // retry. Stage 1 (emotion, ~1s) opens the reveal; stage 2 (monster + the
  // written paragraph, the slow leg) lands in the background while the reveal
  // types itself out, and arms its arrow (RevealBody's `ready`). Neither
  // promise ever rejects — dead ends resolve to the Vritra fallback — so the
  // dots always give way to a screen: the reveal normally, or (when detection
  // itself failed and there is no emotion to announce) the Vritra result
  // directly. A seeded retry re-announces the already-detected emotion.
  const runAnalysis = (finalAnswers: CardAnswer[], knownEmotion?: EmotionId) => {
    setStep('loading');
    setMonster(null); // the reveal's arrow stays down until stage 2 lands
    setRevealEmotion(knownEmotion ?? null); // no stale emotion from a past run
    const startedAt = Date.now();
    const staged = analyze(finalAnswers, knownEmotion);
    resultProgress.current = staged.progress;
    void staged.emotion.then((emotion) => {
      if (emotion === null) {
        // Detection itself failed — there is no emotion to announce, so the
        // רגש reveal is skipped: the dots (held to their floor) give way
        // straight to the Vritra result (staged.result has already resolved
        // to the fallback here, and the setter below has stored it).
        const wait = Math.max(0, MIN_LOADING_MS - (Date.now() - startedAt));
        window.setTimeout(() => {
          void staged.result.then(() => setStep('result'));
        }, wait);
        return;
      }
      // Open the reveal as soon as the emotion is in hand (the merged call
      // streams it out ~2s in), held only to the dots' floor. The old
      // hold-to-half-the-expected-wait predates the merge: back then a whole
      // second API call still had to hide inside the reveal, so the dots
      // absorbed half the wait up front. Now the full result rides one stream
      // that usually lands INSIDE the reveal's ~8s writing beat — extra dots
      // time would be pure added wait (and when the stream does run long, the
      // reveal's bridge-hold caret covers the tail, not the dots).
      const wait = Math.max(0, MIN_LOADING_MS - (Date.now() - startedAt));
      window.setTimeout(() => {
        // Measure the pill (still mounted) so the reveal card can expand from it.
        const pill = document.querySelector('.loading__pill');
        setMorphFrom(pill ? pill.getBoundingClientRect() : null);
        setRevealEmotion(emotion);
        setStep('reveal');
      }, wait);
    });
    void staged.result.then((result) => {
      setMonster(result.monster);
      setIsFallback(result.isFallback);
    });
  };

  const handleCardSubmit = (text: string, responseMs: number) => {
    const next = [...answers, { text, responseMs }];
    setAnswers(next);
    if (cardIndex < DECK_SIZE - 1) {
      setCardIndex(cardIndex + 1);
    } else {
      // Last answer in: collapse to the loading state and run the real analysis.
      // The dots loop until it resolves (so the wait can stretch as long as needed).
      runAnalysis(next);
    }
  };

  // Vritra fallback → "נסה שוב". If the emotion was already detected and
  // announced (it was call 2 that failed), seed it: the retry re-runs only the
  // monster call, and the replayed reveal repeats the SAME emotion — a fresh
  // detection could come back different and contradict what the user read.
  // If detection itself failed (revealEmotion null, no reveal was shown),
  // re-run the whole pipeline.
  const retryAnalysis = () => runAnalysis(answers, revealEmotion ?? undefined);

  // Reveal → Result: slide the רגש frame down and out (ease-out), then swap to
  // the monster screen, which draws its own lines / text / monster in.
  const revealToResult = () => {
    setRevealExiting(true);
    window.setTimeout(() => {
      setRevealExiting(false);
      setStep('result');
    }, REVEAL_EXIT_MS);
  };

  // Menu navigation (available from any page's Menu). The landing passes a
  // CatalogOrigin so the catalogue can fly that monster into its tile; every
  // other caller passes nothing (or a React event), which navigates plainly.
  const goDefiner = (origin?: CatalogOrigin | unknown) => {
    setExiting(false);
    setRevealExiting(false);
    setMorphFrom(null);
    setDefinerOrigin(
      origin && typeof origin === 'object' && 'rect' in origin
        ? (origin as CatalogOrigin)
        : null,
    );
    setStep('definer');
  };
  // Catalogue tile → that monster's inner page. The tile's box (if given) lets
  // the page scale open from where it was clicked.
  const openMonster = (m: Monster, rect?: DOMRect) => {
    setExiting(false);
    setRevealExiting(false);
    setMorphFrom(null);
    setPageMonster(m);
    setMonsterOrigin(rect ?? null);
    setStep('monster');
  };
  // Result → MonsterPage "discover more": a shared-element hero morph. The
  // result's filled monster silhouette and the page's line-art share one
  // `view-transition-name`, so the browser morphs (cross-fade + reposition/
  // resize) the silhouette into the line drawing while the surrounding text
  // cross-fades and reorganizes around it. Where the View Transitions API is
  // unavailable (or motion is reduced) it falls back to the catalogue-style
  // scale-open from the monster's box (rect).
  const discoverMonster = (m: Monster, rect?: DOMRect) => {
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => unknown;
    };
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (doc.startViewTransition && !reduce) {
      doc.startViewTransition(() =>
        // flushSync commits the result→page DOM swap synchronously inside the
        // transition, so the browser captures the before/after for the morph.
        flushSync(() => {
          setExiting(false);
          setRevealExiting(false);
          setMorphFrom(null);
          setPageMonster(m);
          setMonsterOrigin(null); // no scale-open; the morph carries the motion
          setStep('monster');
        }),
      );
    } else {
      openMonster(m, rect);
    }
  };
  // "על הפרוייקט" — the about screen (available from the landing nav + every
  // page's Menu). No scale-open: the about text simply types itself in.
  const goAbout = () => {
    setExiting(false);
    setRevealExiting(false);
    setMorphFrom(null);
    setDefinerOrigin(null);
    setStep('about');
  };
  // The Menu's square logo returns to the home (landing) screen.
  const goHome = () => {
    setExiting(false);
    setRevealExiting(false);
    setMorphFrom(null);
    setDefinerOrigin(null);
    setStep('landing');
  };
  // "מבחן" from another page restarts the experience at the instructions.
  const goTest = () => {
    setExiting(false);
    setRevealExiting(false);
    setMorphFrom(null);
    setCardIndex(0);
    setAnswers([]);
    setStep('instructions');
  };

  // The instructions + cards + loading + reveal phases share one persistent
  // shell, so the white frame must NOT remount between them — keep a stable key
  // across all (the frame physically morphs from the pill into the reveal card).
  const inTest =
    step === 'instructions' ||
    step === 'cards' ||
    step === 'loading' ||
    step === 'reveal';

  // Exhibition safeguard: on ANY screen past the landing, if the visitor goes
  // idle — no mouse movement, click, key, scroll or touch — for IDLE_RESET_MS,
  // return to the home screen, so the kiosk never sits on a previous visitor's
  // test / result / monster page. The landing itself is exempt (already home).
  // A last-activity timestamp + a coarse interval, rather than a timer reset
  // per event, so pointermove's flood is cheap. Any navigation re-runs this
  // (step dep), which restamps — moving between screens counts as activity.
  useEffect(() => {
    if (step === 'landing') return;
    let lastActivity = Date.now();
    const bump = () => {
      lastActivity = Date.now();
    };
    const events = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const watchdog = window.setInterval(() => {
      if (Date.now() - lastActivity < IDLE_RESET_MS) return;
      // Clear every transient so the landing comes up fresh, from whatever
      // screen we were on (test, result, catalogue or a monster page).
      setExiting(false);
      setRevealExiting(false);
      setMorphFrom(null);
      setDefinerOrigin(null);
      setMonsterOrigin(null);
      setPageMonster(null);
      setCardIndex(0);
      setAnswers([]);
      setMonster(null);
      setIsFallback(false);
      setRevealEmotion(null);
      setStep('landing');
    }, IDLE_CHECK_MS);
    return () => {
      window.clearInterval(watchdog);
      events.forEach((e) => window.removeEventListener(e, bump));
    };
  }, [step]);

  // Pre-warm the analysis Worker's connection while the visitor reads the
  // instructions: the FIRST request after a quiet period pays ~4s of DNS+TLS
  // setup, which would otherwise land inside the loading dots right after the
  // 4th answer (see warmupAnalysis). Re-warming on every entry is harmless —
  // on an already-warm connection the ping is a no-op.
  useEffect(() => {
    if (step === 'instructions') warmupAnalysis();
  }, [step]);
  const mainKey = inTest ? 'test' : step;
  // The shell enters via its own white-frame scale animation, so it opts out of
  // the shared screen fade-in (which would double up on that entrance). The
  // result also opts out: its white panel is the SAME box as the reveal frame, so
  // it must stay solid/continuous (only its inner card slid away) rather than
  // fading the whole surface back in.
  // The catalogue entered via a landing hover runs its own fly-in handoff, so it
  // opts out of the shared fade-in (which would cross-fade the whole dark page).
  const definerFlyIn = step === 'definer' && definerOrigin !== null;
  // The monster page runs its own entrance — the catalogue scale-open (origin
  // set) or the Result→page hero morph (a view transition) — so it always opts
  // out of the shared screen fade-in, which would otherwise fight them.
  const screenClass =
    inTest || step === 'result' || definerFlyIn || step === 'monster'
      ? 'app__screen'
      : 'app__screen fade-in';

  // Dev-only video-export stage (open at #reel). Before the blots guard, same
  // rule: AFTER all hooks so React's hook order stays fixed. No CursorFx — the
  // capture must not paint a cursor into the video frames.
  if (SHOW_REEL) return <Reel />;

  // Dev-only blot library review sheet (open at #blots). Guard sits AFTER all
  // hooks + handlers so React's hook order stays fixed across renders.
  // CursorFx comes along — the native cursor is transparent here too.
  if (SHOW_BLOTS)
    return (
      <>
        <BlotGallery />
        <CursorFx />
      </>
    );

  return (
    <div className="app">
      <main key={mainKey} className={screenClass}>
        {step === 'landing' && (
          <Landing
            onStart={startTest}
            onCatalog={goDefiner}
            onAbout={goAbout}
            exiting={exiting}
          />
        )}

        {inTest && (
          <TestShell
            phase={
              step === 'cards'
                ? 'cards'
                : step === 'loading'
                  ? 'loading'
                  : step === 'reveal'
                    ? 'reveal'
                    : 'instructions'
            }
            // Loading + reveal keep every dot filled (the test is complete) — on
            // loading they loop, on reveal they fade out.
            cardIndex={
              step === 'cards'
                ? cardIndex
                : step === 'loading' || step === 'reveal'
                  ? DECK_SIZE - 1
                  : -1
            }
            total={DECK_SIZE}
            dotColors={deck.map((c) => c.dotFill)}
            onTest={goTest}
            onDefiner={goDefiner}
            onAbout={goAbout}
            onHome={goHome}
          >
            {step === 'instructions' ? (
              <InstructionsBody onStart={beginCards} />
            ) : step === 'loading' ? (
              <LoadingBody />
            ) : step === 'reveal' ? (
              revealEmotion && (
                <RevealBody
                  emotion={EMOTIONS[revealEmotion]}
                  ready={monster != null}
                  progress={resultProgress.current}
                  onReveal={revealToResult}
                  morphFrom={morphFrom}
                  exiting={revealExiting}
                />
              )
            ) : (
              <CardBody
                key={cardIndex}
                card={deck[cardIndex]}
                isLast={cardIndex === DECK_SIZE - 1}
                onSubmit={handleCardSubmit}
              />
            )}
          </TestShell>
        )}

        {step === 'result' && monster && (
          <Result
            monster={monster}
            isFallback={isFallback}
            onRetry={retryAnalysis}
            onAllMonsters={goDefiner}
            onDiscover={(rect) => discoverMonster(monster, rect)}
            onTest={goTest}
            onDefiner={goDefiner}
            onAbout={goAbout}
            onHome={goHome}
          />
        )}

        {step === 'definer' && (
          <Definer
            onTest={goTest}
            onAbout={goAbout}
            onHome={goHome}
            onOpen={openMonster}
            origin={definerOrigin}
          />
        )}

        {step === 'monster' && pageMonster && (
          <MonsterPage
            monster={pageMonster}
            origin={monsterOrigin}
            onBack={goDefiner}
            onTest={goTest}
            onDefiner={goDefiner}
            onAbout={goAbout}
            onHome={goHome}
          />
        )}

        {step === 'about' && (
          <About onTest={goTest} onDefiner={goDefiner} onHome={goHome} />
        )}
      </main>
      {/* The visible cursor — a fixed difference-blend overlay riding the
          pointer (the native cursor sitewide is a transparent PNG; see
          tokens.css). A SIBLING after <main>, not a child: <main> animates
          opacity, which isolates blending inside it — out here the arrow
          blends against the whole painted page. */}
      <CursorFx />
    </div>
  );
}
