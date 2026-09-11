import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface MarkdownContentProps {
  content: string;
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 font-mono text-xs shadow-md">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
        <span>{language || "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-slate-400 hover:text-white transition px-2 py-0.5 rounded hover:bg-slate-800"
          aria-label="Copy code block"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  if (!content) return null;

  // Split content into blocks (code blocks vs text blocks)
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textChunk = content.slice(lastIndex, match.index);
      parts.push(renderTextChunk(textChunk, `text-${lastIndex}`));
    }
    const lang = match[1] || "";
    const code = match[2] || "";
    parts.push(<CodeBlock key={`code-${match.index}`} code={code} language={lang} />);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(renderTextChunk(content.slice(lastIndex), `text-${lastIndex}`));
  }

  return <div className="space-y-2 text-sm leading-relaxed text-slate-800">{parts}</div>;
}

function renderTextChunk(chunk: string, keyPrefix: string): React.ReactNode {
  const lines = chunk.split("\n");
  const elements: React.ReactNode[] = [];

  let inList = false;
  let listItems: React.ReactNode[] = [];
  let isOrderedList = false;

  const flushList = () => {
    if (listItems.length > 0) {
      const ListTag = isOrderedList ? "ol" : "ul";
      elements.push(
        <ListTag
          key={`list-${elements.length}`}
          className={`my-2 space-y-1 text-sm ${isOrderedList ? "list-decimal ml-5" : "list-disc ml-5"}`}
        >
          {listItems}
        </ListTag>
      );
      listItems = [];
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={`h3-${i}`} className="text-sm font-bold text-slate-900 mt-3 mb-1">
          {formatInline(trimmed.slice(4))}
        </h3>
      );
    } else if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={`h2-${i}`} className="text-base font-bold text-slate-900 mt-3.5 mb-1.5">
          {formatInline(trimmed.slice(3))}
        </h2>
      );
    } else if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={`h1-${i}`} className="text-lg font-extrabold text-slate-900 mt-4 mb-2">
          {formatInline(trimmed.slice(2))}
        </h1>
      );
    }
    // Blockquote
    else if (trimmed.startsWith("> ")) {
      flushList();
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-4 border-blue-500 bg-blue-50/60 rounded-r-lg px-3.5 py-2 my-2 text-xs text-slate-700 italic"
        >
          {formatInline(trimmed.slice(2))}
        </blockquote>
      );
    }
    // Unordered List (- or *)
    else if (/^[-*]\s+/.test(trimmed)) {
      if (!inList || isOrderedList) {
        flushList();
        inList = true;
        isOrderedList = false;
      }
      listItems.push(
        <li key={`li-${i}`} className="leading-relaxed">
          {formatInline(trimmed.replace(/^[-*]\s+/, ""))}
        </li>
      );
    }
    // Ordered List (1. 2. etc.)
    else if (/^\d+\.\s+/.test(trimmed)) {
      if (!inList || !isOrderedList) {
        flushList();
        inList = true;
        isOrderedList = true;
      }
      listItems.push(
        <li key={`oli-${i}`} className="leading-relaxed">
          {formatInline(trimmed.replace(/^\d+\.\s+/, ""))}
        </li>
      );
    }
    // Normal Paragraph
    else {
      flushList();
      elements.push(
        <p key={`p-${i}`} className="leading-relaxed">
          {formatInline(line)}
        </p>
      );
    }
  }

  flushList();
  return <React.Fragment key={keyPrefix}>{elements}</React.Fragment>;
}

function formatInline(text: string): React.ReactNode[] {
  // Parse bold (**text**), inline code (`code`), links ([text](url))
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIdx = 0;
  let m;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIdx) {
      parts.push(text.slice(lastIdx, m.index));
    }
    if (m[2]) {
      // Bold
      parts.push(
        <strong key={`b-${m.index}`} className="font-semibold text-slate-900">
          {m[2]}
        </strong>
      );
    } else if (m[3]) {
      // Inline Code
      parts.push(
        <code
          key={`c-${m.index}`}
          className="bg-slate-100 text-slate-800 border border-slate-200/80 px-1.5 py-0.5 rounded text-[12px] font-mono"
        >
          {m[3]}
        </code>
      );
    } else if (m[4] && m[5]) {
      // Link (safely check for safe protocol)
      const href = m[5].startsWith("http") || m[5].startsWith("/") ? m[5] : "#";
      parts.push(
        <a
          key={`a-${m.index}`}
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="text-blue-600 hover:text-blue-700 underline font-medium"
        >
          {m[4]}
        </a>
      );
    }
    lastIdx = m.index + m[0].length;
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return parts.length > 0 ? parts : [text];
}
