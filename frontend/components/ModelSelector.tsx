"use client";

import { AVAILABLE_MODELS } from "@/types";

export default function ModelSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (model: string) => void;
}) {
  const current = AVAILABLE_MODELS.find((m) => m.id === value);
  const isCustom = !current;

  return (
    <div className="border-t border-border p-3">
      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-text-muted">
        <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
        </svg>
        AI Model
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full cursor-pointer appearance-none rounded-lg border border-border bg-bg-surface px-3 py-2 pr-8 text-xs text-text-primary outline-none transition-all duration-150 hover:border-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30"
        >
          {AVAILABLE_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
          {isCustom && (
            <option value={value} disabled>
              {value}
            </option>
          )}
        </select>
        <svg
          className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
    </div>
  );
}
