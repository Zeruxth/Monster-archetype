import { Arrow } from './Arrow';
import './Button.css';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** Show the leading glyph (points left / forward in RTL). */
  arrow?: boolean;
  /** Swap the default Arrow for another system glyph (e.g. the RetryIcon on
      the Vritra "נסה שוב" button). The button's `.arrow-host` class keeps
      driving the glyph's hover response either way. */
  icon?: React.ReactNode;
  /** Borderless text link variant (e.g. "גלה עוד"). */
  variant?: 'cta' | 'link';
}

export function Button({
  children,
  onClick,
  disabled = false,
  arrow = true,
  icon,
  variant = 'cta',
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`btn btn--${variant} arrow-host`}
      onClick={onClick}
      disabled={disabled}
      dir="ltr"
    >
      {arrow && (icon ?? <Arrow className="btn__arrow" />)}
      <span className="btn__label" dir="rtl">
        {children}
      </span>
    </button>
  );
}
