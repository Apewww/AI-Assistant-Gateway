"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/types";
import MessageBubble from "./MessageBubble";

function MessageAvatar({ role }: { role: "user" | "assistant" }) {
  return (
    <div
      className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
        role === "user"
          ? "bg-accent/15 text-accent"
          : "bg-[rgba(99,102,241,0.15)] text-[#818CF8]"
      }`}
    >
      {role === "user" ? "U" : "AI"}
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      <span className="typing-dot inline-block size-[7px] rounded-full bg-text-muted" style={{ animationDelay: "0s" }} />
      <span className="typing-dot inline-block size-[7px] rounded-full bg-text-muted" style={{ animationDelay: "0.2s" }} />
      <span className="typing-dot inline-block size-[7px] rounded-full bg-text-muted" style={{ animationDelay: "0.4s" }} />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="animate-fade-in flex w-full justify-start">
      <div className="flex max-w-[80%] items-start gap-3 sm:max-w-[70%]">
        <MessageAvatar role="assistant" />
        <div className="rounded-2xl rounded-bl-md border border-border-soft bg-bg-surface px-4 py-3.5">
          <TypingDots />
        </div>
      </div>
    </div>
  );
}

function StreamingBubble({ content }: { content: string }) {
  return (
    <div className="animate-fade-in flex w-full justify-start">
      <div className="flex max-w-[80%] items-start gap-3 sm:max-w-[70%]">
        <MessageAvatar role="assistant" />
        <div>
          <div className="rounded-2xl rounded-bl-md border border-border-soft bg-bg-surface px-4 py-2.5 text-sm leading-relaxed text-text-primary">
            {content ? (
              <span>
                {content}
                <span className="inline-block h-[1.1em] w-[2px] animate-[blink_0.8s_step-end_infinite] bg-accent align-text-bottom ml-0.5" />
              </span>
            ) : (
              <TypingDots />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatFeed({
  messages,
  sending,
  streamingContent,
  onEditMessage,
  onDeleteMessage,
}: {
  messages: Message[];
  sending: boolean;
  streamingContent?: string;
  onEditMessage?: (id: string, content: string) => void;
  onDeleteMessage?: (id: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, streamingContent]);

  if (messages.length === 0 && !sending && !streamingContent) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-surface border border-border-soft">
            <svg
              className="h-7 w-7 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
              />
            </svg>
          </div>
          <h2 className="mb-1 text-lg font-medium text-text-primary">
            Start a conversation
          </h2>
          <p className="max-w-xs text-sm text-text-secondary">
            Type a message below to begin chatting with the AI assistant.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`animate-fade-in flex w-full items-start gap-3 ${
              msg.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            <MessageAvatar role={msg.role} />
            <div className={`flex max-w-[80%] flex-col gap-1 sm:max-w-[70%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <MessageBubble
                message={msg}
                onEdit={msg.role === "user" ? onEditMessage : undefined}
                onDelete={msg.role === "user" ? onDeleteMessage : undefined}
              />
              <span className="px-1 text-[11px] text-text-muted/40">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
        {streamingContent != null ? (
          <StreamingBubble content={streamingContent} />
        ) : sending ? (
          <TypingIndicator />
        ) : null}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
