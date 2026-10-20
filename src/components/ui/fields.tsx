"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { cx } from "./cx";

// Every field: a real <label>, an optional hint, and an error directly underneath
// that says what to do next. The message is wired up with aria-describedby.

export function ErrorIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cx("shrink-0", className)} aria-hidden>
      <circle cx="8" cy="8" r="7.5" fill="currentColor" />
      <rect x="7.1" y="3.6" width="1.8" height="5.6" rx="0.6" fill="#fff" />
      <rect x="7.1" y="10.7" width="1.8" height="1.8" rx="0.6" fill="#fff" />
    </svg>
  );
}

export function FieldMessage({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error) {
    return (
      <p id={id} className="flex items-start gap-1.5 text-body font-medium text-error">
        <ErrorIcon className="mt-1 size-4" />
        <span>{error}</span>
      </p>
    );
  }
  if (hint) {
    return (
      <p id={id} className="text-label font-normal text-muted">
        {hint}
      </p>
    );
  }
  return null;
}

function LabelText({ label, optional }: { label: string; optional?: boolean }) {
  return (
    <>
      {label}
      {optional && <span className="font-normal text-muted"> (optional)</span>}
    </>
  );
}

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
};

export function Field({ id, label, hint, error, optional, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label text-ink">
        <LabelText label={label} optional={optional} />
      </label>
      {children}
      <FieldMessage id={`${id}-msg`} error={error} hint={hint} />
    </div>
  );
}

const control =
  "rounded-md border-2 border-edge bg-surface px-3 text-body text-ink placeholder:text-muted transition-colors hover:border-ink aria-invalid:border-error aria-invalid:bg-error-tint/40 disabled:cursor-not-allowed disabled:border-disabled-bg disabled:bg-disabled-bg disabled:text-disabled";

type Labelled = { label: string; hint?: string; error?: string; optional?: boolean };

export function TextInput({ label, hint, error, optional, className, id: idProp, ...rest }: Omit<ComponentProps<"input">, "children"> & Labelled) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <Field id={id} label={label} hint={hint} error={error} optional={optional}>
      <input id={id} aria-invalid={error ? true : undefined} aria-describedby={error || hint ? `${id}-msg` : undefined} className={cx(control, "h-12 w-full", className)} {...rest} />
    </Field>
  );
}

export function TextArea({ label, hint, error, optional, className, id: idProp, rows = 3, ...rest }: ComponentProps<"textarea"> & Labelled) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <Field id={id} label={label} hint={hint} error={error} optional={optional}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-msg` : undefined}
        className={cx(control, "w-full py-2.5 leading-relaxed", className)}
        {...rest}
      />
    </Field>
  );
}

export function Select({
  label,
  hint,
  error,
  optional,
  options,
  className,
  id: idProp,
  ...rest
}: Omit<ComponentProps<"select">, "children"> & Labelled & { options: { value: string; label: string }[] }) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <Field id={id} label={label} hint={hint} error={error} optional={optional}>
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${id}-msg` : undefined}
          className={cx(control, "h-12 w-full appearance-none pr-10", className)}
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg viewBox="0 0 16 16" aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6 L8 10 L12 6" />
        </svg>
      </div>
    </Field>
  );
}

export function Checkbox({ label, description, className, ...rest }: Omit<ComponentProps<"input">, "type"> & { label: string; description?: string }) {
  return (
    <label className={cx("flex cursor-pointer items-start gap-3 rounded-md py-1", className)}>
      <input type="checkbox" className="mt-0.5 size-5 shrink-0 cursor-pointer accent-green" {...rest} />
      <span className="flex flex-col">
        <span className="text-body text-ink">{label}</span>
        {description && <span className="text-label font-normal text-muted">{description}</span>}
      </span>
    </label>
  );
}

type Choice = { value: string; label: string; description?: string };

type ChoiceGroupProps = {
  legend: string;
  name: string;
  options: Choice[];
  value: string | undefined;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  optional?: boolean;
  // Exposed to assistive tech (native required on the inputs, aria-required on the group).
  required?: boolean;
  columns?: 2 | 3 | 4 | 5;
};

const columnClass = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 5: "grid-cols-5" } as const;

const tile = (error?: string) =>
  cx(
    "flex min-h-12 flex-col items-center justify-center rounded-md border-2 border-edge bg-surface px-2 py-2 text-center text-body font-semibold text-ink transition-colors",
    "hover:border-ink peer-checked:border-green peer-checked:bg-green peer-checked:text-on-green peer-checked:shadow-card",
    "peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus",
    error && "border-error",
  );

// A radio group drawn as large tappable tiles. Native radios underneath, so arrow keys
// move between options and screen readers announce "1 of 3". The group is a
// radiogroup (named by its legend) that carries required/invalid; each radio also
// carries invalid and points at the hint or error, so it is read on whichever option
// focus lands.
export function ChoiceGroup({ legend, name, options, value, onChange, hint, error, optional, required, columns = 3 }: ChoiceGroupProps) {
  const id = useId();
  const msgId = `${id}-msg`;
  const legendId = `${id}-legend`;
  const describedBy = error || hint ? msgId : undefined;
  return (
    <fieldset role="radiogroup" aria-labelledby={legendId} aria-required={required || undefined} aria-invalid={error ? true : undefined} className="flex flex-col gap-1.5">
      <legend id={legendId} className="mb-1.5 text-label text-ink">
        <LabelText label={legend} optional={optional} />
      </legend>
      <div className={cx("grid gap-2", columnClass[columns])}>
        {options.map((o) => (
          <label key={o.value} className="relative block cursor-pointer">
            {/* aria-invalid is allowed on native radios (ARIA in HTML permits global aria-* attributes); this lint rule is stricter than the spec. */}
            {/* eslint-disable-next-line jsx-a11y/role-supports-aria-props */}
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              required={required}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              className="peer sr-only"
            />
            <span className={tile(error)}>
              {o.label}
              {o.description && <span className="text-label font-normal opacity-90">{o.description}</span>}
            </span>
          </label>
        ))}
      </div>
      <FieldMessage id={msgId} error={error} hint={hint} />
    </fieldset>
  );
}

type MultiChoiceGroupProps = Omit<ChoiceGroupProps, "value" | "onChange"> & {
  value: string[];
  onChange: (value: string[]) => void;
  // Options that can't be combined with others, like "Not sure".
  exclusive?: string[];
};

// The same tiles as ChoiceGroup, but checkboxes: pick any number. Selected values keep
// the order they were picked in, so callers can treat the first as the lead.
export function MultiChoiceGroup({ legend, name, options, value, onChange, hint, error, optional, columns = 3, exclusive = [] }: MultiChoiceGroupProps) {
  const id = useId();
  const msgId = `${id}-msg`;
  const describedBy = error || hint ? msgId : undefined;
  const toggle = (v: string, on: boolean) => {
    if (!on) return onChange(value.filter((x) => x !== v));
    if (exclusive.includes(v)) return onChange([v]);
    onChange([...value.filter((x) => !exclusive.includes(x)), v]);
  };
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-label text-ink">
        <LabelText label={legend} optional={optional} />
      </legend>
      <div className={cx("grid gap-2", columnClass[columns])}>
        {options.map((o) => {
          const checked = value.includes(o.value);
          return (
            <label key={o.value} className="relative block cursor-pointer">
              <input
                type="checkbox"
                name={name}
                value={o.value}
                checked={checked}
                onChange={(e) => toggle(o.value, e.target.checked)}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                className="peer sr-only"
              />
              <span className={tile(error)}>
                <span className="flex items-center gap-1.5">
                  {checked && <CheckIcon />}
                  {o.label}
                </span>
                {o.description && <span className="text-label font-normal opacity-90">{o.description}</span>}
              </span>
            </label>
          );
        })}
      </div>
      <FieldMessage id={msgId} error={error} hint={hint} />
    </fieldset>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 8.5 L6.5 11.5 L12.5 4.5" />
    </svg>
  );
}

type StepperProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  hint?: string;
  error?: string;
  // Read out with the buttons: "Increase score", "Decrease score".
  unit?: string;
};

// A big number with − and + buttons, for counting strokes and putts one-handed.
// The number is a real <input type="number">, so typing and arrow keys work too.
export function Stepper({ label, value, onChange, min = 0, max = 99, hint, error, unit }: StepperProps) {
  const id = useId();
  // While typing, show exactly what was typed (even an empty box); otherwise show the value.
  const [draft, setDraft] = useState<string | null>(null);

  // Buttons keep focus, so say the new value out loud for screen readers.
  const [said, setSaid] = useState("");
  const set = (n: number) => {
    const next = Math.min(max, Math.max(min, n));
    onChange(next);
    setSaid(`${label} ${next}`);
  };
  const name = unit ?? label.toLowerCase();
  const stepButton =
    "grid size-11 shrink-0 place-items-center rounded-md border-2 border-edge bg-surface text-2xl font-semibold text-ink transition-colors hover:border-ink hover:bg-cream active:translate-y-px disabled:cursor-not-allowed disabled:border-disabled-bg disabled:text-disabled disabled:hover:bg-surface";

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label text-ink">
        {label}
      </label>
      <div className="flex items-center gap-1.5">
        <button type="button" className={stepButton} onClick={() => set(value - 1)} disabled={value <= min} aria-label={`Decrease ${name}`} aria-controls={id}>
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={draft ?? String(value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${id}-msg` : undefined}
          onChange={(e) => {
            setDraft(e.target.value);
            const n = parseInt(e.target.value, 10);
            if (!Number.isNaN(n) && n >= min && n <= max) onChange(n);
          }}
          onBlur={() => setDraft(null)}
          className={cx(
            control,
            "h-11 w-14 shrink-0 px-1 text-center font-display text-2xl font-semibold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          )}
        />
        <button type="button" className={stepButton} onClick={() => set(value + 1)} disabled={value >= max} aria-label={`Increase ${name}`} aria-controls={id}>
          +
        </button>
      </div>
      <FieldMessage id={`${id}-msg`} error={error} hint={hint} />
      <span role="status" className="sr-only">
        {said}
      </span>
    </div>
  );
}

// After a failed submit, move focus to the first field that needs fixing.
export function focusFirstError(form: HTMLElement | null) {
  // Inputs, not the radiogroup wrapper, so focus lands on something focusable.
  const el = form?.querySelector<HTMLElement>('input[aria-invalid="true"], select[aria-invalid="true"], textarea[aria-invalid="true"]');
  el?.focus();
}
