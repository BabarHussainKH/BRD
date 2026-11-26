"use client";

import { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <section className="panel animate-fade-up">
      <div className="flex flex-col gap-4 border-l-4 border-l-[var(--ubl-blue)] p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div>
          {eyebrow ? <p className="bank-eyebrow">{eyebrow}</p> : null}
          <h2 className="bank-title mt-1">{title}</h2>
          {description ? <p className="bank-subtitle mt-2 max-w-3xl">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}

export function Alert({
  tone = "warn",
  children,
}: {
  tone?: "warn" | "danger" | "ok" | "info";
  children: ReactNode;
}) {
  const styles = {
    warn: "border-amber-200 bg-amber-50 text-amber-900",
    danger: "border-red-200 bg-[var(--ubl-red-soft)] text-[var(--ubl-red)]",
    ok: "border-emerald-200 bg-emerald-50 text-emerald-900",
    info: "border-[var(--line)] bg-[var(--ubl-soft)] text-[var(--ubl-navy)]",
  };
  return <div className={`rounded border px-4 py-3 text-[13.5px] ${styles[tone]}`}>{children}</div>;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="metric-icon mb-3">○</div>
      <p className="text-[15px] font-bold text-[var(--ubl-navy)]">{title}</p>
      {hint ? <p className="mt-1 max-w-sm text-[13px] text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  delay = 0,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  delay?: number;
}) {
  return (
    <article
      className="panel animate-fade-up p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="bank-eyebrow">{label}</p>
          <p className="mt-2 text-[28px] font-bold leading-none tracking-tight text-[var(--ubl-navy)]">
            {value}
          </p>
          {hint ? <p className="mt-2 text-[12px] text-[var(--muted)]">{hint}</p> : null}
        </div>
        {icon ? <div className="metric-icon">{icon}</div> : null}
      </div>
    </article>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(3,43,74,0.5)] p-3 sm:items-center sm:p-6">
      <button className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} type="button" />
      <div
        className={`relative max-h-[92vh] w-full overflow-auto rounded-lg bg-white shadow-2xl ${
          wide ? "max-w-4xl" : "max-w-xl"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[var(--line)] bg-white px-5 py-4">
          <h3 className="text-[18px] font-bold text-[var(--ubl-navy)]">{title}</h3>
          <button className="btn-ghost" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="panel flex items-center gap-3 p-4 text-[14px] text-[var(--muted)]">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--ubl-blue)]" />
      {label}
    </div>
  );
}

export function FilterBar({
  children,
  onApply,
  onReset,
  applyLabel = "Apply filters",
}: {
  children: ReactNode;
  onApply?: () => void;
  onReset?: () => void;
  applyLabel?: string;
}) {
  return (
    <section className="panel p-4">
      <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">{children}</div>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        {onReset ? (
          <button className="btn-ghost" type="button" onClick={onReset}>
            Reset
          </button>
        ) : null}
        {onApply ? (
          <button className="btn-secondary" type="button" onClick={onApply}>
            {applyLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  disabled,
}: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  disabled?: boolean;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-col gap-3 border-t border-[var(--line)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[12.5px] text-[var(--muted)]">
        Showing <span className="font-semibold text-[var(--ubl-navy)]">{from}</span>–
        <span className="font-semibold text-[var(--ubl-navy)]">{to}</span> of{" "}
        <span className="font-semibold text-[var(--ubl-navy)]">{total.toLocaleString()}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {onPageSizeChange ? (
          <select
            className="field !w-auto !py-1.5 text-[12.5px]"
            disabled={disabled}
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        ) : null}
        <button
          className="btn-ghost"
          type="button"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(1)}
        >
          First
        </button>
        <button
          className="btn-ghost"
          type="button"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </button>
        <span className="min-w-[7rem] text-center text-[12.5px] font-semibold text-[var(--ubl-navy)]">
          Page {page} / {totalPages}
        </span>
        <button
          className="btn-ghost"
          type="button"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
        <button
          className="btn-ghost"
          type="button"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(totalPages)}
        >
          Last
        </button>
      </div>
    </div>
  );
}
