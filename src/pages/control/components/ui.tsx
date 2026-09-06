import { useEffect, useId, useState, type CSSProperties, type PropsWithChildren, type ReactNode } from 'react';
import { formatDuration, isDurationInputAllowed, parseDuration } from '../../../utils/formatDuration';

export const ChevronIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className="chevron-icon">
    <path d="m4 6 4 4 4-4" />
  </svg>
);

export const Panel = ({
  title,
  action,
  className = '',
  children,
}: PropsWithChildren<{ title: string; action?: ReactNode; className?: string }>) => (
  <section className={`stage-panel ${className}`}>
    <header className="panel-heading">
      <h2>{title}</h2>
      {action}
    </header>
    {children}
  </section>
);

export const Toggle = ({
  checked,
  onChange,
  disabled = false,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel: string;
}) => (
  <label className="toggle-control">
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.checked)}
    />
    <span className="toggle-track" />
    <span className="toggle-label">{checked ? 'On' : 'Off'}</span>
  </label>
);

export const FieldLabel = ({ children }: PropsWithChildren) => (
  <span className="field-label">{children}</span>
);

export const VolumeSlider = ({
  value,
  onChange,
  ariaLabel,
}: {
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
}) => {
  const percentage = Math.min(100, Math.max(0, value * 100));

  return (
    <input
      className="volume-slider"
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={value}
      aria-label={ariaLabel}
      style={{ '--volume-percent': `${percentage}%` } as CSSProperties}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );
};

export const TimecodeField = ({
  label,
  seconds,
  format,
  onChange,
  disabled = false,
  invalid = false,
  className = '',
}: {
  label: string;
  seconds: number;
  format: string;
  onChange: (seconds: number) => void;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
}) => {
  const id = useId();
  const [draft, setDraft] = useState(() => formatDuration(seconds, format));

  useEffect(() => {
    setDraft(formatDuration(seconds, format));
  }, [format, seconds]);

  const commit = () => {
    const parsed = parseDuration(draft, format);
    if (parsed === null) {
      setDraft(formatDuration(seconds, format));
      return;
    }
    onChange(parsed);
    setDraft(formatDuration(parsed, format));
  };

  return (
    <label className={`stage-field timecode-field${invalid ? ' invalid-field' : ''} ${className}`} htmlFor={id}>
      <FieldLabel>{label}</FieldLabel>
      <input
        id={id}
        inputMode="decimal"
        disabled={disabled}
        aria-invalid={invalid}
        value={draft}
        onChange={(event) => {
          if (isDurationInputAllowed(event.target.value, format)) setDraft(event.target.value);
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
          if (event.key === 'Escape') {
            setDraft(formatDuration(seconds, format));
            event.currentTarget.blur();
          }
        }}
      />
    </label>
  );
};

export const StageSelect = ({
  label,
  value,
  onChange,
  children,
  className = '',
}: PropsWithChildren<{
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}>) => (
  <label className={`stage-field ${className}`}>
    {label ? <FieldLabel>{label}</FieldLabel> : null}
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {children}
    </select>
  </label>
);
