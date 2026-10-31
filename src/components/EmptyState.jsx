"use client";

import Link from 'next/link';
import clsx from 'clsx';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = ""
}) {
  return (
    <div className={clsx("flex flex-col items-center justify-center text-center py-12 px-6 bg-[var(--surface-1)] rounded-[var(--r-card)] border border-[var(--hairline)]", className)}>
      {Icon && (
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-[var(--surface-2)]">
          <Icon className="w-6 h-6 text-[var(--text-3)]" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-[15px] font-medium text-[var(--text)] tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-[13px] text-[var(--text-2)] mt-1 max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {(actionLabel && (actionHref || onAction)) && (
        <div className="mt-4">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center justify-center px-4 py-2 text-[13px] font-medium text-[var(--text)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] active:scale-[0.97] rounded-[var(--r-control)] transition-all"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center justify-center px-4 py-2 text-[13px] font-medium text-[var(--text)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] active:scale-[0.97] rounded-[var(--r-control)] transition-all"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
