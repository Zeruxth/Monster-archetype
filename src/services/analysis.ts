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
  emotion: string;
  emotion_he?: string;
  confidence?: number;
  reasoning?: string;
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

// One full pass: Call 1 (emotion) then Call 2 (monster + explanation).
async function runOnce(answers: string[]): Promise<AnalysisResult> {
  const emotion = await detectEmotion(answers);
  const { monster, explanation } = await matchMonsterCall(emotion, answers);
  return { emotion, monster: { ...monster, why: explanation }, isFallback: false };
}

/**
 * Run the full analysis for the four Rorschach answers. Retries the whole
 * pipeline once on any failure (network / bad JSON / unrecognized emotion /
 * unmatched monster), then falls back to the Vritra error-monster so the user
 * always receives a result.
 */
export async function analyze(answers: CardAnswer[]): Promise<AnalysisResult> {
  const texts = answers.map((a) => a.text);
  try {
    return await runOnce(texts);
  } catch {
    try {
      return await runOnce(texts);
    } catch {
      return vritraFallback();
    }
  }
}
