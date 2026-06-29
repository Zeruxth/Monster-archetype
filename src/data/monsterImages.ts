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
  /** Caption shown in the lightbox, derived from the filename. */
  title: string;
}

// Turn a globbed path into a human-ish caption: drop the directory + extension,
// turn separators into spaces, collapse runs, and trim a trailing "_1"-style
// index. Deliberately rough — the source filenames are messy — so a hand-curated
// title/artist map can replace this later without touching any callers.
function titleFromPath(path: string): string {
  const file = path.split('/').pop() ?? path;
  return file
    .replace(/\.[^.]+$/, '') // extension
    .replace(/[-_]+/g, ' ') // separators → spaces
    .replace(/\s+/g, ' ') // collapse runs
    .replace(/\s+\d+$/, '') // trailing bare index (e.g. "… 1")
    .trim();
}

export function monsterImages(id: string): MonsterImage[] {
  const prefix = `../monster-images/${id}/`;
  return Object.keys(modules)
    .filter((path) => path.startsWith(prefix))
    .sort()
    .map((path) => ({ src: modules[path] as string, title: titleFromPath(path) }));
}
