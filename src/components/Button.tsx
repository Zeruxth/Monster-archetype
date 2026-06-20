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
      className={`btn btn--${variant}`}
      onClick={onClick}
      disabled={disabled}
      dir="ltr"
    >
      {arrow && (
        <svg
          className="btn__arrow"
          width="16"
          height="15"
          viewBox="0 0 16 15"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M15 7.5H1M6.6 1.2 1 7.5l5.6 6.3"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span className="btn__label" dir="rtl">
        {children}
      </span>
    </button>
  );
}
