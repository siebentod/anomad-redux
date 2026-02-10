import { forwardRef } from 'react';
import { cn } from 'src/shared/lib/cn';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  'aria-label'?: string;
}

const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ checked, onChange, className = '', 'aria-label': ariaLabel }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={checked}
        aria-label={ariaLabel}
        onClick={() => onChange(!checked)}
        className={cn(
          'w-5 aspect-square flex items-center justify-center rounded-sm border flex-shrink-0',
          checked ? 'bg-red-bg border-[rgb(209,114,119)]' : 'bg-transparent border-border-light',
          className
        )}
      >
        {checked && (
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 5L4.2 8L11 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;