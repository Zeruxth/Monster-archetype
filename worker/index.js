// Cloudflare Worker — proxy for "The Archetype of the Monster" analysis pipeline.
//
// Holds the Anthropic API key as a secret (env.ANTHROPIC_API_KEY) so it is never
// shipped to the browser. The static site (GitHub Pages) POSTs here; this Worker
// adds the key + the system prompt and forwards to Anthropic, then returns the
// model's JSON.
//
// Two operations, selected by the request body's `step`:
//   { step: "emotion", answers: [a,b,c,d] }            -> Call 1 (emotion detection)
//   { step: "monster", emotion: "<id>", answers: [...] } -> Call 2 (monster + explanation)
//
// DEPLOY (from the worker/ folder):
//   npm install -g wrangler        # once, if you don't have it
//   wrangler login                 # opens the browser, links your Cloudflare account
//   wrangler secret put ANTHROPIC_API_KEY   # paste your key when prompted (stays server-side)
//   wrangler deploy                # prints the Worker URL — give that to the frontend
//
// After deploy, add the printed URL to the site build as VITE_ANALYSIS_URL.

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 1000;

// Browser origins allowed to call this Worker. The site's key/quota is only as
// safe as this list — keep it tight. Add your production domain(s) and any dev
// origins you actually use.
const ALLOWED_ORIGINS = [
  'https://archetype.monster',
  'https://www.archetype.monster',
  'http://localhost:5173', // vite dev
  'http://localhost:4173', // vite preview
];

// ---------------------------------------------------------------------------
// Call 1 — emotion detection
// ---------------------------------------------------------------------------
const EMOTION_SYSTEM_PROMPT = `You are a psychological analysis system for the project "The Archetype of the Monster."

You will receive four free-text responses from a user who viewed four Rorschach-style images and described what they saw. Your job is to identify which of seven emotions best matches the overall pattern of their four responses. Analyze all four together as a whole, not separately.

THE SEVEN EMOTIONS AND THEIR LINGUISTIC MARKERS:

1. CONFUSION (בלבול)
Markers: contradictions, uncertainty, mixing categories ("half human half animal"), difficulty naming what they see, words like "strange", "impossible", "doesn't make sense", "I'm not sure", describing something that shifts or changes shape, combining elements that don't belong together.

2. SUSPICION (חשד)
Markers: hidden presence, something watching, concealment, words like "hiding", "lurking", "behind", "inside", "watching", "listening", describing eyes or gaze, sense of being observed, something that is there but not fully visible, darkness or shadows, something pretending to be something else.

3. TERROR (אימה)
Markers: overwhelming scale, destruction, chaos, words like "swallowing", "devouring", "endless", "consuming", "destroying", describing something that threatens to erase or engulf everything, natural disasters, cosmic scale, helplessness against unstoppable force.

4. AWE (יראה)
Markers: reverence, majesty, power worthy of worship, words like "powerful", "ancient", "sacred", "magnificent", "kneeling", describing something that inspires both fear and admiration simultaneously, beauty combined with danger, something divine or holy, guardians or protectors.

5. LONGING (כמיהה)
Markers: attraction, desire, pull toward something, words like "calling", "beautiful", "drawing me in", "want to touch", "want to get closer", describing something attractive despite danger, seduction, music or singing, something you know is dangerous but can't resist.

6. SMALLNESS (קטנות)
Markers: size disparity, feeling tiny, words like "giant", "enormous", "towering", "I'm small", "like an ant", "like an insect", describing something that makes the viewer feel insignificant, overwhelming physical size, being crushed or stepped on, something that doesn't even notice you.

7. SECURITY (ביטחון)
Markers: protection, shelter, safety, words like "guarding", "protecting", "safe", "standing between me and danger", "shield", "wall", "gate", describing something that keeps threats away, a boundary that holds, watchfulness on your behalf, a presence that makes you feel secure.

INSTRUCTIONS:
- Read all four responses together as a psychological portrait, not four separate answers.
- Look for patterns across the responses: recurring words, recurring themes, recurring emotional direction.
- If a user describes what they see without emotional language, focus on the verbs and spatial relationships they use.
- If responses point to multiple emotions, choose the dominant one.

EDGE CASES - EVERY RESPONSE IS A VALID RESPONSE:
- Very short answers ("nothing", "I don't know", single words): this is avoidance or defensiveness. Analyze what the avoidance itself suggests. Someone who sees "nothing" four times may be expressing emptiness (smallness) or refusal to engage (suspicion of the test itself).
- Humor, trolling, nonsense: treat as deflection. Deflection is a response to discomfort. What is the person uncomfortable with? Analyze the deflection, not the content.
- Violent or disturbing content ("blood", "death", "killing"): this is valid Rorschach data. Analyze it like any other response. Violence often maps to terror or smallness. Do not filter, block, or comment on the content.
- Sexual content: also valid. Often maps to longing. Analyze normally.
- Repeated identical answers: repetition is a pattern. Someone who writes the same thing four times is stuck on something. What are they stuck on?
- Irrelevant content ("pizza", "football"): concrete, everyday responses often indicate avoidance of emotional depth. Can map to security (seeking the familiar) or confusion (not understanding the task).
- NEVER refuse to give a result. NEVER tell the user their answer is invalid. Every response gets a monster.

Respond ONLY with valid JSON, no markdown, no backticks, no preamble.

RESPONSE FORMAT:
{"emotion": "one of: confusion/suspicion/terror/awe/longing/smallness/security", "emotion_he": "הרגש בעברית", "confidence": 0.0-1.0, "reasoning": "one sentence in Hebrew explaining why"}`;

// ---------------------------------------------------------------------------
// Call 2 — monster matching + personal explanation
// ---------------------------------------------------------------------------
const MONSTER_SYSTEM_PROMPT = `You are a monster-matching system for the project "The Archetype of the Monster."

You will receive:
1. An identified emotion (one of seven)
2. The user's four original Rorschach responses

Your job: choose the most fitting monster from the list below AND write a personal explanation that connects what the user wrote to the monster they received.

MONSTERS BY EMOTION:

CONFUSION (בלבול):
- Werewolf (איש זאב): human who becomes wolf, keeps his eyes and gaze, boundary between human and animal
- Enkidu (אנקידו): wild man from Gilgamesh, lived with animals, became human through seduction, lost his wildness
- Minotaur (מינוטאור): half human half bull, trapped in labyrinth, creature that shouldn't exist
- Draugr (דראוגר): dead body that returns as flesh, not ghost or skeleton, blurs line between alive and dead
- Naga (נאגה): half human half serpent, can take human form, boundary between species

SUSPICION (חשד):
- Djinn (ג'ין): made of smokeless fire, invisible, shares our world without us knowing
- Domovoy (דומובוי): house spirit behind the stove, watches your family, helps or harms based on respect
- Kikimora (קיקימורה): female house spirit behind walls, acts at night, spins thread and breaks quiet
- Vampire (ערפד): dead who rises, feeds on blood, enters homes, drains from within
- Onryo (אונריו): vengeful ghost of wronged person, invisible, strikes from unresolved grief

TERROR (אימה):
- Tiamat (תיאמת): primordial ocean, mother of gods, body became the world when Marduk killed her
- Vritra (ורטרה): cosmic serpent blocking rivers, drought as death, killed by Indra's thunderbolt
- Jormungandr (יורמונגנד): world serpent encircling earth, tail in mouth, releases it at Ragnarok
- Leviathan (לוויתן): sea monster only God controls, fire and smoke, symbol of untameable chaos
- Python (פיתון): serpent at Delphi before Apollo, chaos before order, oracle built on its corpse
- Yamata no Orochi (ימאטה נו אורוצ'י): eight-headed serpent, defeated by sake, sacred sword found in body

AWE (יראה):
- Quetzalcoatl (קצלקואטל): feathered serpent, god and leader, contradiction made divine, demanded sacrifices
- Long (לונג): Chinese dragon, controls rain and rivers, imperial symbol, nine types of dragon
- Mushhushshu (מושחושו): composite on Ishtar Gate, symbol of Marduk, guardian of sacred boundary
- Griffin (גריפון): lion-eagle, guards treasures at world's edge, appears across Persia, Scythia, Greece
- Garuda (גארודה): divine bird, mount of Vishnu, enemy of serpents, chose to serve
- Qilin (קירין): appears before birth of sage, pure goodness, does not step on living grass

LONGING (כמיהה):
- Siren (סירנה): bird-woman who sings, offers knowledge not beauty, Odysseus tied to mast to survive
- Lilith (לילית): first wife of Adam who left Eden, refused to submit, longed for freedom not love
- Kitsune (קיצונה): fox disguised as woman, love that might be real or illusion, ambiguity of intimacy
- Rusalka (רוסאלקה): drowned woman who returns, lures men to water, longing born from grief and loss
- Apsara (אפסרה): celestial nymph sent by Indra to seduce sages, weapon of the gods, not her own choice

SMALLNESS (קטנות):
- Polyphemus (פוליפמוס): one-eyed Cyclops, shepherd outside society, eats humans like snacks, defeated by "Nobody"
- Jotunn (יוטון): frost giants, Ymir's body became the world, you live on the giant's corpse
- Nephilim (נפילים): children of angels and humans, made spies feel like grasshoppers, survived the Flood
- Oni (אוני): horned giant with iron club, originally invisible forces, became visual in Heian period
- Ravana (ראוואנה): ten-headed king of Lanka, scholar and musician, too proud to fear humans, killed by avatar of Vishnu
- Fomorians (פומוריאנים): ancient race of Ireland, Balor's destroying eye, ruled through oppression, defeated by grandson Lugh

SECURITY (ביטחון):
- Bes (בס): dwarf god with lion face and protruding tongue, guards beds, mothers and babies, frightens what frightens you
- Nkisi Nkondi (נקיסי נקונדי): wooden figure covered in nails, each nail is an agreement or plea for protection, activated by ritual specialist
- Lamassu (למאסו): human head, bull body, eagle wings, carved from single stone at palace gates, five legs to look complete from every angle
- Komainu (קומאינו): lion-dog pair at Shinto shrine entrances, one mouth open (beginning) one closed (end), defines boundary of sacred space
- Gargoyle (גרגויל): grotesque drainage sculpture on cathedrals, practical function (water) and symbolic (protection), part of the building itself
- Barong (ברונג): lion or dragon covered in fur and gold, fights Rangda in dance ritual that never ends in final victory, balance not victory is the point

INSTRUCTIONS FOR CHOOSING:
- Match the user's specific words and images to the monster whose core trait fits best.
- If the user described something hiding: lean toward monsters of concealment.
- If the user described something enormous: lean toward monsters of size.
- If the user described something beautiful: lean toward monsters of attraction.
- The match should feel personal, not random.

CRITICAL - MONSTER NAME OUTPUT:
- In the "monster" field, output the monster's English name EXACTLY as written in the list above, with the same spelling and spacing: e.g. "Polyphemus" (never "Cyclops"), "Yamata no Orochi", "Nkisi Nkondi", "Mushhushshu".
- Do not translate, abbreviate, or substitute the name. This field is used as a database key and must match exactly.

INSTRUCTIONS FOR THE EXPLANATION:
- Write in Hebrew.
- 3-4 sentences maximum.
- First sentence: reference what the user actually wrote, using their own words or images.
- Second sentence: connect that to the monster's core story or trait.
- Third sentence: connect to the emotion.
- Do NOT start with the monster's name. Start with what the user saw.
- Do NOT write a Wikipedia summary of the monster. Write a personal mirror.
- Tone: clinical, calm, observational. Like a real Rorschach interpretation. Not dramatic, not poetic.

EDGE CASE EXPLANATIONS:
- If the user wrote very little: "ראית מעט, או בחרת שלא לראות." Then connect the avoidance to the monster.
- If the user wrote something violent: reference it directly. "ראית דם, הרס, מוות." Then connect normally to the monster. Do not soften or sanitize.
- If the user trolled: "כתבת מילים שנועדו להרחיק, לא לקרב." Then analyze what the distancing means.
- NEVER apologize. NEVER moralize. NEVER suggest the user needs help. This is an art project, not therapy.

RESPONSE FORMAT (JSON only, no markdown, no backticks):
{"monster": "monster name in English", "monster_he": "שם המפלצת בעברית", "culture": "culture of origin in Hebrew", "explanation": "3-4 sentences in Hebrew connecting user's responses to this monster", "emotion": "the emotion in Hebrew", "chapter": number 1-7}`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function corsHeaders(origin) {
  // Reflect the origin only if it's on the allowlist; otherwise fall back to the
  // primary production origin (so a stray browser gets a valid, if unusable,
  // CORS header rather than a confusing one).
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

function buildUserContent(step, answers, emotion) {
  const [a, b, c, d] = answers;
  if (step === 'emotion') {
    return (
      'The user viewed four Rorschach images and wrote:\n\n' +
      `Image 1: "${a}"\n` +
      `Image 2: "${b}"\n` +
      `Image 3: "${c}"\n` +
      `Image 4: "${d}"\n\n` +
      'Analyze these four responses together and identify the dominant emotion.'
    );
  }
  return (
    `Identified emotion: ${emotion}\n\n` +
    "The user's four Rorschach responses were:\n" +
    `Image 1: "${a}"\n` +
    `Image 2: "${b}"\n` +
    `Image 3: "${c}"\n` +
    `Image 4: "${d}"\n\n` +
    'Select the best-fitting monster and write a personal explanation.'
  );
}

// The prompts demand raw JSON, but never trust that fully — strip stray code
// fences and slice from the first "{" to the last "}" before parsing.
function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('no JSON object in model response');
  }
  return JSON.parse(raw.slice(start, end + 1));
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Token-gated read endpoints for the collected results (open these directly
    // in a browser with ?token=… — they hold user answers, so keep them private).
    if (request.method === 'GET') {
      if (url.pathname === '/stats') return handleStats(env, url);
      if (url.pathname === '/export.csv') return handleExport(env, url);
      return json({ error: 'not found' }, 404, origin);
    }

    if (request.method !== 'POST') {
      return json({ error: 'method not allowed' }, 405, origin);
    }
    // Block browsers from other origins (best-effort abuse guard).
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return json({ error: 'origin not allowed' }, 403, origin);
    }
    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: 'server not configured: missing ANTHROPIC_API_KEY' }, 500, origin);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: 'invalid JSON body' }, 400, origin);
    }

    const { step, answers, emotion } = payload || {};
    if (step !== 'emotion' && step !== 'monster') {
      return json({ error: 'step must be "emotion" or "monster"' }, 400, origin);
    }
    if (!Array.isArray(answers) || answers.length !== 4) {
      return json({ error: 'answers must be an array of four strings' }, 400, origin);
    }
    if (step === 'monster' && !emotion) {
      return json({ error: 'emotion is required for step "monster"' }, 400, origin);
    }

    const system = step === 'emotion' ? EMOTION_SYSTEM_PROMPT : MONSTER_SYSTEM_PROMPT;
    const userContent = buildUserContent(step, answers.map((a) => String(a ?? '')), emotion);

    let anthropicRes;
    try {
      anthropicRes = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system,
          messages: [{ role: 'user', content: userContent }],
        }),
      });
    } catch {
      return json({ error: 'upstream request failed' }, 502, origin);
    }

    if (!anthropicRes.ok) {
      const detail = await anthropicRes.text().catch(() => '');
      return json({ error: 'anthropic error', status: anthropicRes.status, detail }, 502, origin);
    }

    let data;
    try {
      data = await anthropicRes.json();
    } catch {
      return json({ error: 'could not read anthropic response' }, 502, origin);
    }

    const text = data && data.content && data.content[0] ? data.content[0].text : '';
    let result;
    try {
      result = extractJson(text || '');
    } catch {
      return json({ error: 'could not parse model JSON', raw: text }, 502, origin);
    }

    // Record the finished result (monster step only). Runs after the response is
    // sent (waitUntil) and swallows its own errors, so logging can never delay or
    // break the user's result — the analysis works even with no DB bound.
    if (step === 'monster' && env.DB) {
      ctx.waitUntil(logResult(env, emotion, answers, result));
    }

    return json(result, 200, origin);
  },
};

// ---------------------------------------------------------------------------
// Results log (D1) — one row per completed analysis, written on the monster step.
// ---------------------------------------------------------------------------
async function logResult(env, emotion, answers, result) {
  try {
    const a = (Array.isArray(answers) ? answers : []).map((x) => String(x ?? ''));
    const chapter = Number.isFinite(result.chapter) ? result.chapter : null;
    await env.DB.prepare(
      `INSERT INTO results
         (created_at, emotion, emotion_he, monster, monster_he, culture, chapter,
          explanation, answer1, answer2, answer3, answer4)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        new Date().toISOString(),
        String(emotion ?? ''),
        result.emotion ?? null,
        String(result.monster ?? ''),
        result.monster_he ?? null,
        result.culture ?? null,
        chapter,
        result.explanation ?? null,
        a[0] ?? '',
        a[1] ?? '',
        a[2] ?? '',
        a[3] ?? '',
      )
      .run();
  } catch (err) {
    // Best-effort: a logging failure must never surface to the user.
    console.error('logResult failed:', err && err.message ? err.message : err);
  }
}

// ---------------------------------------------------------------------------
// Read endpoints (token-gated) — aggregate counts + a full CSV export.
// ---------------------------------------------------------------------------

// Guard: require ?token=… to equal the STATS_TOKEN secret. Without a configured
// secret the endpoints stay locked (fail closed) rather than leaking the data.
function authed(env, url) {
  const token = url.searchParams.get('token');
  return Boolean(env.STATS_TOKEN) && token === env.STATS_TOKEN;
}

async function handleStats(env, url) {
  if (!authed(env, url)) return new Response('unauthorized', { status: 401 });
  if (!env.DB) return new Response('no database bound', { status: 500 });
  try {
    const total = await env.DB.prepare('SELECT COUNT(*) AS n FROM results').first('n');
    const byMonster = await env.DB.prepare(
      `SELECT monster, monster_he, COUNT(*) AS count
         FROM results GROUP BY monster ORDER BY count DESC, monster`,
    ).all();
    const byEmotion = await env.DB.prepare(
      `SELECT emotion, emotion_he, COUNT(*) AS count
         FROM results GROUP BY emotion ORDER BY count DESC, emotion`,
    ).all();
    const body = JSON.stringify(
      { total, byEmotion: byEmotion.results, byMonster: byMonster.results },
      null,
      2,
    );
    return new Response(body, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch (err) {
    return new Response('stats error: ' + (err && err.message ? err.message : err), {
      status: 500,
    });
  }
}

async function handleExport(env, url) {
  if (!authed(env, url)) return new Response('unauthorized', { status: 401 });
  if (!env.DB) return new Response('no database bound', { status: 500 });
  try {
    const cols = [
      'id', 'created_at', 'emotion', 'emotion_he', 'monster', 'monster_he',
      'culture', 'chapter', 'explanation', 'answer1', 'answer2', 'answer3', 'answer4',
    ];
    const { results } = await env.DB.prepare(
      `SELECT ${cols.join(', ')} FROM results ORDER BY id`,
    ).all();
    const lines = [cols.join(',')];
    for (const row of results || []) {
      lines.push(cols.map((c) => csvCell(row[c])).join(','));
    }
    // Lead with a UTF-8 BOM so Excel opens the Hebrew columns correctly.
    const csv = '﻿' + lines.join('\r\n');
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="monster-results.csv"',
      },
    });
  } catch (err) {
    return new Response('export error: ' + (err && err.message ? err.message : err), {
      status: 500,
    });
  }
}

// Quote a CSV cell only when it contains a comma, quote, or newline; double any
// embedded quotes (RFC 4180).
function csvCell(value) {
  const s = value == null ? '' : String(value);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
