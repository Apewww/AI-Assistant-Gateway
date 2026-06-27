"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import type { ModelOption } from "@/types";
import { REASONING_OPTIONS, REASONING_LABELS } from "@/types";

const TEMP_STEPS = [0.2, 0.5, 0.8, 1.0] as const;
const TEMP_LABELS = ["Low", "Medium", "High", "Maksimum"] as const;

export default function InputBar({
  onSend,
  disabled,
  attachedFile,
  onAttachFile,
  onRemoveFile,
  model,
  models,
  onModelChange,
  temperature,
  onTemperatureChange,
  reasoningEffort,
  onReasoningChange,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
  attachedFile?: { file_id: string; blobUrl: string; name: string; isImage: boolean } | null;
  onAttachFile?: (file: File) => void;
  onRemoveFile?: () => void;
  model: string;
  models: ModelOption[];
  onModelChange: (m: string) => void;
  temperature: number;
  onTemperatureChange: (t: number) => void;
  reasoningEffort: string;
  onReasoningChange: (r: string) => void;
}) {
  const [text, setText] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  }, [text]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && onAttachFile) {
      onAttachFile(f);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const tempIndex = TEMP_STEPS.indexOf(temperature as typeof TEMP_STEPS[number]);

  return (
    <div className="border-t border-border-soft bg-bg-primary px-4 py-4 sm:px-6">
      {showOptions && (
        <div className="mx-auto mb-3 max-w-2xl space-y-2">
          {/* Model selector */}
          <div className="relative">
            <select
              value={model}
              onChange={(e) => onModelChange(e.target.value)}
              className="w-full cursor-pointer appearance-none rounded-lg border border-border-soft bg-bg-surface px-3 py-2 pr-8 text-xs text-text-primary outline-none transition-all duration-150 hover:border-text-muted focus:border-accent focus:ring-1 focus:ring-accent/20"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-text-muted"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-start sm:gap-3">
            {/* Temperature */}
            <div className="flex-1">
              <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted/60">
                <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                </svg>
                Temperature
              </div>
              <div className="flex gap-1 rounded-lg border border-border-soft bg-bg-primary/60 p-1">
                {TEMP_STEPS.map((val, i) => {
                  const colors = [
                    "from-cyan-400/70 to-cyan-400",
                    "from-accent/70 to-accent",
                    "from-orange-400/70 to-orange-400",
                    "from-rose-400/70 to-rose-400",
                  ];
                  const isActive = tempIndex === i;
                  return (
                    <button
                      key={val}
                      onClick={() => onTemperatureChange(val)}
                      className={`flex-1 cursor-pointer rounded-md px-2 py-1.5 text-[11px] font-medium leading-none transition-all duration-150 ${
                        isActive ? "text-white shadow-sm" : "text-text-muted/60 hover:text-text-secondary"
                      }`}
                      style={isActive ? { background: `linear-gradient(135deg, ${colors[i].split(" to-")[0].replace("from-", "")}, ${colors[i].split("to-")[1]})` } : undefined}
                    >
                      {TEMP_LABELS[i]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reasoning */}
            <div className="flex-1">
              <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted/60">
                <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
                Reasoning
              </div>
              <div className="flex gap-1 rounded-lg border border-border-soft bg-bg-primary/60 p-1">
                {REASONING_OPTIONS.map((val, i) => {
                  const colors = ["from-violet-400/20", "from-violet-400/40", "from-violet-400/60", "from-violet-400/80"];
                  const isActive = reasoningEffort === val;
                  return (
                    <button
                      key={val}
                      onClick={() => onReasoningChange(val)}
                      className={`flex-1 cursor-pointer rounded-md px-2 py-1.5 text-[11px] font-medium leading-none transition-all duration-150 ${
                        isActive
                          ? "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30"
                          : "text-text-muted/60 hover:text-text-secondary"
                      }`}
                    >
                      {REASONING_LABELS[val]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {attachedFile && (
        <div className="mx-auto mb-2 flex max-w-2xl items-center gap-2 rounded-xl border border-border-soft bg-bg-surface px-3 py-2">
          {attachedFile.isImage ? (
            <img
              src={attachedFile.blobUrl}
              alt=""
              className="size-10 rounded-lg object-cover"
            />
          ) : (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-bg-hover text-text-muted">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
          )}
          <span className="flex-1 truncate text-xs text-text-secondary">
            {attachedFile.name}
          </span>
          <button
            onClick={onRemoveFile}
            className="flex size-6 cursor-pointer items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-hover hover:text-danger"
            aria-label="Remove file"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-2xl border border-border-soft bg-bg-surface pl-2 pr-2 py-2 shadow-sm transition-all duration-200 focus-within:border-accent/40 focus-within:shadow-[0_0_16px] focus-within:shadow-accent/5">
        <button
          onClick={() => setShowOptions((v) => !v)}
          className={`flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-all duration-150 ${
            showOptions
              ? "bg-accent/15 text-accent"
              : "text-text-muted/40 hover:bg-bg-hover hover:text-text-muted"
          }`}
          aria-label="Toggle options"
          tabIndex={-1}
        >
          <svg className="size-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
          </svg>
        </button>

        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={handleFilePick}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={disabled || !!attachedFile}
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-text-muted/40 transition-all duration-150 hover:bg-bg-hover hover:text-text-muted disabled:opacity-20 disabled:cursor-not-allowed"
          aria-label="Attach file"
          tabIndex={-1}
        >
          <svg className="size-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          disabled={disabled}
          className="max-h-40 flex-1 resize-none bg-transparent text-sm text-text-primary placeholder-text-muted/40 outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-accent text-white transition-all duration-150 hover:bg-accent-hover hover:shadow-[0_0_10px] hover:shadow-accent/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none disabled:active:scale-100"
          aria-label="Send message"
        >
          <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
