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
// Call 1 (emotion) runs on Haiku: a 7-way classification that outputs one
// English label (see its RESPONSE FORMAT — no Hebrew is generated in that
// step, so Haiku's weaker Hebrew never shows), and Haiku answers in a
// fraction of Sonnet's time. Thinking is opt-in on Haiku 4.5, so like Sonnet
// 4.5 it can't silently spend the token budget on hidden reasoning.
const EMOTION_MODEL = 'claude-haiku-4-5-20251001';
// Call 2 (monster + the explanation the visitor actually reads) stays on
// Sonnet 4.5: much stronger Hebrew spelling/grammar than Haiku, and — unlike
// the newer Sonnet 5 — it has NO adaptive "thinking". That keeps it a plain
// drop-in that honors `temperature` and can't spend the MAX_TOKENS budget on
// hidden reasoning (which would truncate our JSON at only 1000 tokens).
const MONSTER_MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = 1000;
// Below the API default of 1.0 to cut random typos / spelling drift in the
// generated Hebrew. Not 0 — a little variation keeps phrasings from repeating.
const TEMPERATURE = 0.5;

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
// v2 (api_system_prompts_v2.md): tighter markers per emotion + an explicit
// anti-default check on CONFUSION — the 18-user pilot showed the ambiguity of
// Rorschach images pulls the model toward "confusion" unless told to resist.
// Output is trimmed to the ONE field the app reads: the English emotion id
// (analysis.ts discards everything else). Dropping the v1 Hebrew fields
// (emotion_he / reasoning, and the worker-side HEBREW QUALITY block that
// guarded them) means fewer tokens to wait for — and no visible Hebrew in
// this step, which is what lets it run on Haiku.
// ---------------------------------------------------------------------------
// The emotion-detection core — the markers, the anti-confusion balance check
// and the every-response-is-valid edge cases — shared VERBATIM by the
// two-step flow's call 1 (EMOTION_SYSTEM_PROMPT) and the merged single-call
// flow (ANALYZE_SYSTEM_PROMPT below), so the two paths can never drift.
const EMOTION_DETECTION_GUIDE = `THE SEVEN EMOTIONS AND THEIR LINGUISTIC MARKERS:

1. CONFUSION (בלבול)
Markers: category mixing ("half human half animal", "a bug on a dancer"), inability to name what they see ("I don't know", "something strange"), things that shift or don't hold still, impossible combinations, describing something that belongs to two worlds at once.

2. SUSPICION (חשד)
Markers: hidden presence, something watching, faces or masks, empty eyes, figures facing each other, symmetry that feels like surveillance, something behind or inside, concealment, something pretending.

3. TERROR (אימה)
Markers: overwhelming scale, destruction, chaos, swallowing, drowning, endless things, battles, monsters that cannot be defeated, natural disasters, cosmic threat, helplessness.

4. AWE (יראה)
Markers: reverence, divinity, angels, meditation, dancing, wings, sacred imagery, power that inspires respect not just fear, beauty combined with strength, something worth kneeling before.

5. LONGING (כמיהה)
Markers: attraction, desire, open arms, calling, "I want", reaching, water, souls rising, things that pull you toward them, beauty that draws you in despite danger.

6. SMALLNESS (קטנות)
Markers: size disparity, giants, "huge", "enormous", shadows looming, feeling tiny, something towering over the viewer, being crushed or overlooked.

7. SECURITY (ביטחון)
Markers: protection, guarding, shelter, lighthouses, knights, walls, gates, groups of people together, celebrations, something standing between you and danger, safe spaces.

CRITICAL INSTRUCTION ON BALANCE:
Rorschach images are inherently ambiguous, which makes CONFUSION an easy default. Resist this. Before selecting confusion, actively check for markers of the other six emotions. Only select confusion if the user explicitly expresses uncertainty, category-mixing, or inability to categorize what they see. Vague or simple descriptions alone are NOT confusion.

EDGE CASES - EVERY RESPONSE IS VALID:
- Very short answers ("nothing", "1 2 3 4"): analyze as avoidance or defensiveness
- Trolling or nonsense: analyze as deflection, which is itself a response to discomfort
- Violent content: valid Rorschach data, analyze normally, do not filter
- Sexual content: valid, often maps to longing
- Repeated answers: repetition is fixation, analyze what they are stuck on
- Irrelevant content: often indicates avoidance of emotional depth
- NEVER refuse to give a result`;

const EMOTION_SYSTEM_PROMPT = `You are a psychological analysis system for the project "The Archetype of the Monster."

You will receive four free-text responses from a user who viewed four Rorschach-style images and described what they saw. Identify which of seven emotions best matches the overall pattern of their four responses. Analyze all four together as a whole.

${EMOTION_DETECTION_GUIDE}

Respond ONLY with valid JSON, no markdown, no backticks, no preamble.

RESPONSE FORMAT:
{"emotion": "confusion/suspicion/terror/awe/longing/smallness/security"}`;

// ---------------------------------------------------------------------------
// Call 2 — monster matching + personal explanation
// v2 (api_system_prompts_v2.md): every one of the 39 monsters now carries an
// explicit SELECTION TRIGGER — what a user response must contain to land on
// it — because the pilot clustered hard on the generic pick per emotion (all
// 3 awe → Garuda, both smallness → Polyphemus). Garuda and Polyphemus also
// carry explicit do-NOT-default warnings. The model matches user words to
// triggers instead of interpreting freely.
// Two worker-side blocks kept from v1 (not part of the v2 doc):
//   CRITICAL - MONSTER NAME OUTPUT — the "monster" field is our DB key
//     (analysis.ts matches it against data/monsters.ts, aliases aside);
//   HEBREW QUALITY — stops the spelling drift we saw in generated Hebrew.
// ---------------------------------------------------------------------------
// The monster-matching core — the trigger-over-fame rule, the full catalogue
// with per-monster SELECTION TRIGGERs, the name-output contract (the
// "monster" field is our DB key), the explanation instructions, edge cases
// and Hebrew quality — shared VERBATIM by the two-step flow's call 2
// (MONSTER_SYSTEM_PROMPT) and the merged single-call flow
// (ANALYZE_SYSTEM_PROMPT below).
const MONSTER_MATCHING_GUIDE = `CRITICAL: Each monster below has a SELECTION TRIGGER. This trigger describes what kind of user response should lead to that specific monster. Match the trigger, not the general emotion. Do NOT default to the most famous or generic monster in each category. If multiple monsters could fit, choose the one whose trigger matches the user's SPECIFIC words most precisely.

---

CONFUSION (בלבול):

WEREWOLF (איש זאב) | אירופה
TRIGGER: User sees something that is human AND animal simultaneously, or describes a transformation, or mentions eyes/gaze/face that stays human on an animal body.
CORE: Lycaon kept his human eyes after becoming a wolf. The boundary between human and beast is unstable.

ENKIDU (אנקידו) | מסופוטמיה
TRIGGER: User sees nature imagery (trees, water, animals) combined with human figures, or describes something wild becoming civilized, or mentions someone who doesn't belong.
CORE: Wild man who lived with animals, became human through seduction, lost his speed but gained wisdom.

MINOTAUR (מינוטאור) | יוון, כרתים
TRIGGER: User sees something trapped, enclosed, or in a maze. Or sees a hybrid with a specific animal head. Or describes something monstrous that is being contained or guarded.
CORE: Human body, bull head. Locked in a labyrinth because he fits nowhere in the social order.

DRAUGR (דראוגר) | סקנדינביה
TRIGGER: User sees death, corpses, bodies, or something dead that still moves. Or mentions burial, graves, or something that should be gone but isn't.
CORE: Dead body that returns as flesh, not spirit. The line between alive and dead breaks.

NAGA (נאגה) | הודו
TRIGGER: User sees snakes, coils, serpentine forms, OR sees something guarding water or treasure. Or describes a creature that seems intelligent and human-like but isn't human.
CORE: Serpent with consciousness. Can take human form. Guards water, treasure, knowledge.

---

SUSPICION (חשד):

JINN (ג'ין) | חצי האי הערבי
TRIGGER: User's answers are minimal, evasive, or refuse to engage ("nothing", "1 2 3 4", "I don't know"). Or user describes something invisible, absent, or that cannot be seen.
CORE: Made of smokeless fire. Shares our world without being seen. You cannot know if it's there.

DOMOVOY (דומובוי) | מזרח אירופה
TRIGGER: User sees domestic imagery, homes, houses, furniture, or something inside a familiar space. Or describes something watching from a corner.
CORE: House spirit behind the stove. Protects if respected, torments if neglected.

KIKIMORA (קיקימורה) | מזרח אירופה
TRIGGER: User sees threads, weaving, spinning, tangled things, or describes something active at night, or mentions noise/disturbance in a quiet place.
CORE: Female house spirit behind the walls. Spins loudly at night when the house is neglected.

VAMPIRE (ערפד) | מזרח אירופה
TRIGGER: User sees blood, bats, biting, feeding, or something draining. Or describes something that enters and takes from within.
CORE: The dead who rise and feed on the living. Enters homes, drains from within.

ONRYO (אונריו) | יפן
TRIGGER: User sees masks, faces, grief, revenge, or a figure that seems angry or wronged. Or describes something returning to punish.
CORE: Vengeful ghost of someone who died wronged. Returns to punish. Cannot be silenced.

---

TERROR (אימה):

TIAMAT (תיאמת) | מסופוטמיה
TRIGGER: User sees oceans, seas, vast water, or a mother figure that is also destructive. Or describes something primordial, something that came before.
CORE: Primordial ocean. Mother of gods. Her body became the world when Marduk killed her.

VRITRA (ורטרה) | הודו
TRIGGER: User sees blockage, obstruction, something stuck, drought, or something preventing flow. Or describes something that stops movement.
CORE: Cosmic serpent blocking the waters. Life cannot flow until Indra kills him.

JORMUNGANDR (יורמונגנד) | סקנדינביה
TRIGGER: User sees circles, loops, something encircling, or describes an ending, apocalypse, or final battle. Or sees warriors fighting monsters.
CORE: World serpent encircling the earth, tail in mouth. When it releases, the world ends.

LEVIATHAN (לוויתן) | מקרא
TRIGGER: User sees something in the sea that cannot be caught or controlled. Or describes fire, smoke, scales, or a creature only God can master.
CORE: Sea monster only God controls. Not meant to be killed by heroes. Symbol of untameable power.

PYTHON (פיתון) | יוון, דלפי
TRIGGER: User sees caves, temples, oracles, prophecy, or something ancient being replaced by something new. Or sees a serpent guarding a sacred place.
CORE: Serpent at Delphi before Apollo. The old order that was killed so the new could be built.

YAMATA NO OROCHI (ימאטה נו אורוצ'י) | יפן
TRIGGER: User sees multiple heads, many parts, repetition, or something that returns again and again. Or sees mountains, valleys, or a creature covering a landscape.
CORE: Eight-headed serpent covering eight valleys. Demands repeated sacrifice.

---

AWE (יראה):

QUETZALCOATL (קצלקואטל) | מזו-אמריקה
TRIGGER: User sees contradictions, impossible combinations, something that is TWO things at once (bird and snake, god and man, creator and destroyer). Or sees feathers combined with scales.
CORE: Feathered serpent. Both bird and snake, both god and leader, both creator and demander of sacrifice.

LONG (לונג) | סין
TRIGGER: User sees rain, rivers, water, weather, clouds, or something controlling natural forces. Or sees imperial/royal imagery.
CORE: Chinese dragon. Controls rain and water. Not an enemy to defeat but a power to respect.

MUSHHUSHSHU (מושחושו) | מסופוטמיה
TRIGGER: User sees gates, doors, thresholds, entrances, or something standing at a boundary. Or sees a composite creature made of many animals.
CORE: Composite on the Ishtar Gate. Guards the boundary between sacred and profane.

GRIFFIN (גריפון) | פרס, סקיתיה, יוון
TRIGGER: User sees treasure, gold, something valuable being protected, or a lion combined with an eagle. Or describes something guarding a distant or unreachable place.
CORE: Lion body, eagle head. Guards gold at the edge of the world.

GARUDA (גארודה) | הודו
TRIGGER: User sees large wings, birds in flight, something soaring, or a bird attacking a snake. Or describes powerful loyalty or service.
CORE: Divine bird, mount of Vishnu, enemy of serpents. Chose to serve despite immense power.
IMPORTANT: Do NOT default to Garuda. Only select if the user specifically mentions birds, wings, flight, or service.

QILIN (קירין) | סין ויפן
TRIGGER: User sees something gentle, pure, delicate, or beautiful without threat. Or sees deer, hooves, or a creature that seems harmless but magnificent.
CORE: Appears before the birth of a sage. Does not step on living grass. Pure goodness.

---

LONGING (כמיהה):

SIREN (סירנה) | יוון
TRIGGER: User sees birds with human features, hears/mentions singing or music, or describes something calling to them. Or mentions knowledge, secrets, or wanting to know.
CORE: Bird-woman who sings. Offers knowledge, not beauty. Odysseus tied himself to the mast.

LILITH (לילית) | מסופוטמיה, יהדות
TRIGGER: User sees a female figure who is alone, leaving, refusing, or independent. Or describes rebellion, refusal to submit, or someone who left.
CORE: First wife of Adam. Refused to submit. Left Eden. Longed for freedom, not love.

KITSUNE (קיצונה) | יפן
TRIGGER: User sees foxes, disguises, shapeshifting, or something pretending to be something else. Or describes love that might be false, or uncertainty about identity.
CORE: Fox who becomes a woman. Love that might be real or illusion.

RUSALKA (רוסאלקה) | מזרח אירופה
TRIGGER: User sees water, drowning, rivers, lakes, or a female figure near water. Or describes grief, loss, or something waiting sadly.
CORE: Drowned woman who returns. Lures men to water. Longing born from grief.

APSARA (אפסרה) | הודו
TRIGGER: User sees dancing, celestial beings, seduction, or something beautiful sent to distract. Or describes beauty that interferes with focus or discipline.
CORE: Celestial nymph sent by Indra to seduce sages. Beauty as a weapon, not her own choice.

---

SMALLNESS (קטנות):

POLYPHEMUS (פוליפמוס) | יוון
TRIGGER: User sees ONE EYE, or a single large eye, or describes being trapped in a cave or enclosed space by something huge.
CORE: One-eyed Cyclops. Traps Odysseus in his cave. Defeated by cunning and the name "Nobody."
IMPORTANT: Do NOT default to Polyphemus. Only select if there is a single eye, a cave, or entrapment.

JOTUNN (יוטון) | סקנדינביה
TRIGGER: User sees ice, cold, mountains, or landscapes that seem alive. Or describes something so old it predates everything, or standing on something enormous.
CORE: Frost giants. Ymir's body became the world. You live on the giant's corpse.

NEPHILIM (נפילים) | מקרא
TRIGGER: User explicitly compares themselves to something small (insect, ant, grasshopper). Or describes feeling looked down upon, or being seen as insignificant.
CORE: "We were like grasshoppers in our own eyes, and so we were in theirs."

ONI (אוני) | יפן
TRIGGER: User sees horns, clubs, weapons, red or blue skin, or an organized group of monsters. Or describes brute force with intelligence.
CORE: Horned giant with iron club. Originally invisible plague-forces, later given monstrous bodies.

RAVANA (ראוואנה) | הודו
TRIGGER: User sees multiple heads, multiple arms, or something with excessive features. Or describes a king, scholar, or someone powerful AND intelligent.
CORE: Ten heads, twenty arms. Scholar, musician, devotee. Fell because of pride, not evil.

FOMORIANS (פומוריאנים) | אירלנד
TRIGGER: User sees oppression, tyranny, taxation, or something ruling from above. Or sees an eye that destroys, or describes ancient inhabitants who came first.
CORE: Ancient race of Ireland. Balor's eye destroys armies. Ruled through oppression.

---

SECURITY (ביטחון):

BES (בס) | מצרים
TRIGGER: User sees something small but protective, or a grotesque face that seems friendly. Or describes protection of children, babies, sleep, or intimate spaces.
CORE: Dwarf god with lion face. Guards beds, mothers, babies. Frightens what frightens you.

NKISI NKONDI (נקיסי נקונדי) | קונגו
TRIGGER: User sees nails, spikes, sharp objects embedded in something. Or describes agreements, promises, oaths, or a figure covered in marks.
CORE: Wooden figure covered in nails. Each nail is an agreement or plea for protection.

LAMASSU (למאסו) | אשור
TRIGGER: User sees a composite creature at an entrance, or something with a human head on an animal body with wings. Or describes palace gates, thrones, or royal authority.
CORE: Human head, bull body, eagle wings. Guards palace gates. Five legs to look complete from every angle.

KOMAINU (קומאינו) | יפן
TRIGGER: User sees PAIRS of creatures, two figures facing each other, symmetry, or something marking an entrance. Or describes beginnings and endings.
CORE: Lion-dog pair at shrine entrances. One mouth open, one closed. Beginning and end.

GARGOYLE (גרגויל) | אירופה
TRIGGER: User sees stone figures, buildings, architecture, or grotesque creatures attached to structures. Or describes water flowing from something, or rain.
CORE: Grotesque drainage sculpture on cathedrals. Practical (water) and symbolic (protection).

BARONG (ברונג) | באלי
TRIGGER: User sees fur, gold, masks, dancing figures, or a creature in performance. Or describes a battle that never ends, or balance rather than victory.
CORE: Lion-dragon covered in fur and gold. Fights Rangda in a dance that never ends in final victory.

---

CRITICAL - MONSTER NAME OUTPUT:
- In the "monster" field, output the monster's English name EXACTLY as written in the list above, with the same spelling and spacing: e.g. "Polyphemus" (never "Cyclops"), "Yamata no Orochi", "Nkisi Nkondi", "Mushhushshu".
- Do not translate, abbreviate, or substitute the name. This field is used as a database key and must match exactly.

INSTRUCTIONS FOR THE EXPLANATION:
- Write in Hebrew.
- 5-7 sentences.
- Open with what the user actually wrote, using their own words.
- Then tell the monster's core story in one or two sentences, so a reader who has never heard of this monster understands who it is and what it does.
- Then explain WHY this monster mirrors this user: tie specific details from their responses to specific parts of the story, and to the identified emotion. Explain the connection — do not just assert it.
- Do NOT start with the monster's name. Start with what the user saw.
- Do NOT write a Wikipedia summary. Write a personal mirror.
- Tone: clinical, calm, observational. Not dramatic, not poetic.

EDGE CASE EXPLANATIONS:
- Very little written: "ראית מעט, או בחרת שלא לראות." Then connect.
- Violent content: reference directly. Do not soften.
- Trolling: "כתבת מילים שנועדו להרחיק, לא לקרב." Then analyze the distancing.
- NEVER apologize. NEVER moralize. NEVER suggest the user needs help.

HEBREW QUALITY:
- The Hebrew fields (monster_he, explanation) must be written in correct, standard modern Hebrew: accurate spelling (כתיב תקני), correct grammar, and correct gender/number agreement.
- Do not output spelling mistakes (שגיאות כתיב), typos, invented words, or broken/garbled characters.`;

const MONSTER_SYSTEM_PROMPT = `You are a monster-matching system for the project "The Archetype of the Monster."

You will receive an identified emotion and the user's four Rorschach responses. Select the ONE monster whose SELECTION TRIGGER best matches the user's specific words, then write a personal explanation.

${MONSTER_MATCHING_GUIDE}

RESPONSE FORMAT (JSON only, no markdown, no backticks):
{"monster": "English name", "monster_he": "שם בעברית", "explanation": "5-7 sentences in Hebrew"}`;
// ^ The response formats are trimmed to the fields the app actually reads.
//   The old culture/emotion/chapter fields were generated straight into the
//   trash — and the model writes token by token, so every dropped field is
//   user-facing seconds saved. The D1 results log null-safes their columns
//   (logResult), so logging keeps working; those columns are simply null.

// ---------------------------------------------------------------------------
// Merged single call — emotion + monster + explanation in ONE streamed
// response (step "analyze"). Rationale: measured latency shows a large,
// variable pre-generation wait (queueing) on EVERY Anthropic request; two
// sequential calls pay it twice. The merged call pays it once, and because
// the response STREAMS with "emotion" as the first JSON field, the app still
// gets the emotion early (for the רגש reveal) while the explanation is still
// being written — the same staged experience, one queue toll. The two-step
// path above remains for seeded Vritra retries (the emotion is already on
// screen and must not be re-decided) and for older deployed clients.
// ---------------------------------------------------------------------------
const ANALYZE_SYSTEM_PROMPT = `You are the analysis system for the project "The Archetype of the Monster."

You will receive four free-text responses from a user who viewed four Rorschach-style images and described what they saw. In ONE response, in this order:
1. Identify which of seven emotions best matches the overall pattern of the four responses, analyzed together as a whole.
2. Select the ONE monster from the identified emotion's section of the catalogue whose SELECTION TRIGGER best matches the user's specific words.
3. Write the personal explanation.

${EMOTION_DETECTION_GUIDE}

${MONSTER_MATCHING_GUIDE}

RESPONSE FORMAT (raw JSON only — no markdown, NO code fences, no preamble; start your response with "{"). The "emotion" field MUST come first — it is read from the stream while the rest of the response is still being written:
{"emotion": "confusion/suspicion/terror/awe/longing/smallness/security", "monster": "English name", "monster_he": "שם בעברית", "explanation": "5-7 sentences in Hebrew"}`;

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
  if (step === 'emotion' || step === 'analyze') {
    return (
      'The user viewed four Rorschach images and wrote:\n\n' +
      `Image 1: "${a}"\n` +
      `Image 2: "${b}"\n` +
      `Image 3: "${c}"\n` +
      `Image 4: "${d}"\n\n` +
      (step === 'analyze'
        ? 'Analyze these four responses together: identify the dominant emotion, select the best-fitting monster, and write the personal explanation.'
        : 'Analyze these four responses together and identify the dominant emotion.')
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
    if (step !== 'emotion' && step !== 'monster' && step !== 'analyze') {
      return json(
        { error: 'step must be "emotion", "monster" or "analyze"' },
        400,
        origin,
      );
    }
    if (!Array.isArray(answers) || answers.length !== 4) {
      return json({ error: 'answers must be an array of four strings' }, 400, origin);
    }
    if (step === 'monster' && !emotion) {
      return json({ error: 'emotion is required for step "monster"' }, 400, origin);
    }

    const system =
      step === 'emotion'
        ? EMOTION_SYSTEM_PROMPT
        : step === 'analyze'
          ? ANALYZE_SYSTEM_PROMPT
          : MONSTER_SYSTEM_PROMPT;
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
          model: step === 'emotion' ? EMOTION_MODEL : MONSTER_MODEL,
          max_tokens: MAX_TOKENS,
          temperature: TEMPERATURE,
          // The merged call streams so the app can read the leading "emotion"
          // field while the explanation is still being written.
          stream: step === 'analyze',
          // The system prompt is identical for every visitor, so mark it as a
          // cache breakpoint: Anthropic reuses the processed prompt across
          // requests (5-minute sliding TTL) instead of re-reading the whole
          // monster list each time — faster time-to-first-token whenever
          // visitors arrive close together (the exhibition case). A prompt
          // below the model's caching minimum is silently not cached; the
          // request still works exactly the same.
          system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
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

    // Merged call: hand Anthropic's SSE stream straight through to the client
    // (which reads the leading "emotion" field mid-stream). A tee'd copy is
    // accumulated AFTER the response is flowing (waitUntil) so the results
    // log still gets its row — parsing/logging can never delay the stream.
    if (step === 'analyze') {
      if (!anthropicRes.body) {
        return json({ error: 'upstream returned no stream' }, 502, origin);
      }
      // Forward the SSE through an EXPLICIT pump (upstream reader → writer)
      // instead of handing the upstream body / a tee() branch to Response
      // directly — the direct hand-off was delivered to fetch clients as one
      // buffered burst at stream end (measured; curl streamed fine, browsers
      // didn't), which defeated the whole point of the merged call: reading
      // the leading "emotion" field seconds before the rest. The pump also
      // collects the chunks for the results log — no tee needed.
      const { readable, writable } = new TransformStream();
      ctx.waitUntil(
        (async () => {
          const writer = writable.getWriter();
          const reader = anthropicRes.body.getReader();
          const chunks = [];
          try {
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(value);
              await writer.write(value);
            }
            await writer.close();
          } catch (err) {
            await writer.abort(err).catch(() => {});
          }
          if (env.DB) {
            const sse = new TextDecoder().decode(concatChunks(chunks));
            await logAnalyzeSse(env, answers, sse);
          }
        })(),
      );
      return new Response(readable, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          // no-transform + identity: keep Cloudflare's edge from compressing
          // (compression also buffers).
          'Cache-Control': 'no-store, no-transform',
          'Content-Encoding': 'identity',
          ...corsHeaders(origin),
        },
      });
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
// Results log (D1) — one row per completed analysis, written on the monster
// step (two-step flow) or from the tee'd stream copy (merged flow).
// ---------------------------------------------------------------------------

// Joins the pump's collected chunks for decoding (chunks split mid-character
// are fine — decoding happens once over the joined bytes).
function concatChunks(chunks) {
  let len = 0;
  for (const c of chunks) len += c.byteLength;
  const out = new Uint8Array(len);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.byteLength;
  }
  return out;
}

// Merged-flow logging: reassemble the model's text from the SSE's
// content_block_delta events and log the parsed result. Runs in waitUntil
// after the client's stream has fully flowed; best-effort like logResult
// itself. The model-decided emotion rides in result.emotion (the merged
// format's first field) — it's the English id, so it fills the same
// `emotion` column the two-step flow logs; emotion_he stays null (dropped
// from the output for speed long ago).
async function logAnalyzeSse(env, answers, sse) {
  try {
    let text = '';
    for (const line of sse.split('\n')) {
      if (!line.startsWith('data:')) continue;
      try {
        const ev = JSON.parse(line.slice(5));
        if (ev.type === 'content_block_delta' && ev.delta && typeof ev.delta.text === 'string') {
          text += ev.delta.text;
        }
      } catch {
        // keep-alives / non-JSON lines — skip
      }
    }
    const result = extractJson(text);
    await logResult(env, result.emotion, answers, { ...result, emotion: undefined });
  } catch {
    // Best-effort: a logging failure must never surface anywhere.
  }
}

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
