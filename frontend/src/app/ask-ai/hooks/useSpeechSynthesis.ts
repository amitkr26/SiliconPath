import { useState, useEffect, useRef, useCallback } from "react";

export interface SpeechSynthesisHook {
  isSupported: boolean;
  speakingMsgId: string | null;
  isPaused: boolean;
  speak: (id: string, text: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

function cleanTextForSpeech(markdown: string): string {
  if (!markdown) return "";
  return markdown
    .replace(/```[\s\S]*?```/g, "Code block omitted.")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_~#>[\]]/g, "")
    .replace(/\((?:https?:\/\/[^\s)]+)\)/g, "")
    .replace(/\n+/g, " ")
    .trim();
}

export function useSpeechSynthesis(): SpeechSynthesisHook {
  const [isSupported, setIsSupported] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true);
      synthRef.current = window.speechSynthesis;
    } else {
      setIsSupported(false);
    }

    return () => {
      if (synthRef.current) {
        try {
          synthRef.current.cancel();
        } catch {}
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (synthRef.current) {
      try {
        synthRef.current.cancel();
      } catch {}
    }
    setSpeakingMsgId(null);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    if (synthRef.current && synthRef.current.speaking) {
      try {
        synthRef.current.pause();
        setIsPaused(true);
      } catch {}
    }
  }, []);

  const resume = useCallback(() => {
    if (synthRef.current && synthRef.current.paused) {
      try {
        synthRef.current.resume();
        setIsPaused(false);
      } catch {}
    }
  }, []);

  const speak = useCallback(
    (id: string, text: string) => {
      if (!synthRef.current) return;

      if (speakingMsgId === id) {
        stop();
        return;
      }

      stop();

      const cleaned = cleanTextForSpeech(text);
      if (!cleaned) return;

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setSpeakingMsgId(id);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setSpeakingMsgId(null);
        setIsPaused(false);
      };

      utterance.onerror = (e) => {
        // Interrupted/canceled errors are expected on manual stop
        if (e.error !== "interrupted" && e.error !== "canceled") {
          console.warn("[TTS] Utterance error:", e.error);
        }
        setSpeakingMsgId(null);
        setIsPaused(false);
      };

      try {
        synthRef.current.speak(utterance);
      } catch (err) {
        console.warn("[TTS] Speak failed:", err);
        setSpeakingMsgId(null);
      }
    },
    [speakingMsgId, stop]
  );

  return {
    isSupported,
    speakingMsgId,
    isPaused,
    speak,
    stop,
    pause,
    resume,
  };
}
