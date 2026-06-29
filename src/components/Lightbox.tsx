import { useEffect } from 'react';
import { Arrow } from './Arrow';
import type { MonsterImage } from '../data/monsterImages';
import './Lightbox.css';

interface LightboxProps {
  /** The full gallery, so the lightbox can page through it with the arrow keys. */
  images: MonsterImage[];
  /** Which image is open. */
  index: number;
  /** Close → back to the gallery (arrow button, scrim click, or Esc). */
  onClose: () => void;
  /** Move to another image (keyboard ←/→, wrapping). */
  onIndex: (index: number) => void;
}

/**
 * A reference image shown large (Figma 496-738, Frame 59). A dark scrim over the
 * monster page with a centred light panel: a header row ("Title of art" + a
 * close arrow, matching the page's back control) above the artwork. The panel
 * shrink-wraps the image, so any aspect ratio sits flush — the image is bounded
 * by the viewport via CSS so it never overflows. Closes on the arrow, a scrim
 * click, or Esc; ←/→ page through the gallery.
 */
export function Lightbox({ images, index, onClose, onIndex }: LightboxProps) {
  const count = images.length;
  const image = images[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onIndex((index + 1) % count);
      else if (e.key === 'ArrowLeft') onIndex((index - 1 + count) % count);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, count, onClose, onIndex]);

  if (!image) return null;

  return (
    <div
      className="lightbox"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={image.title}
    >
      {/* Stop clicks inside the panel from bubbling up to the scrim's close. */}
      <div className="lightbox__panel" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox__header">
          <p className="lightbox__title">{image.title}</p>
          <button
            type="button"
            className="lightbox__close arrow-host"
            onClick={onClose}
            aria-label="סגירה"
          >
            <Arrow direction="right" />
          </button>
        </div>
        <img className="lightbox__image" src={image.src} alt={image.title} />
      </div>
    </div>
  );
}
