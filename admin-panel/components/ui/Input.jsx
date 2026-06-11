import { cn } from "./cn";

const base =
  "w-full rounded border border-line bg-sand px-4 py-2.5 text-sm text-ink " +
  "transition-colors placeholder:text-gray-400 outline-none " +
  "focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/20 " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

function Field({ label, hint, error, required, htmlFor, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-xs font-bold uppercase tracking-wide text-gray-700"
        >
          {label}
          {required && <span className="ml-0.5 text-crimson">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-crimson">{error}</p>}
    </div>
  );
}

export function Input({ label, hint, error, required, id, className, ...props }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id}>
      <input
        id={id}
        required={required}
        aria-invalid={!!error}
        className={cn(base, error && "border-crimson focus:border-crimson focus:ring-crimson/20", className)}
        {...props}
      />
    </Field>
  );
}

export function Textarea({ label, hint, error, required, id, className, rows = 4, ...props }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id}>
      <textarea
        id={id}
        rows={rows}
        required={required}
        aria-invalid={!!error}
        className={cn(base, "resize-y font-sans", error && "border-crimson", className)}
        {...props}
      />
    </Field>
  );
}

export function Select({ label, hint, error, required, id, className, children, ...props }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id}>
      <select
        id={id}
        required={required}
        aria-invalid={!!error}
        className={cn(base, "cursor-pointer", className)}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
}

export default Input;
