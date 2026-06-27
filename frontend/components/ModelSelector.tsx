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
      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-text-muted">
        Model
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-xs text-text-primary outline-none transition-colors focus:border-border-focus"
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
    </div>
  );
}
