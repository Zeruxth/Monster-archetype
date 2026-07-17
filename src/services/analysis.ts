import { getMonster, MONSTERS } from '../data/monsters';
import type { CardAnswer, Monster } from '../data/monsters';
import type { EmotionId } from '../data/emotions';

// The deployed Cloudflare Worker that proxies the two Claude calls (it holds the
// Anthropic API key server-side — see worker/index.js). This is a public URL
// (the browser calls it directly), so it's fine to keep here. If the Worker ever
// moves, change this one line.
const ENDPOINT = 'https://monster-archetype-api.monsterarchetype.workers.dev';

// ---------------------------------------------------------------------------
// Wire shapes returned by the Worker (the raw model JSON for each call).
// ---------------------------------------------------------------------------
interface MonsterResponse {
  // The Worker-side prompt asks for exactly these three fields — the old
  // culture/emotion/chapter outputs were never read and were dropped to cut
  // generation time.
  monster: string;
  monster_he?: string;
  explanation?: string;
}
// The merged streamed call ("analyze") adds the emotion as the FIRST field,
// so it can be read off the stream while the rest is still being written.
interface AnalyzeResponse extends MonsterResponse {
  emotion?: string;
}

// ---------------------------------------------------------------------------
// App-facing result. The monster is our LOCAL record (so the result screen and
// the monster's own page stay in sync) with its personal `why` filled in from
// the API's explanation. `emotion` drives the reveal; `isFallback` marks the
// Vritra error-monster so the UI can offer "נסה שוב".
// ---------------------------------------------------------------------------
export interface AnalysisResult {
  emotion: EmotionId;
  monster: Monster;
  isFallback: boolean;
}

const VALID_EMOTIONS: readonly EmotionId[] = [
  'confusion',
  'suspicion',
  'terror',
  'awe',
  'longing',
  'smallness',
  'security',
];

function asEmotionId(value: string | undefined): EmotionId | null {
  const n = (value ?? '').trim().toLowerCase();
  return (VALID_EMOTIONS as readonly string[]).includes(n)
    ? (n as EmotionId)
    : null;
}

// ---------------------------------------------------------------------------
// Monster-name matching: the model returns the "plain" English name from the
// Worker prompt's list; our DB uses diacritic forms (Jötunn, Nāga, Mušḫuššu…)
// and a few different names. Normalize both sides (strip accents + punctuation)
// and keep a small alias table for the handful that still don't line up. The
// Hebrew name is a secondary fallback.
// ---------------------------------------------------------------------------
function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // drop combining accents (ā, ö, š, ḫ…)
    .replace(/[^\p{L}\p{N} ]/gu, '') // drop punctuation (geresh, hyphens…)
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const byNormEn = new Map(MONSTERS.map((m) => [norm(m.en), m] as const));
const byNormHe = new Map(MONSTERS.map((m) => [norm(m.he), m] as const));

// Normalized API name -> local monster id, for the names that don't survive a
// plain normalize: "Djinn"≠"Jinn", "Nkisi Nkondi"≠"Nkisi", the alternate
// "Mushhushshu" spelling, and the doc example's "Cyclops" for Polyphemus.
const ALIASES: Record<string, string> = {
  djinn: 'jinn',
  'nkisi nkondi': 'nkisi',
  mushhushshu: 'mushhushu',
  cyclops: 'polyphemus',
};

function matchMonster(nameEn: string, nameHe?: string): Monster | null {
  const n = norm(nameEn);
  const direct = byNormEn.get(n);
  if (direct) return direct;
  const aliased = ALIASES[n];
  if (aliased) return getMonster(aliased) ?? null;
  if (nameHe) {
    const byHe = byNormHe.get(norm(nameHe));
    if (byHe) return byHe;
  }
  return null;
}

// ---------------------------------------------------------------------------
// The two Worker calls.
// ---------------------------------------------------------------------------

/**
 * Open the connection to the analysis Worker ahead of time. The FIRST request
 * after a quiet period pays DNS + TLS setup (~4s measured) — and without this
 * it pays it inside the loading dots, right after the visitor's 4th answer.
 * Pinging when the instructions screen opens moves that handshake to a moment
 * nobody is waiting on; the browser then reuses the warm connection for the
 * real calls a minute later. OPTIONS is the cheapest round trip the Worker
 * answers (its CORS preflight handler, no body, no model call). Fire-and-
 * forget: the reply is irrelevant and failures must never surface.
 */
export function warmupAnalysis(): void {
  void fetch(ENDPOINT, { method: 'OPTIONS' }).catch(() => {});
}

async function post<T>(body: unknown): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`analysis endpoint returned ${res.status}`);
  return (await res.json()) as T;
}

// The model is told to answer with raw JSON, but never trust that fully —
// strip stray code fences and slice from the first "{" to the last "}"
// (mirrors the Worker's own extractJson).
function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('no JSON object in model response');
  }
  return JSON.parse(raw.slice(start, end + 1));
}

/**
 * The merged call: ONE streamed request in which the model identifies the
 * emotion, picks the monster and writes the explanation. The emotion is the
 * response's first JSON field, so it is plucked out of the arriving stream
 * (via `onEmotion`) seconds before the explanation finishes — the רגש reveal
 * opens on it while the rest still generates. `onText` reports the streamed
 * character count as it grows, so the reveal's typewriter can pace itself
 * against the generation's real progress. Replaces the old two-call chain,
 * which paid the API's (large, variable) per-request wait twice.
 */
async function analyzeStream(
  answers: string[],
  onEmotion: (emotion: EmotionId) => void,
  onText?: (chars: number) => void,
): Promise<{ emotion: EmotionId; monster: Monster; explanation: string }> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ step: 'analyze', answers }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`analysis endpoint returned ${res.status}`);
  }
  // A non-stream reply here is the Worker reporting an upstream error as JSON.
  if (!(res.headers.get('Content-Type') ?? '').includes('text/event-stream')) {
    throw new Error('analysis endpoint did not stream');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let pending = ''; // partial SSE line carried between chunks
  let text = ''; // the model's accumulated response text
  let announced = false;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    pending += decoder.decode(value, { stream: true });
    const lines = pending.split('\n');
    pending = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      let event: { type?: string; delta?: { type?: string; text?: string }; error?: { message?: string } };
      try {
        event = JSON.parse(line.slice(5));
      } catch {
        continue; // keep-alive / non-JSON data line
      }
      if (event.type === 'error') {
        throw new Error(event.error?.message ?? 'stream error');
      }
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        text += event.delta.text ?? '';
        onText?.(text.length);
        // The emotion rides in the first chunks (first field by contract) —
        // announce it as soon as it can be read, exactly once.
        if (!announced) {
          const m = text.match(/"emotion"\s*:\s*"([^"]+)"/);
          if (m) {
            const emotion = asEmotionId(m[1]);
            if (emotion) {
              announced = true;
              onEmotion(emotion);
            }
          }
        }
      }
    }
  }

  const data = extractJson(text) as AnalyzeResponse;
  const emotion = asEmotionId(data.emotion);
  if (!emotion) throw new Error(`unrecognized emotion: ${data.emotion}`);
  const monster = matchMonster(data.monster, data.monster_he);
  if (!monster) throw new Error(`unmatched monster: ${data.monster}`);
  const explanation = (data.explanation ?? '').trim();
  if (!explanation) throw new Error('empty explanation');
  return { emotion, monster, explanation };
}

async function matchMonsterCall(
  emotion: EmotionId,
  answers: string[],
): Promise<{ monster: Monster; explanation: string }> {
  const data = await post<MonsterResponse>({
    step: 'monster',
    emotion,
    answers,
  });
  const monster = matchMonster(data.monster, data.monster_he);
  if (!monster) throw new Error(`unmatched monster: ${data.monster}`);
  const explanation = (data.explanation ?? '').trim();
  if (!explanation) throw new Error('empty explanation');
  return { monster, explanation };
}

// ---------------------------------------------------------------------------
// Vritra error-monster (per the brief). If both attempts fail, the user still
// gets a monster — never a generic error — with a "try again" affordance.
// ---------------------------------------------------------------------------
const VRITRA_EXPLANATION =
  'משהו חסם את הדרך. ורטרה, הנחש הקוסמי מהריג ודה, חוסם את המים ומונע מהחיים לזרום. לפעמים התשובה לא מצליחה לעבור. נסה שוב, ואולי הפעם אינדרה ישבור את החסימה.';

function vritraFallback(): AnalysisResult {
  const vritra = getMonster('vritra')!;
  return {
    emotion: 'terror',
    monster: { ...vritra, why: VRITRA_EXPLANATION },
    isFallback: true,
  };
}

// Fixed exhibition notice shown after the personalized text — Result.tsx
// renders it as its own BOLD run continuing the paragraph. Deliberately NOT
// part of the model prompt (and no longer baked into `why`): fixed wording in
// code is guaranteed verbatim, costs zero generation time, can be styled
// separately from the model text, and stays off the Vritra error screen
// (nothing was identified — there is no postcard to take).
export const POSTCARD_LINE =
  'לצד התצוגה מחכה לכם גלויה מודפסת של המפלצת והרגש שעלו בתוצאה שלכם, וניתן לקחת אותה בסיום הביקור.';

// ---------------------------------------------------------------------------
// Staged analysis over ONE streamed call: the model writes the emotion as its
// first JSON field, so the emotion promise resolves seconds into the stream
// (App opens the רגש reveal on it) while the explanation keeps generating
// underneath — same staged experience as the old two-call chain, but the
// API's (large, variable) per-request wait is paid once instead of twice.
// ---------------------------------------------------------------------------
export interface StagedAnalysis {
  /** Resolves the moment the emotion is read off the stream. NULL means the
      analysis failed outright — the Vritra result is coming and App skips
      the רגש reveal entirely rather than announce a feeling that was never
      actually detected. Never rejects. */
  emotion: Promise<EmotionId | null>;
  /** Resolves when the monster + explanation are in (stream end). Any dead
      end resolves to the Vritra error-monster. Never rejects. */
  result: Promise<AnalysisResult>;
  /** Live 0..1 estimate of how far the result's generation has come — the
      streamed character count against a typical response's size (or elapsed
      time against a typical duration on the non-streamed retry paths).
      Monotonic-ish and cheap to poll; the reveal's typewriter throttles
      itself against it so the text can't outrun the actual generation. May
      hit 1 slightly before the result settles — the reveal keeps its own
      last-character reserve until the result promise resolves, so the text
      still never LOOKS finished early. */
  progress: () => number;
}

// Calibration for `progress` (measured from the D1 results log + timings):
// a full merged response streams ~550-620 chars (446-510-char explanation +
// ~105 chars of JSON wrapper and names) over typically ~11s. Deliberately
// set at the LOW end: overshooting stalls the on-screen paragraph short of
// its end while the stream finishes (an ugly mid-sentence freeze), while
// undershooting just means the text reaches its reserve a touch earlier and
// waits there — the calmer failure.
const EXPECTED_STREAM_CHARS = 500;
const EXPECTED_RESULT_MS = 11000;

/**
 * Run the staged analysis for the four Rorschach answers. One retry on any
 * failure; a dead end resolves to the Vritra error-monster, so the user
 * always receives a result. The retry respects what is already on screen:
 * - Nothing announced yet → the whole merged call simply runs again.
 * - Emotion already announced (mid-stream cut, bad monster name, …) → the
 *   retry is the seeded monster-only call with that SAME emotion — a fresh
 *   run could decide differently and contradict what the user has read.
 *
 * `knownEmotion` seeds a Vritra RETRY from the result screen the same way.
 */
export function analyze(
  answers: CardAnswer[],
  knownEmotion?: EmotionId,
): StagedAnalysis {
  const texts = answers.map((a) => a.text);

  // Every path pins progress to exactly 1 once the result has settled — the
  // pre-settle estimate never claims completion (capped just below 1).
  let settled = false;

  // Seeded retry: the emotion was already announced in a previous run — only
  // the monster call re-runs (once + one retry), locked to that emotion. The
  // call isn't streamed, so progress falls back to elapsed time against the
  // typical duration.
  if (knownEmotion) {
    const startedAt = Date.now();
    const result: Promise<AnalysisResult> = matchMonsterCall(knownEmotion, texts)
      .catch(() => matchMonsterCall(knownEmotion, texts))
      .then(({ monster, explanation }) => ({
        emotion: knownEmotion,
        monster: { ...monster, why: explanation },
        isFallback: false,
      }))
      .catch(() => vritraFallback())
      .then((r) => {
        settled = true;
        return r;
      });
    return {
      emotion: Promise.resolve(knownEmotion),
      result,
      progress: () =>
        settled ? 1 : Math.min(1, (Date.now() - startedAt) / EXPECTED_RESULT_MS),
    };
  }

  // Normal flow: the merged streamed call. The emotion promise is resolved
  // from inside the stream (onEmotion) — or with null if everything failed —
  // and progress mirrors the stream's own growth (onText). A retry restarts
  // the stream, and its onText naturally resets the count.
  let announce!: (emotion: EmotionId | null) => void;
  const emotion = new Promise<EmotionId | null>((resolve) => {
    announce = resolve;
  });
  let announcedEmotion: EmotionId | null = null;
  const onEmotion = (e: EmotionId) => {
    announcedEmotion = e;
    announce(e);
  };
  let streamedChars = 0;
  const onText = (chars: number) => {
    streamedChars = chars;
  };

  const result: Promise<AnalysisResult> = analyzeStream(texts, onEmotion, onText)
    .catch(() => {
      // First attempt failed. If its stream already announced an emotion, the
      // reveal may be showing it — retry monster-only, locked to it.
      if (announcedEmotion) {
        const locked = announcedEmotion;
        return matchMonsterCall(locked, texts).then(
          ({ monster, explanation }) => ({ emotion: locked, monster, explanation }),
        );
      }
      return analyzeStream(texts, onEmotion, onText);
    })
    .then(({ emotion: detected, monster, explanation }) => {
      // Settle the emotion promise for the fast-path case where the stream
      // finished before the mid-stream announce (resolve is idempotent).
      announce(detected);
      return {
        emotion: detected,
        monster: { ...monster, why: explanation },
        isFallback: false,
      };
    })
    .catch(() => {
      announce(null);
      return vritraFallback();
    })
    .then((r) => {
      settled = true;
      return r;
    });

  return {
    emotion,
    result,
    progress: () =>
      settled ? 1 : Math.min(1, streamedChars / EXPECTED_STREAM_CHARS),
  };
}
