import './Arrow.css';

interface ArrowProps {
  /** Pointing direction. In RTL "forward / proceed" points left; "back" points right. */
  direction?: 'left' | 'right';
  /** Extra class for the host to hook sizing onto (e.g. `btn__arrow`). */
  className?: string;
}

// The system arrow (Figma 489-1373), exact artwork: a solid filled shape drawn
// in `currentColor` (so a hovering control recolours it). This is the Default
// (rest) outline; the hover state rounds the corners — that morph lives in
// Arrow.css (`transition: d`). Used here as the `d` attribute so browsers
// without CSS `d` still render the rest shape.
const ARROW_D =
  'M13.9841 0.168544C14.305 -0.0928264 14.7769 -0.0449293 15.0387 0.275575L15.5139 0.857346C15.776 1.17831 15.7282 1.65107 15.407 1.913L8.87669 7.23895C7.23669 8.57648 8.18247 11.2326 10.2987 11.2326H26.3069C26.7212 11.2326 27.0569 11.5684 27.0569 11.9826V12.7326C27.0569 13.1468 26.7212 13.4826 26.3069 13.4826H10.2987C8.18247 13.4826 7.23668 16.1387 8.87668 17.4762L15.407 22.8022C15.7282 23.0641 15.776 23.5368 15.5139 23.8578L15.0389 24.4393C14.777 24.7599 14.3049 24.8077 13.9841 24.5461L0.276921 13.3683C0.10247 13.226 0.00114102 13.0129 0.000906614 12.7878L0 11.9176C-0.000234713 11.6918 0.101259 11.4779 0.27631 11.3353L13.9841 0.168544Z';

/**
 * The system arrow (Figma 489-1373). Decorative, so aria-hidden. On hover the
 * corners round out (Default → Hover state); that morph is driven by the hosting
 * control via the `.arrow-host` class (see Arrow.css) so it fires with the
 * control's own hover, not just when the cursor is over the small glyph.
 */
export function Arrow({ direction = 'left', className }: ArrowProps) {
  return (
    <svg
      className={`arrow arrow--${direction}${className ? ` ${className}` : ''}`}
      viewBox="0 0 27.0569 24.7149"
      aria-hidden="true"
    >
      <path className="arrow__shape" d={ARROW_D} />
    </svg>
  );
}
