"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "@/types";

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`animate-fade-in flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex max-w-[80%] flex-col gap-1 sm:max-w-[70%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-accent text-white rounded-br-md"
              : "bg-bg-ai-msg text-text-primary rounded-bl-md border border-border"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p({ children }) {
                  return <p className="mb-2 last:mb-0">{children}</p>;
                },
                pre({ children }) {
                  return (
                    <pre className="my-2 overflow-x-auto rounded-lg bg-bg-surface p-3 text-xs leading-relaxed">
                      {children}
                    </pre>
                  );
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
              }}
            >
              {message.content}
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
