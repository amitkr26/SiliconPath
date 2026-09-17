import { useState, useEffect, useCallback } from "react";

import { GroundedRecord } from "@/lib/ai/grounding";

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  opportunities?: GroundedRecord[];
  sources?: Array<{ name: string; url: string; tier?: string; type?: string }>;
  citations?: Array<{ type: string; id: string; title: string; url: string | null }>;
  domain?: string;
  toolResults?: Array<{ tool: string; result: unknown }>;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessageItem[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "bdw_chat_sessions_v1";
const MAX_SESSIONS = 30;

function createDefaultSession(): ChatSession {
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return {
    id: `session-${Date.now()}`,
    title: "New Conversation",
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: `m-init-${Date.now()}`,
        role: "assistant",
        content: "Namaste! I am the **BerojgarDegreeWala AI Career Assistant**, specialized in Indian semiconductor careers, VLSI design, JRF research positions, and ISRO/DRDO exams. How can I assist your career journey today?",
        timestamp: now,
      },
    ],
  };
}

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Load sessions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          setIsLoaded(true);
          return;
        }
      }
    } catch {
      // Ignore parsing errors and fallback to fresh default session
    }

    const defaultSession = createDefaultSession();
    setSessions([defaultSession]);
    setActiveSessionId(defaultSession.id);
    setIsLoaded(true);
  }, []);

  // 2. Persist sessions to localStorage whenever they change
  useEffect(() => {
    if (!isLoaded || sessions.length === 0) return;
    try {
      const trimmed = sessions.slice(0, MAX_SESSIONS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // Storage quota exceeded or unavailable
    }
  }, [sessions, isLoaded]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || createDefaultSession();

  const createNewSession = useCallback((): string => {
    const newSession = createDefaultSession();
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    return newSession.id;
  }, []);

  const updateActiveMessages = useCallback(
    (newMessages: ChatMessageItem[], customTitle?: string) => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeSessionId) return s;
          const isFirstUserMsg = s.title === "New Conversation" && newMessages.some((m) => m.role === "user");
          const firstUserText = newMessages.find((m) => m.role === "user")?.content || "";
          const autoTitle = customTitle || (isFirstUserMsg ? firstUserText.slice(0, 36) + (firstUserText.length > 36 ? "..." : "") : s.title);

          return {
            ...s,
            title: autoTitle,
            messages: newMessages,
            updatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
        })
      );
    },
    [activeSessionId]
  );

  const renameSession = useCallback((sessionId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, title: newTitle.trim() } : s))
    );
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== sessionId);
      if (filtered.length === 0) {
        const fresh = createDefaultSession();
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (activeSessionId === sessionId) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  }, [activeSessionId]);

  const clearAllSessions = useCallback(() => {
    const fresh = createDefaultSession();
    setSessions([fresh]);
    setActiveSessionId(fresh.id);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    sessions: filteredSessions,
    allSessions: sessions,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    createNewSession,
    updateActiveMessages,
    renameSession,
    deleteSession,
    clearAllSessions,
    searchQuery,
    setSearchQuery,
    isLoaded,
  };
}
