import { Minotaur } from './Minotaur';
import { MonsterArt, hasMonsterArt } from './MonsterArt';
import './MonsterCard.css';

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
        {hasMonsterArt(id) ? <MonsterArt id={id} /> : <Minotaur />}
      </div>
      <p className="monster-card__label" dir="rtl">
        {he} / {en}
      </p>
    </button>
  );
}
