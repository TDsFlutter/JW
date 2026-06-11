import { cn } from "./cn";

export default function Card({ title, description, actions, className, bodyClassName, children }) {
  return (
    <section
      className={cn(
        "rounded-card border border-line bg-white shadow-sm",
        className
      )}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div>
            {title && (
              <h3 className="font-serif text-lg text-ink sm:text-xl">{title}</h3>
            )}
            {description && (
              <p className="mt-0.5 text-sm text-gray-500">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn("p-5 sm:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}
