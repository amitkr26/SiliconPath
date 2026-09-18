/**
 * Score aggregation — the penalty model.
 *
 * Every check contributes an explainable penalty:
 *   🔴 critical   -> -8
 *   🟠 warning    -> -5
 *   🟡 improvement-> -2
 *   🟢 pass       ->  0
 *
 * score = max(0, 100 - totalPenalty).
 *
 * Anti-gaming property: because points can ONLY be lost, no amount of added
 * keywords, filler text, meaningless FAQs, redundant schema or extra internal
 * links can increase a score. The only way up is to stop failing real checks.
 */

import { SEVERITY_META, type CheckResult, type Severity } from "./types";

export function penaltyFor(check: Pick<CheckResult, "severity">): number {
  return SEVERITY_META[check.severity].penalty;
}

export function computeScore(checks: CheckResult[]): number {
  const totalPenalty = checks.reduce((sum, c) => sum + penaltyFor(c), 0);
  return Math.max(0, 100 - totalPenalty);
}

export function summarizeSeverities(checks: CheckResult[]): Record<Severity, number> {
  const summary: Record<Severity, number> = { critical: 0, warning: 0, improvement: 0, pass: 0 };
  for (const c of checks) summary[c.severity] += 1;
  return summary;
}

export function explainScore(score: number, checks: CheckResult[]): string {
  const bySeverity = summarizeSeverities(checks);
  const failed = checks.filter((c) => c.severity !== "pass");
  const breakdown = failed.length
    ? failed.map((c) => `${SEVERITY_META[c.severity].emoji} ${c.id} (-${SEVERITY_META[c.severity].penalty})`).join(", ")
    : "no deductions";
  return `Score ${score}/100 = 100 minus penalties for failed checks (${breakdown}).`;
}