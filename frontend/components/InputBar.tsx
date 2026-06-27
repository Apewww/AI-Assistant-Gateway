"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";

export default function InputBar({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  return (
    <div className="border-t border-border bg-bg-primary px-4 py-3">
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-border bg-bg-surface px-4 py-2 transition-colors focus-within:border-border-focus">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          disabled={disabled}
          className="max-h-40 flex-1 resize-none bg-transparent text-sm text-text-primary placeholder-text-muted outline-none"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white transition-all hover:bg-accent-hover active:scale-95 disabled:opacity-40 disabled:active:scale-100"
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
