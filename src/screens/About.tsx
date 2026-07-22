import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { combine, interpolate, interpolateAll, separate } from 'flubber';
import { svgPathProperties } from 'svg-path-properties';
import { Menu } from '../components/Menu';
import { Arrow } from '../components/Arrow';
import {
  blots,
  dragons,
  logo,
  polygon,
  star,
  type AboutArt,
} from '../data/aboutShapes';
import haifaLogo from '../assets/haifa-logo.svg';
import './About.css';

interface AboutProps {
  onTest?: () => void;
  onDefiner?: () => void;
  onHome?: () => void;
}

/* ---- The scroll-scrubbed story (Figma 577-727 entry → 558-610 sections) ----
   The page is a runway of one 100vh unit per stage; a sticky full-viewport
   layer shows one composition per stage (shape canvas above a label+body
   block, bottom-pinned like the Figma sections). Scroll position drives
   everything: stage i is settled at scrollY = i·vh, layers crossfade around
   each boundary, and the down-arrow glides to the next stop. The shape-to-
   shape morphs (flubber) mount on top of this in a later step — every canvas
   already carries its hidden `.about__ring` morph geometry. */

interface Stage {
  key: string;
  /** Standard stages carry a label + body; the credits colophon (last stage)
   *  carries neither — it renders its own centered block (see the map). */
  label?: string;
  body?: string;
}

const STAGES: Stage[] = [
  {
    key: 'luca',
    label: 'תחילת הפרוייקט',
    body: 'הפרויקט התחיל מתוך מחשבה על אורגניזם קדום אחד בשם L.U.C.A — האב הקדמון המשותף האחרון של כל צורות החיים. המחשבה שלכל האורגניזמים החיים יש מקור משותף הובילה אותי לשאול: אילו דברים נוספים עשויים להיות משותפים לנו?',
  },
  {
    key: 'jung',
    label: 'הארכיטיפים הקדמוניים',
    body: 'השאלה הזו הובילה אותי לתאוריית הארכיטיפים של קרל יונג. לפי יונג, האדם אינו נולד כתודעה ריקה, אלא עם מבנים ודפוסים נפשיים מולדים, שיכולים להופיע כדימויים ורעיונות דומים בתרבויות שונות.',
  },
  {
    key: 'cohen',
    label: 'תאוריית המפלצות',
    body: 'מתאוריית הארכיטיפים עברתי לתאוריית המפלצות של ג׳פרי ג׳רום כהן. כהן מציע לראות את המפלצת לא רק כיצור דמיוני, אלא כגוף תרבותי שנוצר מתוך הפחדים, הערכים והגבולות של החברה שיצרה אותו. כך, גם כאשר דפוסים מסוימים חוזרים בין תרבויות, כל תרבות מעניקה להם צורה אחרת.',
  },
  {
    key: 'seminar',
    label: 'המחקר הסמינריוני',
    body: 'הרצון לחבר את המחשבה על ארכיטיפים לנושא שמעניין אותי הוביל אותי אל המפלצות. נקודת המוצא הייתה הדרקון, דמות שמופיעה בצורות שונות בתרבויות רבות, גם במקומות שלא התקיים ביניהם קשר ישיר. מתוך השאלה מה גורם לדימוי דומה לחזור שוב ושוב, נולד המחקר הסמינריוני, שבחן את המאפיינים החזותיים של מפלצות המשקפות פחד ביוון, יפן, מצרים והתרבות האצטקית. המחקר ניסה לזהות אילו עקרונות חוזרים בדימוי המפלצת, וכיצד כל תרבות מעניקה להם צורה אחרת.',
  },
  {
    key: 'rorschach',
    label: 'מהמחקר לפרויקט',
    body: 'המחקר התמקד בפחד, אבל תוך כדי העבודה התברר שמפלצות אינן מבטאות רק פחד. הן יכולות לעורר גם משיכה, יראה, בלבול, חשד, תחושת קטנות או ביטחון. במקביל, מבחן רורשאך הציע דרך נוספת לחשוב על הקשר בין דימויים מפלצתיים לבין התת־מודע האנושי: צורה עמומה אינה מכתיבה משמעות אחת, אלא מאפשרת לכל אדם להשליך עליה את האסוציאציות והרגשות שלו. שתי המחשבות האלה הרחיבו את המחקר והפכו לבסיס של פרויקט הגמר.',
  },
  {
    key: 'project',
    label: 'הארכיטיפ של המפלצת',
    body: 'הפרויקט מאגד 39 מפלצות מתרבויות שונות ומארגן אותן לפי שבעה רגשות: בלבול, חשד, אימה, יראה, כמיהה, קטנות וביטחון. במקום לסווג את המפלצות לפי תרבות, מקום או תקופה, הוא בוחן מה הן מעוררות, מה הן מגלמות ואילו גבולות הן מערערות. הספר מציע קריאה מחקרית והשוואתית במפלצות וברגשות שהן מבטאות. הממשק הדיגיטלי ממשיך את אותו רעיון דרך דימויים המבוססים על מבחן רורשאך, ומזמין את המשתמש לזהות את המפלצת מתוך האסוציאציות והרגשות האישיים שלו. כך הפרויקט חוזר אל נקודת המוצא שלו: מן השאלה אם לכל החיים יש מקור משותף, אל השאלה אם גם הדימויים, הפחדים והרגשות שלנו נשענים על מבנים משותפים — מבנים שמשנים צורה מתרבות לתרבות, אך ממשיכים להופיע שוב ושוב.',
  },
  {
    key: 'thanks',
    label: 'תודות ומחשבות נוספות',
    body: 'הפרויקט הזה נבנה מתוך תהליך ארוך של קריאה, השוואה, ניסוי ושינוי כיוון. הוא אינו מבקש לקבוע משמעות אחת לכל מפלצת, אלא להציע דרך נוספת להתבונן בהן - דרך הרגשות שהן מעוררות והאופן שבו הן ממשיכות להשתנות לצדנו. תודה לכל מי שליווה את התהליך, קרא, שאל, העיר, ערער ועזר לדייק את המחשבה ואת הצורה.\n\nלמחשבות, שאלות או פניות נוספות: @aki.wip באינסטגרם',
  },
  // The closing colophon (Figma 577-727) — a centered credits block, not the
  // shape-canvas + label/body of the story stages; rendered specially below.
  { key: 'credits' },
];

/* ---- Closing colophon (Figma 577-727) ---- */
const CREDITS = {
  title: 'החוג לעיצוב תקשורת חזותית',
  school: 'בית הספר לעיצוב',
  university: 'אוניברסיטת חיפה',
  year: 'תשפ"ו 2026',
};

/* ---- Stage art (design-local coordinates from the Figma metadata) ----
   Every canvas spans the 1344px content width; its height is that section's
   art-area height. Shapes sit at their exact Figma x/y; each export is
   uniform-scaled to fit its design rect (ratios ≈1 — export bounds differ by
   a stroke's breadth). The full artwork renders visibly; each shape's
   morph ring is duplicated as a hidden `.about__ring` for the step-3 engine. */

/** The settled render of one export: filled unions vs stroked line-work. */
function ArtPaths({ art }: { art: AboutArt }) {
  return (
    <>
      {art.paths.map((p, i) =>
        p.filled ? (
          <path
            key={i}
            d={p.d}
            className="about__fill"
            fillRule="evenodd"
            clipRule="evenodd"
          />
        ) : (
          /* p.strokeWidth (the export's weight) goes unused — all About
             line-work renders at the uniform 1px set in CSS (.about__line). */
          <path
            key={i}
            d={p.d}
            className="about__line"
          />
        ),
      )}
    </>
  );
}

/** Hidden morph geometry (sampled by the step-3 engine, never painted). */
function Rings({ art }: { art: AboutArt }) {
  return (
    <>
      {art.mainRings.map((d, i) => (
        <path key={i} d={d} className="about__ring" />
      ))}
    </>
  );
}

/** Stage canvas shell. `pin` chooses the letterbox anchor for short viewports:
    right-flush compositions hug the right edge, full-width ones stay centred;
    both keep the BOTTOM (the text sits directly below). */
const canvas = (stage: number, h: number, pin: 'right' | 'mid', children: ReactNode) => (
  <svg
    className="about__canvas"
    viewBox={`0 0 1344 ${h}`}
    style={{ aspectRatio: `1344 / ${h}` }}
    preserveAspectRatio={`${pin === 'right' ? 'xMaxYMax' : 'xMidYMax'} meet`}
    aria-hidden="true"
    data-stage={stage}
  >
    {children}
  </svg>
);

/** Stage 1 — the L.U.C.A cell: a 24px ring centred in the 369px stage box
    that hugs the content's right edge (box x=975, ellipse at 172.5+12). */
const CIRCLE_RING =
  'M1171.5 184.5A12 12 0 1 1 1147.5 184.5A12 12 0 1 1 1171.5 184.5Z';

/** Stage 4 — one column per dragon, structured instead of one scaled picture:
    the art frame keeps its dragon's aspect and scales with the COLUMN width,
    while the caption is real HTML (the [0N] marks live only in the caption
    row — the design's frame-riding tags were dropped as doubled info). All
    four dragons hang from the SAME top line (revised from the Figma stagger,
    by request) — every slot pins `align: 'start'` with no frame margins; the
    knobs stay so a scatter can come back per-slot. LTR order = the design's
    layout. */
interface SeminarSlot {
  art: AboutArt;
  /** Letterbox anchor for short viewports — matches the column's alignment. */
  pin: string;
  align: 'start' | 'end';
  frame?: CSSProperties;
  /** The drawing's visual MASS box in art units (getBBox of the painted
      paths, x-profiled to exclude thin appendages). Used as the viewBox and
      the frame aspect, so the frame hugs the drawn body with none of the
      export canvas's padding: frames top-align at the ink, columns (sized to
      these widths in About.css) put ONE even gap between the masses. Thin
      overhangs simply spill into the gap (overflow is visible): [02]'s claw
      arm (x 290→334) deliberately reaches toward [01]. */
  win: { x: number; y: number; w: number; h: number };
  mark: string;
  name: string;
}

const SEMINAR: SeminarSlot[] = [
  {
    art: dragons[3], // 290×465 — the tall Quetzalcoatl, hangs from the top
    pin: 'xMidYMin meet',
    align: 'start',
    win: { x: 34.6, y: 37.7, w: 236.5, h: 413.2 },
    mark: '(04)',
    name: 'קצלקואטל// מיתולוגיה אצטקית // המאה ה-15',
  },
  {
    art: dragons[2], // 357×331 — Apophis
    pin: 'xMidYMin meet',
    align: 'start',
    win: { x: 1, y: 1, w: 354.6, h: 328.7 },
    mark: '[03]',
    name: 'אפופיס// מיתולוגיה מצרית// 1290-1292 לפנה”ס',
  },
  {
    art: dragons[1], // 334×346 — the Japanese dragon; claw arm overflows right
    pin: 'xMidYMin meet',
    align: 'start',
    win: { x: 1, y: 1, w: 289, h: 343.4 },
    mark: '[02]',
    name: 'דרקון ללא שם// מיתולוגיה יפנית // המאה ה-18',
  },
  {
    art: dragons[0], // 498×226 — the wide Python
    pin: 'xMidYMin meet',
    align: 'start',
    win: { x: 8, y: 8.3, w: 484.7, h: 214.4 },
    mark: '[01]',
    name: 'פייתון// מיתולוגיה יוונית // המאה השלישית לפנה”ס',
  },
];

/** Stage 5 — the blots sheet split into one column per blot (x-windows from
    the sheet's per-path bboxes; the sheet's paths are NOT in left→right
    order, hence the explicit path indices). Every window keeps the sheet's
    full height as its vertical reference, so the four blots hold their
    relative scale; ring i is the sheet's i-th ring left→right, pairing blot
    columns with dragon columns by slot for the step-3 morph. */
const BLOT_SLOTS = [
  { x: 0.8, w: 290.1, path: 0 },
  { x: 317.7, w: 282.4, path: 3 },
  { x: 613.7, w: 266.3, path: 2 },
  { x: 918.7, w: 251.4, path: 1 },
].map(({ x, w, path }, i) => ({
  x,
  w,
  art: {
    w,
    h: blots.h,
    paths: [blots.paths[path]],
    mainRings: [blots.mainRings[i]],
  },
}));

/* Module-level JSX: created once, so the scroll-driven re-renders reuse the
   exact same elements and React skips diffing the heavy path data. */
const ART: ReactNode[] = [
  // 1 — circle (art area 369.01 tall; ring is both the art and its morph ring)
  canvas(
    0,
    369.01,
    'right',
    <>
      <path d={CIRCLE_RING} className="about__line" />
      <path d={CIRCLE_RING} className="about__ring" />
    </>,
  ),
  // 2 — the eight-ray star, right-flush in the same 369 stage box
  canvas(
    1,
    369.01,
    'right',
    <g transform="translate(974.99 0) scale(0.99732)">
      <ArtPaths art={star} />
      <Rings art={star} />
    </g>,
  ),
  // 3 — the irregular polygon band (design rect 473.58×430.44 @ x=870.42)
  canvas(
    2,
    430.45,
    'right',
    <g transform="translate(870.42 0) scale(1.01409)">
      <ArtPaths art={polygon} />
      <Rings art={polygon} />
    </g>,
  ),
  // 4 — the four seminar dragons as structured columns: the row always spans
  // the full content width; art scales with its column (compressing on short
  // viewports) while tags and captions hold their real text size
  <div className="about__seminar" data-stage={3} key="seminar">
    {SEMINAR.map((d) => (
      <div
        key={d.mark}
        className="about__seminar-cell"
        style={{ justifyContent: d.align === 'end' ? 'flex-end' : 'flex-start' }}
      >
        <div
          className="about__seminar-frame"
          style={{ aspectRatio: `${d.win.w} / ${d.win.h}`, ...d.frame }}
        >
          <svg
            viewBox={`${d.win.x} ${d.win.y} ${d.win.w} ${d.win.h}`}
            preserveAspectRatio={d.pin}
            aria-hidden="true"
          >
            <ArtPaths art={d.art} />
            <Rings art={d.art} />
          </svg>
        </div>
      </div>
    ))}
    {SEMINAR.map((d) => (
      <p key={d.mark} className="about__seminar-caption" dir="rtl">
        <span className="about__seminar-mark" dir="ltr">
          {d.mark}
        </span>
        {d.name}
      </p>
    ))}
  </div>,
  // 5 — the capsule as a real CSS stadium box (full width, 1.5px border) with
  // one column per blot inside: when the viewport is short the capsule
  // flattens structurally and the blots compress in place, still spread
  // across the full width instead of shrinking to the centre
  <div className="about__capsule" data-stage={4} key="capsule">
    {BLOT_SLOTS.map((s, i) => (
      <svg
        key={i}
        viewBox={`${s.x} 0 ${s.w} ${blots.h}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <ArtPaths art={s.art} />
        <Rings art={s.art} />
      </svg>
    ))}
  </div>,
  // 6 — the project logo (asterisk outline), right-flush
  canvas(
    5,
    315.42,
    'right',
    <g transform="translate(985.16 0) scale(0.99187)">
      <ArtPaths art={logo} />
      <Rings art={logo} />
    </g>,
  ),
  // 7 — thanks: text only
  null,
  // 8 — credits: its own centered block (rendered in the map), no shape/morph
  null,
];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/* ---- The morph engine ----
   Between stage i and i+1 the settled layers crossfade out and a full-frame
   overlay svg draws the in-between shape. Geometry is sampled from the hidden
   `.about__ring` paths IN SCREEN SPACE — each ring's own getScreenCTM already
   folds in its svg's viewBox, letterboxing and column layout, so the morph
   starts and ends exactly where the settled art sits, at any viewport size.
   Everything lives in the same sticky frame, so the sampled coordinates are
   scroll-invariant; interpolators rebuild only on resize / font load. */

/** Morph window inside one boundary unit (u = p − boundary). The overlay
    ramps in over the same 0.2 the settled layer fades out (a crossfade from
    full artwork to its morph ring), scrubs across the clear middle, and hands
    over to the next layer's fade-in symmetrically. */
const MORPH_IN = 0.15;
const MORPH_OUT = 0.85;
const FADE_LEN = 0.2;
/** The shape TRAVELS only through the clear middle: t is pinned at 0/1 for
    the whole of each crossfade, so the overlay sits position-exact on the
    settled art during both hand-offs — without this the shape is still moving
    while it fades, which reads as "finishes, then slides into place". */
const TRAVEL_IN = 0.35;
const TRAVEL_OUT = 0.65;

const smoothstep = (t: number) => t * t * (3 - 2 * t);

type Ring = [number, number][];
/** One boundary's interpolators (one per drawn path), or null = no morph
    (plain crossfade — the thanks stage has no shape). */
type MorphSet = ((t: number) => string)[] | null;

/** Ring geometry never changes — only its on-screen placement does. The
    local samples are cached per path element; DOM getPointAtLength re-walks
    the whole path per call (the dense blot rings made that ~1s for a full
    build), while svg-path-properties parses once and indexes. */
const localRingCache = new WeakMap<SVGPathElement, Ring>();

function localRing(path: SVGPathElement): Ring {
  const hit = localRingCache.get(path);
  if (hit) return hit;
  const props = new svgPathProperties(path.getAttribute('d') ?? '');
  const len = props.getTotalLength();
  const pts: Ring = [];
  if (len > 0) {
    // Density by contour length (design units): tiny rings (the 24px circle)
    // stay light, long organic rings get the full budget.
    const k = Math.max(48, Math.min(200, Math.round(len / 6)));
    for (let i = 0; i < k; i++) {
      const p = props.getPointAtLength((len * i) / k);
      pts.push([p.x, p.y]);
    }
  }
  localRingCache.set(path, pts);
  return pts;
}

/** Map a ring's cached local samples into overlay space via its current CTM.
    Works while the layer is visibility:hidden — CTMs don't care. */
function sampleRing(path: SVGPathElement, ox: number, oy: number): Ring {
  const m = path.getScreenCTM();
  if (!m) return [];
  return localRing(path).map(([x, y]): [number, number] => [
    m.a * x + m.c * y + m.e - ox,
    m.b * x + m.d * y + m.f - oy,
  ]);
}

/** Build every boundary's interpolators from the current layout:
    1→1 interpolate (circle→star→polygon), 1→4 separate (polygon splits into
    the dragons), 4→4 interpolateAll (dragon column i → blot column i),
    4→1 combine (blots merge into the logo), none into the thanks stage. */
function buildMorphs(sticky: HTMLElement, overlay: SVGSVGElement): MorphSet[] {
  const o = overlay.getBoundingClientRect();
  const stageRings = [...sticky.querySelectorAll('.about__layer')].map((layer) =>
    [...layer.querySelectorAll<SVGPathElement>('.about__ring')]
      .map((p) => sampleRing(p, o.x, o.y))
      .filter((r) => r.length > 0),
  );
  return stageRings.slice(0, -1).map((from, b) => {
    const to = stageRings[b + 1];
    if (!from.length || !to.length) return null;
    try {
      if (from.length === 1 && to.length === 1)
        return [interpolate(from[0], to[0])];
      if (from.length === 1) return separate(from[0], to);
      if (to.length === 1) return combine(from, to[0]);
      return interpolateAll(from, to);
    } catch {
      // Degenerate ring topology — fall back to the plain crossfade.
      return null;
    }
  });
}

export function About({ onTest, onDefiner, onHome }: AboutProps) {
  // Scroll progress in stage units: stage i is settled at p = i.
  const [progress, setProgress] = useState(0);
  const stickyRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<SVGSVGElement>(null);
  // Per-boundary interpolators; rebuilt whenever layout can have moved.
  const [morphs, setMorphs] = useState<MorphSet[] | null>(null);

  useEffect(() => {
    let alive = true;
    let timer = 0;
    const build = () => {
      if (alive && stickyRef.current && overlayRef.current)
        setMorphs(buildMorphs(stickyRef.current, overlayRef.current));
    };
    build();
    // Text heights position the art (bottom-anchored flex) — resample once
    // the real fonts are in.
    document.fonts.ready.then(build);
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(build, 150);
    };
    window.addEventListener('resize', onResize);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    // The browser's deferred scroll restoration (after a reload) can fire
    // late and glide the runway to a stale position mid-story — opt out; the
    // app always enters screens at a controlled scroll anyway.
    window.history.scrollRestoration = 'manual';
    // Arriving from another screen keeps the old document scroll — start at
    // the entry state.
    window.scrollTo(0, 0);
    let raf = 0;
    const read = () => {
      raf = 0;
      const p = window.scrollY / window.innerHeight;
      setProgress(Math.max(0, Math.min(STAGES.length - 1, p)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  /** The down-arrow: glide to the next stage boundary (i·100vh stops). */
  const advance = () => {
    const target = Math.min(Math.round(progress) + 1, STAGES.length - 1);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
      top: Math.round(target * window.innerHeight),
      behavior: reduce ? 'auto' : 'smooth',
    });
  };

  // The arrow fades out with the final stage's fade-in (nothing left to
  // advance to).
  const arrowOpacity = clamp01((STAGES.length - 1 - progress - 0.15) / 0.2);
  const active = Math.round(progress);

  /** Layer opacity: a settled plateau (|p−i| ≤ 0.15), then a fade whose reach
      depends on the boundary being crossed. Where a morph plays, the layer
      clears out fast (gone by 0.35) and the overlay owns the middle; where
      there's none (into the thanks stage, or a failed build), the two layers
      crossfade across the whole window so the frame is never empty. */
  const layerOpacity = (i: number) => {
    const d = progress - i; // >0: this boundary is i (outgoing), <0: i−1 (incoming)
    const u = Math.abs(d);
    if (u <= MORPH_IN) return 1;
    return morphs?.[d > 0 ? i : i - 1]
      ? clamp01(1 - (u - MORPH_IN) / FADE_LEN)
      : clamp01((MORPH_OUT - u) / (MORPH_OUT - MORPH_IN));
  };

  // This frame's morph: inside a boundary window, scrub the interpolators
  // and crossfade the overlay against the settled layers' fades.
  let morphPaths: string[] = [];
  let morphOpacity = 0;
  if (morphs) {
    const b = Math.floor(progress);
    const u = progress - b;
    const set = u > MORPH_IN && u < MORPH_OUT ? morphs[b] : null;
    if (set) {
      const t = smoothstep(
        clamp01((u - TRAVEL_IN) / (TRAVEL_OUT - TRAVEL_IN)),
      );
      morphPaths = set.map((f) => f(t));
      morphOpacity = Math.min(
        clamp01((u - MORPH_IN) / FADE_LEN),
        clamp01((MORPH_OUT - u) / FADE_LEN),
      );
    }
  }

  return (
    <div
      className="about"
      style={{ '--about-stages': STAGES.length } as CSSProperties}
    >
      <div className="about__sticky" ref={stickyRef}>
        {STAGES.map((stage, i) => {
          const opacity = layerOpacity(i);
          const isCredits = stage.key === 'credits';
          return (
            <section
              key={stage.key}
              className={`about__layer${isCredits ? ' about__layer--credits' : ''}`}
              style={{
                opacity,
                visibility: opacity === 0 ? 'hidden' : undefined,
                pointerEvents: i === active ? 'auto' : 'none',
              }}
              aria-hidden={i !== active}
            >
              {isCredits ? (
                <div className="about__credits" dir="rtl">
                  <p className="about__credits-title">{CREDITS.title}</p>
                  <p className="about__credits-line">{CREDITS.school}</p>
                  <p className="about__credits-line">{CREDITS.university}</p>
                  <img
                    className="about__credits-logo"
                    src={haifaLogo}
                    alt={CREDITS.university}
                    width={138}
                    height={84}
                  />
                  <p className="about__credits-line">{CREDITS.year}</p>
                </div>
              ) : (
                <>
                  {ART[i]}
                  <div className="about__text" dir="rtl">
                    <p className="about__label">{stage.label}</p>
                    <p className="about__body">{stage.body}</p>
                  </div>
                </>
              )}
            </section>
          );
        })}

        {/* The morph overlay: full-frame, screen-space path coordinates. */}
        <svg
          ref={overlayRef}
          className="about__morph"
          aria-hidden="true"
          style={{
            opacity: morphOpacity,
            visibility: morphOpacity === 0 ? 'hidden' : undefined,
          }}
        >
          {morphPaths.map((d, k) => (
            <path key={k} d={d} />
          ))}
        </svg>

        <div className="about__menu">
          <Menu
            onTest={onTest}
            onDefiner={onDefiner}
            onHome={onHome}
            active="about"
          />
        </div>

        <button
          type="button"
          className="about__advance arrow-host"
          style={{
            opacity: arrowOpacity,
            visibility: arrowOpacity === 0 ? 'hidden' : undefined,
            pointerEvents: arrowOpacity === 0 ? 'none' : undefined,
          }}
          onClick={advance}
          aria-label="המשך לשלב הבא"
        >
          {/* The system arrow rotated to point down (the Figma button is the
              same left-arrow at -90°). */}
          <Arrow className="about__advance-arrow" />
        </button>
      </div>
    </div>
  );
}
