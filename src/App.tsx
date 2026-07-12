import { useState } from 'react';
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
import CursorFx from './components/CursorFx';
import { buildDeck, DECK_SIZE } from './data/cards';
import type { TestCard } from './data/cards';
import type { CardAnswer, Monster } from './data/monsters';
import { EMOTIONS } from './data/emotions';
import { analyze } from './services/analysis';
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

// A floor on the loading beat so a fast (or fast-failing) analysis doesn't flash
// the dots and jump straight to the reveal. The two Claude calls usually take a
// few seconds; this only bites when they resolve — or error out — quickly.
const MIN_LOADING_MS = 1400;

// Dev-only: open the app at #blots to review the blot variation library. Read
// once at load (a module constant) so App's hook order never changes at runtime.
const SHOW_BLOTS =
  typeof window !== 'undefined' && window.location.hash === '#blots';

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
  const [exiting, setExiting] = useState(false);
  // The loading pill's box, captured at the loading→reveal hand-off so the reveal
  // card can morph (expand) out of it. null = no morph (e.g. dev jump).
  const [morphFrom, setMorphFrom] = useState<DOMRect | null>(null);
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

  // Run the two-call analysis (emotion → monster) under the loading dots, then
  // hand off to the reveal. Shared by the last-card submit and the Vritra retry.
  // `analyze` never rejects — it retries once internally, then resolves to the
  // Vritra fallback — so the loading dots always give way to a real result.
  const runAnalysis = (finalAnswers: CardAnswer[]) => {
    setStep('loading');
    const startedAt = Date.now();
    void analyze(finalAnswers).then((result) => {
      // Hold the loading beat to its floor so a fast resolve doesn't flash the dots.
      const wait = Math.max(0, MIN_LOADING_MS - (Date.now() - startedAt));
      window.setTimeout(() => {
        // Measure the pill (still mounted) so the reveal card can expand from it.
        const pill = document.querySelector('.loading__pill');
        setMorphFrom(pill ? pill.getBoundingClientRect() : null);
        setMonster(result.monster);
        setIsFallback(result.isFallback);
        setStep('reveal');
      }, wait);
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

  // Vritra fallback → "נסה שוב": re-run the whole pipeline with the same answers.
  const retryAnalysis = () => runAnalysis(answers);

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
            onTest={beginCards}
            onDefiner={goDefiner}
            onAbout={goAbout}
            onHome={goHome}
          >
            {step === 'instructions' ? (
              <InstructionsBody onStart={beginCards} />
            ) : step === 'loading' ? (
              <LoadingBody />
            ) : step === 'reveal' ? (
              monster && (
                <RevealBody
                  emotion={EMOTIONS[monster.emotion]}
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
