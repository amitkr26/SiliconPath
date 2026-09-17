import React, { useState } from "react";
import {
  Bot,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Search,
  Target,
  Map,
  Wrench,
  Newspaper,
  Building2,
  BookOpen,
} from "lucide-react";
import { ChatMessageItem } from "../hooks/useChatSessions";
import { MarkdownContent } from "./MarkdownContent";
import { OpportunityCard } from "./OpportunityCard";

interface ChatMessageProps {
  message: ChatMessageItem;
  isSpeaking: boolean;
  onSpeak: (id: string, text: string) => void;
  onStopSpeak: () => void;
  savedIds?: string[];
  onToggleSave?: (id: string) => void;
}

export function ChatMessage({
  message,
  isSpeaking,
  onSpeak,
  onStopSpeak,
  savedIds = [],
  onToggleSave,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const isAssistant = message.role === "assistant";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSpeak = () => {
    if (isSpeaking) {
      onStopSpeak();
    } else {
      onSpeak(message.id, message.content);
    }
  };

  return (
    <div
      className={`flex gap-3.5 group transition-opacity duration-200 ${
        isAssistant ? "justify-start" : "justify-end"
      }`}
    >
      {/* Assistant Avatar */}
      {isAssistant && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-2xs">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div
        className={`max-w-[92%] sm:max-w-[85%] flex flex-col ${
          !isAssistant ? "items-end" : "items-start"
        }`}
      >
        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all ${
            isAssistant
              ? "bg-white border border-slate-200/90 text-slate-800 shadow-2xs rounded-tl-sm w-full"
              : "bg-blue-600 text-white shadow-2xs rounded-tr-sm"
          }`}
        >
          {isAssistant ? (
            <div className="space-y-4">
              {/* Grounded text explanation */}
              <MarkdownContent content={message.content} />

              {/* Domain Badge (when BDW AI detected intent) */}
              {message.domain && message.domain !== "general" && (
                <DomainBadge domain={message.domain} />
              )}

              {/* Tool Activity Indicator */}
              {message.toolResults && message.toolResults.length > 0 && (
                <ToolActivityIndicator toolResults={message.toolResults} />
              )}

              {/* Structured Opportunity Cards if present */}
              {message.opportunities && message.opportunities.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Verified Opportunity Records ({message.opportunities.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {message.opportunities.map((opp) => (
                      <OpportunityCard
                        key={opp.id || opp.slug || opp.title}
                        opportunity={opp}
                        isSaved={savedIds.includes(opp.id || "")}
                        onToggleSave={onToggleSave}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Official Sources List if present */}
              {message.sources && message.sources.length > 0 && (
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Sources:
                  </span>
                  {message.sources.map((src, idx) => (
                    <a
                      key={idx}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 bg-blue-50/70 border border-blue-200/60 px-2 py-0.5 rounded-md text-[11px] font-semibold"
                    >
                      <span>{src.name}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              )}

              {/* BDW Citations (additional reference links from RAG) */}
              {message.citations && message.citations.length > 0 && !(message.sources && message.sources.length > 0) && (
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-violet-600" /> References:
                  </span>
                  {message.citations.filter(c => c.url).slice(0, 5).map((cit, idx) => (
                    <a
                      key={idx}
                      href={cit.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-800 bg-violet-50/70 border border-violet-200/60 px-2 py-0.5 rounded-md text-[11px] font-semibold"
                    >
                      <CitationIcon type={cit.type} />
                      <span className="truncate max-w-[180px]">{cit.title}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {/* Action Controls & Timestamp */}
        <div className="flex items-center gap-3 mt-1.5 px-1 text-[11px] text-slate-400">
          <span>{message.timestamp}</span>

          {isAssistant && (
            <div className="flex items-center gap-2">
              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className="hover:text-slate-700 transition flex items-center gap-1 py-0.5 px-1 rounded hover:bg-slate-100"
                title="Copy response"
                aria-label="Copy response"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>

              {/* Listen / TTS Button */}
              <button
                onClick={toggleSpeak}
                className={`transition flex items-center gap-1 py-0.5 px-1 rounded hover:bg-slate-100 ${
                  isSpeaking ? "text-blue-600 font-semibold" : "hover:text-slate-700"
                }`}
                title={isSpeaking ? "Stop listening" : "Read aloud"}
                aria-label={isSpeaking ? "Stop listening" : "Read aloud"}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Listen</span>
                  </>
                )}
              </button>

              {/* Rating Feedback Buttons */}
              <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                <button
                  onClick={() => setFeedback(feedback === "up" ? null : "up")}
                  className={`p-1 rounded transition ${
                    feedback === "up"
                      ? "text-emerald-600 bg-emerald-50"
                      : "hover:text-slate-700 hover:bg-slate-100"
                  }`}
                  title="Helpful response"
                  aria-label="Thumbs up"
                >
                  <ThumbsUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setFeedback(feedback === "down" ? null : "down")}
                  className={`p-1 rounded transition ${
                    feedback === "down"
                      ? "text-rose-600 bg-rose-50"
                      : "hover:text-slate-700 hover:bg-slate-100"
                  }`}
                  title="Needs improvement"
                  aria-label="Thumbs down"
                >
                  <ThumbsDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── BDW Helper Components ────────────────────────────────────────────────

const DOMAIN_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  opportunity_search: { label: "Opportunity Search", icon: <Search className="w-3 h-3" />, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  organization_search: { label: "Organization Lookup", icon: <Building2 className="w-3 h-3" />, color: "bg-blue-50 text-blue-700 border-blue-200" },
  eligibility_check: { label: "Eligibility Analysis", icon: <Target className="w-3 h-3" />, color: "bg-amber-50 text-amber-700 border-amber-200" },
  career_planning: { label: "Career Planning", icon: <Map className="w-3 h-3" />, color: "bg-violet-50 text-violet-700 border-violet-200" },
  skill_gap: { label: "Skill Gap Analysis", icon: <Wrench className="w-3 h-3" />, color: "bg-rose-50 text-rose-700 border-rose-200" },
  news_update: { label: "News & Updates", icon: <Newspaper className="w-3 h-3" />, color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
};

function DomainBadge({ domain }: { domain: string }) {
  const config = DOMAIN_CONFIG[domain];
  if (!config) return null;

  return (
    <div className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${config.color}`}>
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}

function ToolActivityIndicator({ toolResults }: { toolResults: Array<{ tool: string; result: unknown }> }) {
  const toolLabels: Record<string, string> = {
    search_opportunities: "Searched opportunities",
    search_organizations: "Searched organizations",
    check_eligibility: "Checked eligibility",
    get_required_skills: "Retrieved skills",
    find_related_opportunities: "Found related roles",
    get_career_roadmap: "Generated career roadmap",
    search_news: "Searched news",
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {toolResults.map((tr, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full"
        >
          <Wrench className="w-2.5 h-2.5" />
          {toolLabels[tr.tool] || tr.tool}
        </span>
      ))}
    </div>
  );
}

function CitationIcon({ type }: { type: string }) {
  switch (type) {
    case "opportunity": return <Search className="w-2.5 h-2.5" />;
    case "organization": return <Building2 className="w-2.5 h-2.5" />;
    case "news": return <Newspaper className="w-2.5 h-2.5" />;
    default: return <BookOpen className="w-2.5 h-2.5" />;
  }
}
