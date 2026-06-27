"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/types";
import MessageBubble from "./MessageBubble";

function TypingIndicator() {
  return (
    <div className="animate-fade-in flex w-full justify-start">
      <div className="flex max-w-[80%] flex-col gap-1 sm:max-w-[70%] items-start">
        <div className="rounded-2xl rounded-bl-md border border-border bg-bg-ai-msg px-4 py-3.5">
          <div className="flex items-center gap-1">
            <span className="typing-dot inline-block size-1.5 rounded-full bg-text-secondary" style={{ animationDelay: "0s" }} />
            <span className="typing-dot inline-block size-1.5 rounded-full bg-text-secondary" style={{ animationDelay: "0.2s" }} />
            <span className="typing-dot inline-block size-1.5 rounded-full bg-text-secondary" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StreamingBubble({ content }: { content: string }) {
  return (
    <div className="animate-fade-in flex w-full justify-start">
      <div className="flex max-w-[80%] flex-col gap-1 sm:max-w-[70%] items-start">
        <div className="rounded-2xl rounded-bl-md border border-border bg-bg-ai-msg px-4 py-2.5 text-sm leading-relaxed text-text-primary">
          {content || <TypingIndicator />}
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
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-surface border border-border">
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
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onEdit={onEditMessage}
            onDelete={msg.role === "user" ? onDeleteMessage : undefined}
          />
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
