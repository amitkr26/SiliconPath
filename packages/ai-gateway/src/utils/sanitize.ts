const SENSITIVE_PATTERNS: RegExp[] = [
  /(?:api[_-]?key|apikey|api[_-]?secret|secret[_-]?key)\s*[:=]\s*["']?[A-Za-z0-9_\-\.]{16,}["']?/gi,
  /(?:Bearer|Basic)\s+[A-Za-z0-9_\-\.=]{20,}/g,
  /(?:sk|pk|tk|ak)-[A-Za-z0-9_\-]{20,}/g,
  /ghp_[A-Za-z0-9]{36}/g,
  /xox[baprs]-[A-Za-z0-9\-]{10,}/g,
  /(?:password|passwd|pwd)\s*[:=]\s*["']?[^\s"']{6,}["']?/gi,
  /(?:token|auth_token|access_token|refresh_token)\s*[:=]\s*["']?[A-Za-z0-9_\-\.]{20,}["']?/gi,
];

const REDACTION_PLACEHOLDER = "[REDACTED]";

export function sanitizePrompt(prompt: string): string {
  let sanitized = prompt;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, REDACTION_PLACEHOLDER);
  }
  return sanitized;
}
