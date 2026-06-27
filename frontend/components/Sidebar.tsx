"use client";

import { useState } from "react";
import type { Session } from "@/types";
import ModelSelector from "./ModelSelector";

const TEMP_STEPS = [0.2, 0.5, 0.8, 1.0] as const;
const TEMP_LABELS = ["Low", "Medium", "High", "Maksimum"] as const;

export default function Sidebar({
  sessions,
  activeId,
  isOpen,
  onClose,
  onSelect,
  onNewChat,
  onRename,
  onDelete,
  model,
  onModelChange,
  temperature,
  onTemperatureChange,
}: {
  sessions: Session[];
  activeId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  model: string;
  onModelChange: (model: string) => void;
  temperature: number;
  onTemperatureChange: (temp: number) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [tempOpen, setTempOpen] = useState(true);
  const tempIndex = TEMP_STEPS.indexOf(temperature as typeof TEMP_STEPS[number]);

  const handleStartRename = (s: Session) => {
    setEditingId(s.id);
    setEditValue(s.name);
  };

  const handleCommitRename = () => {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
    setEditValue("");
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-bg-sidebar border-r border-border-soft transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* New Chat */}
        <div className="p-4 pb-3 border-b border-border-soft">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-border-soft bg-transparent px-4 py-3 text-sm font-medium text-text-primary transition-all duration-150 hover:border-accent/30 hover:bg-bg-hover active:scale-[0.98]"
          >
            <svg className="size-[18px] shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Model Selector */}
        <div className="px-4 py-3 border-b border-border-soft">
          <ModelSelector value={model} onChange={onModelChange} />
        </div>

        {/* Temperature Settings */}
        <div className="px-4 py-3 border-b border-border-soft">
          <button
            onClick={() => setTempOpen(!tempOpen)}
            className="flex w-full cursor-pointer items-center justify-between"
          >
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
              </svg>
              Temperature
            </div>
            <span className="font-mono text-xs font-semibold text-accent">{temperature.toFixed(1)}</span>
          </button>
          {tempOpen && (
            <div className="mt-3 rounded-lg border border-border-soft bg-bg-primary/60 p-3">
              <div className="flex items-center justify-between mb-3">
                {TEMP_LABELS.map((label, i) => (
                  <button
                    key={label}
                    onClick={() => onTemperatureChange(TEMP_STEPS[i])}
                    className={`cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-150 ${
                      tempIndex === i
                        ? "bg-accent/15 text-accent"
                        : "text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="relative h-1 w-full rounded-full bg-[rgba(255,255,255,0.08)]">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-accent/40 to-accent transition-all duration-200"
                  style={{ width: `${((tempIndex + 1) / TEMP_STEPS.length) * 100}%` }}
                >
                  <div className="absolute right-0 top-1/2 size-3 -translate-y-1/2 translate-x-1/2 rounded-full border-2 border-bg-sidebar bg-accent shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Sessions */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {sessions.map((s) => {
            const isActive = s.id === activeId;
            const isEditing = editingId === s.id;

            return (
              <div
                key={s.id}
                onClick={() => {
                  if (!isEditing) {
                    onSelect(s.id);
                    onClose();
                  }
                }}
                className={`group relative mb-0.5 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-all ${
                  isActive
                    ? "bg-bg-active text-text-primary border border-accent/15"
                    : "text-text-secondary hover:bg-bg-hover hover:text-text-primary border border-transparent"
                }`}
              >

                {isEditing ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleCommitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCommitRename();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-transparent text-sm text-text-primary outline-none border-b border-accent"
                  />
                ) : (
                  <span className="flex-1 truncate">{s.name}</span>
                )}

                {!isEditing && (
                  <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartRename(s);
                      }}
                      className="flex size-6 cursor-pointer items-center justify-center rounded-md text-text-muted transition-all duration-150 hover:bg-bg-hover hover:text-text-primary"
                      aria-label="Rename"
                    >
                      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(s.id);
                      }}
                      className="flex size-6 cursor-pointer items-center justify-center rounded-md text-text-muted transition-all duration-150 hover:bg-bg-hover hover:text-danger"
                      aria-label="Delete"
                    >
                      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border-soft px-4 py-3.5">
          <a
            href="https://github.com/Apewww"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text-secondary"
          >
            <svg className="size-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Rafly Anggara Putra
          </a>
        </div>
      </aside>
    </>
  );
}
