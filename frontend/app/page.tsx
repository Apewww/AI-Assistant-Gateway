"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Session, Message } from "@/types";
import { FALLBACK_MODELS } from "@/types";
import { sendMessage, sendMessageStream, uploadFile } from "@/lib/api";
import { loadSessions, saveSessions, loadActiveId, saveActiveId } from "@/lib/persist";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ChatFeed from "@/components/ChatFeed";
import InputBar from "@/components/InputBar";

const MODEL_KEY = "selected_model";
const TEMP_KEY = "selected_temperature";
const TEMP_STEPS = [0.2, 0.5, 0.8, 1.0] as const;
const TEMP_LABELS = ["Low", "Medium", "High", "Maksimum"] as const;
const CONTEXT_LIMIT = 32768;
const ESTIMATED_CHARS_PER_TOKEN = 4;

function createId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}

function createSession(name?: string): Session {
  return {
    id: createId(),
    name: name || "New Chat",
    messages: [],
    createdAt: Date.now(),
  };
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / ESTIMATED_CHARS_PER_TOKEN);
}

function sessionTokenCount(messages: Message[]): number {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content) + 4, 0);
}

function loadModel(): string {
  if (typeof window === "undefined") return FALLBACK_MODELS[0].id;
  try {
    return localStorage.getItem(MODEL_KEY) || FALLBACK_MODELS[0].id;
  } catch {
    return FALLBACK_MODELS[0].id;
  }
}

function saveModel(m: string) {
  try {
    localStorage.setItem(MODEL_KEY, m);
  } catch {
    // storage unavailable
  }
}

function loadTemperature(): number {
  if (typeof window === "undefined") return 0.7;
  try {
    const v = localStorage.getItem(TEMP_KEY);
    if (v) {
      const n = parseFloat(v);
      if (TEMP_STEPS.includes(n as typeof TEMP_STEPS[number])) return n;
    }
    return 0.7;
  } catch {
    return 0.7;
  }
}

function saveTemperature(t: number) {
  try {
    localStorage.setItem(TEMP_KEY, String(t));
  } catch {
    // storage unavailable
  }
}

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([createSession()]);
  const [activeId, setActiveId] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sendingSessions, setSendingSessions] = useState<Record<string, boolean>>({});
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [model, setModel] = useState(FALLBACK_MODELS[0].id);
  const [temperature, setTemperature] = useState(0.7);
  const [attachedFile, setAttachedFile] = useState<{ file_id: string; blobUrl: string; name: string; isImage: boolean } | null>(null);
  const activeIdRef = useRef(activeId);
  const abortRef = useRef<AbortController | null>(null);
  activeIdRef.current = activeId;

  const activeSession = sessions.find((s) => s.id === activeId) ?? sessions[0];

  useEffect(() => {
    const saved = loadSessions();
    const sessions_ = saved.length > 0 ? saved : [createSession()];
    setSessions(sessions_);

    const savedActive = loadActiveId();
    if (savedActive && sessions_.some((s) => s.id === savedActive)) {
      setActiveId(savedActive);
    } else {
      setActiveId(sessions_[0].id);
    }

    setModel(loadModel());
    setTemperature(loadTemperature());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveSessions(sessions);
  }, [sessions, hydrated]);

  useEffect(() => {
    if (hydrated) saveActiveId(activeId);
  }, [activeId, hydrated]);

  useEffect(() => {
    return () => {
      if (attachedFile) URL.revokeObjectURL(attachedFile.blobUrl);
    };
  }, [attachedFile]);

  const handleNewChat = useCallback(() => {
    abortRef.current?.abort();
    const newSession = createSession();
    setSessions((prev) => [newSession, ...prev]);
    setActiveId(newSession.id);
  }, []);

  const handleSelect = useCallback((id: string) => {
    abortRef.current?.abort();
    setActiveId(id);
  }, []);

  const handleRename = useCallback((id: string, name: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name } : s)),
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    abortRef.current?.abort();
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (remaining.length === 0) {
        const fresh = createSession();
        return [fresh];
      }
      if (activeIdRef.current === id) {
        setActiveId(remaining[0].id);
      }
      return remaining;
    });
  }, []);

  const handleEditMessage = useCallback((msgId: string, content: string) => {
    const userId = activeIdRef.current;
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== userId) return s;
        const msgs = s.messages.map((m) =>
          m.id === msgId ? { ...m, content, timestamp: Date.now() } : m,
        );
        return { ...s, messages: msgs };
      }),
    );
  }, []);

  const handleDeleteMessage = useCallback((msgId: string) => {
    const userId = activeIdRef.current;
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== userId) return s;
        const msgs = s.messages.filter((m) => m.id !== msgId);
        return { ...s, messages: msgs };
      }),
    );
  }, []);

  const handleModelChange = useCallback((m: string) => {
    setModel(m);
    saveModel(m);
  }, []);

  const handleTemperatureChange = useCallback((t: number) => {
    setTemperature(t);
    saveTemperature(t);
  }, []);

  const handleAttachFile = useCallback(async (file: File) => {
    try {
      const result = await uploadFile(file);
      const blobUrl = URL.createObjectURL(file);
      setAttachedFile({ file_id: result.file_id, blobUrl, name: file.name, isImage: file.type.startsWith("image/") });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      alert(msg);
    }
  }, []);

  const handleRemoveFile = useCallback(() => {
    setAttachedFile((prev) => {
      if (prev) URL.revokeObjectURL(prev.blobUrl);
      return null;
    });
  }, []);

  const handleSend = useCallback(async (text: string) => {
    const userId = activeIdRef.current;

    const currentFile = attachedFile;
    setAttachedFile(null);

    const userMsg: Message = {
      id: createId(),
      role: "user",
      content: text,
      files: currentFile
        ? [{ file_id: currentFile.file_id, name: currentFile.name, isImage: currentFile.isImage, blobUrl: currentFile.blobUrl }]
        : undefined,
      timestamp: Date.now(),
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== userId) return s;
        const msgs = [...s.messages, userMsg];
        const name =
          s.messages.length === 0
            ? text.slice(0, 40) + (text.length > 40 ? "…" : "")
            : s.name;
        return { ...s, messages: msgs, name };
      }),
    );

    setSendingSessions((prev) => ({ ...prev, [userId]: true }));
    setStreamingContent("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let collected = "";

      await sendMessageStream(
        {
          session_id: userId,
          source_platform: "web_porto",
          message: text,
          model,
          temperature,
          file_ids: currentFile ? [currentFile.file_id] : undefined,
        },
        {
          onText: (chunk) => {
            collected += chunk;
            setStreamingContent(collected);
          },
          onDone: () => {
            const aiMsg: Message = {
              id: createId(),
              role: "assistant",
              content: collected,
              timestamp: Date.now(),
            };
            setSessions((prev) =>
              prev.map((s) =>
                s.id === userId
                  ? { ...s, messages: [...s.messages, aiMsg] }
                  : s,
              ),
            );
            setStreamingContent(null);
          },
          onError: (msg) => {
            const errMsg: Message = {
              id: createId(),
              role: "assistant",
              content: msg,
              timestamp: Date.now(),
            };
            setSessions((prev) =>
              prev.map((s) =>
                s.id === userId
                  ? { ...s, messages: [...s.messages, errMsg] }
                  : s,
              ),
            );
            setStreamingContent(null);
          },
        },
        controller.signal,
      );

      // If stream ended without done/error event (e.g. abort), clean up
      setStreamingContent((cur) => {
        if (cur != null) {
          // Stream ended but no done event; add what we have
          const aiMsg: Message = {
            id: createId(),
            role: "assistant",
            content: collected,
            timestamp: Date.now(),
          };
          setSessions((prev) =>
            prev.map((s) =>
              s.id === userId
                ? { ...s, messages: [...s.messages, aiMsg] }
                : s,
            ),
          );
        }
        return null;
      });
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setStreamingContent(null);
        return;
      }
      const msg = e instanceof Error ? e.message : "Sorry, the AI service is currently unavailable. Please try again.";
      const errMsg: Message = {
        id: createId(),
        role: "assistant",
        content: msg,
        timestamp: Date.now(),
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === userId ? { ...s, messages: [...s.messages, errMsg] } : s,
        ),
      );
      setStreamingContent(null);
    } finally {
      setSendingSessions((prev) => ({ ...prev, [userId]: false }));
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [model, temperature, attachedFile]);

  const tokens = sessionTokenCount(activeSession.messages);
  const tokenPct = Math.min((tokens / CONTEXT_LIMIT) * 100, 100);
  const tokenWarning = tokenPct > 75;

  return (
    <div className="flex h-full">
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={handleSelect}
        onNewChat={handleNewChat}
        onRename={handleRename}
        onDelete={handleDelete}
        model={model}
        onModelChange={handleModelChange}
        temperature={temperature}
        onTemperatureChange={handleTemperatureChange}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <Header
          name={activeSession.name}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />
        <div className="flex items-center justify-center gap-2.5 border-b border-border-soft px-6 py-1.5">
          <svg className="size-3.5 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <span className={`font-mono text-[11px] font-medium tracking-tight ${tokenWarning ? "text-danger" : "text-text-muted"}`}>
            {tokens.toLocaleString()} / {CONTEXT_LIMIT.toLocaleString()}
          </span>
          <div className="h-1 w-24 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                tokenWarning
                  ? "bg-danger shadow-[0_0_6px] shadow-danger/50"
                  : "bg-gradient-to-r from-accent/60 to-accent"
              }`}
              style={{ width: `${Math.max(tokenPct, 2)}%` }}
            />
          </div>
          <button
            onClick={() => {
              const userId = activeIdRef.current;
              setSessions((prev) =>
                prev.map((s) =>
                  s.id === userId
                    ? { ...s, messages: s.messages.slice(-2) }
                    : s,
                ),
              );
            }}
            className="cursor-pointer rounded border border-border-soft px-2 py-0.5 text-[11px] font-medium text-text-muted transition-all duration-150 hover:border-danger/30 hover:bg-danger/10 hover:text-danger"
          >
            Clear
          </button>
        </div>
        <ChatFeed
          messages={activeSession.messages}
          sending={!!sendingSessions[activeId]}
          streamingContent={streamingContent ?? undefined}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
        />
        <InputBar
          onSend={handleSend}
          disabled={!!sendingSessions[activeId] || streamingContent != null}
          attachedFile={attachedFile}
          onAttachFile={handleAttachFile}
          onRemoveFile={handleRemoveFile}
        />
      </div>
    </div>
  );
}
