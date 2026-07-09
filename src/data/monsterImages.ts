// Per-monster reference images for the inner page gallery. Drop files into
// `src/monster-images/<monster-id>/` (e.g. src/monster-images/minotaur/) and
// they appear automatically, sorted by filename — no code change needed.
//
// import.meta.glob is resolved at build time, so new files are picked up on the
// next dev reload / build.
const modules = import.meta.glob(
  '../monster-images/**/*.{jpg,jpeg,png,webp,gif,avif,svg}',
  { eager: true, query: '?url', import: 'default' },
);

export interface MonsterImage {
  /** Resolved URL (Vite-hashed in build, dev server path in dev). */
  src: string;
  /** Caption shown in the lightbox, derived from the filename (or curated). */
  title: string;
}

// ---------------------------------------------------------------------------
// Caption derivation
//
// The source files come from Wikimedia/museum exports, so the raw filenames
// carry predictable noise: the creator field doubled ("Edvard Munch Edvard
// Munch…"), trailing/embedded accession codes ("… MET DP252320", "… 19895139"),
// zero-padded page indices ("… 001"), and photo-tool tokens ("IMG_1234",
// "…_cropped"). `captionFromFilename` strips all of that mechanically so most
// captions read as "Artist, Title, date" with no per-file work.
//
// A handful can't be fixed by rule — filenames the exporter truncated mid-word,
// or ones that reduce to a bare code with no words. Those get a hand-written
// entry in CAPTIONS below, which wins over the derived text.
// ---------------------------------------------------------------------------

// A "code" token: a museum accession id, not a real word or a plain year.
// Kept: 1–4 digit numbers (years, "Room 42", "100 Aspects"). Dropped: DP252320,
// V0045104, M71769, B20099105, 19895139, 197921b, and any 5+ digit run.
function isCode(tok: string): boolean {
  if (/^\d{1,4}$/.test(tok)) return false;
  if (/^[A-Za-z]{0,4}\d{2,}[A-Za-z]?$/.test(tok)) return true;
  if (/^\d{5,}$/.test(tok)) return true;
  return false;
}

// Collapse an immediately-repeated run of 1–4 tokens (the doubled creator field:
// "James McNeill Whistler James McNeill Whistler" → "James McNeill Whistler").
function dedupAdjacentPhrases(tokens: string[]): string[] {
  let changed = true;
  while (changed) {
    changed = false;
    for (let k = 4; k >= 1 && !changed; k--) {
      for (let i = 0; i + 2 * k <= tokens.length; i++) {
        const a = tokens.slice(i, i + k).map((x) => x.toLowerCase()).join(' ');
        const b = tokens.slice(i + k, i + 2 * k).map((x) => x.toLowerCase()).join(' ');
        if (a && a === b) {
          tokens.splice(i, k);
          changed = true;
          break;
        }
      }
    }
  }
  return tokens;
}

const MUSEUM_ABBR = new Set([
  'MET', 'Met', 'DP', 'LACMA', 'Walters', 'Wellcome', 'BM', 'AO', 'DT', 'MNK', 'MAS', 'WGA',
]);
const PHOTO_JUNK = new Set(['Profile', 'cropped', 'gradient', 'scan', 'black']);
const isIndex = (tok: string) => /^0*\d{1,3}$/.test(tok); // 1–3 digits, incl. zero-padded (001)

export function captionFromFilename(pathOrFile: string): string {
  const file = pathOrFile.split('/').pop() ?? pathOrFile;
  const base = file
    .replace(/\.[^.]+$/, '') // extension
    .replace(/[-_]+/g, ' ') // separators → spaces
    .replace(/\s+/g, ' ')
    .trim();

  // Un-glue "<lower>Unknown" (Wikimedia glues the creator field: "authorUnknown",
  // "ChinaUnknown", "EastUnknown") so the dedup below can see the repeat.
  let s = base.replace(/([a-z])Unknown\b/g, '$1 Unknown');

  let t = s.split(' ').filter(Boolean);

  // Drop photo-tool tokens and museum accession codes anywhere in the string.
  for (let i = 0; i < t.length; i++) {
    if (/^(IMG|DSC)$/i.test(t[i])) {
      if (t[i + 1] && /^\d+$/.test(t[i + 1])) t[i + 1] = '';
      t[i] = '';
    }
    if (/^(cropped|gradient)$/i.test(t[i])) t[i] = '';
    if (isCode(t[i])) t[i] = '';
  }
  t = t.filter(Boolean);

  t = dedupAdjacentPhrases(t);

  // Strip trailing museum name / photo-junk / bare index left dangling by the above.
  while (t.length) {
    const last = t[t.length - 1];
    if (MUSEUM_ABBR.has(last) || PHOTO_JUNK.has(last) || isIndex(last)) t.pop();
    else break;
  }

  s = t.join(' ');
  // "<Name> … by <same Name>" → drop the redundant trailing "by <Name>".
  s = s.replace(/^(\S+(?: \S+){0,3}) (.*) by \1$/i, '$1 $2');
  s = s.replace(/\s+\d+$/, '').replace(/\s+/g, ' ').trim();

  // Never return something with no real words: fall back to the naive humanized
  // filename so a caption is never blank (curated CAPTIONS cover these anyway).
  const letters = (s.match(/[A-Za-zÀ-ɏ֐-׿一-鿿]/g) || []).length;
  if (letters <= 1) return base.replace(/\s+\d+$/, '').trim() || base;
  return s;
}

// Hand-curated captions for files the rules can't rescue (truncated mid-word, or
// reduced to a bare accession code). Keyed by exact filename; wins over the
// derived caption. Filled in batches — see the caption-cleanup task.
const CAPTIONS: Record<string, string> = {
  " .jpg": "Theodor Kittelsen, The Draug (Draugen), Norwegian, c. 1890s",
  "19th-century-artists-working-in-Pompeii-Mosaic-depicting-Theseus-fighting-the-Minotaur-from-Room-42-the-House-of-the-Lab.jpg": "Mosaic depicting Theseus fighting the Minotaur, from the House of the Labyrinth (Room 42), Pompeii",
  "59 (681).jpg": "Illustration for J. Sheridan Le Fanu's 'Carmilla' by David Henry Friston, 1872",
  "Abu-al-Abbas-Amad-ibn-Abi-Abd-Allah-Muammad-ibn-Amad-al-Misri-14th-cent-Jafar-al-Sadiq-702-765-or-6-Irbili-iya-al-Din-us.png": "Illustrated Arabic manuscript on the occult sciences, 14th century (attributed to Jaʿfar al-Sadiq)",
  "Anonymous-Near-EastUnknown-author-Near-Eastern-Cylinder-Seal-with-Enkidu-Vanquishing-the-Bull-of-Heaven-Walters-42786-Si.jpg": "Near Eastern cylinder seal: Enkidu vanquishing the Bull of Heaven — Walters Art Museum",
  "Anonymous-Near-EastUnknown-author-Near-Eastern-Cylinder-Seal-with-Enkidu-Vanquishing-the-Bull-of-Heaven-Walters-42786-Si_1.jpg": "Near Eastern cylinder seal: Enkidu vanquishing the Bull of Heaven — Walters Art Museum",
  "Anonymous-Near-EastUnknown-author-Near-Eastern-Cylinder-Seal-with-Enkidu-Vanquishing-the-Bull-of-Heaven-Walters-42786-Si_2.jpg": "Near Eastern cylinder seal: Enkidu vanquishing the Bull of Heaven — Walters Art Museum",
  "Anonymous-Near-EastUnknown-author-Near-Eastern-Cylinder-Seal-with-Enkidu-Vanquishing-the-Bull-of-Heaven-Walters-42786-Si_3.jpg": "Near Eastern cylinder seal: Enkidu vanquishing the Bull of Heaven — Walters Art Museum",
  "Anonymous-Near-EastUnknown-author-Near-Eastern-Cylinder-Seal-with-Enkidu-Vanquishing-the-Bull-of-Heaven-Walters-42786-Si_4.jpg": "Near Eastern cylinder seal: Enkidu vanquishing the Bull of Heaven — Walters Art Museum",
  "Anonymous-Near-EastUnknown-author-Near-Eastern-Cylinder-Seal-with-Enkidu-Vanquishing-the-Bull-of-Heaven-Walters-42786-Si_5.jpg": "Near Eastern cylinder seal: Enkidu vanquishing the Bull of Heaven — Walters Art Museum",
  "Anonymous-Near-EastUnknown-author-Near-Eastern-Cylinder-Seal-with-Enkidu-Vanquishing-the-Bull-of-Heaven-Walters-42786-Si_6.jpg": "Near Eastern cylinder seal: Enkidu vanquishing the Bull of Heaven — Walters Art Museum",
  "Anonymous-Near-EastUnknown-author-Near-Eastern-Cylinder-Seal-with-Enkidu-Vanquishing-the-Bull-of-Heaven-Walters-42786-To.jpg": "Near Eastern cylinder seal: Enkidu vanquishing the Bull of Heaven — Walters Art Museum",
  "Antimenes-Painter-Greek-Attic-active-c-530-510-BCE-Black-Figure-Hydria-Water-Vessel-Frontal-Quadriga-Body-Theseus-and-Mi.jpg": "Antimenes Painter, black-figure hydria with Theseus and the Minotaur, Greek (Attic), c. 530–510 BCE",
  "Artist-is-Lee-Lawrie-1877-1963-Photographed-2007-by-Carol-Highsmith-1946-who-explicitly-placed-the-photograph-in-the-pub.jpg": "Quetzalcoatl, architectural sculpture by Lee Lawrie (1877–1963)",
  "Battle-of-Ravana-and-Jatayu-from-Chapters-50-and-51-of-the-Aranya-Kanda-Book-of-the-Forest-of-Valmikis-Ramayana-Ramas-Jo.jpg": "The Battle of Ravana and Jatayu, from the Aranya Kanda (Book of the Forest) of Valmiki's Ramayana",
  "DT880.jpg": "Human-headed winged lion (lamassu), Neo-Assyrian, ca. 883–859 BC, from Nimrud — The Metropolitan Museum of Art",
  "Daderot-Apsarases-1-of-5-China-Northern-or-Eastern-Wei-dynasty-500-550-AD-gilt-bronze-Arthur-M-Sackler-Museum-Harvard-Un.jpg": "Apsarases, China, Northern or Eastern Wei dynasty, 500–550 AD, gilt bronze — Arthur M. Sackler Museum, Harvard",
  "Daderot-Kesi-fragment-with-dragon-design-on-purple-ground-China-Yuan-dynasty-1200s-1300s-AD-textile-Tokyo-National-Museu.jpg": "Kesi (silk tapestry) fragment with dragon design on a purple ground, China, Yuan dynasty (1200s–1300s AD) — Tokyo National Museum",
  "Daderot-Namanari-type-noh-mask-Edo-period-1700s-1800s-AD-wood-polychromy-Tokyo-National-Museum-Ueno-Park-Tokyo-Japan-DSC.jpg": "Namanari-type Noh mask, Edo period (1700s–1800s AD), wood with polychromy — Tokyo National Museum",
  "Fazl-Indian-Indian-Mughal-dynasty-Arjuna-fells-Ravana-with-his-mace-and-advances-to-capture-him-with-his-thousand-arms.jpg": "Kartavirya Arjuna fells Ravana with his mace and captures him with his thousand arms, Mughal dynasty",
  "Gary-Todd-from-Xinzheng-China-Ancient-Greece-Pentelic-Marble-Funerary-Statue-of-a-Siren-370-BC-Found-Next-to-Stele-of-At.jpg": "Funerary statue of a Siren, Ancient Greece, Pentelic marble, c. 370 BC",
  "Gilles-Paul-Cauvet-Design-for-a-Decorative-Panel-with-Two-Sirens-Holding-a-Vase-Embellished-with-Dolphins-and-other-Deco.jpg": "Gilles-Paul Cauvet, Design for a Decorative Panel with Two Sirens Holding a Vase Embellished with Dolphins",
  "Giovanni-Antonio-da-Brescia-Italian-c-1460-1523-Griffins-and-Two-Cupids-Crossing-Halberds-plate-five-of-Twelve-Ornament-.jpg": "Giovanni Antonio da Brescia, Griffins and Two Cupids Crossing Halberds (plate 5 of Twelve Ornament Panels), Italian, c. 1460–1523",
  "Giovanni-DallOrto-9896-Ulysses-and-Polyphemos-2nd-century-AD-Catania-Castello-Ursino-Photo-by-Giovanni-DallOrto-October-.jpg": "Ulysses and Polyphemos, Roman, 2nd century AD — Castello Ursino, Catania",
  "India-Madhya-Pradesh-Door-Lintel-with-God-Vishnu-on-His-Mount-Garuda-Flanked-by-the-Nine-Planetary-Deities-Navagraha.jpg": "Door lintel with Vishnu on his mount Garuda, flanked by the Nine Planetary Deities (Navagraha), Madhya Pradesh, India",
  "John-William-Taverner-English-1703-1772-Polyphemus-Throwing-Boulder-at-Acis-with-Galatea-recto-and-Pholyphemus-Lifting-B_2.jpg": "John William Taverner, Polyphemus Throwing a Boulder at Acis, with Galatea, English, 1703–1772",
  "Katsukawa-Shunko-I-Japanese-1743-1812-The-Actor-Iwai-Hanshiro-IV-as-Kitsune-ga-Saki-Otama-in-the-Play-Miyakodori-Yayoi-n.jpg": "Katsukawa Shunko I, The Actor Iwai Hanshiro IV as the fox-woman Otama in 'Miyakodori Yayoi no Nishiki', Japanese, 1743–1812",
  "MET-DP12019.jpg": "Silk textile with confronting dragons amid clouds, China — The Metropolitan Museum of Art",
  "MET-DP227291.jpg": "Rank badge (buzi) with a qilin, China, Qing dynasty — The Metropolitan Museum of Art",
  "Mary-Harrsch-from-Springfield-Oregon-USA-A-musussu-the-sacred-animal-of-the-Mesopotamian-god-Marduk-on-the-Ishtar-Gate-o.jpg": "The mushhushu, sacred animal of the Mesopotamian god Marduk, on the Ishtar Gate of Babylon",
  "Osama-Shukir-Muhammed-Amin-FRCPGlasg-A-pair-of-lamassus-from-the-Throne-Room-Room-B-of-the-North-West-Palace-at-Nimrud-I.jpg": "A pair of lamassus from the Throne Room (Room B) of the North-West Palace at Nimrud, Iraq",
  "Osama-Shukir-Muhammed-Amin-FRCPGlasg-Head-of-a-lamassu-from-the-palace-of-Esarhaddon-from-Nimrud-Iraq-7th-century-BC-The.jpg": "Head of a lamassu from the palace of Esarhaddon, Nimrud, Iraq, 7th century BC",
  "Osama-Shukir-Muhammed-Amin-FRCPGlasg-Head-of-lamassu-Marble-8th-century-BCE-from-Assur-Iraq-Ancient-Orient-Museum-Istanb.jpg": "Head of a lamassu, marble, 8th century BCE, from Assur, Iraq — Ancient Orient Museum, Istanbul",
  "Osama-Shukir-Muhammed-Amin-FRCPGlasg-Lamassu-from-the-Throne-Room-Room-B-of-the-North-West-Palace-at-Nimrud-Iraq-9th-cen.jpg": "Lamassu from the Throne Room (Room B) of the North-West Palace at Nimrud, Iraq, 9th century BC",
  "Osama-Shukir-Muhammed-Amin-FRCPGlasg-Non-glazed-clay-brick-from-the-Ishtar-Gate-at-Babylon-Iraq-Relief-of-a-head-of-a-dr.jpg": "Unglazed clay brick from the Ishtar Gate at Babylon, Iraq: relief of the head of a mushhushu-dragon",
  "Pobably-Felice-Giani-Italian-1758-1823-or-possibly-Fortunato-Durati-Italian-1787-1863-or-possibly-Juan-Bautista-Martinez_2.jpg": "Polyphemus, probably Felice Giani (Italian, 1758–1823)",
  "Print-artist-Utagawa-Kuniyoshi-Published-by-Nuno-Kichi-Sesshu-Daimotsu-no-ura-ni-Heike-no-onryo-arawaruru-no-zu-BM-20083_1.jpg": "Utagawa Kuniyoshi, The Vengeful Ghosts of the Heike Appear at Daimotsu Bay in Sesshu — British Museum",
  "The-rejuvenated-old-man-and-the-daughter-of-the-king-of-the-jinns-take-leave-of-the-King-of-Kings-from-a-Tuti-nama-Tales.jpg": "The rejuvenated old man and the daughter of the king of the jinns take leave of the King of Kings, from a Tuti-nama (Tales of a Parrot)",
  "Tsukioka-Yoshitoshi-1839-1892-Tsukioka-Taiso-Yoshitoshi-1839-1892-Sugawara-no-Michizane-roept-een-onweersbui-op-boven-Ky.jpg": "Tsukioka Yoshitoshi, Sugawara no Michizane summons a thunderstorm over Kyoto, 1839–1892",
  "Unknown-authorUnknown-author-COLLECTIE-TROPENMUSEUM-Groep-Balinese-danseressen-met-op-de-voorgrond-een-man-verkleed-als-.jpg": "Balinese dancers with a man costumed as Garuda in the foreground — Tropenmuseum collection",
  "anonymous-India-Orissa-late-18th-century-The-Monkeys-and-Bears-Fight-Ravana-and-His-Demons-verso-197921b-Cleveland-Museu.jpg": "The Monkeys and Bears Fight Ravana and His Demons, India, Orissa, late 18th century — Cleveland Museum of Art",
};

// Turn a globbed path into a caption: curated entry first, else derive from the
// filename.
function titleForPath(path: string): string {
  const file = path.split('/').pop() ?? path;
  return CAPTIONS[file] ?? captionFromFilename(file);
}

export function monsterImages(id: string): MonsterImage[] {
  const prefix = `../monster-images/${id}/`;
  return Object.keys(modules)
    .filter((path) => path.startsWith(prefix))
    .sort()
    .map((path) => ({ src: modules[path] as string, title: titleForPath(path) }));
}
