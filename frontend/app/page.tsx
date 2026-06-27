"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Session, Message } from "@/types";
import { sendMessage } from "@/lib/api";
import { loadSessions, saveSessions, loadActiveId, saveActiveId } from "@/lib/persist";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ChatFeed from "@/components/ChatFeed";
import InputBar from "@/components/InputBar";

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

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([createSession()]);
  const [activeId, setActiveId] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sendingSessions, setSendingSessions] = useState<Record<string, boolean>>({});
  const activeIdRef = useRef(activeId);
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

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveSessions(sessions);
  }, [sessions, hydrated]);

  useEffect(() => {
    if (hydrated) saveActiveId(activeId);
  }, [activeId, hydrated]);

  const handleNewChat = useCallback(() => {
    const newSession = createSession();
    setSessions((prev) => [newSession, ...prev]);
    setActiveId(newSession.id);
  }, []);

  const handleSelect = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const handleRename = useCallback((id: string, name: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name } : s)),
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
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

  const handleSend = useCallback(async (text: string) => {
    const userId = activeIdRef.current;

    const userMsg: Message = {
      id: createId(),
      role: "user",
      content: text,
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

    try {
      const res = await sendMessage({
        session_id: userId,
        source_platform: "web_porto",
        message: text,
      });

      const aiMsg: Message = {
        id: createId(),
        role: "assistant",
        content: res.content,
        timestamp: Date.now(),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === userId
            ? { ...s, messages: [...s.messages, aiMsg] }
            : s,
        ),
      );
    } catch (e) {
      const errMsg: Message = {
        id: createId(),
        role: "assistant",
        content: e instanceof Error ? e.message : "Sorry, the AI service is currently unavailable. Please try again.",
        timestamp: Date.now(),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === userId
            ? { ...s, messages: [...s.messages, errMsg] }
            : s,
        ),
      );
    } finally {
      setSendingSessions((prev) => ({ ...prev, [userId]: false }));
    }
  }, []);

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
      />

      <div className="flex flex-1 flex-col min-w-0">
        <Header
          name={activeSession.name}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />
        <ChatFeed messages={activeSession.messages} sending={!!sendingSessions[activeId]} />
        <InputBar onSend={handleSend} disabled={!!sendingSessions[activeId]} />
      </div>
    </div>
  );
}
