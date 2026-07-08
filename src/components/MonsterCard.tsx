import { Minotaur } from './Minotaur';
import { MonsterArt, hasMonsterArt } from './MonsterArt';
import './MonsterCard.css';

/**
 * Per-monster shrink for the מגדיר catalogue tiles ONLY. A handful of monsters'
 * source crops fill the tile more than the rest, so these render 10% smaller in
 * the grid to even out how big each creature reads. Purely a catalogue-layout
 * tweak: the inner monster pages don't consult it, so every monster still fills
 * its frame identically there.
 */
export const CATALOGUE_SCALE: Record<string, number> = {
  vritra: 0.9,
  leviathan: 0.9,
  python: 0.9,
  quetzalcoatl: 0.9,
  griffin: 0.9,
  mushhushu: 0.9,
  qilin: 0.9,
  rusalka: 0.9,
  ravana: 0.9,
  fomorians: 0.9,
  oni: 0.9,
  lamassu: 0.9,
  barong: 0.9,
  gargoyle: 0.9,
  komainu: 0.9,
};

interface MonsterCardProps {
  id: string;
  he: string;
  en: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * A single tile in the מגדיר catalogue (Figma 382-1080). At rest the monster is
 * light on the dark page; on hover the card fills light and the monster flips to
 * dark — the line-art is drawn in `currentColor`, so the card's color swap (set
 * in MonsterCard.css) recolours it. Monsters without finished art yet fall back
 * to the filled-Minotaur placeholder.
 */
export function MonsterCard({ id, he, en, onClick }: MonsterCardProps) {
  return (
    <button
      type="button"
      className="monster-card"
      onClick={onClick}
      data-monster-id={id}
    >
      <div className="monster-card__art">
        {hasMonsterArt(id) ? (
          <MonsterArt id={id} scale={CATALOGUE_SCALE[id]} />
        ) : (
          <Minotaur />
        )}
      </div>
      <p className="monster-card__label" dir="rtl">
        {he} / {en}
      </p>
    </button>
  );
}
