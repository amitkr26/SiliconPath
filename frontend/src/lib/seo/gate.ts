/**
 * Programmatic SEO Quality Gate.
 *
 * The documented BDW rule (project-bible/ARCHITECTURE.md §Programmatic SEO,
 * docs/audit-reports 2026-09-13 §2): any programmatic page (Role × Location,
 * Category × Location, etc.) must have >= 3 active, verified, currently
 * available opportunities to be indexed. Sub-threshold combinations fail
 * closed with `noindex, follow`. Combinations with zero listings must not be
 * emitted at all (avoid fabricating doorway pages).
 */

import type { GateDecision, ProgrammaticDimension } from "./types";

export const PROGRAMMATIC_INDEX_THRESHOLD = 3;

export function evaluateProgrammaticGate(
  dimension: ProgrammaticDimension | undefined,
  activeVerifiedCount: number
): GateDecision | undefined {
  if (!dimension) return undefined;

  const label = [dimension.role && `role:${dimension.role}`, dimension.location && `location:${dimension.location}`, dimension.category && `category:${dimension.category}`]
    .filter(Boolean)
    .join(" × ");

  if (activeVerifiedCount >= PROGRAMMATIC_INDEX_THRESHOLD) {
    return {
      indexable: true,
      directive: "index,follow",
      activeVerifiedCount,
      threshold: PROGRAMMATIC_INDEX_THRESHOLD,
      reason: `${label} has ${activeVerifiedCount} active verified opportunity(ies) — meets the >= ${PROGRAMMATIC_INDEX_THRESHOLD} indexing threshold.`,
    };
  }

  if (activeVerifiedCount > 0) {
    return {
      indexable: false,
      directive: "noindex,follow",
      activeVerifiedCount,
      threshold: PROGRAMMATIC_INDEX_THRESHOLD,
      reason: `${label} has only ${activeVerifiedCount} active verified opportunity(ies) (< ${PROGRAMMATIC_INDEX_THRESHOLD}) — failing closed with noindex,follow to avoid doorway/thin-content pages.`,
    };
  }

  return {
    indexable: false,
    directive: "omit",
    activeVerifiedCount,
    threshold: PROGRAMMATIC_INDEX_THRESHOLD,
    reason: `${label} has 0 active verified opportunities — the page should not be emitted as an indexable URL at all.`,
  };
}

export function isProgrammaticallyIndexable(
  dimension: ProgrammaticDimension | undefined,
  activeVerifiedCount: number
): boolean {
  if (!dimension) return true;
  return activeVerifiedCount >= PROGRAMMATIC_INDEX_THRESHOLD;
}