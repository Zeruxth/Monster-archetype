import { Arrow } from './Arrow';
import './Button.css';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** Show the leading arrow (points left / forward in RTL). */
  arrow?: boolean;
  /** Borderless text link variant (e.g. "גלה עוד"). */
  variant?: 'cta' | 'link';
}

export function Button({
  children,
  onClick,
  disabled = false,
  arrow = true,
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
      {arrow && <Arrow className="btn__arrow" />}
      <span className="btn__label" dir="rtl">
        {children}
      </span>
    </button>
  );
}
