"use client";

import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "@/types";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard not available
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="absolute right-2 top-2 cursor-pointer rounded-md border border-border/60 bg-bg-surface/80 px-2 py-1 text-[11px] text-text-muted opacity-0 backdrop-blur-sm transition-all duration-200 hover:border-accent/40 hover:bg-bg-surface hover:text-accent group-hover:opacity-100"
    >
      {copied ? (
        <span className="flex items-center gap-1 text-accent">
          <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          Copied
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
          </svg>
          Copy
        </span>
      )}
    </button>
  );
}

function PreBlock({ children }: { children: React.ReactNode }) {
  const text = extractText(children);
  return (
    <div className="group relative my-2">
      <CopyButton text={text} />
      <pre className="overflow-x-auto rounded-lg bg-bg-surface p-3 text-xs leading-relaxed">
        {children}
      </pre>
    </div>
  );
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object") {
    const el = node as { props?: { children?: React.ReactNode } };
    if (el.props?.children) return extractText(el.props.children);
  }
  return "";
}

export default function MessageBubble({
  message,
  onEdit,
  onDelete,
}: {
  message: Message;
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
}) {
  const isUser = message.role === "user";
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  const processedContent = message.content.replace(/<br\s*\/?>/gi, "\n");

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== message.content) {
      onEdit?.(message.id, editText.trim());
    }
    setEditing(false);
  };

  return (
    <div
      className={`animate-fade-in group flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex max-w-[80%] flex-col gap-1 sm:max-w-[70%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-accent text-white rounded-br-md"
              : "bg-bg-ai-msg text-text-primary rounded-bl-md border border-border"
          }`}
        >
          {isUser && !editing && (
            <div className="absolute -left-9 top-2 flex flex-col gap-0.5 opacity-0 transition-all duration-200 group-hover:opacity-100 max-lg:-right-2 max-lg:left-auto max-lg:top-0 max-lg:flex-row max-lg:opacity-100">
              <button
                onClick={() => {
                  setEditText(message.content);
                  setEditing(true);
                }}
                className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-text-muted transition-all duration-150 hover:bg-white/10 hover:text-text-primary"
                aria-label="Edit message"
              >
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
              </button>
              <button
                onClick={() => onDelete?.(message.id)}
                className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-text-muted transition-all duration-150 hover:bg-danger/10 hover:text-danger"
                aria-label="Delete message"
              >
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {isUser ? (
            editing ? (
              <div className="flex flex-col gap-2">
                <textarea
                  autoFocus
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveEdit();
                    }
                    if (e.key === "Escape") setEditing(false);
                  }}
                  className="w-full resize-none rounded-lg bg-black/30 p-2 text-sm text-white outline-none ring-1 ring-border-focus"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-white hover:bg-accent-hover"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="rounded-md border border-border px-3 py-1 text-xs font-medium text-text-secondary hover:bg-bg-hover"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p({ children }) {
                  return <p className="mb-2 last:mb-0">{children}</p>;
                },
                pre({ children }) {
                  return <PreBlock>{children}</PreBlock>;
                },
                code({ className, children, ...props }) {
                  if (className) {
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code
                      className="rounded bg-bg-surface px-1.5 py-0.5 text-xs text-accent"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                a({ href, children }) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline underline-offset-2 hover:text-accent-hover"
                    >
                      {children}
                    </a>
                  );
                },
                ul({ children }) {
                  return <ul className="my-1 list-disc pl-5">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="my-1 list-decimal pl-5">{children}</ol>;
                },
                blockquote({ children }) {
                  return (
                    <blockquote className="my-2 border-l-2 border-border pl-4 italic text-text-secondary">
                      {children}
                    </blockquote>
                  );
                },
                table({ children }) {
                  return (
                    <div className="my-2 overflow-x-auto">
                      <table className="w-full border-collapse border border-border text-left text-sm">
                        {children}
                      </table>
                    </div>
                  );
                },
                th({ children }) {
                  return (
                    <th className="border border-border bg-bg-surface px-3 py-2 font-semibold">
                      {children}
                    </th>
                  );
                },
                td({ children }) {
                  return (
                    <td className="border border-border px-3 py-2">{children}</td>
                  );
                },
              }}
            >
              {processedContent}
            </ReactMarkdown>
          )}
        </div>
        <span className="px-1 text-[11px] text-text-secondary">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
