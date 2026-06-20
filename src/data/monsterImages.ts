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

export function monsterImages(id: string): string[] {
  const prefix = `../monster-images/${id}/`;
  return Object.keys(modules)
    .filter((path) => path.startsWith(prefix))
    .sort()
    .map((path) => modules[path] as string);
}
