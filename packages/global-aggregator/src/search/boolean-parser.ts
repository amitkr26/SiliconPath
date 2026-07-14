import type { ParsedQuery, BooleanClause } from "../types";

const BOOLEAN_OPERATORS = /\b(AND|OR|NOT)\b/;
const PHRASE_PATTERN = /"([^"]+)"/g;
const FIELD_PATTERN = /(\w+):("([^"]+)"|(\S+))/g;

export class BooleanQueryParser {
  parse(query: string): ParsedQuery {
    const phrases: string[] = [];
    const fieldQueries: { field: string; term: string }[] = [];
    let text = query.trim();

    let match: RegExpExecArray | null;
    const phraseMatches: { full: string; content: string; index: number }[] = [];
    while ((match = PHRASE_PATTERN.exec(query)) !== null) {
      phraseMatches.push({ full: match[0], content: match[1], index: match.index });
      phrases.push(match[1]);
    }
    text = text.replace(PHRASE_PATTERN, "").trim();

    const fieldMatches: { full: string; field: string; term: string; index: number }[] = [];
    while ((match = FIELD_PATTERN.exec(query)) !== null) {
      fieldMatches.push({ full: match[0], field: match[1].toLowerCase(), term: match[3] ?? match[4], index: match.index });
      fieldQueries.push({ field: match[1].toLowerCase(), term: match[3] ?? match[4] });
    }
    text = text.replace(FIELD_PATTERN, "").trim();

    const booleanClauses: BooleanClause[] = [];
    const tokens = text.split(/\s+/).filter(Boolean);
    let defaultOp: "AND" | "OR" = "AND";
    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i].toUpperCase();
      if (token === "AND" || token === "OR" || token === "NOT") {
        if (token === "NOT") {
          if (i + 1 < tokens.length) {
            booleanClauses.push({ operator: "NOT", term: tokens[i + 1] });
            i += 2;
          } else {
            i++;
          }
        } else {
          defaultOp = token;
          i++;
        }
      } else {
        booleanClauses.push({ operator: defaultOp, term: tokens[i] });
        i++;
      }
    }

    const hasBoolean = booleanClauses.some((c) => c.operator !== defaultOp) || booleanClauses.length > 1;
    const hasPhrases = phrases.length > 0;
    const hasFields = fieldQueries.length > 0;

    const cleanText = [
      ...booleanClauses.map((c) => c.term),
      ...phrases,
      ...fieldQueries.map((fq) => fq.term),
    ].join(" ");

    return {
      text: cleanText,
      booleanClauses,
      phrases,
      fieldQueries,
      hasBoolean,
      hasPhrases,
      hasFields,
    };
  }
}
