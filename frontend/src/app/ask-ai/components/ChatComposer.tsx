import React, { useRef, useEffect } from "react";
import { Send, Mic, MicOff, Loader2, AlertCircle } from "lucide-react";
import { SpeechRecognitionHook } from "../hooks/useSpeechRecognition";

interface ChatComposerProps {
  input: string;
  setInput: (val: string) => void;
  onSend: (text?: string) => void;
  loading: boolean;
  speech: SpeechRecognitionHook;
}

export function ChatComposer({
  input,
  setInput,
  onSend,
  loading,
  speech,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const nextHeight = Math.min(Math.max(el.scrollHeight, 44), 160);
    el.style.height = `${nextHeight}px`;
  }, [input]);

  // Handle keydown for Enter to send vs Shift+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !loading) {
        onSend();
      }
    }
  };

  const handleToggleVoice = () => {
    if (speech.isListening) {
      speech.stopListening();
    } else {
      speech.startListening();
    }
  };

  return (
    <div className="border-t border-slate-200/90 bg-white/95 backdrop-blur-sm p-3 sm:p-4 shrink-0 transition-all">
      <div className="max-w-3xl mx-auto space-y-2">
        {/* Live speech feedback / error banner */}
        {speech.isListening && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            <span className="font-semibold">Listening...</span>
            <span className="truncate text-red-600/80">
              {speech.interimTranscript || "Speak into your microphone..."}
            </span>
          </div>
        )}

        {speech.error && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="flex-1">{speech.error}</span>
            <button
              onClick={speech.resetTranscript}
              className="text-amber-700 hover:text-amber-900 font-bold ml-1 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Input box */}
        <div className="flex items-end gap-2 bg-slate-50/90 border border-slate-200 rounded-2xl p-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-sm">
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={handleToggleVoice}
            disabled={loading}
            className={`p-2.5 rounded-xl transition shrink-0 ${
              speech.isListening
                ? "bg-red-600 text-white shadow-md animate-bounce"
                : "text-slate-500 hover:text-blue-600 hover:bg-slate-200/60"
            }`}
            title={
              !speech.isSupported
                ? "Voice input not supported in this browser"
                : speech.isListening
                ? "Stop recording"
                : "Speak message (Speech-to-Text)"
            }
            aria-label={speech.isListening ? "Stop listening" : "Start voice input"}
          >
            {speech.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Multiline Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder={
              speech.isListening
                ? "Listening to voice input..."
                : "Ask about VLSI jobs, JRF, DRDO/ISRO exams, SystemVerilog..."
            }
            className="flex-1 bg-transparent border-none text-slate-900 text-sm focus:outline-none resize-none py-2 px-1 max-h-40 placeholder:text-slate-400 leading-relaxed font-medium"
            aria-label="Ask AI prompt input"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={() => onSend()}
            disabled={!input.trim() || loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white p-2.5 rounded-xl transition-all shrink-0 font-semibold shadow-sm flex items-center justify-center"
            title="Send message (Enter)"
            aria-label="Send message"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        <p className="text-[10.5px] text-slate-400 text-center font-medium">
          BerojgarDegreeWala AI Assistant grounds technical advice in live opportunities data. Always verify exam dates with official circulars.
        </p>
      </div>
    </div>
  );
}
