"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";

export default function InputBar({
  onSend,
  disabled,
  attachedFile,
  onAttachFile,
  onRemoveFile,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
  attachedFile?: { file_id: string; blobUrl: string; name: string; isImage: boolean } | null;
  onAttachFile?: (file: File) => void;
  onRemoveFile?: () => void;
}) {
  const [text, setText] = useState("");
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

  return (
    <div className="border-t border-border-soft bg-bg-primary px-6 py-4">
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

      <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-2xl border border-border-soft bg-bg-surface pl-3 pr-2 py-2 shadow-sm transition-all duration-200 focus-within:border-accent/40 focus-within:shadow-[0_0_16px] focus-within:shadow-accent/5">
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
