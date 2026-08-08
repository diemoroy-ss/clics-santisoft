'use client';

interface ToggleProps {
  id:       string;
  checked:  boolean;
  onChange: (checked: boolean) => void;
  label:    string;
  desc?:    string;
  disabled?: boolean;
}

export function Toggle({ id, checked, onChange, label, desc, disabled = false }: ToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-dark-200 cursor-pointer">{label}</label>
        {desc && <p className="text-xs text-dark-500 mt-0.5">{desc}</p>}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`
          relative flex-shrink-0 w-10 h-5.5 rounded-full transition-all duration-200 focus:outline-none
          focus:ring-2 focus:ring-brand-500/50 disabled:opacity-40 disabled:cursor-not-allowed
          ${checked ? 'bg-brand-600' : 'bg-dark-700'}
        `}
      >
        <span
          className={`
            absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200
            ${checked ? 'translate-x-5' : 'translate-x-0.5'}
          `}
        />
      </button>
    </div>
  );
}
