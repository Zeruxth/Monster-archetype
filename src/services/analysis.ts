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
interface EmotionResponse {
  // Call 1 was trimmed to this single field (the only one the app ever read);
  // the Hebrew mirror fields were dropped Worker-side to cut latency.
  emotion: string;
}
interface MonsterResponse {
  monster: string;
  monster_he?: string;
  culture?: string;
  explanation?: string;
  emotion?: string;
  chapter?: number;
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
async function post<T>(body: unknown): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`analysis endpoint returned ${res.status}`);
  return (await res.json()) as T;
}

async function detectEmotion(answers: string[]): Promise<EmotionId> {
  const data = await post<EmotionResponse>({ step: 'emotion', answers });
  const emotion = asEmotionId(data.emotion);
  if (!emotion) throw new Error(`unrecognized emotion: ${data.emotion}`);
  return emotion;
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
// Staged analysis: the emotion resolves first (the fast Haiku call), the full
// result later (Sonnet writing the paragraph). App.tsx opens the רגש reveal on
// the first promise and lets the second land in the background while the
// reveal types itself out — the paragraph's generation time hides inside a
// screen the user is already reading, instead of stretching the loading dots.
// ---------------------------------------------------------------------------
export interface StagedAnalysis {
  /** Resolves the moment the emotion is known (call 1, retried once). NULL
      means detection itself failed — the Vritra result is coming and App
      skips the רגש reveal entirely rather than announce a feeling that was
      never actually detected. Never rejects. */
  emotion: Promise<EmotionId | null>;
  /** Resolves when the monster + explanation are in (call 2, retried once
      with the SAME emotion — the reveal is already showing it, so a full
      re-run could contradict the screen). Any failure resolves to the Vritra
      error-monster. Never rejects. */
  result: Promise<AnalysisResult>;
}

/**
 * Run the staged analysis for the four Rorschach answers. Each call gets one
 * retry on any failure (network / bad JSON / unrecognized emotion / unmatched
 * monster); a dead end resolves to the Vritra error-monster, so the user
 * always receives a result.
 *
 * `knownEmotion` seeds a Vritra RETRY where detection already succeeded and
 * was announced on the reveal: call 1 is skipped — re-detecting could come
 * back different and contradict the emotion the user has already read.
 */
export function analyze(
  answers: CardAnswer[],
  knownEmotion?: EmotionId,
): StagedAnalysis {
  const texts = answers.map((a) => a.text);
  // Call 1 with one retry (or the seeded emotion). This attempt may reject
  // (both tries failed) — both derived promises below attach a catch, so no
  // rejection goes unhandled.
  const attempt = knownEmotion
    ? Promise.resolve(knownEmotion)
    : detectEmotion(texts).catch(() => detectEmotion(texts));

  const result: Promise<AnalysisResult> = attempt
    .then(async (emotion) => {
      const { monster, explanation } = await matchMonsterCall(
        emotion,
        texts,
      ).catch(() => matchMonsterCall(emotion, texts));
      return {
        emotion,
        monster: { ...monster, why: explanation },
        isFallback: false,
      };
    })
    .catch(() => vritraFallback());

  return { emotion: attempt.catch(() => null), result };
}
